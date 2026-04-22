package com.krh.backend.configs;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 1. 프로필 이미지 경로
        registry.addResourceHandler("/upload/profile/**")
                .addResourceLocations("file:///C:/Users/노오리/Desktop/carmit_uploads/profile/");

        // 2. 예약 증상 이미지 경로
        registry.addResourceHandler("/upload/reservation/**")
                .addResourceLocations("file:///C:/Users/노오리/Desktop/carmit_uploads/reservation/");

        // 3.리뷰 이미지 경로
        registry.addResourceHandler("/upload/review/**")
                .addResourceLocations("file:///C:/Users/노오리/Desktop/carmit_uploads/review/");
    }
}