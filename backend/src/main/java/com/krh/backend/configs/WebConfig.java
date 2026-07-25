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
        // 경로 구분자 통일 및 끝 슬래시 보정
        // 윈도우의 역슬래시(\)를 슬래시(/)로 변환하여 경로 깨짐을 방지
        String basePath = uploadDir.replace("\\", "/");
        if (!basePath.endsWith("/")) {
            basePath += "/";
        }

        // 운영체제 및 환경에 따른 프로토콜(file: vs file:///) 최적화
        String resourceLocation;
        if (basePath.startsWith("/")) {
            // 리눅스/배포 환경 (예: /home/ubuntu/carmit_uploads/)
            resourceLocation = "file:" + basePath;
        } else {
            // 윈도우 로컬 환경 (예: C:/carmit_uploads/)
            resourceLocation = "file:///" + basePath;
        }

        //리소스 핸들러 등록
        // DB에 "/upload/profile/파일명.jpg" 처럼 저장되므로
        // 호출 경로(/upload/**)와 실제 물리 경로(resourceLocation)를 1:1로 매핑
        // 이렇게 하면 profile, reservation, review 하위 폴더를 자동으로 찾기 가능
        registry.addResourceHandler("/upload/**")
                .addResourceLocations(resourceLocation);

        // 디버깅용 로그 - 서버 기동 시 콘솔에서 확인 가능
        System.out.println("=================================================");
        System.out.println("이미지 리소스 설정 정보");
        System.out.println("설정된 업로드 폴더: " + uploadDir);
        System.out.println("매핑된 리소스 위치: " + resourceLocation);
        System.out.println("=================================================");
    }
}