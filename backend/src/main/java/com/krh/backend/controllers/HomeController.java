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
            // 나중에 UserEntity 클래스를 만들면 아래 주석을 풀고 실제 세션(로그인 정보)을 받을 거예요!
            // @SessionAttribute(value = "user", required = false) UserEntity sessionUser
    ) {
        Map<String, Object> response = new HashMap<>();

        // 임시로 로그인 상태를 체크하는 변수입니다. (나중에는 sessionUser가 null인지 아닌지로 판단합니다)
        boolean isSigned = false; // 테스트해 보시려면 이 값을 true로 바꿔보세요!

        if (isSigned) {
            // 로그인 된 상태 (sessionUser != null 일 때)
            response.put("viewStatus", "home_signed");
            response.put("message", "로그인된 사용자입니다. 환영합니다!");
            // response.put("user", sessionUser.getNickname()); // 나중에 유저 닉네임도 같이 보냅니다.
        } else {
            // 로그인 안 된 상태 (sessionUser == null 일 때)
            response.put("viewStatus", "home_unsigned");
            response.put("message", "로그인되지 않은 사용자입니다.");
        }

        return response;
    }
}