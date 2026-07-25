package com.krh.backend.controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api") // 프론트엔드와 통신하는 API라는 뜻으로 달아둡니다.
public class HomeController {

    @GetMapping("/home")
    public Map<String, Object> getHome(
            // @SessionAttribute(value = "user", required = false) UserEntity sessionUser
    ) {
        Map<String, Object> response = new HashMap<>();

        // 임시로 로그인 상태를 체크하는 변수 (나중에는 sessionUser가 null인지 아닌지로 판단)
        boolean isSigned = false;

        if (isSigned) {
            // 로그인 된 상태 (sessionUser != null 일 때)
            response.put("viewStatus", "home_signed");
            response.put("message", "로그인된 사용자입니다. 환영합니다!");
            // response.put("user", sessionUser.getNickname());
        } else {
            // 로그인 안 된 상태 (sessionUser == null 일 때)
            response.put("viewStatus", "home_unsigned");
            response.put("message", "로그인되지 않은 사용자입니다.");
        }

        return response;
    }
}