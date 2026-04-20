package com.krh.backend.entities.user;

import lombok.*;

import java.time.LocalDateTime;

@Getter//각 필드(변수)값 가져오는 메서드 자동생성
@Setter//각 필드(변수)값 설정하는 메서드 자동생성
@NoArgsConstructor//파라미터가 없는 기본 생성자 만듬
@AllArgsConstructor//모든 필드 인자로 받는 생성자
@ToString //객체출력시 주소값아닌 실제데이터나오게 디버깅에 도움
@Builder // 객체 생성시 생성자 대신 가독성 좋은 빌더패턴 사용위함
@EqualsAndHashCode(of = "email") //객체끼리 비교시 기준이 되는 필드 정의 : email
public class UserEntity {

    private String email;
    private String password;
    private String name;
    private String phone;
    //차량정보
    private String carModel;
    private String carNumber;
    private String fuelType;
    private int mileage;
    private String annualMileage;
    private String drivingEnv;
    //시스템 및 소셜정보
    private LocalDateTime createdAt;
    private String socialTypeCode;
    private String socialId;

}
