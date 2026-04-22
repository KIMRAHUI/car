package com.krh.backend.dtos;

import lombok.Getter;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Getter
@Setter
public class ReviewRequest {
    // [추가] 수정 시 어떤 리뷰를 고칠지 식별하는 ID (등록 시에는 null, 수정 시에는 필수)
    private Long id;

    // 1. 어떤 예약에 대한 후기인지 식별 (예약 정보 및 업체명 조회용)
    private Long reservationId;

    // 2. 작성자 확인 및 users 테이블의 mileage 업데이트용
    private String userEmail;

    // 3. 리뷰 본문 데이터
    private int rating;              // 서비스 만족도 별점 (1~5)
    private Integer mileage;         // 사용자가 입력한 현재 주행 km
    private List<String> selectedTags; // 선택된 리뷰 태그 리스트 (#친절한 설명 등)

    // 4. 후기 사진 업로드 (최대 2장)
    // 리액트에서 append('images', file)로 보낸 파일들을 담습니다.
    private List<MultipartFile> images;
}