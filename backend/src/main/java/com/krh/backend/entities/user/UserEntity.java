package com.krh.backend.entities.user;

import lombok.*;

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

    //기존 String carModel 대신 DB의 FK와 매칭되는 ID 필드 추가
    private Integer carModelId; // int보다 null 처리가 가능한 Integer 권장

    private String carNumber;
    private String fuelType;
    private int mileage;
    private String annualMileage;
    private String drivingEnv;

    private LocalDateTime createdAt;
    private String socialTypeCode;
    private String socialId;

    //화면에 모델 이름을 바로 보여줘야 할 경우를 대비한 필드
    // DB 조인(Join) 결과값을 담기 위해 보통 사용합니다.
    private String modelName;
    private String brandName;
}