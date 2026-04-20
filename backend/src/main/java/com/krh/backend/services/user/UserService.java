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
        // 가입하려는 이메일이 이미 users 테이블에 있다면 인증번호를 보내지 않고 중복 에러 반환
        if ("JOIN".equals(type)) {
            if (this.userMapper.selectByEmail(email) != null) {
                return UserResult.DUPLICATE_EMAIL;
            }
        }

        EmailTokenEntity existingToken = this.userMapper.selectEmailTokenByEmail(email);

        // [핵심 수정] 재전송 횟수 제한 체크
        if (existingToken != null && !existingToken.isUsed() && existingToken.getRetryCount() >= 1) {
            return CommonResult.FAILURE;
        }

        String code = RandomStringUtils.randomNumeric(6);
        String salt = this.passwordEncoder.encode(email + LocalDateTime.now());

        EmailTokenEntity token = EmailTokenEntity.builder()
                .email(email)
                .code(code)
                .salt(salt)
                .expiresAt(LocalDateTime.now().plusMinutes(3)) // 3분 타임 제약
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
     * 번호 대조 -> 만료 시간 검증 -> 성공 시 DB 업데이트
     */
    @Transactional
    public Result verifyEmailCode(String email, String code) {
        // 1. 해당 이메일의 최신 토큰 조회
        EmailTokenEntity token = this.userMapper.selectEmailTokenByEmail(email);

        // 2. 토큰 존재 여부 및 만료 시간 확인 (3분 경과 여부)
        if (token == null || token.getExpiresAt().isBefore(LocalDateTime.now())) {
            return UserResult.INVALID_EMAIL; // 만료되었거나 이력이 없음
        }

        // 3. 사용자가 입력한 번호와 DB 번호 대조
        if (!token.getCode().equals(code)) {
            return UserResult.WRONG_PASSWORD; // 번호 불일치
        }

        // 4. 인증 성공 처리 (is_verified = true)
        if (this.userMapper.updateEmailTokenVerified(email, code) <= 0) {
            return CommonResult.FAILURE;
        }

        return CommonResult.SUCCESS;
    }

    /**
     * [추가/수정] 임시 비밀번호 발급 및 메일 전송 (차량 번호 검증 추가)
     * @param email 사용자 이메일
     * @param carNumber 사용자가 입력한 차량 번호
     */
    @Transactional
    public Result issueTemporaryPassword(String email, String carNumber) {
        // 1. 사용자 존재 확인
        UserEntity user = this.userMapper.selectByEmail(email);
        if (user == null) {
            return UserResult.USER_NOT_FOUND;
        }

        // [핵심 추가] 2. 차량 번호 대조 (DB값과 입력값 비교)
        // 공백 제거 후 비교하여 사용자 입력 편의성 제공
        String dbCarNumber = user.getCarNumber().replaceAll("\\s", "");
        String inputCarNumber = carNumber.replaceAll("\\s", "");

        if (!dbCarNumber.equals(inputCarNumber)) {
            return CommonResult.FAILURE; // 차량 번호 불일치 시 거부
        }

        // 3. 8자리 영문+숫자 혼합 임시 비밀번호 생성
        String tempPassword = RandomStringUtils.randomAlphanumeric(8);

        // 4. DB 비밀번호 암호화 후 업데이트
        user.setPassword(BCrypt.hashpw(tempPassword, BCrypt.gensalt()));
        if (this.userMapper.updateUserInfo(user) <= 0) {
            return CommonResult.FAILURE;
        }

        // 5. 이메일 토큰 사용 처리 (다음 인증 시 횟수 초기화를 위해)
        this.userMapper.updateEmailTokenUsed(email);

        // 6. 임시 비밀번호 전용 메일 발송 로직 호출
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

        if (user.getPassword() != null && !user.getPassword().isEmpty()) {
            user.setPassword(BCrypt.hashpw(user.getPassword(), BCrypt.gensalt()));
        }

        if (user.getPhone() != null) {
            user.setPhone(user.getPhone().replaceAll("[^0-9]", ""));
        }

        if (this.userMapper.insertUser(user) <= 0) {
            return Pair.of(CommonResult.FAILURE, null);
        }

        // 가입 완료 시 토큰 사용 처리
        this.userMapper.updateEmailTokenUsed(user.getEmail());

        return Pair.of(CommonResult.SUCCESS, user);
    }

    /**
     * [READ / LOGIN] 로그인
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
     * UPDATE 유저 정보 수정
     * [핵심 수정] 기존 비밀번호 검증 로직 추가
     * @param user 수정할 정보 (새 비밀번호 포함)
     * @param currentPassword 사용자가 입력한 현재 비밀번호
     */
    @Transactional
    public Pair<Result, UserEntity> updateUserInfo(UserEntity user, String currentPassword) {
        // 1. 유효성 검사
        if (!UserValidator.validateEmail(user.getEmail())) {
            return Pair.of(UserResult.INVALID_EMAIL, null);
        }

        // 2. 기존 유저 정보 조회
        UserEntity dbUser = this.userMapper.selectByEmail(user.getEmail());
        if (dbUser == null) {
            return Pair.of(UserResult.USER_NOT_FOUND, null);
        }

        // 3. 기존 비밀번호 검증 (BCrypt 대조)
        // 사용자가 입력한 currentPassword와 DB의 암호화된 password를 비교합니다.
        if (currentPassword == null || !BCrypt.checkpw(currentPassword, dbUser.getPassword())) {
            return Pair.of(UserResult.WRONG_PASSWORD, null); // 일치하지 않으면 '기존 비밀번호 불일치' 반환
        }

        // 4. 전화번호 양식 정제
        if (user.getPhone() != null) {
            user.setPhone(user.getPhone().replaceAll("[^0-9]", ""));
        }

        // 5. 새 비밀번호 암호화 후 설정
        if (user.getPassword() != null && !user.getPassword().isEmpty()) {
            user.setPassword(BCrypt.hashpw(user.getPassword(), BCrypt.gensalt()));
        }

        // 6. DB 업데이트 실행
        return this.userMapper.updateUserInfo(user) > 0
                ? Pair.of(CommonResult.SUCCESS, user)
                : Pair.of(CommonResult.FAILURE, null);
    }

    /**
     * DELETE 회원 탈퇴
     */
    @Transactional
    public Result deleteUser(String email) {
        if (!UserValidator.validateEmail(email)) {
            return CommonResult.FAILURE;
        }
        return this.userMapper.deleteByUser(email) > 0 ? CommonResult.SUCCESS : CommonResult.FAILURE;
    }

    /**
     * READ 단일 유저 조회
     */
    public UserEntity getUserByEmail(String email) {
        if (!UserValidator.validateEmail(email)) {
            return null;
        }
        return this.userMapper.selectByEmail(email);
    }
}