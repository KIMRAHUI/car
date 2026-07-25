package com.krh.backend.services.user;

import com.krh.backend.entities.user.UserEntity;
import com.krh.backend.mappers.user.UserMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final UserMapper userMapper;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException {
        HttpSession session = request.getSession();

        String socialTypeCode = (String) session.getAttribute("pendingSocialType");
        String socialId = (String) session.getAttribute("pendingSocialId");

        UserEntity user = userMapper.selectBySocialInfo(socialTypeCode, socialId);

        String serverName = request.getServerName();
        String baseUrl;
        String registerUrl;

        // 로컬 환경
        if ("localhost".equals(serverName) || "127.0.0.1".equals(serverName)) {
            baseUrl = "http://localhost:5173/";
            registerUrl = "http://localhost:5173/register";
        } else {
            // 배포 환경
            baseUrl = "https://car.rhui.dev/";
            registerUrl = "https://car.rhui.dev/register";
        }

        if (user != null) {
            //기존 회원: 로그인 성공
            session.setAttribute("sessionUser", user);
            session.removeAttribute("pendingSocialType");
            session.removeAttribute("pendingSocialId");

            log.info("로그인 성공. 이동 대상: {}", baseUrl);
            response.sendRedirect(baseUrl);
        } else {
            //신규 유저: 회원가입 필요
            log.info("신규 유저 확인. 이동 대상: {}", registerUrl);
            response.sendRedirect(registerUrl);
        }
    }
}