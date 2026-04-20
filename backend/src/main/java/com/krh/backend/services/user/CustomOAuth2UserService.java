package com.krh.backend.services.user;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final HttpSession httpSession; // 세션 주입 추가

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        // 1. 소셜 서비스 ID (kakao, naver)
        String registrationId = userRequest.getClientRegistration().getRegistrationId();

        // 2. 응답받은 속성들
        Map<String, Object> attributes = oAuth2User.getAttributes();

        // 3. [핵심] 소셜 고유 ID(social_id) 추출
        String socialId = "";
        if ("kakao".equals(registrationId)) {
            socialId = String.valueOf(attributes.get("id")); // 카카오는 id가 최상위에 있음
        } else if ("naver".equals(registrationId)) {
            Map<String, Object> response = (Map<String, Object>) attributes.get("response");
            socialId = String.valueOf(response.get("id")); // 네이버는 response 안에 id가 있음
        }

        log.info("추출된 소셜 타입: {}, 소셜 ID: {}", registrationId, socialId);

        // 4. 추출한 정보를 세션에 임시 저장
        // (이후 /user/register로 이동했을 때 꺼내서 DB에 넣기 위함)
        httpSession.setAttribute("pendingSocialType", registrationId);
        httpSession.setAttribute("pendingSocialId", socialId);

        String userNameAttributeName = userRequest.getClientRegistration()
                .getProviderDetails().getUserInfoEndpoint().getUserNameAttributeName();

        return new DefaultOAuth2User(
                Collections.singleton(new SimpleGrantedAuthority("ROLE_USER")),
                attributes,
                userNameAttributeName
        );
    }
}