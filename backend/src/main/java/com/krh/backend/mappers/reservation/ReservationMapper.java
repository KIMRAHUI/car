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
     * - XML의 useGeneratedKeys="true" 설정을 통해 데이터베이스에서 생성된 PK(id)가
     * 파라미터로 전달된 reservation 객체의 id 필드에 자동으로 주입됩니다.
     * @param reservation 예약 정보 엔티티
     * @return 영향받은 행의 수
     */
    int insertReservation(Reservation reservation);

    /**
     * [CREATE] 예약 상세 수리 항목 저장
     * @param item 예약 ID와 항목명이 포함된 상세 항목 엔티티
     * @return 영향받은 행의 수
     */
    int insertReservationItem(ReservationItem item);

    /**
     * [READ] 사용자별 예약 목록 조회
     * - 마이페이지의 Reservation 및 History 탭에 출력될 데이터를 조회합니다.
     * - 개선사항: XML 조인을 통해 해당 예약과 연관된 리뷰 ID 및 당시 기록된 주행거리(recordedMileage)를 함께 가져옵니다.
     * @param userEmail 사용자 식별 이메일
     * @return 예약 정보 리스트 (리뷰 정보 포함)
     */
    List<Reservation> selectReservationsByUserEmail(@Param("userEmail") String userEmail);

    /**
     * [READ] 특정 예약의 상세 수리 항목 조회
     * - 예약 리스트 출력 시 각 예약 건에 매핑된 세부 항목들을 가져오기 위해 사용합니다.
     * @param reservationId 예약 고유 번호
     * @return 상세 항목 리스트
     */
    List<ReservationItem> selectItemsByReservationId(@Param("reservationId") Long reservationId);

    /**
     * [UPDATE] 예약 정보 및 상태 수정
     * - 예약 날짜(reservedAt), 요청 상세 설명(description), 예약 상태(status) 등을 변경할 때 사용합니다.
     * @param reservation 수정할 정보가 담긴 엔티티
     * @return 영향받은 행의 수
     */
    int updateReservation(Reservation reservation);

    /**
     * [DELETE] 예약 삭제 (취소)
     * - 사용자가 직접 예약을 취소할 때 호출합니다.
     * - DB 설정에 따라 연관된 상세 항목(ReservationItem)도 함께 삭제될 수 있습니다.
     * @param id 삭제할 예약 고유 번호
     * @return 영향받은 행의 수
     */
    int deleteReservationById(@Param("id") Long id);

    /**
     * [DELETE] 특정 예약의 모든 상세 항목 삭제
     * - 예약 정보를 수정할 때, 기존 항목들을 일괄 삭제하고 새로 삽입하기 위한 용도로 사용합니다.
     * @param reservationId 항목을 삭제할 예약 고유 번호
     * @return 영향받은 행의 수
     */
    int deleteItemsByReservationId(@Param("reservationId") Long reservationId);
}