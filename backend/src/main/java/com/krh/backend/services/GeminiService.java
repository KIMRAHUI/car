package com.krh.backend.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.*;

@Service
public class GeminiService {

    @Value("${gemini.api.key}")
    private String apiKey;

    // application.properties에서 URL을 가져오지 않고 직접 정의하거나 확인하세요.
    // 추천 URL: https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent
    @Value("${gemini.api.url}")
    private String apiUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public boolean validateContent(String text) {
        if (text == null || text.trim().isEmpty()) {
            return true;
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            // [강화된 프롬프트 유지]
            String prompt = String.format(
                    "You are an extremely strict content moderation bot for a car repair service.\n" +
                            "If the text contains ANY Korean profanity (e.g., 시발, 존나) or spam, respond with 'FAIL'.\n" +
                            "If it is valid, respond with 'PASS'.\n" +
                            "Respond ONLY with 'PASS' or 'FAIL'.\n\nText: \"%s\"", text);

            Map<String, Object> body = Map.of(
                    "contents", List.of(
                            Map.of("parts", List.of(
                                    Map.of("text", prompt)
                            ))
                    )
            );

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            // 중요: URL 끝에 파라미터가 중복되지 않도록 확인
            String finalUrl = apiUrl.contains("?key=") ? apiUrl : apiUrl + "?key=" + apiKey;

            ResponseEntity<Map> response = restTemplate.postForEntity(finalUrl, entity, Map.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                List candidates = (List) response.getBody().get("candidates");
                Map firstCandidate = (Map) candidates.get(0);
                Map content = (Map) firstCandidate.get("content");
                List parts = (List) content.get("parts");
                Map part = (Map) parts.get(0);

                String aiAnswer = part.get("text").toString().trim().toUpperCase();
                return aiAnswer.equals("PASS");
            }
        } catch (Exception e) {
            // API 호출 실패 시, 안전을 위해 false를 반환하여 저장을 막거나 로그를 남깁니다.
            System.err.println("Gemini API 호출 중 오류 발생: " + e.getMessage());
            return false; // 오류 시 일단 차단 (테스트 시 확인 용이)
        }
        return true;
    }
}