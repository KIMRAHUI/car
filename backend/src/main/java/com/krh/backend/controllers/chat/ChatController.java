package com.krh.backend.controllers.chat;

import com.krh.backend.services.chat.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    /**
     * 리액트에서 전달한 질문을 받아 AI 응답 반환
     * 요청 경로: POST /api/chat/ask
     */
    @PostMapping("/ask")
    public ResponseEntity<Map<String, String>> ask(@RequestBody Map<String, String> request) {
        String userMessage = request.get("message");

        log.info("ChatController - 질문 접수: {}", userMessage);

        try {
            // 서비스 계층을 통해 AI 답변 획득
            String aiResponse = chatService.getAiResponse(userMessage);

            // JSON 형태로 응답 반환 { "response": "AI의 답변내용" }
            return ResponseEntity.ok(Map.of("response", aiResponse));

        } catch (Exception e) {
            log.error("ChatController - 오류 발생: ", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("response", "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요."));
        }
    }
}