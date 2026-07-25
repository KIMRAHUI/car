package com.krh.backend.configs;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.client.SimpleClientHttpRequestFactory;

@Configuration
public class RestTemplateConfig {

    @Bean
    public RestTemplate restTemplate() {
        // 타임아웃 설정을 추가하여 AI 응답이 너무 늦어질 경우 무한 대기를 방지
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();

        factory.setConnectTimeout(5000); // 연결 시도 시간 (5초)
        factory.setReadTimeout(30000);    // 답변 기다리는 시간 (30초)

        return new RestTemplate(factory);
    }
}