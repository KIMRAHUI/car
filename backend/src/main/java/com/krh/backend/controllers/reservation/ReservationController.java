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
     * [수정] @RequestBody -> @ModelAttribute : Multipart 데이터를 받기 위함
     * [수정] consumes 추가 : multipart/form-data 전용임을 명시
     */
    @RequestMapping(
            value = "/",
            method = RequestMethod.POST,
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public Map<String, Object> postReservation(@ModelAttribute ReservationRequest request) {
        // 서비스 내부에서 이미지 저장 및 DB 등록 로직이 수행됩니다.
        Result result = this.reservationService.registerReservation(request);
        return this.resolveResult(result);
    }

    /**
     * GET 사용자의 예약 목록 조회 (마이페이지용)
     */
    @RequestMapping(value = "/", method = RequestMethod.GET, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public List<Reservation> getReservations(@RequestParam("email") String email) {
        return this.reservationService.getReservations(email);
    }

    /**
     * PATCH 예약 정보 수정
     */
    @RequestMapping(value = "/", method = RequestMethod.PATCH, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public Map<String, Object> patchReservation(@RequestBody Reservation reservation) {
        Result result = this.reservationService.updateReservation(reservation);
        return this.resolveResult(result);
    }

    /**
     * DELETE 예약 취소
     */
    @RequestMapping(value = "/{id}", method = RequestMethod.DELETE, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public Map<String, Object> deleteReservation(@PathVariable("id") Long id) {
        Result result = this.reservationService.cancelReservation(id);
        return this.resolveResult(result);
    }
}