package com.krh.backend.controllers.review;

import com.krh.backend.dtos.ReviewRequest;
import com.krh.backend.entities.review.Review; // 엔티티 임포트
import com.krh.backend.results.Result;
import com.krh.backend.services.review.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/review")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;
    /**
     * [GET] 특정 정비소(Partner)의 후기 목록 조회
     * 프론트엔드 ReservationModal에서 업체별 리뷰를 로드할 때 호출합니다.
     * 경로: GET /api/review/partner/{partnerId}
     */
    @GetMapping("/partner/{partnerId}")
    public List<Review> getPartnerReviews(@PathVariable String partnerId) {
        // 서비스 레이어에서 매퍼를 호출해 조인된 결과를 가져옵니다.
        return this.reviewService.getReviewsByPartner(partnerId);
    }

    /**
     * [GET] 후기 상세 조회 (수정 모드 시 데이터 로딩용)
     * 리액트의 useEffect에서 axios.get("/api/review/1") 호출 시 응답
     */
    @GetMapping("/{reviewId}")
    public Review getReview(@PathVariable Long reviewId) {
        // 서비스에서 ID로 리뷰와 태그 정보를 모두 채워서 반환해야 함
        return this.reviewService.getReviewDetail(reviewId);
    }

    @GetMapping("/list")
    public List<Review> getAllReviews() {
        // 모든 리뷰와 각 리뷰의 태그 정보를 포함하여 반환하는 로직
        return this.reviewService.getAllReviews();
    }

    /**
     * [POST] 새로운 후기 등록
     */
    @PostMapping(value = "/register", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public String registerReview(@ModelAttribute ReviewRequest request) {
        Result result = this.reviewService.registerReview(request);
        return result.name().toLowerCase();
    }

    /**
     * [POST] 기존 후기 수정 (업데이트)
     * 리액트에서 isEditMode일 때 호출하는 경로
     */
    @PostMapping(value = "/update", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public String updateReview(@ModelAttribute ReviewRequest request) {
        Result result = this.reviewService.updateReview(request);
        return result.name().toLowerCase();
    }

    /**
     * [DELETE] 후기 삭제
     */
    @DeleteMapping("/{reviewId}")
    public String deleteReview(@PathVariable Long reviewId) {
        Result result = this.reviewService.deleteReview(reviewId);
        return result.name().toLowerCase();
    }

}