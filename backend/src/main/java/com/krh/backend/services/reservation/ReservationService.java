package com.krh.backend.services.reservation;

import com.krh.backend.dtos.ReservationRequest;
import com.krh.backend.entities.reservation.Reservation;
import com.krh.backend.entities.reservation.ReservationItem;
import com.krh.backend.results.CommonResult;
import com.krh.backend.results.Result;
import com.krh.backend.validators.reservation.ReservationValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReservationService {
    private final com.krh.backend.mappers.reservation.ReservationMapper reservationMapper;

    // [제거] GeminiService 필드 삭제 (더 이상 외부 API에 의존하지 않습니다.)

    // WebConfig 설정과 동일한 물리적 저장 경로
    private final String UPLOAD_PATH = "C:/Users/노오리/Desktop/carmit_uploads/reservation/";

    /**
     * [CREATE] 새로운 예약 등록 (이미지 저장 + 상세 항목 저장)
     * AI 검증 대신 프론트에서 넘어온 키워드(Items) 기반으로 안전하게 저장합니다.
     */
    @Transactional
    public Result registerReservation(ReservationRequest request) {
        // 1. 기본 유효성 검사 (항목 선택 여부 등 확인)
        if (!ReservationValidator.validateRequest(request)) {
            return CommonResult.FAILURE;
        }

        // 2. [제거] AI 기반 콘텐츠 검증 (404 에러 원인 제거)
        // 이제 사용자가 선택한 정제된 키워드(Items)를 신뢰합니다.

        try {
            // 3. 날짜 및 시간 포맷팅
            String dateTimeStr = request.getSelectedDate() + " " + request.getSelectedTime();
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd hh:mm a", Locale.ENGLISH);
            LocalDateTime reservedAt = LocalDateTime.parse(dateTimeStr, formatter);

            // 4. 이미지 파일 물리적 저장 처리 (최대 2장)
            List<String> savedPaths = new ArrayList<>();
            if (request.getImages() != null && !request.getImages().isEmpty()) {
                File uploadDir = new File(UPLOAD_PATH);
                if (!uploadDir.exists()) uploadDir.mkdirs();

                for (int i = 0; i < Math.min(request.getImages().size(), 2); i++) {
                    MultipartFile image = request.getImages().get(i);
                    if (image != null && !image.isEmpty()) {
                        String fileName = UUID.randomUUID() + "_" + image.getOriginalFilename();
                        File targetFile = new File(UPLOAD_PATH + fileName);
                        image.transferTo(targetFile);
                        savedPaths.add("/upload/reservation/" + fileName);
                    }
                }
            }

            // 5. 메인 예약 엔티티 빌드 및 저장
            Reservation reservation = Reservation.builder()
                    .userEmail(request.getUserEmail())
                    .partnerId(request.getPartnerId())
                    .partnerName(request.getPartnerName())
                    .category(request.getCategory())
//                    .description(request.getDescription())
                    .image1(savedPaths.size() >= 1 ? savedPaths.get(0) : null)
                    .image2(savedPaths.size() >= 2 ? savedPaths.get(1) : null)
                    .reservedAt(reservedAt)
                    .status("PENDING")
                    .build();

            if (this.reservationMapper.insertReservation(reservation) <= 0) {
                return CommonResult.FAILURE;
            }

            // 6. 상세 항목(Items) 저장 (1:N)
            // 사용자가 선택한 키워드들이 정식으로 DB에 등록됩니다.
            if (request.getItems() != null && !request.getItems().isEmpty()) {
                for (String itemName : request.getItems()) {
                    ReservationItem item = ReservationItem.builder()
                            .reservationId(reservation.getId())
                            .itemName(itemName)
                            .build();

                    if (this.reservationMapper.insertReservationItem(item) <= 0) {
                        throw new RuntimeException("상세 항목 저장 실패");
                    }
                }
            }

            return CommonResult.SUCCESS;
        } catch (IOException e) {
            e.printStackTrace();
            return CommonResult.FAILURE;
        } catch (Exception e) {
            e.printStackTrace();
            return CommonResult.FAILURE;
        }
    }

    /**
     * [READ] 마이페이지용 예약 목록 조회 (아이템 리스트 포함)
     */
    public List<Reservation> getReservations(String email) {
        if (email == null || email.isEmpty()) return null;

        List<Reservation> reservations = this.reservationMapper.selectReservationsByUserEmail(email);

        for (Reservation res : reservations) {
            List<ReservationItem> dbItems = this.reservationMapper.selectItemsByReservationId(res.getId());
            List<String> itemNames = new ArrayList<>();
            for (ReservationItem item : dbItems) {
                itemNames.add(item.getItemName());
            }
            res.setItems(itemNames);
        }

        return reservations;
    }

    /**
     * [DELETE] 예약 취소 -> 상태 변경(CANCELED)
     */
    @Transactional
    public Result cancelReservation(Long id) {
        if (id == null) return CommonResult.FAILURE;

        Reservation reservation = Reservation.builder()
                .id(id)
                .status("CANCELED")
                .build();

        return this.reservationMapper.updateReservation(reservation) > 0
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

    /**
     * [UPDATE] 정비 완료 처리
     */
    @Transactional
    public Result completeReservation(Long id) {
        if (id == null) return CommonResult.FAILURE;

        Reservation reservation = Reservation.builder()
                .id(id)
                .status("COMPLETED")
                .build();

        return this.reservationMapper.updateReservation(reservation) > 0
                ? CommonResult.SUCCESS
                : CommonResult.FAILURE;
    }
}