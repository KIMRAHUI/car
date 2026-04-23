package com.krh.backend.mappers.reservation;

import com.krh.backend.entities.reservation.Reservation;
import com.krh.backend.entities.reservation.ReservationItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ReservationMapper {

    /**
     * [CREATE] 예약 메인 정보 저장
     * - XML에서 description 컬럼과 #{description} 매핑을 반드시 제거해야 에러가 나지 않습니다.
     */
    int insertReservation(Reservation reservation);

    /**
     * [CREATE] 예약 상세 수리 항목 저장
     */
    int insertReservationItem(ReservationItem item);

    /**
     * [CREATE] 예약 상세 수리 항목 다중 저장 (Batch Insert)
     */
    int insertReservationItems(@Param("items") List<ReservationItem> items);

    /**
     * [READ] 사용자별 예약 목록 조회
     */
    List<Reservation> selectReservationsByUserEmail(@Param("userEmail") String userEmail);

    /**
     * [READ] 특정 예약의 상세 수리 항목 조회
     */
    List<ReservationItem> selectItemsByReservationId(@Param("reservationId") Long reservationId);

    /**
     * [READ] 특정 항목의 가장 최근 정비 완료 이력 조회
     */
    Reservation selectLatestFinishedItem(@Param("userEmail") String userEmail, @Param("itemName") String itemName);

    /**
     * [UPDATE] 예약 정보 및 상태 수정
     * - [수정] description 속성이 제거되었으므로, 이제 예약 날짜(reservedAt)와 상태(status) 변경 위주로 사용합니다.
     */
    int updateReservation(Reservation reservation);

    // ==========================================================
    // 아래 메서드들은 현재 서비스 로직에서 '상태 변경(CANCELED)'으로
    // 대체되었거나, 사용하지 않으므로 주석 처리합니다.
    // ==========================================================

    /* /**
     * [DELETE] 예약 삭제 (취소)
     * - 현재 서비스에서 삭제 대신 status를 'CANCELED'로 업데이트하므로 사용하지 않습니다.
     * /
    int deleteReservationById(@Param("id") Long id);
    */

    /*
    /**
     * [DELETE] 특정 예약의 모든 상세 항목 삭제
     * - 예약 수정 시 기존 항목을 날리고 새로 넣는 방식이 아니라면 현재는 불필요합니다.
     * /
    int deleteItemsByReservationId(@Param("reservationId") Long reservationId);
    */
}