package com.krh.backend.validators.user;

import com.krh.backend.entities.user.UserEntity;
import com.krh.backend.validators.ValidatorUtils;
import lombok.NonNull;
import lombok.experimental.UtilityClass;

@UtilityClass
public class UserValidator {
    //정규식
    public static final String EMAIL_REGEX = "^(?=.{8,50}$)([\\da-zA-Z_.]{4,25})@([\\da-z\\-]+\\.)?([\\da-z\\-]{2,})\\.([a-z]{2,15}\\.)?([a-z]{2,3})$";
    public static final String PASSWORD_REGEX = "^[\\da-zA-Z`~!@#$%^&*()\\-_=+\\[{\\]}\\\\|;:'\",<.>/?]{8,50}$"; // 보안 강화: 8자 이상
    public static final String NAME_REGEX = "^[가-힣a-zA-Z]{2,10}$"; // 이름 2~10자
    public static final String PHONE_REGEX = "^010\\d{7,8}$"; // 하이픈 제거된 숫자만
    public static final String CAR_NUMBER_REGEX = "^\\d{2,3}[가-힣]\\d{4}$";

    //Email 검증
    public static boolean validateEmail(String email) {
        return email != null &&
                ValidatorUtils.isLengthInBetween(email,8,50) &&
                email.matches(EMAIL_REGEX);
    }

    //Password검증
    public static boolean validatePassword(String password) {
        return password != null &&
                ValidatorUtils.isLengthInBetween(password,8,50) &&
                password.matches(PASSWORD_REGEX);
    }

    //phone검증
    public static boolean validatePhone(String phone) {
        if(phone == null) return  false;
        String cleanPhone = phone.replaceAll("[^0-9]", "");
        return cleanPhone.matches(PHONE_REGEX);
    }

    //Name검증
    public static boolean validateName(String name) {
        return name != null &&
                ValidatorUtils.isLengthInBetween(name,2,10)&&
                name.matches(NAME_REGEX);
    }

    // 1. 로그인용 검증: 이메일과 비번만 체크
    public boolean validateLogin(String email, String password) {
        return validateEmail(email) && validatePassword(password);
    }

    // 2. 회원가입용 검증: 필수 정보 전부 체크
    public boolean validateRegister(@NonNull UserEntity user) {
        // 로그인이 가능한 기본 조건 + 가입에 필요한 추가 조건(이름, 번호 등)
        return validateEmail(user.getEmail()) &&
                validatePassword(user.getPassword()) &&
                validateName(user.getName()) &&
                validatePhone(user.getPhone());
    }

    //프론트에서 52,100km 문자열을 순수 숫자로 정제하는것
    public static int normalizeNumber(String str){
        if(str == null || str.isEmpty()) return 0;
        return Integer.parseInt(str.replaceAll("[^0-9]", ""));
    }
}
