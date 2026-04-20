import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/header/Header.jsx';
import useEmailAuth from '../../assets/javascript/useEmailAuth';
import AuthAlertModal from '../../components/auth/AuthAlertModal.jsx';
import '../Label.css';
import './register.css';

const Register = () => {
    const navigate = useNavigate();

    /* --- 상태 관리 --- */
    const [step, setStep] = useState(1);
    const [emailFocused, setEmailFocused] = useState(false);

    // [추가] 모달 상태 관리
    const [modalConfig, setModalConfig] = useState({
        show: false,
        title: '',
        message: ''
    });

    const [formData, setFormData] = useState({
        name: "", phone: "", email: "", emailVerify: "",
        password: "", passwordConfirm: "", carModel: "",
        carNumber: "", fuelType: "", mileage: "",
        annualMileage: "", drivingEnv: ""
    });

    const emailDomains = ["naver.com", "gmail.com", "kakao.com", "hanmail.net"];

    /* --- 보완된 인증 훅 연결 --- */
    const {
        timeLeft, isTimerActive, isVerified, isLoading,
        formatTime, sendVerificationEmail, verifyEmailCode
    } = useEmailAuth(formData.email, 'JOIN');

    // 모달 제어 함수
    const showAlert = (title, message) => setModalConfig({ show: true, title, message });
    const closeModal = () => setModalConfig({ ...modalConfig, show: false });

    /* --- [추가] 훅의 결과를 받아 모달을 띄우는 핸들러 --- */
    const handleSendEmail = async (isRetry = false) => {
        const result = await sendVerificationEmail(isRetry);
        if (result.success) {
            showAlert("발송 완료", result.message);
        } else {
            showAlert("발송 실패", result.message);
        }
    };

    const handleVerifyCode = async () => {
        const result = await verifyEmailCode(formData.emailVerify);
        if (result.success) {
            showAlert("인증 성공", result.message);
        } else {
            showAlert("인증 실패", result.message);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePhoneChange = (e) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        let formattedValue = "";
        if (value.length < 4) formattedValue = value;
        else if (value.length < 7) formattedValue = `${value.slice(0, 3)}-${value.slice(3)}`;
        else if (value.length < 11) formattedValue = `${value.slice(0, 3)}-${value.slice(3, 6)}-${value.slice(6)}`;
        else formattedValue = `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7, 11)}`;
        setFormData(prev => ({ ...prev, phone: formattedValue }));
    };

    const handleMileageChange = (e) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        const formattedValue = value.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        setFormData(prev => ({ ...prev, mileage: formattedValue }));
    };

    const handleMileageBlur = () => {
        if (formData.mileage && !formData.mileage.includes('km')) {
            setFormData(prev => ({ ...prev, mileage: `${prev.mileage} km` }));
        }
    };

    const handleMileageFocus = () => {
        setFormData(prev => ({ ...prev, mileage: prev.mileage.replace(/ km/g, '') }));
    };

    const handleEmailClick = (domain) => {
        const id = formData.email.split('@')[0];
        setFormData(prev => ({ ...prev, email: `${id}@${domain}` }));
        setEmailFocused(false);
    };

    const nextStep = () => {
        if (step === 1) {
            const agree1 = document.getElementById('agree1').checked;
            const agree2 = document.getElementById('agree2').checked;
            if (!agree1 || !agree2) {
                showAlert("약관 동의", "필수 약관에 모두 동의하셔야 합니다.");
                return;
            }
        }
        else if (step === 2) {
            const { name, phone, email, password, passwordConfirm } = formData;
            if (!name || !/^[가-힣a-zA-Z]{2,10}$/.test(name)) {
                showAlert("입력 오류", "이름은 2~10자 이내의 한글 또는 영문으로 입력해주세요.");
                return;
            }
            if (!phone || !/^010-\d{3,4}-\d{4}$/.test(phone)) {
                showAlert("입력 오류", "유효한 핸드폰 번호를 입력해주세요.");
                return;
            }
            if (!email || !/^(?=.{8,50}$)/.test(email)) {
                showAlert("입력 오류", "이메일은 8~50자 사이의 올바른 형식이어야 합니다.");
                return;
            }
            if (!isVerified) {
                showAlert("인증 필요", "이메일 인증을 완료해주세요.");
                return;
            }
            if (!password || password.length < 6) {
                showAlert("보안 취약", "비밀번호는 최소 6자 이상이어야 합니다.");
                return;
            }
            if (password !== passwordConfirm) {
                showAlert("일치 확인", "비밀번호가 서로 일치하지 않습니다.");
                return;
            }
        }
        else if (step === 3) {
            const { carModel, carNumber, fuelType, mileage } = formData;
            if (!carModel) {
                showAlert("정보 부족", "차량 모델을 입력해주세요.");
                return;
            }
            if (!carNumber || !/^\d{2,3}[가-힣]\d{4}$/.test(carNumber.replace(/\s/g, ''))) {
                showAlert("번호판 확인", "차량 번호 형식이 올바르지 않습니다. (예: 12가 3456)");
                return;
            }
            if (!fuelType) {
                showAlert("연료 선택", "연료 타입을 선택해주세요.");
                return;
            }
            if (!mileage) {
                showAlert("주행거리 확인", "현재 주행거리를 입력해주세요.");
                return;
            }
            handleFinalSubmit();
            return;
        }
        setStep(step + 1);
        window.scrollTo(0, 0);
    };

    const handleFinalSubmit = () => {
        const xhr = new XMLHttpRequest();
        const fd = new FormData();
        fd.append('name', formData.name);
        fd.append('email', formData.email);
        fd.append('password', formData.password);
        fd.append('phone', formData.phone.replace(/-/g, ''));
        fd.append('carModel', formData.carModel);
        fd.append('carNumber', formData.carNumber);
        fd.append('fuelType', formData.fuelType);
        fd.append('mileage', formData.mileage.replace(/[^0-9]/g, ''));
        fd.append('annualMileage', formData.annualMileage);
        fd.append('drivingEnv', formData.drivingEnv);

        xhr.onreadystatechange = () => {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status >= 200 && xhr.status < 400) {
                    const response = JSON.parse(xhr.responseText);
                    if (response.result === 'success') {
                        setStep(4);
                    } else if (response.result === 'duplicate_email') {
                        showAlert("중복 계정", "이미 사용 중인 이메일입니다.\n다른 이메일을 사용하거나 로그인을 진행해 주세요.");
                        setStep(2);
                    } else {
                        showAlert("가입 실패", "회원가입 중 오류가 발생했습니다: " + response.result);
                    }
                } else {
                    showAlert("서버 오류", "서버 연결에 실패했습니다.");
                }
            }
        };
        xhr.open('POST', '/user/register');
        xhr.send(fd);
    };

    return (
        <div className="register-page-container">
            {isLoading && (
                <div className="auth-loading-overlay">
                    <div className="loading-spinner"></div>
                    <p className="loading-text">잠시만 기다려 주세요...</p>
                </div>
            )}

            <div className="auth-header-layer">
                <Header isBlack={true} />
            </div>

            <div className="register-top-section">
                <h1 className="register-main-title">REGISTER</h1>
                <div className="step-indicator-group">
                    {[
                        { s: 1, t: "이용약관" }, { s: 2, t: "개인정보입력" },
                        { s: 3, t: "차량정보입력" }, { s: 4, t: "가입완료" }
                    ].map((item) => (
                        <div key={item.s} className={`step-item ${step === item.s ? 'active' : ''}`}>
                            <span className="step-num">{item.s}</span> {item.t}
                        </div>
                    ))}
                </div>
            </div>

            <div className="register-content-area">
                {step === 1 && (
                    <div className="step-box">
                        <div className="top-guide-box">
                            아래 서비스 이용약관, 개인정보 처리방침 등을 읽어 보신 뒤 회원가입을 진행해 주시기 바랍니다.
                        </div>
                        <div className="terms-section">
                            <h3 className="terms-label">서비스 이용약관</h3>
                            <div className="terms-scroll-viewer">
                                <strong>제 1 조 (목적)</strong><br/>이 약관은 본 사이트(이하 "회사")가 제공하는 차량 관리 서비스 및 관련 제반 서비스의 이용과 관련하여 회사와 회원과의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.<br/><br/>
                                <strong>제 2 조 (용어의 정의)</strong><br/>... (생략 없음)
                            </div>
                            <div className="terms-check-row">
                                <input type="checkbox" id="agree1" className="terms-checkbox" />
                                <label htmlFor="agree1">[필수] 위 서비스 이용약관을 읽어보았으며 이해하였고 동의합니다.</label>
                            </div>
                        </div>
                        <div className="terms-section">
                            <h3 className="terms-label">개인정보 처리 방침</h3>
                            <div className="terms-scroll-viewer">
                                <strong>1. 수집하는 개인정보 항목</strong><br/>이름, 휴대전화번호, 이메일, 차량정보 등...
                            </div>
                            <div className="terms-check-row">
                                <input type="checkbox" id="agree2" className="terms-checkbox" />
                                <label htmlFor="agree2">[필수] 위 개인 정보 처리 방침을 읽어보았으며 이해하였고 동의합니다.</label>
                            </div>
                        </div>
                        <div className="step-btn-group">
                            <button className="btn-rect-gray" onClick={() => navigate('/login')}>취소</button>
                            <button className="btn-rect-gray" onClick={nextStep}>다음</button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="step-box">
                        <div className="top-guide-box">이메일 인증을 진행해 주세요.</div>
                        <div className="register-form-inner">
                            <div className="input-unit">
                                <label className="auth-label">이름</label>
                                <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="예시) 김갑수" className="auth-input" disabled={isVerified} />
                            </div>
                            <div className="input-unit">
                                <label className="auth-label">핸드폰 번호</label>
                                <input type="text" placeholder="예시) 010-1234-5678" className="auth-input" value={formData.phone} onChange={handlePhoneChange} maxLength="13" disabled={isVerified} />
                            </div>
                            <div className="input-unit email-group">
                                <div className="auth-row-group">
                                    <div className="input-unit-flex">
                                        <label className="auth-label">이메일</label>
                                        <input type="text" name="email" placeholder="이메일 주소" className="auth-input" value={formData.email} onChange={handleInputChange} disabled={isVerified} onFocus={() => setEmailFocused(true)} onBlur={() => setTimeout(() => setEmailFocused(false), 200)} />
                                    </div>
                                    {/* [수정] 직접 훅의 함수 대신 handleSendEmail 호출 */}
                                    <button type="button" className="auth-verify-btn auth-btn-align-with-label" onClick={() => handleSendEmail(false)} disabled={isTimerActive || isVerified || isLoading}>
                                        {isLoading ? "발송 중" : "인증번호"}
                                    </button>
                                </div>
                                {emailFocused && (
                                    <div className="email-autocomplete-box">
                                        {emailDomains.map(domain => (
                                            <div key={domain} className="domain-option" onMouseDown={() => handleEmailClick(domain)}>
                                                {formData.email.split('@')[0]}@{domain}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="auth-row-group">
                                <div className="input-unit-flex">
                                    <label className="auth-label">이메일 인증번호</label>
                                    <input type="text" name="emailVerify" value={formData.emailVerify} onChange={handleInputChange} maxLength="6" placeholder="인증번호 6자리" className="auth-input" disabled={isVerified} />
                                    <p className="helper-text" style={{ color: isVerified ? '#00c853' : '#e74c3c' }}>
                                        {isVerified ? '*이메일 인증이 완료되었습니다.' : `*인증가능시간 ${formatTime()}`}
                                    </p>
                                </div>
                                {formData.emailVerify.length === 6 && !isVerified ? (
                                    <button type="button" className="auth-verify-btn auth-btn-align-with-label" style={{ backgroundColor: '#1a1a1a', color: '#fff' }} onClick={handleVerifyCode} disabled={isLoading}>확인</button>
                                ) : (
                                    <button type="button" className="auth-verify-btn auth-btn-align-with-label" onClick={() => handleSendEmail(true)} disabled={isVerified || isLoading}>재 전송</button>
                                )}
                            </div>
                            <div className="input-unit">
                                <label className="auth-label">비밀번호</label>
                                <input type="password" name="password" placeholder="비밀번호를 입력해주세요" className="auth-input" value={formData.password} onChange={handleInputChange} />
                            </div>
                            <div className="input-unit">
                                <label className="auth-label">비밀번호 확인</label>
                                <input type="password" name="passwordConfirm" placeholder="비밀번호를 다시 입력해주세요" className="auth-input" value={formData.passwordConfirm} onChange={handleInputChange} />
                            </div>
                        </div>
                        <div className="step-btn-group">
                            <div className="right-btns">
                                <button className="btn-rect-gray" onClick={() => setStep(1)}>이전</button>
                                <button className="btn-rect-gray" onClick={nextStep}>다음</button>
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="step-box">
                        <div className="top-guide-box">정확한 차량 관리를 위해 내 차 정보를 입력해 주세요.</div>
                        <div className="register-form-inner">
                            <div className="input-unit">
                                <label className="auth-label">차량 모델</label>
                                <input type="text" name="carModel" value={formData.carModel} onChange={handleInputChange} placeholder="아반떼N" className="auth-input" />
                            </div>
                            <div className="input-unit">
                                <label className="auth-label">차량 번호</label>
                                <input type="text" name="carNumber" value={formData.carNumber} onChange={handleInputChange} placeholder="12가 1234" className="auth-input" />
                            </div>
                            <div className="input-unit">
                                <label className="auth-label">연료 타입</label>
                                <div className="radio-selection-group">
                                    {["가솔린", "디젤", "하이브리드", "전기차(EV)"].map((fuel) => (
                                        <label key={fuel}>
                                            <input type="radio" name="fuelType" value={fuel} checked={formData.fuelType === fuel} onChange={handleInputChange} /> {fuel}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="input-unit">
                                <label className="auth-label">현재 계기판 주행거리</label>
                                <input type="text" placeholder="예: 52,100km" className="auth-input" value={formData.mileage} onChange={handleMileageChange} onBlur={handleMileageBlur} onFocus={handleMileageFocus} />
                            </div>
                        </div>
                        <div className="step-btn-group">
                            <div className="right-btns">
                                <button className="btn-rect-gray" onClick={() => setStep(2)}>이전</button>
                                <button className="btn-rect-gray" onClick={nextStep}>다음</button>
                            </div>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="step-box complete-step">
                        <div className="complete-banner">감사합니다. 회원가입에 성공하였습니다</div>
                        <button className="btn-rect-gray" onClick={() => navigate('/login')}>로그인</button>
                    </div>
                )}
            </div>

            {/* 커스텀 알림 모달 렌더링 */}
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

export default Register;