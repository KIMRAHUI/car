package com.krh.backend.validators;

import lombok.NonNull;
import lombok.experimental.UtilityClass;

@UtilityClass
public class ValidatorUtils {
    // 최소/최대 길이 체크
    public static boolean isLengthInBetween(@NonNull String str, int min, int max) {
        return str.length() >= min && str.length() <= max;
    }
}