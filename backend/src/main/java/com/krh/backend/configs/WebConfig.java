package com.krh.backend.configs;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${file.upload-dir}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 경로 끝에 슬래시(/)가 포함되도록 보정
        String basePath = uploadDir.endsWith("/") ? uploadDir : uploadDir + "/";

        // 1. 프로필 이미지 경로
        registry.addResourceHandler("/upload/profile/**")
                .addResourceLocations("file:" + basePath + "profile/");

        // 2. 예약 증상 이미지 경로
        registry.addResourceHandler("/upload/reservation/**")
                .addResourceLocations("file:" + basePath + "reservation/");

        // 3. 리뷰 이미지 경로
        registry.addResourceHandler("/upload/review/**")
                .addResourceLocations("file:" + basePath + "review/");
    }
}