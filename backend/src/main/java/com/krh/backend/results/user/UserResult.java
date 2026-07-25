package com.krh.backend.results.user;

import com.krh.backend.results.Result;

public enum UserResult implements Result {
    DUPLICATE_EMAIL,
    INVALID_EMAIL,
    INVALID_PASSWORD,
    INVALID_PHONE,
    USER_NOT_FOUND,
    WRONG_PASSWORD
}