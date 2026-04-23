package com.krh.backend.entities.reservation;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class Reservation {
    private Long id;              // 예약 고유 번호 (PK, AUTO_INCREMENT)
    private String userEmail;     // 예약자 이메일 (users 테이블 참조 FK)
    private String partnerId;     // 업체 고유 식별자 (카카오 API ID)
    private String partnerName;   // 업체명 (UI 표시용)
    private String category;      // 수리 카테고리 (일반, 고장, 사고)
//    private String description;   // 사고 경위 또는 고장 상세 증상
    private LocalDateTime reservedAt; // 사용자가 선택한 실제 예약 일시
    private String status;        // 예약 상태 (PENDING, CONFIRMED, COMPLETED, CANCELED)
    private LocalDateTime createdAt;  // 예약 신청 시간 (기본 NOW())
    private String image1; // 추가
    private String image2; // 추가
    private List<String> items;//상세항목
    private Long reviewId; // 해당예약과 연겨로딘 리뷰의 ID 없으면 null[결과전달용]
    private Integer recordedMileage; // 리뷰 작성 시 저장된 주행거리
}