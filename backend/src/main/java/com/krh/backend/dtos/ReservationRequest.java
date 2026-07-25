package com.krh.backend.dtos;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Getter
@Setter
@ToString
public class ReservationRequest {
    // 예약자 및 업체 기본 정보
    private String userEmail;     // 로그인한 사용자 이메일 (ID)
    private String partnerId;     // 카카오 장소 ID (예: 18512310)
    private String partnerName;   // 선택한 업체명

    // 수리 카테고리
    private String category;      // '일반', '고장', '사고'

    // 상세 증상 및 경위
    // - 고장: 선택한 증상 + 텍스트
    // - 사고: 사고 경위 텍스트
//    private String description;

    // 예약 일시 (문자열 상태로 전달받음)
    private String selectedDate;  // "2026-04-21"
    private String selectedTime;  // "11:30 AM"

    //  선택 항목 리스트 (다중 선택 대응)
    // - 일반: 선택한 소모품 리스트
    // - 사고: 선택한 파손 부위 리스트 (#앞범퍼, #휀다 등)
    // - 고장: 선택한 고장 타입 (엔진/출력 저하 등)
    private List<String> items;

    /**
     * 업로드 이미지 파일 리스트 (최대 2장)
     * 프론트엔드에서 FormData로 'images'라는 키값에 파일을 담아 보낼 때 매핑
     * image1, image2를 유연하기 위해서 -> List
     */
    private List<MultipartFile> images;
}