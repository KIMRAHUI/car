package com.krh.backend.services.user;

import com.krh.backend.dtos.MaintenanceResponse;
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
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserMapper userMapper;
    private final MailService mailService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    /**
     * [READ] 마이페이지 정비 기록 및 소모품 상태 데이터 계산
     * 교체 주기(replaceInterval)가 999,999인 비정기 수리 항목은 마이페이지 관리 대상에서 완전히 제외
     * 정기적인 교체/점검이 필요한 소모품(엔진오일 등)만 리스트에 담아 상태를 계산
     * 사고 수리 등은 예약(Reservation) 이력에서 관리되므로 여기서 중복 노출안함
     */
    public List<MaintenanceResponse> getMaintenanceStatus(String email) {
        UserEntity user = this.userMapper.selectByEmail(email);
        if (user == null) return new ArrayList<>();

        // DB:마스터 항목 기반으로 정비 이력 조회
        List<MaintenanceResponse> allItems = this.userMapper.selectAllMaintenanceStatus(email);
        List<MaintenanceResponse> filteredResponses = new ArrayList<>();

        for (MaintenanceResponse item : allItems) {
            // DB:가져온 개별 항목의 교체 주기
            int interval = (item.getReplaceInterval() != null) ? item.getReplaceInterval() : 10000;

            // 교체 주기가 999,999인 항목(외장 수리, 사고 수리 등)은 마이페이지 소모품 관리 대상이 아니므로 즉시 제외
            if (interval >= 999999) {
                continue;
            }
            int lastMileage = (item.getLastServiceMileage() != null) ? item.getLastServiceMileage() : 0;
            int nextMileage = lastMileage + interval;
            int remaining = nextMileage - user.getMileage();

            // 진행률 계산 (0 ~ 100%)
            int spent = user.getMileage() - lastMileage;
            int progress = (int) Math.min(100, Math.max(0, ((double) spent / interval) * 100));

            // 상태(Status) 판별 로직
            String status = "정상";
            if (remaining <= 0) {
                status = "위험"; // 교체 주기 도달 또는 초과
            } else if (remaining <= (interval * 0.2)) {
                status = "주의"; // 남은 거리가 주기 대비 20% 이하일 때 (80% 지점 도달)
            }

            item.setNextServiceMileage(nextMileage);
            item.setRemainingMileage(remaining);
            item.setMaintenanceProgress(progress);
            item.setStatus(status);

            if (item.getLastServiceDate() == null) {
                item.setLastServiceDate("기록 없음");
            }

            filteredResponses.add(item);
        }

        return filteredResponses;
    }

    /**
     * 이메일 인증 번호 발송
     *  일일 최대 10회 발송 제한 로직 적용
     * 자정이 지나면(날짜가 바뀌면) 발송 횟수 자동 리셋
     */
    @Transactional
    public Result sendVerificationEmail(String email, String type) {
        if (!UserValidator.validateEmail(email)) {
            return UserResult.INVALID_EMAIL;
        }

        //회원가입(JOIN) 시 이메일 중복 체크
        if ("JOIN".equals(type)) {
            if (this.userMapper.selectByEmail(email) != null) {
                return UserResult.DUPLICATE_EMAIL;
            }
        }

        // 기존 토큰 정보 조회 (PK가 email로 변경됨에 따라 단일 행 조회)
        EmailTokenEntity existingToken = this.userMapper.selectEmailTokenByEmail(email);
        int newRetryCount = 1;
        LocalDateTime now = LocalDateTime.now();

        if (existingToken != null) {
            // 마지막 발송일(updatedAt)과 현재 날짜 비교
            // DB의 updated_at 컬럼 자동 갱신 기능을 활용하여 오늘 발송 여부 판단
            boolean isSameDay = existingToken.getUpdatedAt().toLocalDate().isEqual(now.toLocalDate());

            if (isSameDay) {
                // 오늘 이미 보낸 기록이 있다면 기존 횟수 + 1
                newRetryCount = existingToken.getRetryCount() + 1;
                // 오늘 발송 기록이 있는 경우 횟수 체크 (10회 제한)
                if (existingToken.getRetryCount() > 10) {
                    return CommonResult.FAILURE; // 일일 발송 한도 초과
                }
            } else {
                // 날짜가 바뀌었으므로 카운트를 1로 리셋하여 새로 시작
                newRetryCount = 1;
            }
        }



        // 인증 번호 및 보안 솔트 생성
        String code = RandomStringUtils.randomNumeric(6);
        String salt = this.passwordEncoder.encode(email + now);

        //새 토큰 엔티티 빌드 (인증 상태 및 카운트 반영)
        EmailTokenEntity token = EmailTokenEntity.builder()
                .email(email)
                .code(code)
                .salt(salt)
                .retryCount(newRetryCount)
                .isVerified(false) // 새로운 인증 시도이므로 초기화
                .isUsed(false)     // 새로운 인증 시도이므로 초기화
                .expiresAt(now.plusMinutes(3))
                .build();

        // DB 저장 또는 갱신
        if (existingToken == null) {
            this.userMapper.insertEmailToken(token);
        } else {
            this.userMapper.updateEmailToken(token);
        }

        // 실제 메일 발송 서비스 호출
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
        // 1. 입력값 유효성 검사
        if (!UserValidator.validateLogin(email, password)) {
            return Pair.of(CommonResult.FAILURE, null);
        }

        // 이메일로 사용자 조회
        UserEntity dbUser = this.userMapper.selectByEmail(email);

        // 사용자가 존재하지 않는 경우
        if (dbUser == null) {
            return Pair.of(UserResult.USER_NOT_FOUND, null);
        }

        // 소셜 가입 계정의 일반 로그인 차단
        // DB의 social_type_code가 null이 아니면 네이버/카카오 가입자이므로 일반 로그인 막음
        if (dbUser.getSocialTypeCode() != null && !dbUser.getSocialTypeCode().isEmpty()) {
            return Pair.of(CommonResult.FAILURE, null);
        }
        // --------------------------------------------------

        // 4. 비밀번호 일치 여부 확인
        if (dbUser.getPassword() == null || !BCrypt.checkpw(password, dbUser.getPassword())) {
            return Pair.of(UserResult.WRONG_PASSWORD, null);
        }

        // 보안을 위해 비밀번호 필드는 비우고 리턴
        dbUser.setPassword(null);
        return Pair.of(CommonResult.SUCCESS, dbUser);
    }

    /**
     * [UPDATE] 유저 정보 수정 (비밀번호 검증을 선택적으로 수행)
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

        // currentPassword가 입력된 경우에만 비밀번호 검증을 수행
        // 사진만 즉시 변경할 때는 currentPassword가 null이나 빈 값으로 들어오므로 이 검증을 건너뜀
        if (currentPassword != null && !currentPassword.isEmpty()) {
            if (!BCrypt.checkpw(currentPassword, dbUser.getPassword())) {
                return Pair.of(UserResult.WRONG_PASSWORD, null);
            }
        }

        // 차량 모델 존재 여부 확인
        if (user.getCarModelId() != null && this.userMapper.countModelById(user.getCarModelId()) == 0) {
            return Pair.of(CommonResult.FAILURE, null);
        }

        // 전화번호 포맷팅 (숫자만 남기기)
        if (user.getPhone() != null) {
            user.setPhone(user.getPhone().replaceAll("[^0-9]", ""));
        }

        // 새 비밀번호 설정
        if (user.getPassword() != null && !user.getPassword().isEmpty()) {
            user.setPassword(BCrypt.hashpw(user.getPassword(), BCrypt.gensalt()));
        } else {
            // 비밀번호를 변경하지 않는 경우 ->기존 비밀번호를 유지
            user.setPassword(dbUser.getPassword());
        }

        // DB 업데이트 실행
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
        if (this.userMapper.countModelById(carModelId) == 0) {
            return CommonResult.FAILURE;
        }

        UserEntity user = this.userMapper.selectByEmail(email);
        if (user == null) return UserResult.USER_NOT_FOUND;

        user.setCarModelId(carModelId);
        user.setCarNumber(carNumber);

        return this.userMapper.updateUserInfo(user) > 0 ? CommonResult.SUCCESS : CommonResult.FAILURE;
    }

    /**
     * [UPDATE] 프로필 이미지만 즉시 수정 (마이페이지 직접 클릭 전용)
     */
    @Transactional
    public Result updateProfileImageOnly(UserEntity user) {
        if (user == null || user.getEmail() == null) {
            return CommonResult.FAILURE;
        }
        return this.userMapper.updateUserInfo(user) > 0 ? CommonResult.SUCCESS : CommonResult.FAILURE;
    }

    /**
     * [UPDATE] 정비 기록 수동 업데이트 및 사용자 주행거리 동기화
     */
    @Transactional
    public Result updateUserMaintenanceRecord(String email, String itemName, String lastServiceDate, int lastServiceMileage) {
        if (email == null || itemName == null || lastServiceDate == null) {
            return CommonResult.FAILURE;
        }

        // 해당 사용자의 주행거리 업데이트
        UserEntity user = this.userMapper.selectByEmail(email);
        if (user == null) return UserResult.USER_NOT_FOUND;

        if (lastServiceMileage > user.getMileage()) {
            user.setMileage(lastServiceMileage);
            this.userMapper.updateUserInfo(user);
        }

        // 정비 이력 저장 (source 인자인 "MANUAL"을 추가하여 5개의 인자를 맞춤)
        int affectedRows = this.userMapper.upsertMaintenanceRecord(
                email,
                itemName,
                lastServiceDate,
                lastServiceMileage,
                "MANUAL"
        );

        return affectedRows > 0 ? CommonResult.SUCCESS : CommonResult.FAILURE;
    }
    /**
     * 이메일 인증 번호 발송
     * 리턴값에 현재 발송 횟수(retryCount)를 포함하여 프론트엔드에서 1/10 등 표시 가능하게 함
     */
    @Transactional
    public Map<String, Object> sendVerificationEmailWithCount(String email, String type) {
        Result result = this.sendVerificationEmail(email, type);

        Map<String, Object> response = new HashMap<>();
        response.put("result", result.toString().toLowerCase()); // 'success', 'failure' 등

        //최신 카운트 정보 조회하여 포함
        EmailTokenEntity token = this.userMapper.selectEmailTokenByEmail(email);
        if (token != null) {
            response.put("retryCount", token.getRetryCount());
        } else {
            response.put("retryCount", 0);
        }

        return response;
    }
}