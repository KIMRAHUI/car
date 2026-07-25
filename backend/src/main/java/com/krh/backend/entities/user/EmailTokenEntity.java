package com.krh.backend.entities.user;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString
@EqualsAndHashCode(of = {"email"}) // DB의 단일 Primary Key(email)와 일치시킴
public class EmailTokenEntity {
    private String email;       // 인증 대상 이메일 (Primary Key)
    private String code;        // 6자리 랜덤 인증번호
    private String salt;        // 보안 솔트
    private int retryCount;     // 당일 누적 발송 횟수
    private boolean isVerified; // 인증 성공 여부
    private boolean isUsed;     // 실제 가입/변경에 사용되었는지 여부
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt; // 마지막 발송 시간 (날짜 비교용 핵심 필드)
    private LocalDateTime expiresAt; // 인증 번호 만료 시간 (현재 시간 + 3분)
}