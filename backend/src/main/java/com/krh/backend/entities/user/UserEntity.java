package com.krh.backend.entities.user;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
@Builder
@EqualsAndHashCode(of = "email")
public class UserEntity {

    private String email;
    private String password;
    private String name;
    private String phone;

    // 기존 String carModel 대신 DB의 FK와 매칭되는 ID 필드 추가
    private Integer carModelId; // int보다 null 처리가 가능한 Integer 권장

    private String carNumber;
    private String fuelType;
    private int mileage;
    private String annualMileage;
    private String drivingEnv;

    private LocalDateTime createdAt;
    private String socialTypeCode;
    private String socialId;

    // 화면에 모델 이름을 바로 보여줘야 할 경우를 대비한 필드
    // DB 조인(Join) 결과값을 담기 위해 보통 사용합니다.
    private String modelName;
    private String brandName;

    /**
     * [수정] Jackson이 이 필드를 JSON으로 변환하지 않도록 설정합니다.
     * 이를 통해 NoSuchFileException 및 서버 연결 코드 0 에러를 방지합니다.
     */
    @JsonIgnore
    private MultipartFile profileImageFile;

    /**
     * [추가] 실제 DB에 저장될 프로필 이미지의 웹 경로 (String)
     */
    private String profileImage;
}