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

        if (user != null) {
            /* --- [CASE 1] 기존 회원: 로그인 성공 --- */
            session.setAttribute("sessionUser", user);
            session.removeAttribute("pendingSocialType");
            session.removeAttribute("pendingSocialId");

            log.info("기존 회원 로그인 성공. 8080 포트로 이동합니다.");

            // [수정] 로그인 성공 후 브라우저 주소창을 http://localhost:8080/ 으로 고정
            response.sendRedirect("http://localhost:8080/");
        } else {
            /* --- [CASE 2] 신규 유저: 회원가입 필요 --- */
            log.info("신규 유저 확인. 5173 포트의 가입 페이지로 이동합니다.");

            // 아직 가입 전이므로 리액트 개발 서버(5173)의 가입 페이지로 보냅니다.
            response.sendRedirect("http://localhost:5173/register");
        }
    }
}