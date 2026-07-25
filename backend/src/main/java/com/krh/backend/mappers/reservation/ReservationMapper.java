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
     * - 예약 날짜(reservedAt)와 상태(status) 변경 위주로 사용
     */
    int updateReservation(Reservation reservation);

    /**
     * [UPDATE] 예약 상태를 특정 값으로 업데이트 (상태 변경 로직)
     * - 물리 삭제(Hard Delete)를 방지하고 데이터를 유지하기 위해 사용
     * @param id     예약 고유 번호
     * @param status 변경할 상태값 (예: 'CANCELED')
     */
    int updateReservationStatus(@Param("id") Long id, @Param("status") String status);

}