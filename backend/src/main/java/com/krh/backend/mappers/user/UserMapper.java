package com.krh.backend.mappers.user;

import com.krh.backend.entities.user.EmailTokenEntity;
import com.krh.backend.entities.user.UserEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface UserMapper {
    /**
     * [CREATE] 신규 회원 등록
     * * @Param(value = "user") 설명:
     * - UserEntity 클래스 내부에 "user"라는 변수 없음!
     * - 이 메서드를 호출할 때 넘겨주는 'UserEntity 객체' 그 자체에 MyBatis용 별명인 "user"를 붙이는 것
     * - 이렇게 별명을 붙여두면, UserMapper.xml 파일에서 #{user.email}, #{user.carModel} 처럼
     * "별명.필드명" 형식으로 데이터에 접근 위함
     * * @param user 실제 데이터가 담긴 UserEntity 객체 묶음
     * @return 성공 시 영향받은 행의 수 (1) 반환
     */
    int insertUser(@Param(value = "user") UserEntity user);

    //READ : pk(email)기준 유저 정보 1개(혹은 null)반환
    UserEntity selectByEmail(@Param(value = "email") String email);

    // [READ] 소셜 타입(KAKAO/NAVER)과 고유 식별자(socialId)로 유저를 찾는 메서드
    UserEntity selectBySocialInfo(@Param(value = "socialTypeCode") String socialTypeCode,
                                  @Param(value = "socialId") String socialId);
    /**
     * [UPDATE] 사용자 정보 수정
     * - 'email'은 연락처 수단이므로 수정을 허용합니다. (단, 중복 체크 로직 필요)
     * - 'name'은 신원 보장을 위해 수정을 금지
     * - 차량 정보, 주행 환경 등 가변 데이터 위주 업데이트합니다.
     */
    int updateUserInfo(@Param(value = "user") UserEntity user);

    //DELETE
    int deleteByUser(@Param(value = "email") String email);

    // [이메일 인증 토큰 관련 메서드]
    /**
     * [READ] 해당 이메일로 발송된 최신 인증 토큰 정보를 조회합니다.
     * - 재전송 횟수 제한(1회) 및 만료 시간 체크를 위해 사용됩니다.
     */
    EmailTokenEntity selectEmailTokenByEmail(@Param(value = "email") String email);

    /**
     * [CREATE] 최초 이메일 인증 요청 시 토큰 정보를 저장합니다.
     * @param token 이메일, 인증번호, 솔트, 만료시간이 담긴 객체
     */
    int insertEmailToken(@Param(value = "token") EmailTokenEntity token);

    /**
     * [UPDATE] 인증번호 재전송 시 기존 토큰 정보를 업데이트합니다.
     * - 인증번호(code)와 솔트(salt)를 갱신하고 재전송 횟수(retry_count)를 1 증가시킵니다.
     */
    int updateEmailToken(@Param(value = "token") EmailTokenEntity token);

    /**
     * [UPDATE] 인증번호 일치 확인 성공 시 인증 완료 상태로 변경합니다.
     * - is_verified 값을 true로 변경합니다.
     */
    int updateEmailTokenVerified(@Param(value = "email") String email,
                                 @Param(value = "code") String code);

    /**
     * [UPDATE] 회원가입 완료 시 해당 토큰을 '사용됨' 상태로 변경합니다.
     * - is_used 값을 true로 변경하여 보안을 강화합니다.
     */
    int updateEmailTokenUsed(@Param(value = "email") String email);
}