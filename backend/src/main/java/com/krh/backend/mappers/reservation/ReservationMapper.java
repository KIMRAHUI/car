package com.krh.backend.mappers.reservation;

import com.krh.backend.entities.reservation.ReservationItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ReservationMapper {
    // 1. [Create] 예약 및 상세 항목 저장
    // XML의 useGeneratedKeys="true"를 통해 id가 주입됩니다.
    int insertReservation(com.krh.backend.entities.reservation.Reservation reservation);

    int insertReservationItem(ReservationItem item);

    // 2. [Read] 예약 정보 조회 (마이페이지 및 변경용)
    // 사용자별 예약 목록 조회
    List<com.krh.backend.entities.reservation.Reservation> selectReservationsByUserEmail(@Param("userEmail") String userEmail);

    // 특정 예약의 상세 수리 항목 조회
    List<ReservationItem> selectItemsByReservationId(@Param("reservationId") Long reservationId);

    // 3. [Update] 예약 정보 수정
    // 예약 날짜, 시간, 상세 설명 등을 변경할 때 사용합니다.
    int updateReservation(com.krh.backend.entities.reservation.Reservation reservation);

    // 4. [Delete] 예약 삭제 (취소)
    // DB의 ON DELETE CASCADE 설정으로 부모 삭제 시 자식 항목도 자동 삭제됩니다.
    int deleteReservationById(@Param("id") Long id);

    // 수정을 위해 기존 상세 항목만 지워야 할 때 사용합니다.
    int deleteItemsByReservationId(@Param("reservationId") Long reservationId);
}