import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/header/Header.jsx';
import useEmailAuth from '../../assets/javascript/useEmailAuth';
import AuthAlertModal from '../../components/auth/AuthAlertModal.jsx'; // [추가] 커스텀 모달
import '../Label.css';
import './login.css';

const Login = () => {
    const [viewMode, setViewMode] = useState('login');
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    // [제거] rememberMe 상태 변수를 삭제했습니다.

    // [추가] 모달 상태 관리
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

    // 모달 닫기 핸들러
    const closeModal = () => setModalConfig({ ...modalConfig, show: false });

    // 모달 호출 도우미 함수
    const showAlert = (title, message) => {
        setModalConfig({ show: true, title, message });
    };

    /**
     * [수정] 컴포넌트 마운트 시 로직
     * 보안을 위해 기존에 저장되어 있을 수 있는 '이메일 기억하기' 데이터를 삭제합니다.
     */
    useEffect(() => {
        window.scrollTo(0, 0);
        localStorage.removeItem('rememberedEmailData');
    }, []);

    const {
        timeLeft,
        isTimerActive,
        isVerified,
        isLoading,
        formatTime,
        sendVerificationEmail,
        verifyEmailCode
    } = useEmailAuth(formData.email, 'FIND_PASSWORD');

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    /**
     * [수정] 소셜 로그인 핸들러
     * 소셜 로그인 시 폼 데이터를 초기화하여 세션 간섭을 방지합니다.
     */
    const handleSocialLogin = (provider) => {
        // 소셜 로그인 창으로 이동하기 전 폼의 이메일 상태를 비워줍니다.
        setFormData(prev => ({ ...prev, email: '' }));

        // OAuth2 인증 경로로 리다이렉트
        window.location.href = `http://localhost:8080/oauth2/authorization/${provider}`;
    };

    /**
     * [수정] 일반 로그인 핸들러
     * '이메일 기억하기' 저장 로직을 제거했습니다.
     */
    const handleLogin = (e) => {
        if (e) e.preventDefault();

        if (!formData.email || !formData.password) {
            showAlert('입력 오류', '이메일과 비밀번호를 모두 입력해주세요.');
            return;
        }

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
                } else if (result === 'user_not_found') {
                    showAlert('로그인 실패', '존재하지 않는 이메일 계정입니다.');
                } else if (result === 'wrong_password') {
                    showAlert('로그인 실패', '비밀번호가 일치하지 않습니다.');
                } else {
                    showAlert('오류', '로그인에 실패하였습니다. 다시 시도해주세요.');
                }
            } else {
                showAlert('서버 오류', '서버와 통신 중 오류가 발생했습니다.');
            }
        };

        xhr.open('POST', '/user/login');
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
            {(isLoading === true || isSubmitting === true) && (
                <div className="auth-loading-overlay">
                    <div className="loading-spinner"></div>
                    <p className="loading-text">잠시만 기다려 주세요...</p>
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
                                <div className="input-unit">
                                    <label className="auth-label">이메일</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="이메일을 입력해주세요"
                                        className="auth-input"
                                    />
                                </div>
                                <div className="input-unit">
                                    <label className="auth-label">비밀번호</label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        placeholder="비밀번호를 입력해주세요"
                                        className="auth-input"
                                    />
                                </div>

                                {/* [제거] 이메일 기억하기 체크박스 영역을 삭제했습니다. */}

                                <button type="submit" className="btn-primary-black">LOGIN</button>

                                <div className="social-login-group">
                                    <button type="button" className="social-btn kakao" onClick={() => handleSocialLogin('kakao')}>💬</button>
                                    <button type="button" className="social-btn naver" onClick={() => handleSocialLogin('naver')}>N</button>
                                </div>
                            </form>
                        ) : (
                            <form className="auth-form-body" onSubmit={(e) => e.preventDefault()}>
                                <div className="auth-row-group">
                                    <div className="input-unit-flex">
                                        <label className="auth-label">이메일</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            placeholder="이메일을 입력해주세요"
                                            className="auth-input"
                                            disabled={isVerified}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        className="auth-verify-btn auth-btn-align-with-label"
                                        onClick={() => sendVerificationEmail(false)}
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
                                            onClick={() => sendVerificationEmail(true)}
                                            disabled={isVerified || isLoading || isSubmitting}
                                        >
                                            {(isLoading || isSubmitting) ? "재발송 중" : "재전송"}
                                        </button>
                                    )}
                                </div>
                                <div className="input-unit">
                                    <label className="auth-label">차량 번호</label>
                                    <input
                                        type="text"
                                        name="carNumber"
                                        value={formData.carNumber}
                                        onChange={handleInputChange}
                                        placeholder="차량번호를 입력해주세요 (예: 12가 3456)"
                                        className="auth-input"
                                    />
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