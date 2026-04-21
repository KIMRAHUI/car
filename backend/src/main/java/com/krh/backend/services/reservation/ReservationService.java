package com.krh.backend.services.reservation;

import com.krh.backend.dtos.service.ReservationRequest;
import com.krh.backend.entities.reservation.Reservation;
import com.krh.backend.entities.reservation.ReservationItem;
import com.krh.backend.results.CommonResult;
import com.krh.backend.results.Result;
import com.krh.backend.services.GeminiService;
import com.krh.backend.validators.reservation.ReservationValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class ReservationService {
    // 인터페이스 이름이 Reservation이므로 엔티티와 구분을 위해 풀 패키지 경로를 사용하여 주입합니다.
    private final com.krh.backend.mappers.reservation.ReservationMapper reservationMapper;

    // AI 검증을 위한 GeminiService 주입
    private final GeminiService geminiService;

    /**
     * [CREATE] 새로운 예약 등록
     * 메인 예약 저장 후 생성된 ID를 받아와 상세 항목(Items) 일괄 저장
     */
    @Transactional
    public Result registerReservation(ReservationRequest request) {
        // 1. 기본 유효성 검사 (필수값 존재 여부 등)
        if (!ReservationValidator.validateRequest(request)) {
            return CommonResult.FAILURE;
        }

        // 2. AI 기반 콘텐츠 검증 (비속어, 광고, 비방 차단)
        // 상담 내용(Description)이 존재할 경우 Gemini API를 통해 검사합니다.
        if (request.getDescription() != null && !request.getDescription().trim().isEmpty()) {
            if (!this.geminiService.validateContent(request.getDescription())) {
                return CommonResult.FAILURE; // AI가 부적절하다고 판단 시 즉시 리턴
            }
        }

        try {
            // 3. 날짜 및 시간 포맷팅 ( "2026-04-21" + "11:30 AM" -> LocalDateTime )
            // AM/PM 파싱을 위해 Locale.ENGLISH와 hh(12시간제) 포맷을 사용합니다.
            String dateTimeStr = request.getSelectedDate() + " " + request.getSelectedTime();
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd hh:mm a", Locale.ENGLISH);
            LocalDateTime reservedAt = LocalDateTime.parse(dateTimeStr, formatter);

            // 4. 메인 예약 엔티티 빌드 및 저장
            Reservation reservation = Reservation.builder()
                    .userEmail(request.getUserEmail())
                    .partnerId(request.getPartnerId())
                    .partnerName(request.getPartnerName())
                    .category(request.getCategory())
                    .description(request.getDescription())
                    .reservedAt(reservedAt)
                    .status("PENDING") // 기본 상태값 설정
                    .build();

            if (this.reservationMapper.insertReservation(reservation) <= 0) {
                return CommonResult.FAILURE;
            }

            // 5. 생성된 ID를 활용하여 상세 항목들 저장 (1:N)
            if (request.getItems() != null && !request.getItems().isEmpty()) {
                for (String itemName : request.getItems()) {
                    ReservationItem item = ReservationItem.builder()
                            .reservationId(reservation.getId()) // useGeneratedKeys로 주입된 ID 사용
                            .itemName(itemName)
                            .build();

                    if (this.reservationMapper.insertReservationItem(item) <= 0) {
                        throw new RuntimeException("상세 항목 저장 실패"); // 트랜잭션 롤백 유도
                    }
                }
            }

            return CommonResult.SUCCESS;
        } catch (Exception e) {
            e.printStackTrace();
            return CommonResult.FAILURE;
        }
    }

    /**
     * [READ] 마이페이지용 예약 목록 조회
     */
    public List<Reservation> getReservations(String email) {
        if (email == null || email.isEmpty()) return null;
        return this.reservationMapper.selectReservationsByUserEmail(email);
    }

    /**
     * [DELETE] 예약 취소
     */
    @Transactional
    public Result cancelReservation(Long id) {
        if (id == null) return CommonResult.FAILURE;
        // DB의 ON DELETE CASCADE 설정으로 자식 항목은 자동 삭제됨
        return this.reservationMapper.deleteReservationById(id) > 0
                ? CommonResult.SUCCESS
                : CommonResult.FAILURE;
    }

    /**
     * [UPDATE] 예약 정보 수정
     */
    @Transactional
    public Result updateReservation(Reservation reservation) {
        if (reservation == null || reservation.getId() == null) return CommonResult.FAILURE;
        return this.reservationMapper.updateReservation(reservation) > 0
                ? CommonResult.SUCCESS
                : CommonResult.FAILURE;
    }
}