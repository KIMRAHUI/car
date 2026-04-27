package com.krh.backend.services.review;

import com.krh.backend.dtos.ReviewRequest;
import com.krh.backend.entities.review.Review;
import com.krh.backend.mappers.review.ReviewMapper;
import com.krh.backend.results.CommonResult;
import com.krh.backend.results.Result;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReviewService {
    private final ReviewMapper reviewMapper;

    // 리뷰 사진 전용 물리적 저장 경로
    private final String UPLOAD_PATH = "C:/Users/노오리/Desktop/carmit_uploads/review/";

    /**
     * [READ] 모든 후기 목록 조회 (랜딩페이지 및 리스트용)
     * 각 리뷰에 연관된 태그 리스트를 함께 채워서 반환합니다.
     */
    public List<Review> getAllReviews() {
        // 1. 모든 리뷰 기본 정보 조회
        List<Review> reviews = this.reviewMapper.selectAllReviews();

        // 2. 각 리뷰마다 태그 리스트 조회 후 셋팅
        if (reviews != null && !reviews.isEmpty()) {
            for (Review review : reviews) {
                review.setSelectedTags(this.reviewMapper.selectTagsByReviewId(review.getId()));
            }
        }
        return reviews;
    }




    /**
     * [READ] 후기 상세 정보 조회 (수정 모드 진입 시 데이터 채우기용)
     */
    public Review getReviewDetail(Long reviewId) {
        if (reviewId == null) return null;

        // 1. 리뷰 기본 정보 조회
        Review review = this.reviewMapper.selectReviewById(reviewId);

        // 2. 리뷰에 포함된 태그 리스트 조회 후 셋팅
        if (review != null) {
            review.setSelectedTags(this.reviewMapper.selectTagsByReviewId(reviewId));
        }
        return review;
    }

    /**
     * [CREATE] 후기 등록
     */
    @Transactional
    public Result registerReview(ReviewRequest request) {
        if (this.reviewMapper.selectReviewByReservationId(request.getReservationId()) != null) {
            return CommonResult.FAILURE;
        }

        try {
            // 이미지 저장 로직 호출
            List<String> savedPaths = saveImages(request.getImages());

            Review review = Review.builder()
                    .reservationId(request.getReservationId())
                    .userEmail(request.getUserEmail())
                    .rating(request.getRating())
                    .mileage(request.getMileage())
                    .image1(savedPaths.size() >= 1 ? savedPaths.get(0) : null)
                    .image2(savedPaths.size() >= 2 ? savedPaths.get(1) : null)
                    .build();

            if (this.reviewMapper.insertReview(review) <= 0) return CommonResult.FAILURE;

            // 태그 저장
            saveTags(review.getId(), request.getSelectedTags());

            // 마일리지 업데이트
            if (this.reviewMapper.updateUserMileage(request.getUserEmail(), request.getMileage()) <= 0) {
                throw new RuntimeException("사용자 마일리지 업데이트 실패");
            }

            return CommonResult.SUCCESS;
        } catch (Exception e) {
            e.printStackTrace();
            return CommonResult.FAILURE;
        }
    }

    /**
     * [UPDATE] 후기 수정
     */
    @Transactional
    public Result updateReview(ReviewRequest request) {
        if (request.getId() == null) return CommonResult.FAILURE;

        try {
            // 1. 기존 리뷰 정보 조회
            Review existingReview = this.reviewMapper.selectReviewById(request.getId());
            if (existingReview == null) return CommonResult.FAILURE;

            // 2. 이미지 처리 (새로 업로드된 이미지가 있으면 교체, 없으면 기존 경로 유지)
            List<String> savedPaths = saveImages(request.getImages());

            Review updatedReview = Review.builder()
                    .id(request.getId())
                    .rating(request.getRating())
                    .mileage(request.getMileage())
                    // 새 사진이 오면 새 경로, 안 오면 기존 경로 유지 (비어있으면 null)
                    .image1(!savedPaths.isEmpty() ? savedPaths.get(0) : existingReview.getImage1())
                    .image2(savedPaths.size() >= 2 ? savedPaths.get(1) : existingReview.getImage2())
                    .build();

            if (this.reviewMapper.updateReview(updatedReview) <= 0) return CommonResult.FAILURE;

            // 3. 태그 갱신 (기존 태그 삭제 후 재등록)
            this.reviewMapper.deleteReviewTagsByReviewId(request.getId());
            saveTags(request.getId(), request.getSelectedTags());

            // 4. 마일리지 재업데이트
            this.reviewMapper.updateUserMileage(request.getUserEmail(), request.getMileage());

            return CommonResult.SUCCESS;
        } catch (Exception e) {
            e.printStackTrace();
            return CommonResult.FAILURE;
        }
    }

    /**
     * [DELETE] 리뷰 삭제
     */
    @Transactional
    public Result deleteReview(Long reviewId) {
        if (reviewId == null) return CommonResult.FAILURE;
        this.reviewMapper.deleteReviewTagsByReviewId(reviewId);
        return this.reviewMapper.deleteReviewById(reviewId) > 0 ? CommonResult.SUCCESS : CommonResult.FAILURE;
    }

    // --- 내부 헬퍼 메서드 (중복 코드 방지) ---

    private List<String> saveImages(List<MultipartFile> images) throws IOException {
        List<String> savedPaths = new ArrayList<>();
        if (images != null && !images.isEmpty()) {
            File uploadDir = new File(UPLOAD_PATH);
            if (!uploadDir.exists()) uploadDir.mkdirs();

            for (int i = 0; i < Math.min(images.size(), 2); i++) {
                MultipartFile image = images.get(i);
                if (image != null && !image.isEmpty()) {
                    String fileName = UUID.randomUUID() + "_" + image.getOriginalFilename();
                    File targetFile = new File(UPLOAD_PATH + fileName);
                    image.transferTo(targetFile);
                    savedPaths.add("/upload/review/" + fileName);
                }
            }
        }
        return savedPaths;
    }

    private void saveTags(Long reviewId, List<String> tags) {
        if (tags != null && !tags.isEmpty()) {
            for (String tagName : tags) {
                if (this.reviewMapper.insertReviewTag(reviewId, tagName) <= 0) {
                    throw new RuntimeException("리뷰 태그 저장 실패");
                }
            }
        }
    }

    public List<Review> getReviewsByPartner(String partnerId) {
        // 1. 매퍼를 통해 해당 업체 ID를 가진 예약들의 리뷰 리스트를 가져옴
        List<Review> reviews = this.reviewMapper.selectReviewsByPartnerId(partnerId);

        // 2. 각 리뷰에 대한 태그 정보를 채워줌
        if (reviews != null && !reviews.isEmpty()) {
            for (Review review : reviews) {
                // review.setTags 대신 다른 메서드들과 동일하게 setSelectedTags를 사용하세요.
                // 그래야 프론트엔드에서 selectedTags라는 하나의 이름으로 데이터를 일관되게 받을 수 있습니다.
                review.setSelectedTags(this.reviewMapper.selectTagsByReviewId(review.getId()));
            }
        }

        return reviews;
    }

}