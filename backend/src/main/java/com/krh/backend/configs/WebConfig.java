package com.krh.backend.configs;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 바탕화면에 만드신 폴더 경로로 직접 지정합니다.
        // 역슬래시(\) 대신 슬래시(/)를 사용해야 자바에서 인식을 잘 합니다.
        registry.addResourceHandler("/upload/profile/**")
                .addResourceLocations("file:///C:/Users/노오리/Desktop/carmit_uploads/profile/");
    }
}