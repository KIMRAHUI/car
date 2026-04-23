package com.krh.backend.dtos;

import lombok.*;

@Getter
@Setter // UserService에서 계산된 값을 주입하기 위해 추가
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceResponse {
    private String category;            // 카테고리 (오일 및 케미컬, 외장 및 수리 등)
    private String itemName;            // 항목명

    // [추가] 기준 주기 (km)
    // Mapper에서 읽어온 뒤, 프론트엔드 "주기: 10,000km 기준" 안내용으로 활용
    private Integer replaceInterval;

    // 주행거리 데이터
    private Integer lastServiceMileage; // 마지막 정비 시 주행거리 (km)
    private Integer nextServiceMileage; // 다음 정비 예정 주행거리 (km)
    private Integer remainingMileage;   // 남은 주행거리 (km)

    private String lastServiceDate;     // 마지막 정비일 (yyyy-MM-dd)

    /**
     * 상태 (status)
     * - 정상: 안전 범위
     * - 주의: 교체 주기 80% 도달 (입력 폼 활성화 시점)
     * - 위험: 주기 초과
     */
    private String status;

    /**
     * 정비 진행률 (0 ~ 100%)
     */
    private Integer maintenanceProgress;
}