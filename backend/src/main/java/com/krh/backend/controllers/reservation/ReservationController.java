package com.krh.backend.controllers.reservation;

import com.krh.backend.controllers.CommonController;
import com.krh.backend.dtos.ReservationRequest;
import com.krh.backend.entities.reservation.Reservation;
import com.krh.backend.results.Result;
import com.krh.backend.services.reservation.ReservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Controller
@RequiredArgsConstructor
@RequestMapping("/service/reservation")
public class ReservationController extends CommonController {
    private final ReservationService reservationService;

    /**
     * POST 새로운 예약 등록 (이미지 업로드 대응)
     */
    @PostMapping(
            value = {"", "/"},
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public Map<String, Object> postReservation(@ModelAttribute ReservationRequest request) {
        System.out.println(">>> [LOG] 예약 등록 요청 수신");
        Result result = this.reservationService.registerReservation(request);
        return this.resolveResult(result);
    }

    /**
     * GET 사용자의 예약 목록 조회
     */
    @GetMapping(value = {"", "/"})
    @ResponseBody
    public List<Reservation> getReservations(@RequestParam("email") String email) {
        System.out.println(">>> [LOG] 예약 목록 조회 요청: " + email);
        return this.reservationService.getReservations(email);
    }

    /**
     * PATCH 예약 정보 수정
     */
    @PatchMapping(value = {"", "/"})
    @ResponseBody
    public Map<String, Object> patchReservation(@RequestBody Reservation reservation) {
        System.out.println(">>> [LOG] 예약 수정 요청 수신! ID: " + (reservation != null ? reservation.getId() : "null"));
        Result result = this.reservationService.updateReservation(reservation);
        return this.resolveResult(result);
    }

    /**
     * DELETE 예약 취소
     */
    @DeleteMapping("/{id}")
    @ResponseBody
    public Map<String, Object> deleteReservation(@PathVariable("id") Long id) {
        System.out.println(">>> [LOG] 예약 취소 요청 수신! ID: " + id);
        Result result = this.reservationService.cancelReservation(id);
        System.out.println(">>> [LOG] 서비스 결과: " + result);
        return this.resolveResult(result);
    }
}