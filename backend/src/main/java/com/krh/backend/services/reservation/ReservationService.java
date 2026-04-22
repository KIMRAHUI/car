package com.krh.backend.services.reservation;

import com.krh.backend.dtos.ReservationRequest;
import com.krh.backend.entities.reservation.Reservation;
import com.krh.backend.entities.reservation.ReservationItem;
import com.krh.backend.results.CommonResult;
import com.krh.backend.results.Result;
import com.krh.backend.services.GeminiService;
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
    private final GeminiService geminiService;

    // WebConfig 설정과 동일한 물리적 저장 경로
    private final String UPLOAD_PATH = "C:/Users/노오리/Desktop/carmit_uploads/reservation/";

    /**
     * [CREATE] 새로운 예약 등록 (이미지 저장 + AI 검증 + 상세 항목 저장)
     */
    @Transactional
    public Result registerReservation(ReservationRequest request) {
        // 1. 기본 유효성 검사
        if (!ReservationValidator.validateRequest(request)) {
            return CommonResult.FAILURE;
        }

        // 2. AI 기반 콘텐츠 검증
        if (request.getDescription() != null && !request.getDescription().trim().isEmpty()) {
            if (!this.geminiService.validateContent(request.getDescription())) {
                return CommonResult.FAILURE;
            }
        }

        try {
            // 3. 날짜 및 시간 포맷팅
            String dateTimeStr = request.getSelectedDate() + " " + request.getSelectedTime();
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd hh:mm a", Locale.ENGLISH);
            LocalDateTime reservedAt = LocalDateTime.parse(dateTimeStr, formatter);

            // 4. [추가] 이미지 파일 물리적 저장 처리 (최대 2장)
            List<String> savedPaths = new ArrayList<>();
            if (request.getImages() != null && !request.getImages().isEmpty()) {
                File uploadDir = new File(UPLOAD_PATH);
                if (!uploadDir.exists()) uploadDir.mkdirs(); // 폴더 없으면 자동 생성

                for (int i = 0; i < Math.min(request.getImages().size(), 2); i++) {
                    MultipartFile image = request.getImages().get(i);
                    if (image != null && !image.isEmpty()) {
                        String fileName = UUID.randomUUID() + "_" + image.getOriginalFilename();
                        File targetFile = new File(UPLOAD_PATH + fileName);
                        image.transferTo(targetFile); // 실제 파일 저장
                        savedPaths.add("/upload/reservation/" + fileName); // 웹 접근 경로 저장
                    }
                }
            }

            // 5. 메인 예약 엔티티 빌드 및 저장
            Reservation reservation = Reservation.builder()
                    .userEmail(request.getUserEmail())
                    .partnerId(request.getPartnerId())
                    .partnerName(request.getPartnerName())
                    .category(request.getCategory())
                    .description(request.getDescription())
                    // 저장된 이미지 경로 매핑
                    .image1(savedPaths.size() >= 1 ? savedPaths.get(0) : null)
                    .image2(savedPaths.size() >= 2 ? savedPaths.get(1) : null)
                    .reservedAt(reservedAt)
                    .status("PENDING")
                    .build();

            if (this.reservationMapper.insertReservation(reservation) <= 0) {
                return CommonResult.FAILURE;
            }

            // 6. 상세 항목(Items) 저장 (1:N)
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
            return CommonResult.FAILURE; // 파일 저장 중 에러 발생 시
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

        // 1. 우선 예약 메인 정보 목록을 가져옵니다.
        List<Reservation> reservations = this.reservationMapper.selectReservationsByUserEmail(email);

        // 2. [추가] 각 예약마다 DB에서 상세 아이템 리스트를 가져와서 셋팅합니다.
        for (Reservation res : reservations) {
            // 해당 예약 ID로 저장된 아이템들을 DB에서 조회
            List<ReservationItem> dbItems = this.reservationMapper.selectItemsByReservationId(res.getId());

            // 프론트엔드 리액트에서 join(', ')으로 뿌려줄 수 있게 List<String>으로 변환
            List<String> itemNames = new ArrayList<>();
            for (ReservationItem item : dbItems) {
                itemNames.add(item.getItemName());
            }

            // Reservation 엔티티의 items 필드에 리스트 설정 (Reservation 엔티티에 items 필드가 선언되어 있어야 함)
            res.setItems(itemNames);
        }

        return reservations;
    }

    /**
     * [DELETE] 예약 취소 -> 히스토리 관리를 위해 삭제 대신 상태 변경(CANCELED)으로 수정
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
     * [UPDATE] 정비 완료 처리 -> 'COMPLETED' 상태로 변경하여 히스토리에 정식 반영
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