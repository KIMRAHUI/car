import { useState, useEffect, useCallback } from 'react';

const useEmailAuth = (email, type) => {
    const [timeLeft, setTimeLeft] = useState(0);
    const [isTimerActive, setIsTimerActive] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    // [추가] DB의 retry_count와 동기화될 상태값
    const [count, setCount] = useState(1);

    useEffect(() => {
        let timer;
        if (isTimerActive && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsTimerActive(false);
            if (timer) clearInterval(timer);
        }
        return () => clearInterval(timer);
    }, [isTimerActive, timeLeft]);

    const formatTime = useCallback(() => {
        const m = Math.floor(timeLeft / 60);
        const s = timeLeft % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }, [timeLeft]);

    const sendVerificationEmail = (isRetry = false) => {
        return new Promise((resolve) => {
            if (!email || email.trim() === "") {
                resolve({ success: false, message: "이메일을 입력해 주세요." });
                return;
            }

            setIsLoading(true);

            //재전송 시 미리 숫자 올림
            if (isRetry) setCount(prev => prev + 1);

            const xhr = new XMLHttpRequest();
            const fd = new FormData();
            fd.append('email', email);
            fd.append('type', type);

            xhr.onreadystatechange = () => {
                if (xhr.readyState !== XMLHttpRequest.DONE) return;
                setIsLoading(false);

                if (xhr.status >= 200 && xhr.status < 400) {
                    const response = JSON.parse(xhr.responseText);
                    const result = response.result;
                    const retryCount = response.retryCount; // 서버에서 오는 실제 카운트

                    // 서버 카운트가 있으면 즉시 동기화
                    if (retryCount !== undefined) setCount(retryCount);

                    if (result === 'success') {
                        setTimeLeft(180);
                        setIsTimerActive(true);
                        setIsSent(true);
                        setIsVerified(false);
                        resolve({ success: true, message: isRetry ? "인증번호가 재발송되었습니다." : "인증번호가 발송되었습니다." });
                    } else if (result === 'invalid_email') {
                        resolve({ success: false, message: "유효하지 않은 이메일 형식입니다." });
                    } else if (result === 'duplicate_email') {
                        resolve({ success: false, message: "이미 다른 사용자가 사용 중인 이메일입니다." });
                    } else {
                        // [수정] "최대 1회" 문구를 서버 데이터 기반으로 동적 수정
                        const finalCount = retryCount || count;
                        resolve({
                            success: false,
                            message: finalCount >= 10
                                ? "오늘의 인증번호 전송 한도(10회)를 모두 초과했습니다. 내일 다시 시도해주세요."
                                : "인증번호 발송에 실패했습니다."
                        });
                    }
                } else {
                    if (isRetry) setCount(prev => prev - 1); // 실패 시 복구
                    resolve({ success: false, message: "서버와 통신 중 오류가 발생했습니다." });
                }
            };

            xhr.open('POST', '/user/email');
            xhr.send(fd);
        });
    };

    const verifyEmailCode = (code) => {
        return new Promise((resolve) => {
            if (!code || code.length !== 6) {
                resolve({ success: false, message: "인증번호 6자리를 입력해 주세요." });
                return;
            }

            setIsLoading(true);

            const xhr = new XMLHttpRequest();
            const fd = new FormData();
            fd.append('email', email);
            fd.append('code', code);

            xhr.onreadystatechange = () => {
                if (xhr.readyState !== XMLHttpRequest.DONE) return;
                setIsLoading(false);

                if (xhr.status >= 200 && xhr.status < 400) {
                    const response = JSON.parse(xhr.responseText);
                    const result = response.result;

                    if (result === 'success') {
                        setIsVerified(true);
                        setIsTimerActive(false);
                        setTimeLeft(0);
                        resolve({ success: true, message: "이메일 인증에 성공하였습니다." });
                    } else if (result === 'invalid_email') {
                        resolve({ success: false, message: "인증 시간이 만료되었습니다. 다시 시도해 주세요." });
                    } else if (result === 'wrong_password') {
                        resolve({ success: false, message: "인증번호가 일치하지 않습니다." });
                    } else {
                        resolve({ success: false, message: "인증 확인 중 오류가 발생했습니다." });
                    }
                } else {
                    resolve({ success: false, message: "서버와 통신 중 오류가 발생했습니다." });
                }
            };

            xhr.open('POST', '/user/verify-email');
            xhr.send(fd);
        });
    };

    return {
        timeLeft,
        isTimerActive,
        setIsTimerActive,
        isSent,
        isVerified,
        isLoading,
        count,
        formatTime,
        sendVerificationEmail,
        verifyEmailCode
    };
};

export default useEmailAuth;