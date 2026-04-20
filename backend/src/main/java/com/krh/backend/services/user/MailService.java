package com.krh.backend.services.user;

import com.krh.backend.results.Result;
import com.krh.backend.results.CommonResult;
import com.krh.backend.results.user.UserResult;
import com.krh.backend.validators.user.UserValidator;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

@Service
@RequiredArgsConstructor
public class MailService {

    private final JavaMailSender mailSender;
    private final SpringTemplateEngine templateEngine;

    /**
     * 인증 메일을 발송합니다.
     * @param to 수신자 이메일
     * @param type 요청 타입 (예: 회원가입, 비밀번호 찾기)
     * @param code 생성된 6자리 인증번호
     * @return Result (성공 시 SUCCESS, 이메일 형식 오류 시 INVALID_EMAIL, 발송 실패 시 FAILURE)
     */
    public Result sendVerificationEmail(String to, String type, String code) {
        // 1. [정규화 및 검증] UserValidator를 통한 이메일 유효성 체크
        if (!UserValidator.validateEmail(to)) {
            return UserResult.INVALID_EMAIL;
        }

        try {
            // 2. Thymeleaf 컨텍스트 설정
            Context context = new Context();
            context.setVariable("type", type);
            context.setVariable("code", code);

            // 3. HTML 템플릿 처리 (email/sendEmail.html 경로 사용)
            String htmlContent = templateEngine.process("email/sendEmail", context);

            // 4. MimeMessage 설정
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom("rah610670@gmail.com"); // application.properties의 username과 일치해야 함
            helper.setTo(to);
            helper.setSubject("[COMMIT CAR] 인증번호가 도착했습니다.");
            helper.setText(htmlContent, true);

            // 5. 실제 발송
            mailSender.send(message);

            return CommonResult.SUCCESS;

        } catch (MessagingException e) {
            // 로그 기록
            e.printStackTrace();
            return CommonResult.FAILURE;
        }
    }

    /**
     * [추가] 임시 비밀번호 메일을 발송합니다.
     * @param to 수신자 이메일
     * @param password 생성된 8자리 임시 비밀번호
     * @return Result (성공 시 SUCCESS, 이메일 형식 오류 시 INVALID_EMAIL, 발송 실패 시 FAILURE)
     */
    public Result sendPasswordEmail(String to, String password) {
        // 1. [정규화 및 검증] 이메일 유효성 체크
        if (!UserValidator.validateEmail(to)) {
            return UserResult.INVALID_EMAIL;
        }

        try {
            // 2. Thymeleaf 컨텍스트 설정 (임시 비밀번호 변수 전달)
            Context context = new Context();
            context.setVariable("password", password);

            // 3. HTML 템플릿 처리 (email/sendPassword.html 경로 사용)
            String htmlContent = templateEngine.process("email/sendPassword", context);

            // 4. MimeMessage 설정
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom("rah610670@gmail.com");
            helper.setTo(to);
            helper.setSubject("[COMMIT CAR] 임시 비밀번호가 발급되었습니다.");
            helper.setText(htmlContent, true);

            // 5. 실제 발송
            mailSender.send(message);

            return CommonResult.SUCCESS;

        } catch (MessagingException e) {
            e.printStackTrace();
            return CommonResult.FAILURE;
        }
    }
}