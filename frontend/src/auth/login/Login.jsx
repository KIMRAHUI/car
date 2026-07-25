import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/header/Header.jsx';
import useEmailAuth from '../../components/common/useEmailAuth'; // 경로 확인 필요
import AuthAlertModal from '../../components/auth/AuthAlertModal.jsx'; // [추가] 커스텀 모달
import '../Label.css';
import './login.css';
import kakaoLogo from '../../assets/image/auth/kakao_logo.png';
import naverLogo from '../../assets/image/auth/naver_logo.png';

const Login = () => {
    const [viewMode, setViewMode] = useState('login');
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);

    //말풍선 가이드 텍스트 제어 상태
    const [activeTooltip, setActiveTooltip] = useState({
        field: '', // 'email', 'password', 'carNumber'
        visible: false
    });

    //모달 상태 관리
    const [modalConfig, setModalConfig] = useState({
        show: false,
        title: '',
        message: ''
    });

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        emailVerify: '',
        carNumber: ''
    });

    // 모달 닫기
    const closeModal = () => setModalConfig({ ...modalConfig, show: false });

    // 모달 호출
    const showAlert = (title, message) => {
        setModalConfig({ show: true, title, message });
    };

    //인풋창 활성화 -> 말풍선을 띄우는 함수
    const triggerTooltip = (fieldName) => {
        setActiveTooltip({ field: fieldName, visible: true });
    };

    //마우스가 떠나거나 포커스가 풀렸을 때 말풍선을 지우는 함수
    const hideTooltip = () => {
        setActiveTooltip({ field: '', visible: false });
    };

    //컴포넌트 마운트 시 로직
    useEffect(() => {
        window.scrollTo(0, 0);
        localStorage.removeItem('rememberedEmailData');
    }, []);

    // 뷰 모드가 변경-> 노출 중 툴팁 상태를 리셋
    useEffect(() => {
        hideTooltip();
    }, [viewMode]);

    const {
        timeLeft,
        isTimerActive,
        isVerified,
        isLoading,
        count,
        formatTime,
        sendVerificationEmail,
        verifyEmailCode
    } = useEmailAuth(formData.email, 'FIND_PASSWORD');

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

        //이메일 발송 통합 핸들러
        //10회 한도 초과 등 에러 발생 시 알림 모달을 띄워줍니다.
    const handleEmailRequest = async () => {
        const result = await sendVerificationEmail();
        // 발송 실패 시 (네트워크 에러, 10회 한도 초과 등) 메시지 출력
        if (!result.success) {
            showAlert('알림', result.message);
        }
    };


        //소셜 로그인 핸들러
        // 현재 환경(local/prod)따라 리다이렉트 주소 결정
    const handleSocialLogin = (provider) => {
        // 소셜 로그인 창으로 이동하기 전 폼의 이메일 상태 비움
        setFormData(prev => ({ ...prev, email: '' }));

        //현재 접속한 호스트네임 확인
        const host = window.location.hostname;
        const socialLoginUrl = host === 'localhost'
            ? `http://localhost:8080/oauth2/authorization/${provider}`
            : `https://car.rhui.dev/oauth2/authorization/${provider}`;

        // 결정된 경로로 리다이렉트
        window.location.href = socialLoginUrl;
    };


    //일반 로그인 핸들러
    const handleLogin = (e) => {
        if (e) e.preventDefault();

        if (!formData.email || !formData.password) {
            showAlert('입력 오류', '이메일과 비밀번호를 모두 입력해주세요.');
            return;
        }

        // 환경에 따른 API URL 결정
        const host = window.location.hostname;
        const loginUrl = host === 'localhost'
            ? '/user/login'
            : 'https://car.rhui.dev/user/login'; // 서버에서는 HTTPS 명시

        const xhr = new XMLHttpRequest();
        const fd = new FormData();
        fd.append('email', formData.email);
        fd.append('password', formData.password);

        xhr.onreadystatechange = () => {
            if (xhr.readyState !== XMLHttpRequest.DONE) return;

            if (xhr.status >= 200 && xhr.status < 400) {
                const response = JSON.parse(xhr.responseText);
                const result = response.result;

                if (result === 'success') {
                    showAlert('성공', '로그인에 성공하였습니다.');
                    localStorage.setItem('isLoggedIn', 'true');
                    setTimeout(() => navigate('/'), 1500);
                } else {
                    const errorMessages = {
                        'user_not_found': '존재하지 않는 이메일 계정입니다.',
                        'wrong_password': '비밀번호가 일치하지 않습니다.',
                        'failure': '비밀번호가 일치하지 않거나 소셜 가입 계정입니다.\n입력 정보를 다시 확인해 주세요.'
                    };
                    showAlert('로그인 실패', errorMessages[result] || '로그인에 실패하였습니다.');
                }
            } else {
                showAlert('서버 오류', '서버와 통신 중 오류가 발생했습니다.');
            }
        };

        xhr.open('POST', loginUrl);
        xhr.withCredentials = true;
        xhr.send(fd);
    };

    const handleFindPasswordSubmit = () => {
        if (!isVerified) {
            showAlert('인증 필요', "이메일 인증을 먼저 완료해주세요.");
            return;
        }
        if (!formData.carNumber) {
            showAlert('입력 오류', "차량 번호를 입력해주세요.");
            return;
        }

        setIsSubmitting(true);

        const xhr = new XMLHttpRequest();
        const fd = new FormData();
        fd.append('email', formData.email);
        fd.append('carNumber', formData.carNumber);

        xhr.onreadystatechange = () => {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                setIsSubmitting(false);

                if (xhr.status >= 200 && xhr.status < 400) {
                    const response = JSON.parse(xhr.responseText);
                    const result = response.result;

                    if (result === 'success') {
                        showAlert('발송 완료', "입력하신 이메일로 임시 비밀번호가 발송되었습니다.\n로그인 후 반드시 비밀번호를 변경해 주세요.");
                        setViewMode('login');
                    } else if (result === 'user_not_found') {
                        showAlert('조회 실패', "가입되지 않은 이메일입니다.");
                    } else if (result === 'failure') {
                        showAlert('정보 불일치', "등록된 차량 번호 정보와 일치하지 않습니다.\n다시 확인 후 입력해주세요.");
                    } else {
                        showAlert('오류', "임시 비밀번호 발급 중 오류가 발생했습니다.");
                    }
                } else {
                    showAlert('서버 오류', "서버 연결에 실패했습니다.");
                }
            }
        };

        xhr.open('POST', '/user/temp-password');
        xhr.send(fd);
    };

    return (
        <div className={`auth-page-container ${viewMode}`}>
            {/*count 값에 따른 로딩 텍스트 분기 처리 적용 */}
            {(isLoading === true || isSubmitting === true) && (
                <div className="auth-loading-overlay">
                    <div className="loading-spinner"></div>
                    <p className="loading-text">
                        {isSubmitting
                            ? "잠시만 기다려 주세요..."
                            : (count > 1
                                ? `인증번호 전송 중... (${count}/10)`
                                : "인증번호 발송 처리 중입니다...")}
                    </p>
                </div>
            )}

            <div className="auth-header-layer">
                <Header isBlack={true} />
            </div>

            <div className="auth-content-group">
                <div className="side-tab-group">
                    <div className="vertical-tab" onClick={() => navigate('/register')}>
                        회원가입
                    </div>
                    <div
                        className={`vertical-tab ${viewMode === 'find' ? 'active' : ''}`}
                        onClick={() => setViewMode(viewMode === 'login' ? 'find' : 'login')}
                    >
                        {viewMode === 'login' ? '비밀번호 찾기' : '로그인으로'}
                    </div>
                </div>

                <div className="auth-form-wrapper">
                    <h1 className="auth-main-title">
                        {viewMode === 'login' ? 'LOGIN' : 'FIND PASSWORD'}
                    </h1>

                    <div className="form-inner-wrapper">
                        {viewMode === 'login' ? (
                            <form className="auth-form-body" onSubmit={handleLogin}>
                                <div className="input-unit relative-container">
                                    <label className="auth-label">이메일</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="이메일을 입력해주세요"
                                        className="auth-input"
                                        onMouseEnter={() => triggerTooltip('email')}
                                        onFocus={() => triggerTooltip('email')}
                                        onMouseLeave={hideTooltip}
                                        onBlur={hideTooltip}
                                    />
                                    {activeTooltip.field === 'email' && activeTooltip.visible && (
                                        <div className="mini-bubble">올바른 이메일 형식을 입력해주세요.</div>
                                    )}
                                </div>
                                <div className="input-unit relative-container">
                                    <label className="auth-label">비밀번호</label>
                                    <input
                                        type="password"
                                        name="password"
                                        autoComplete="off"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        placeholder="비밀번호를 입력해주세요"
                                        className="auth-input"
                                        onMouseEnter={() => triggerTooltip('password')}
                                        onFocus={() => triggerTooltip('password')}
                                        onMouseLeave={hideTooltip}
                                        onBlur={hideTooltip}
                                    />
                                    {activeTooltip.field === 'password' && activeTooltip.visible && (
                                        <div className="mini-bubble">영문, 숫자, 특수문자를 포함하여 8~16자로 입력해주세요.</div>
                                    )}
                                </div>


                                <button type="submit" className="btn-primary-black">LOGIN</button>

                                <div className="social-login-group">
                                    <button type="button" className="social-btn kakao" onClick={() => handleSocialLogin('kakao')}>
                                        <img src={kakaoLogo} alt="카카오 로그인" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    </button>
                                    <button type="button" className="social-btn naver" onClick={() => handleSocialLogin('naver')}>
                                        <img src={naverLogo} alt="네이버 로그인" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <form className="auth-form-body" onSubmit={(e) => e.preventDefault()}>
                                <div className="auth-row-group">
                                    <div className="input-unit-flex relative-container">
                                        <label className="auth-label">이메일</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            placeholder="이메일을 입력해주세요"
                                            className="auth-input"
                                            disabled={isVerified}
                                            onMouseEnter={() => triggerTooltip('email')}
                                            onFocus={() => triggerTooltip('email')}
                                            onMouseLeave={hideTooltip}
                                            onBlur={hideTooltip}
                                        />
                                        {activeTooltip.field === 'email' && activeTooltip.visible && (
                                            <div className="mini-bubble">올바른 이메일 형식을 입력해주세요.</div>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        className="auth-verify-btn auth-btn-align-with-label"
                                        onClick={handleEmailRequest}
                                        disabled={isTimerActive || isVerified || isLoading || isSubmitting}
                                    >
                                        {(isLoading || isSubmitting) ? "전송 중" : "인증번호 전송"}
                                    </button>
                                </div>
                                <div className="auth-row-group">
                                    <div className="input-unit-flex">
                                        <label className="auth-label">이메일 인증번호</label>
                                        <input
                                            type="text"
                                            name="emailVerify"
                                            value={formData.emailVerify}
                                            onChange={handleInputChange}
                                            maxLength="6"
                                            placeholder="인증번호 6자리를 입력해주세요"
                                            className="auth-input"
                                            disabled={isVerified}
                                        />
                                        <p className="helper-text" style={{ color: isVerified ? '#00c853' : '#e74c3c' }}>
                                            {isVerified ? '*인증이 완료되었습니다' : `*인증가능시간 ${formatTime()}`}
                                        </p>
                                    </div>

                                    {formData.emailVerify.length === 6 && !isVerified ? (
                                        <button
                                            type="button"
                                            className="auth-verify-btn auth-btn-align-with-label"
                                            style={{ backgroundColor: '#1a1a1a', color: '#fff' }}
                                            onClick={() => verifyEmailCode(formData.emailVerify)}
                                            disabled={isLoading || isSubmitting}
                                        >
                                            {(isLoading || isSubmitting) ? "확인 중" : "확인"}
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            className="auth-verify-btn"
                                            onClick={handleEmailRequest}
                                            disabled={isVerified || isLoading || isSubmitting}
                                        >
                                            {(isLoading || isSubmitting) ? "재발송 중" : "재전송"}
                                        </button>
                                    )}
                                </div>
                                <div className="input-unit relative-container">
                                    <label className="auth-label">차량 번호</label>
                                    <input
                                        type="text"
                                        name="carNumber"
                                        value={formData.carNumber}
                                        onChange={handleInputChange}
                                        placeholder="차량번호를 입력해주세요 (예: 12가 3456)"
                                        className="auth-input"
                                        onMouseEnter={() => triggerTooltip('carNumber')}
                                        onFocus={() => triggerTooltip('carNumber')}
                                        onMouseLeave={hideTooltip}
                                        onBlur={hideTooltip}
                                    />
                                    {activeTooltip.field === 'carNumber' && activeTooltip.visible && (
                                        <div className="mini-bubble">올바른 차량번호 형식으로 입력해주세요. (예: 12가3456)</div>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    className="btn-primary-black"
                                    onClick={handleFindPasswordSubmit}
                                    disabled={isLoading || isSubmitting}
                                >
                                    {(isLoading || isSubmitting) ? "처리 중..." : "확인"}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>

            {modalConfig.show && (
                <AuthAlertModal
                    title={modalConfig.title}
                    message={modalConfig.message}
                    onClose={closeModal}
                />
            )}
        </div>
    );
};

export default Login;