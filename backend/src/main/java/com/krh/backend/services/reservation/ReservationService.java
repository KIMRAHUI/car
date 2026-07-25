package com.krh.backend.services.reservation;

import com.krh.backend.dtos.ReservationRequest;
import com.krh.backend.entities.reservation.Reservation;
import com.krh.backend.entities.reservation.ReservationItem;
import com.krh.backend.results.CommonResult;
import com.krh.backend.results.Result;
import com.krh.backend.validators.reservation.ReservationValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
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

    // application.properties에 설정된 공통 업로드 경로 주입
    @Value("${file.upload-dir}")
    private String uploadBaseDir;

    /**
     * 예약 관련 이미지 저장 경로 반환 (OS별 구분자 자동 처리)
     */
    private String getReservationPath() {
        return uploadBaseDir + "reservation" + File.separator;
    }

    /**
     * [CREATE] 새로운 예약 등록 (이미지 저장 + 상세 항목 저장)
     * AI 검증 대신 프론트에서 넘어온 키워드(Items) 기반으로 저장
     */
    @Transactional
    public Result registerReservation(ReservationRequest request) {

        if (!ReservationValidator.validateRequest(request)) {
            return CommonResult.FAILURE;
        }

        try {

            String dateTimeStr = request.getSelectedDate() + " " + request.getSelectedTime();
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd hh:mm a", Locale.ENGLISH);
            LocalDateTime reservedAt = LocalDateTime.parse(dateTimeStr, formatter);

            //이미지 파일 물리적 저장 처리 (최대 2장)
            List<String> savedPaths = new ArrayList<>();
            String fullPath = getReservationPath(); // 동적으로 경로 획득

            if (request.getImages() != null && !request.getImages().isEmpty()) {
                File uploadDir = new File(fullPath);
                if (!uploadDir.exists()) {
                    uploadDir.mkdirs(); // 폴더가 없으면 생성
                }

                for (int i = 0; i < Math.min(request.getImages().size(), 2); i++) {
                    MultipartFile image = request.getImages().get(i);
                    if (image != null && !image.isEmpty()) {
                        String fileName = UUID.randomUUID() + "_" + image.getOriginalFilename();
                        File targetFile = new File(fullPath + fileName);
                        image.transferTo(targetFile);
                        savedPaths.add("/upload/reservation/" + fileName);
                    }
                }
            }

            // 메인 예약 엔티티 빌드 및 저장
            Reservation reservation = Reservation.builder()
                    .userEmail(request.getUserEmail())
                    .partnerId(request.getPartnerId())
                    .partnerName(request.getPartnerName())
                    .category(request.getCategory())
                    .image1(savedPaths.size() >= 1 ? savedPaths.get(0) : null)
                    .image2(savedPaths.size() >= 2 ? savedPaths.get(1) : null)
                    .reservedAt(reservedAt)
                    .status("PENDING")
                    .build();

            if (this.reservationMapper.insertReservation(reservation) <= 0) {
                return CommonResult.FAILURE;
            }

            // 상세 항목(Items) 저장 (1:N)
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