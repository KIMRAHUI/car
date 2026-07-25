package com.krh.backend.entities.user;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class UserMaintenanceEntity {
    private String userEmail;           // users 테이블의 email 참조
    private String itemName;            // 정비 항목명 (PK)
    private LocalDate lastServiceDate;  // 마지막 정비 날짜
    private int lastServiceMileage;     // 정비 당시 주행거리
    private String source;              // 출처 (MANUAL / RESERVATION)
    private LocalDateTime updatedAt;    // 수정 일시
}