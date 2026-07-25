import { useState, useEffect } from 'react';

const useEmailAuth = (email, type) => {
    const [timeLeft, setTimeLeft] = useState(180); // 3분 (180초)
    const [isTimerActive, setIsTimerActive] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    //초기값을 1로 설정->UI에서 (/10)으로 비어 보이는 현상을 방지
    const [count, setCount] = useState(1);

    // 타이머 로직
    useEffect(() => {
        let timer = null;
        if (isTimerActive && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsTimerActive(false);
            if (timer) clearInterval(timer);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [isTimerActive, timeLeft]);

    // 시간 포맷팅 (03:00)
    const formatTime = () => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    //인증번호 발송 (최초 발송 & 재전송 공용)
    const sendVerificationEmail = async () => {
        if (!email) return { success: false, message: "이메일을 입력해주세요." };

        //클라이언트 단계에서 10회 초과 시 즉시 차단
        if (count > 10) {
            return {
                success: false,
                message: "오늘의 인증번호 전송 한도(10회)를 모두 초과했습니다. 내일 다시 시도해주세요."
            };
        }

        setIsLoading(true);
        setIsTimerActive(false);
        setIsVerified(false);

        /**
         * count === 1 (첫 시도): 숫자를 미리 올리지 않고 서버 응답을 기다림
         * 이때 UI(Register.jsx)에서는 "처리 중..." 문구를 보여줌
         * 2. count > 1 (재전송): 이미 시도 횟수가 존재, 유저 클릭 시 즉시 숫자를 올려 반응성을 높임
         */
        if (count > 1) {
            setCount(prev => prev + 1);
        }

        try {
            const response = await fetch('/user/email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ email, type })
            });

            const data = await response.json(); // { result: 'success', retryCount: n }

            // 서버 응답 결과가 오면 실제 DB에 기록된 정확한 숫자로 최종 동기화
            // 첫 시도(count 1)였다면 여기서 실제 서버 카운트가 처음으로 UI에 반영
            if (data.retryCount !== undefined) {
                setCount(data.retryCount);
            }

            if (data.result === 'success') {
                setTimeLeft(180);
                setIsTimerActive(true);

                // 숫자가 업데이트된 것을 유저가 인지할 수 있도록 아주 짧은 대기 후 종료
                await new Promise(resolve => setTimeout(resolve, 300));

                return {
                    success: true,
                    message: `인증번호가 발송되었습니다. (오늘 시도: ${data.retryCount}/10)`
                };
            } else {
                // 발송 실패 시, 미리 올렸던 숫자만 다시 원상복구
                if (count > 1) {
                    setCount(prev => prev - 1);
                }

                const msg = data.retryCount >= 10
                    ? "오늘의 인증번호 전송 한도(10회)를 모두 초과했습니다. 내일 다시 시도해주세요."
                    : "인증번호 발송에 실패했습니다. 잠시 후 다시 시도해주세요.";
                return { success: false, message: msg };
            }
        } catch {
            // 네트워크 에러 시에도 숫자를 원상복구합니다.
            if (count > 1) {
                setCount(prev => prev - 1);
            }
            return { success: false, message: "네트워크 오류가 발생했습니다." };
        } finally {
            setIsLoading(false);
        }
    };

    //인증번호 확인
    const verifyEmailCode = async (code) => {
        if (!code || code.length < 6) return { success: false, message: "인증번호 6자리를 입력해주세요." };

        setIsLoading(true);
        try {
            const response = await fetch('/user/verify-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ email, code })
            });

            const data = await response.json();

            if (data.result === 'success') {
                setIsVerified(true);
                setIsTimerActive(false);
                return { success: true, message: "이메일 인증이 완료되었습니다." };
            } else {
                return { success: false, message: "인증번호가 일치하지 않거나 만료되었습니다." };
            }
        } catch {
            return { success: false, message: "네트워크 오류가 발생했습니다." };
        } finally {
            setIsLoading(false);
        }
    };

    return {
        timeLeft,
        isTimerActive,
        isVerified,
        isLoading,
        count,
        formatTime,
        sendVerificationEmail,
        verifyEmailCode
    };
};

export default useEmailAuth;