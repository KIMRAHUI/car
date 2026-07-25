package com.krh.backend.entities.reservation;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class ReservationItem {
    private Long id;              // 항목 고유 번호 (PK, AUTO_INCREMENT)
    private Long reservationId;   // 부모 예약 번호 (reservations 테이블의 id 참조 FK)
    private String itemName;      // 선택 항목명 (예: 엔진오일, 앞 범퍼, 본네트 등)
}