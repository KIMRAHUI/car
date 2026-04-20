package com.krh.backend.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * 프론트엔드(React) 라우팅을 위한 포워딩 컨트롤러
 */
@Controller
public class ForwardController {

    // React Router에서 사용하는 모든 경로를 등록합니다.
    @GetMapping({
            "/login",
            "/register",
            "/mypage/**",
            "/service/**"
    })
    public String forward() {
        // 서버 내부에서 index.html로 요청을 넘깁니다.
        // 이렇게 하면 브라우저 URL은 유지되면서 React 앱이 다시 로드됩니다.
        return "forward:/index.html";
    }
}