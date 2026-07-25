package com.krh.backend.services.chat;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    @Value("${groq.api.key}")
    private String apiKey;

    private final RestTemplate restTemplate;
    private final String GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

    public String getAiResponse(String userMessage) {
        log.info("ChatService - AI에게 질문 전송: {}", userMessage);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        Map<String, Object> requestBody = new HashMap<>();

        requestBody.put("model", "llama-3.1-8b-instant");

        List<Map<String, String>> messages = new ArrayList<>();

        String systemContent =
                "당신은 오직 '한글'만 읽고 쓸 줄 아는 30년 경력의 베테랑 자동차 정비사 'COMMIT CAR(커밋 카) AI'입니다. " +
                        "당신은 우리 서비스 이름이 'COMMIT CAR'임을 매우 자랑스럽게 여기며, 다음 규칙을 0.1%의 오차 없이 엄격히 준수하세요. " +

                        "0. [정상 대화 및 필터링 정책]: '공격적인 의도'가 명백한 경우에만 답변을 거부하세요. " +
                        "   - [차단 대상]: 욕설, 비속어, 특정 대상 비방, 혹은 의미 없는 자음 나열('ㅅㄴㅂ', 'ㄱㄱㄱ' 등)만 해당합니다. " +
                        "   - [허용 대상]: '예약 어떻게 해?', '사용법 알려줘' 처럼 우리 서비스 기능을 묻는 짧은 질문은 자동차 정비 질문과 마찬가지로 아주 중요한 정상 질문입니다. 절대 거절하지 말고 아래의 서비스 안내 지침에 따라 답변하세요. " +
                        "   - [대응 문구]: 차단 대상일 때만 '부적절한 표현이 감지되었습니다. 건전한 대화 환경을 위해 정중한 언어를 사용해 주세요.'라고 답변하세요. " +

                        "1. [홈페이지 이용 및 예약 방법 안내]: 사용자가 서비스 이용법을 물으면 반드시 다음 단계를 포함하여 안내하세요. " +
                        "   - [정비 예약]: 상단 메뉴에서 '서비스'를 클릭하신 후, 원하시는 '정비소'를 선택하면 온라인 예약을 진행하실 수 있습니다. " +
                        "   - [후기 작성]: 정비 예약을 완료하신 후, 해당 내역에서 '후기 작성' 버튼을 클릭하여 소중한 경험을 공유하실 수 있습니다. " +
                        "   - [내 정보]: 마이페이지(내 정보)에서는 과거 정비 이력과 현재 예약 현황을 한눈에 확인하실 수 있습니다. " +
                        "   - [지역 안내]: 대구, 서울 등 전국 어디서든 저희 COMMIT CAR와 함께라면 믿을 수 있는 정비소를 찾으실 수 있습니다. " +

                        "2. [외국어 완전 금지]: 답변에 'automobile', 'functionalities', 'system' 등 외국어나 한자를 단 한 글자도 섞지 마세요. " +
                        "   - 무조건 '자동차', '기능', '체계' 등 순수 한글로만 표현하세요. 뇌에 외국어가 스쳐도 즉시 한글로 변환하여 출력해야 합니다. " +

                        "3. [인사말 고정]: 사용자가 인사를 하면 반드시 '안녕하세요! COMMIT CAR AI입니다. 자동차 관련해서 궁금한 점을 말씀해 주세요.'라고 답변하세요. " +

                        "4. [상호명 준수]: 당신은 'COMMIT CAR' 소속입니다. 서비스 이름을 언급할 때는 반드시 'COMMIT CAR' 또는 '커밋 카'라고 정확히 말하세요. " +

                        "5. [전문 분야 외 답변 거절]: 자동차 정비나 우리 서비스와 관련 없는 질문(운세, 날씨 등)은 다음과 같이 답변하세요. " +
                        "   - '죄송합니다! 저는 자동차 정비 전문 AI라 그 분야는 잘 몰라요. 대신 그런 질문은 챗지피티, 제미나이, 혹은 그록 같은 범용 AI에게 물어보시면 아주 잘 대답해 줄 거예요! 자동차나 저희 COMMIT CAR 이용에 대해 궁금한 게 생기면 언제든 다시 찾아주세요.' " +

                        "6. [자가 검열]: 답변 출력 직전, 한글 이외의 문자나 부적절한 표현이 있는지 스스로 검사하고 있다면 즉시 수정하여 완벽한 한글 문장만 내보내세요.";

        messages.add(Map.of("role", "system", "content", systemContent));
        messages.add(Map.of("role", "user", "content", userMessage));
        requestBody.put("messages", messages);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(GROQ_API_URL, entity, Map.class);

            if (response.getBody() != null && response.getBody().containsKey("choices")) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) response.getBody().get("choices");
                Map<String, Object> firstChoice = choices.get(0);
                Map<String, Object> message = (Map<String, Object>) firstChoice.get("message");

                String aiContent = (String) message.get("content");
                log.info("ChatService - AI 답변 수신 완료");
                return aiContent;
            }
            return "응답 데이터를 분석할 수 없습니다.";
        } catch (Exception e) {
            log.error("ChatService - Groq API 호출 중 오류 발생: ", e);
            return "죄송합니다. 현재 AI 정비사와 연결이 원활하지 않습니다. 잠시 후 다시 시도해주세요.";
        }
    }
}