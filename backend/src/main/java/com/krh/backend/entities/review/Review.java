package com.krh.backend.entities.review;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class Review {
    private Long id;              // 후기 고유 번호 (PK, AUTO_INCREMENT)
    private Long reservationId;   // 예약 고유 번호 (FK, reservations 테이블 참조)
    private String userEmail;     // 작성자 이메일 (users 테이블 참조)
    private int rating;           // 서비스 만족도 별점 (1~5)
    private Integer mileage;      // 정비 시점 주행 거리 (km)
    private String image1;        // 후기 사진 1 웹 접근 경로
    private String image2;        // 후기 사진 2 웹 접근 경로
    private LocalDateTime createdAt;  // 후기 작성 시간
    private LocalDateTime updatedAt;  // 후기 수정 시간

    // DB reviews 테이블에는 없지만, review_tags 테이블과 조인하거나
    // 로직 처리를 위해 사용하는 필드
    private List<String> selectedTags;

    
}