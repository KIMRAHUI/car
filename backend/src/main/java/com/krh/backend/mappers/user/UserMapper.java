package com.krh.backend.mappers.user;

import com.krh.backend.dtos.MaintenanceResponse;
import com.krh.backend.entities.user.EmailTokenEntity;
import com.krh.backend.entities.user.UserEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface UserMapper {
    /**
     * [CREATE] 신규 회원 등록
     * @param user 실제 데이터가 담긴 UserEntity 객체 묶음
     * @return 성공 시 영향받은 행의 수 (1) 반환
     */
    int insertUser(@Param(value = "user") UserEntity user);

    /**
     * [READ] pk(email) 기준 유저 정보 조회
     * @param email 사용자 이메일
     * @return 유저 정보 1개 또는 null
     */
    UserEntity selectByEmail(@Param(value = "email") String email);

    /**
     * [READ] 소셜 타입(KAKAO/NAVER)과 고유 식별자(socialId)로 유저를 찾는 메서드
     * @param socialTypeCode 소셜 로그인 타입
     * @param socialId 소셜 플랫폼 고유 ID
     * @return 일치하는 유저 정보
     */
    UserEntity selectBySocialInfo(@Param(value = "socialTypeCode") String socialTypeCode,
                                  @Param(value = "socialId") String socialId);

    /**
     * [READ] 주행거리 무결성 체크용 단순 조회
     * @param email 사용자 이메일
     * @return 현재 DB에 저장된 누적 주행거리(km)
     */
    int selectMileageByEmail(@Param(value = "email") String email);

    /**
     * [UPDATE] 사용자 정보 수정
     * @param user 수정할 데이터가 담긴 유저 객체
     */
    int updateUserInfo(@Param(value = "user") UserEntity user);

    /**
     * [DELETE] 회원 탈퇴 처리
     * @param email 탈퇴할 사용자 이메일
     */
    int deleteByUser(@Param(value = "email") String email);

    // [이메일 인증 토큰 관련 메서드]
    /**
     * [READ] 해당 이메일로 발송된 최신 인증 토큰 정보를 조회합니다.
     */
    EmailTokenEntity selectEmailTokenByEmail(@Param(value = "email") String email);

    /**
     * [CREATE] 최초 이메일 인증 요청 시 토큰 정보를 저장합니다.
     */
    int insertEmailToken(@Param(value = "token") EmailTokenEntity token);

    /**
     * [UPDATE] 인증번호 재전송 시 기존 토큰 정보를 업데이트합니다.
     */
    int updateEmailToken(@Param(value = "token") EmailTokenEntity token);

    /**
     * [UPDATE] 인증번호 일치 확인 성공 시 인증 완료 상태로 변경합니다.
     */
    int updateEmailTokenVerified(@Param(value = "email") String email,
                                 @Param(value = "code") String code);

    /**
     * [UPDATE] 회원가입 완료 시 해당 토큰을 '사용됨' 상태로 변경합니다.
     */
    int updateEmailTokenUsed(@Param(value = "email") String email);


    // [차량 마스터 정보 관련 메서드]

    /**
     * [READ] 모든 차량 브랜드 목록을 조회합니다. (모달 Step 1용)
     */
    List<Map<String, Object>> selectAllBrands();

    /**
     * [READ] 특정 브랜드에 속한 차량 모델 목록을 조회합니다. (모달 Step 2용)
     */
    List<Map<String, Object>> selectModelsByBrandId(@Param(value = "brandId") int brandId);

    /**
     * [READ] 특정 모델 ID가 실제로 DB에 존재하는지 확인합니다.
     */
    int countModelById(@Param(value = "modelId") int modelId);


    // [추가 항목: 정비 관리 시스템 연동]

    /**
     * [READ] 마스터 정비 항목과 사용자의 마지막 정비 이력을 조인하여 전체 상태를 조회합니다.
     * - XML의 selectAllMaintenanceStatus 쿼리와 매핑됩니다.
     * @param email 사용자 이메일
     * @return 각 항목의 카테고리, 이름, 주기, 마지막 정비 거리/날짜가 포함된 리스트
     */
    List<MaintenanceResponse> selectAllMaintenanceStatus(@Param(value = "email") String email);
}