package com.krh.backend.controllers.reservation;

import com.krh.backend.controllers.CommonController;
import com.krh.backend.dtos.service.ReservationRequest;
import com.krh.backend.entities.reservation.Reservation;
import com.krh.backend.results.CommonResult;
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
     * POST 새로운 예약 등록 (AI 검증 포함)
     * @param request 예약 폼 데이터 (DTO)
     */
    @RequestMapping(value = "/", method = RequestMethod.POST, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public Map<String, Object> postReservation(@RequestBody ReservationRequest request) {
        // 서비스 내부에서 Gemini API를 통한 광고/비속어 검증이 수행됩니다.
        Result result = this.reservationService.registerReservation(request);
        return this.resolveResult(result);
    }

    /**
     * GET 사용자의 예약 목록 조회 (마이페이지용)
     * @param email 예약자 이메일
     */
    @RequestMapping(value = "/", method = RequestMethod.GET, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public List<Reservation> getReservations(@RequestParam("email") String email) {
        // 예약 목록은 리스트 형태 그대로 반환하거나 필요 시 resolveResult로 감쌀 수 있습니다.
        return this.reservationService.getReservations(email);
    }

    /**
     * PATCH 예약 정보 수정
     * @param reservation 수정된 예약 엔티티
     */
    @RequestMapping(value = "/", method = RequestMethod.PATCH, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public Map<String, Object> patchReservation(@RequestBody Reservation reservation) {
        Result result = this.reservationService.updateReservation(reservation);
        return this.resolveResult(result);
    }

    /**
     * DELETE 예약 취소
     * @param id 예약 고유 번호 (PK)
     */
    @RequestMapping(value = "/{id}", method = RequestMethod.DELETE, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public Map<String, Object> deleteReservation(@PathVariable("id") Long id) {
        Result result = this.reservationService.cancelReservation(id);
        return this.resolveResult(result);
    }
}