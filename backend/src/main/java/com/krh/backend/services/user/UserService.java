package com.krh.backend.services.user;

import com.krh.backend.entities.user.EmailTokenEntity;
import com.krh.backend.entities.user.UserEntity;
import com.krh.backend.mappers.user.UserMapper;
import com.krh.backend.results.CommonResult;
import com.krh.backend.results.Result;
import com.krh.backend.results.user.UserResult;
import com.krh.backend.validators.user.UserValidator;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.RandomStringUtils;
import org.apache.commons.lang3.tuple.Pair;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserMapper userMapper;
    private final MailService mailService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    /**
     * [인증-1] 이메일 인증 번호 발송
     * 3분 제한 시간 및 재전송 1회 제한 포함
     */
    @Transactional
    public Result sendVerificationEmail(String email, String type) {
        if (!UserValidator.validateEmail(email)) {
            return UserResult.INVALID_EMAIL;
        }

        /* --- [핵심 추가] 회원가입(JOIN) 시 이메일 중복 체크 --- */
        if ("JOIN".equals(type)) {
            if (this.userMapper.selectByEmail(email) != null) {
                return UserResult.DUPLICATE_EMAIL;
            }
        }

        EmailTokenEntity existingToken = this.userMapper.selectEmailTokenByEmail(email);

        if (existingToken != null && !existingToken.isUsed() && existingToken.getRetryCount() >= 1) {
            return CommonResult.FAILURE;
        }

        String code = RandomStringUtils.randomNumeric(6);
        String salt = this.passwordEncoder.encode(email + LocalDateTime.now());

        EmailTokenEntity token = EmailTokenEntity.builder()
                .email(email)
                .code(code)
                .salt(salt)
                .expiresAt(LocalDateTime.now().plusMinutes(3))
                .build();

        if (existingToken == null) {
            this.userMapper.insertEmailToken(token);
        } else {
            this.userMapper.updateEmailToken(token);
        }

        return this.mailService.sendVerificationEmail(email, type, code);
    }

    /**
     * [인증-2] 이메일 인증 번호 확인
     */
    @Transactional
    public Result verifyEmailCode(String email, String code) {
        EmailTokenEntity token = this.userMapper.selectEmailTokenByEmail(email);

        if (token == null || token.getExpiresAt().isBefore(LocalDateTime.now())) {
            return UserResult.INVALID_EMAIL;
        }

        if (!token.getCode().equals(code)) {
            return UserResult.WRONG_PASSWORD;
        }

        if (this.userMapper.updateEmailTokenVerified(email, code) <= 0) {
            return CommonResult.FAILURE;
        }

        return CommonResult.SUCCESS;
    }

    /**
     * [UPDATE] 임시 비밀번호 발급 (차량 번호 검증 포함)
     */
    @Transactional
    public Result issueTemporaryPassword(String email, String carNumber) {
        UserEntity user = this.userMapper.selectByEmail(email);
        if (user == null) {
            return UserResult.USER_NOT_FOUND;
        }

        String dbCarNumber = user.getCarNumber().replaceAll("\\s", "");
        String inputCarNumber = carNumber.replaceAll("\\s", "");

        if (!dbCarNumber.equals(inputCarNumber)) {
            return CommonResult.FAILURE;
        }

        String tempPassword = RandomStringUtils.randomAlphanumeric(8);
        user.setPassword(BCrypt.hashpw(tempPassword, BCrypt.gensalt()));

        if (this.userMapper.updateUserInfo(user) <= 0) {
            return CommonResult.FAILURE;
        }

        this.userMapper.updateEmailTokenUsed(email);
        return this.mailService.sendPasswordEmail(email, tempPassword);
    }

    /**
     * [CREATE] 회원가입
     */
    @Transactional
    public Pair<Result, UserEntity> register(UserEntity user) {
        if (!UserValidator.validateRegister(user)) {
            return Pair.of(CommonResult.FAILURE, null);
        }

        if (this.userMapper.selectByEmail(user.getEmail()) != null) {
            return Pair.of(UserResult.DUPLICATE_EMAIL, null);
        }

        // 보안: 회원가입 시 전달된 carModelId가 유효한지 검증
        if (user.getCarModelId() != null && this.userMapper.countModelById(user.getCarModelId()) == 0) {
            return Pair.of(CommonResult.FAILURE, null);
        }

        if (user.getPassword() != null && !user.getPassword().isEmpty()) {
            user.setPassword(BCrypt.hashpw(user.getPassword(), BCrypt.gensalt()));
        }

        if (user.getPhone() != null) {
            user.setPhone(user.getPhone().replaceAll("[^0-9]", ""));
        }

        if (this.userMapper.insertUser(user) <= 0) {
            return Pair.of(CommonResult.FAILURE, null);
        }

        this.userMapper.updateEmailTokenUsed(user.getEmail());
        return Pair.of(CommonResult.SUCCESS, user);
    }

    /**
     * [READ] 로그인
     */
    public Pair<Result, UserEntity> login(String email, String password) {
        if (!UserValidator.validateLogin(email, password)) {
            return Pair.of(CommonResult.FAILURE, null);
        }

        UserEntity dbUser = this.userMapper.selectByEmail(email);

        if (dbUser == null) {
            return Pair.of(UserResult.USER_NOT_FOUND, null);
        }

        if (dbUser.getPassword() == null || !BCrypt.checkpw(password, dbUser.getPassword())) {
            return Pair.of(UserResult.WRONG_PASSWORD, null);
        }

        dbUser.setPassword(null);
        return Pair.of(CommonResult.SUCCESS, dbUser);
    }

    /**
     * [UPDATE] 유저 정보 수정 (비밀번호 및 차량 정보 보안 검증 포함)
     */
    @Transactional
    public Pair<Result, UserEntity> updateUserInfo(UserEntity user, String currentPassword) {
        if (!UserValidator.validateEmail(user.getEmail())) {
            return Pair.of(UserResult.INVALID_EMAIL, null);
        }

        UserEntity dbUser = this.userMapper.selectByEmail(user.getEmail());
        if (dbUser == null) {
            return Pair.of(UserResult.USER_NOT_FOUND, null);
        }

        // 비밀번호 검증
        if (currentPassword == null || !BCrypt.checkpw(currentPassword, dbUser.getPassword())) {
            return Pair.of(UserResult.WRONG_PASSWORD, null);
        }

        // [보안 핵심] 차량 모델 ID 유효성 검사 (악의적 조작 방지)
        if (user.getCarModelId() != null && this.userMapper.countModelById(user.getCarModelId()) == 0) {
            return Pair.of(CommonResult.FAILURE, null); // 가짜 ID 전송 시 차단
        }

        if (user.getPhone() != null) {
            user.setPhone(user.getPhone().replaceAll("[^0-9]", ""));
        }

        if (user.getPassword() != null && !user.getPassword().isEmpty()) {
            user.setPassword(BCrypt.hashpw(user.getPassword(), BCrypt.gensalt()));
        }

        return this.userMapper.updateUserInfo(user) > 0
                ? Pair.of(CommonResult.SUCCESS, user)
                : Pair.of(CommonResult.FAILURE, null);
    }

    /**
     * [DELETE] 회원 탈퇴
     */
    @Transactional
    public Result deleteUser(String email) {
        if (!UserValidator.validateEmail(email)) {
            return CommonResult.FAILURE;
        }
        return this.userMapper.deleteByUser(email) > 0 ? CommonResult.SUCCESS : CommonResult.FAILURE;
    }

    /**
     * [READ] 단일 유저 조회
     */
    public UserEntity getUserByEmail(String email) {
        if (!UserValidator.validateEmail(email)) {
            return null;
        }
        return this.userMapper.selectByEmail(email);
    }


    // [차량 마스터 정보 관련 서비스 ]
    /**
     * [READ] 모든 차량 브랜드 목록 조회
     */
    public List<Map<String, Object>> getAllBrands() {
        return this.userMapper.selectAllBrands();
    }

    /**
     * [READ] 브랜드별 모델 목록 조회
     */
    public List<Map<String, Object>> getModelsByBrand(int brandId) {
        return this.userMapper.selectModelsByBrandId(brandId);
    }

    /**
     * [UPDATE] 차량 정보만 별도로 수정 (차량 정보 모달 전용)
     */
    @Transactional
    public Result updateVehicleOnly(String email, int carModelId, String carNumber) {
        // 1. 모델 ID 존재 여부 검증 (보안)
        if (this.userMapper.countModelById(carModelId) == 0) {
            return CommonResult.FAILURE;
        }

        UserEntity user = this.userMapper.selectByEmail(email);
        if (user == null) return UserResult.USER_NOT_FOUND;

        // 2. 정보 업데이트
        user.setCarModelId(carModelId);
        user.setCarNumber(carNumber);

        return this.userMapper.updateUserInfo(user) > 0 ? CommonResult.SUCCESS : CommonResult.FAILURE;
    }
}