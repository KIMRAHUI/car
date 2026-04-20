package com.krh.backend.entities.user;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString
@EqualsAndHashCode(of = {"email", "code", "salt"}) // DB 복합키와 일치
public class EmailTokenEntity {
    private String email;       // 인증 대상 이메일
    private String code;        // 6자리 랜덤 인증번호
    private String salt;        // 보안 솔트
    private int retryCount;     // 재전송 횟수 (0 또는 1)
    private boolean isVerified; // 인증 성공 여부
    private boolean isUsed;     // 실제 가입/변경에 사용되었는지 여부
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt; // 현재 시간 + 3분
}