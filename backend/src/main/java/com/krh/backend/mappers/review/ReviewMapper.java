package com.krh.backend.mappers.review;

import com.krh.backend.entities.review.Review;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ReviewMapper {

    // [CREATE] 후기 본문 저장
    int insertReview(Review review);

    // [CREATE] 후기 태그 저장 (1:N 관계)
    int insertReviewTag(@Param("reviewId") Long reviewId, @Param("tagName") String tagName);

    // [READ] 특정 예약에 대한 후기 존재 여부 확인 (중복 작성 방지)
    Review selectReviewByReservationId(@Param("reservationId") Long reservationId);

    // [READ] 특정 사용자가 작성한 모든 후기 목록 조회
    List<Review> selectReviewsByUserEmail(@Param("userEmail") String userEmail);

    // [READ] 후기 상세 조회 (수정 폼 호출 시 사용)
    Review selectReviewById(@Param("id") Long id);

    // [READ] 후기에 포함된 태그 목록 조회
    List<String> selectTagsByReviewId(@Param("reviewId") Long reviewId);

    // [UPDATE] 후기 내용 수정 (별점, 주행거리 등)
    int updateReview(Review review);

    // [UPDATE] 사용자 마일리지 최신화 (정비 시점 기준)
    // 이 메서드는 ReviewService에서 리뷰 저장과 함께 호출됩니다.
    int updateUserMileage(@Param("email") String email, @Param("mileage") int mileage);

    // [DELETE] 후기 삭제
    int deleteReviewById(@Param("id") Long id);

    // [DELETE] 후기 삭제 시 관련 태그 전체 삭제
    int deleteReviewTagsByReviewId(@Param("reviewId") Long reviewId);

    List<Review> selectAllReviews();
}