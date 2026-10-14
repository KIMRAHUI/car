package com.krh.backend.controllers.reservation;

import com.krh.backend.controllers.CommonController;
import com.krh.backend.dtos.ReservationRequest;
import com.krh.backend.entities.reservation.Reservation;
import com.krh.backend.entities.user.UserEntity;
import com.krh.backend.results.CommonResult;
import com.krh.backend.results.Result;
import com.krh.backend.services.reservation.ReservationService;
import jakarta.servlet.http.HttpSession;
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
    public Map<String, Object> postReservation(@ModelAttribute ReservationRequest request, HttpSession session) {
        System.out.println(">>> [LOG] 예약 등록 요청 수신");
        String sessionEmail = this.getSessionEmail(session);
        if (sessionEmail == null) {
            return this.resolveResult(CommonResult.FAILURE);
        }
        // 요청 본문의 이메일 대신 로그인한 사용자의 이메일로 예약을 등록
        request.setUserEmail(sessionEmail);
        Result result = this.reservationService.registerReservation(request);
        return this.resolveResult(result);
    }

    /**
     * GET 사용자의 예약 목록 조회
     */
    @GetMapping(value = {"", "/"})
    @ResponseBody
    public List<Reservation> getReservations(@RequestParam(value = "email", required = false) String email,
                                             HttpSession session) {
        // 쿼리 파라미터의 이메일은 무시하고, 로그인한 사용자 본인의 예약만 조회
        String sessionEmail = this.getSessionEmail(session);
        if (sessionEmail == null) {
            return List.of();
        }
        System.out.println(">>> [LOG] 예약 목록 조회 요청: " + sessionEmail);
        return this.reservationService.getReservations(sessionEmail);
    }

    /**
     * PATCH 예약 정보 수정
     */
    @PatchMapping(value = {"", "/"})
    @ResponseBody
    public Map<String, Object> patchReservation(@RequestBody Reservation reservation, HttpSession session) {
        System.out.println(">>> [LOG] 예약 수정 요청 수신! ID: " + (reservation != null ? reservation.getId() : "null"));
        String sessionEmail = this.getSessionEmail(session);
        if (sessionEmail == null || reservation == null || reservation.getReservedAt() == null) {
            return this.resolveResult(CommonResult.FAILURE);
        }
        // 사용자는 예약 일시만 바꿀 수 있고, 상태(status)는 변경할 수 없음
        Reservation changes = Reservation.builder()
                .id(reservation.getId())
                .reservedAt(reservation.getReservedAt())
                .build();
        Result result = this.reservationService.updateReservation(changes, sessionEmail);
        return this.resolveResult(result);
    }

    /**
     * DELETE 예약 취소
     */
    @DeleteMapping("/{id}")
    @ResponseBody
    public Map<String, Object> deleteReservation(@PathVariable("id") Long id, HttpSession session) {
        System.out.println(">>> [LOG] 예약 취소 요청 수신! ID: " + id);
        String sessionEmail = this.getSessionEmail(session);
        if (sessionEmail == null) {
            return this.resolveResult(CommonResult.FAILURE);
        }
        Result result = this.reservationService.cancelReservation(id, sessionEmail);
        System.out.println(">>> [LOG] 서비스 결과: " + result);
        return this.resolveResult(result);
    }

    /**
     * 세션에 저장된 로그인 사용자의 이메일 (로그인하지 않았으면 null)
     */
    private String getSessionEmail(HttpSession session) {
        Object user = session.getAttribute("sessionUser");
        return user instanceof UserEntity ? ((UserEntity) user).getEmail() : null;
    }
}
