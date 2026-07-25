import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/header/Header.jsx';
import Footer from '../../components/footer/footer.jsx'
import useEmailAuth from '../../components/common/useEmailAuth';
import AuthAlertModal from '../../components/auth/AuthAlertModal.jsx';
import VehicleEditModal from '../../components/mypage/VehicleEditModal.jsx';
import '../Label.css';
import './register.css';

const Register = () => {
    const navigate = useNavigate();
    const location = useLocation(); // 푸터에서 보낸 state 데이터를 추적하기 위해 선언

    //상태 관리
    const [step, setStep] = useState(1);
    const [emailFocused, setEmailFocused] = useState(false);

    //말풍선 가이드 텍스트 제어 위한 상태
    const [activeTooltip, setActiveTooltip] = useState({
        field: '', // 'name', 'phone', 'password', 'passwordConfirm', 'carNumber'
        visible: false
    });

    //차량 선택 모달 열림 상태
    const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);

    //모달 상태 관리
    const [modalConfig, setModalConfig] = useState({
        show: false,
        title: '',
        message: ''
    });

    const [formData, setFormData] = useState({
        name: "", phone: "", email: "", emailVerify: "",
        password: "", passwordConfirm: "",
        carModel: "",
        carModelId: "",
        carNumber: "", fuelType: "", mileage: "",
        annualMileage: "", drivingEnv: ""
    });

    const emailDomains = ["naver.com", "gmail.com", "hanmail.net"];

    const {
        timeLeft,
        isTimerActive,
        isVerified,
        isLoading,
        count,
        formatTime,
        sendVerificationEmail,
        verifyEmailCode
    } = useEmailAuth(formData.email, 'JOIN');


    // 모달 제어 함수
    const showAlert = (title, message) => setModalConfig({ show: true, title, message });
    const closeModal = () => setModalConfig({ ...modalConfig, show: false });

    // 인풋창 활성화 시 말풍선을 띄우는 함수
    const triggerTooltip = (fieldName) => {
        setActiveTooltip({ field: fieldName, visible: true });
    };


    //마우스가 떠나거나 포커스가 풀렸을 때 말풍선을 지우는 함수
    const hideTooltip = () => {
        setActiveTooltip({ field: '', visible: false });
    };

    // 스텝 단계가 변경될 때 표시되고 있던 말풍선 상태를 초기화
    useEffect(() => {
        hideTooltip();
    }, [step]);

    // 푸터 하단 약관 버튼 클릭 유입 트래킹 및 약관 동의 구역 부드러운 스크롤 인터랙션
    useEffect(() => {
        if (location.state && location.state.scrollTo === 'terms-section') {
            // 회원가입 페이지에 이미 진입한 상태인데 스텝이 다를 경우를 방지하기 위해 스텝 1로 리셋 강제 지정
            setStep(1);

            // 스텝 1 렌더링을 끝내고 엘리먼트를 찾을 수 있도록 미세 비동기 사이클 분리
            setTimeout(() => {
                const termsWrapper = document.getElementById('commit-terms-wrapper');
                if (termsWrapper) {
                    termsWrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 50);
        }
    }, [location]);

        //마우스가 떠나거나 포커스가 풀렸을 때 말풍선을 지우는 함수
        //10회 한도 초과 등 에러 발생 시 알림 모달을 띄움
    const handleSendEmailRequest = async () => {
        const result = await sendVerificationEmail();
        // 발송 실패 시 (네트워크 에러, 10회 한도 초과 등) 메시지 출력
        if (!result.success) {
            showAlert("알림", result.message);
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

    /* 차량 모델 선택 완료 핸들러 */
    const handleVehicleSelect = (brandName, modelName, modelId) => {
        setFormData(prev => ({
            ...prev,
            carModel: `${brandName} ${modelName}`,
            carModelId: modelId
        }));
        setIsVehicleModalOpen(false); // 선택 후 모달 닫기
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

            // 이름 검증
            if (!name || !/^[가-힣a-zA-Z]{2,10}$/.test(name)) {
                showAlert("입력 오류", "이름은 2~10자 이내의 한글 또는 영문으로 입력해주세요.");
                return;
            }

            //핸드폰 번호 검증
            if (!phone || !/^010-\d{3,4}-\d{4}$/.test(phone)) {
                showAlert("입력 오류", "유효한 핸드폰 번호를 입력해주세요.");
                return;
            }

            // 이메일 형식 기본 검증
            if (!email || !/^(?=.{8,50}$)/.test(email)) {
                showAlert("입력 오류", "이메일은 8~50자 사이의 올바른 형식이어야 합니다.");
                return;
            }

            //소셜 연동을 위한 도메인 제한
            const emailDomain = email.split('@')[1];
            const allowedDomains = ["naver.com", "kakao.com", "gmail.com"];

            if (!allowedDomains.includes(emailDomain)) {
                showAlert("도메인 확인", "네이버, 카카오, 구글 계정 중 하나로 가입해 주세요.");
                return;
            }

            //이메일 인증 여부 확인
            if (!isVerified) {
                showAlert("인증 필요", "이메일 인증을 완료해주세요.");
                return;
            }

            //비밀번호 검증
            if (!password || password.length < 6) {
                showAlert("보안 취약", "비밀번호는 최소 6자 이상이어야 합니다.");
                return;
            }

            //비밀번호 일치 확인
            if (password !== passwordConfirm) {
                showAlert("일치 확인", "비밀번호가 서로 일치하지 않습니다.");
                return;
            }
        }
        else if (step === 3) {
            const { carModelId, carNumber, fuelType, mileage } = formData;
            if (!carModelId) {
                showAlert("정보 부족", "차량 모델을 선택해주세요.");
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


    //최종 가입 처리 핸들러
    const handleFinalSubmit = () => {
        const xhr = new XMLHttpRequest();
        const fd = new FormData();


        fd.append('name', formData.name);
        fd.append('email', formData.email);
        fd.append('password', formData.password);
        fd.append('phone', formData.phone.replace(/-/g, ''));
        //텍스트가 서버 보안 검증용 모델 ID 전송
        fd.append('carModelId', formData.carModelId);
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
            {/* count 값에 따른 로딩 텍스트 분기 처리 적용 */}
            {isLoading && (
                <div className="auth-loading-overlay">
                    <div className="loading-spinner"></div>
                    <p className="loading-text">
                        {count > 1
                            ? `인증번호 전송 중... (${count}/10)`
                            : "인증번호 발송 처리 중입니다..."}
                    </p>
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

            {/*[아이디 지정 변경] 푸터 유입 스크롤 포커싱 추적을 위한 DOM Id(commit-terms-wrapper) 하단 래퍼 박스에 부여 */}
            <div className="register-content-area" id="commit-terms-wrapper">
                {step === 1 && (
                    <div className="step-box">
                        <div className="top-guide-box">
                            아래 서비스 이용약관, 개인정보 처리방침 등을 읽어 보신 뒤 회원가입을 진행해 주시기 바랍니다.
                        </div>
                        <div className="terms-section">
                            <h3 className="terms-label">서비스 이용약관</h3>
                            <div className="terms-scroll-viewer">
                                <strong>제 1 조 (목적)</strong><br/>
                                본 약관은 '커밋카(Commit Car)'(이하 "회사")가 제공하는 차량 관리, 정비소 예약 및 위치 기반 정보 서비스(이하 "서비스")의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.<br/><br/>

                                <strong>제 2 조 (용어의 정의)</strong><br/>
                                1. "서비스"란 회사가 구현하는 단말기(PC, 휴대형 단말기 등)와 상관없이 회원이 이용할 수 있는 커밋카 관련 제반 서비스를 의미합니다.<br/>
                                2. "회원"이란 본 약관에 따라 회사와 이용계약을 체결하고 회사가 제공하는 서비스를 이용하는 고객을 말합니다.<br/><br/>

                                <strong>제 3 조 (약관의 게시와 개정)</strong><br/>
                                1. 회사는 본 약관의 내용을 회원이 쉽게 알 수 있도록 서비스 초기 화면에 게시합니다.<br/>
                                2. 회사는 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있으며, 변경된 약관은 적용일자 7일 전부터 서비스 내 공지합니다.
                            </div>
                            <div className="terms-check-row">
                                <input type="checkbox" id="agree1" className="terms-checkbox" />
                                <label htmlFor="agree1">[필수] 커밋카 서비스 이용약관에 동의합니다.</label>
                            </div>
                        </div>
                        <div className="terms-section">
                            <h3 className="terms-label">개인정보 처리 방침</h3>
                            <div className="terms-scroll-viewer">
                                <strong>1. 수집하는 개인정보 항목</strong><br/>
                                회사는 원활한 서비스 제공 및 정비소 예약 처리를 위해 아래와 같은 개인정보를 수집합니다.<br/>
                                - 필수 항목: 이메일 주소(아이디), 비밀번호, 휴대전화번호, 차량 번호, 차량 모델명<br/>
                                - 서비스 이용 과정: 서비스 이용 기록, 접속 로그, 쿠키, 접속 IP 정보, 기기 정보<br/><br/>

                                <strong>2. 개인정보의 수집 및 이용 목적</strong><br/>
                                - 정비소 예약 접수 및 서비스 안내<br/>
                                - 회원 식별 및 부정한 이용 방지<br/>
                                - 고충 처리 및 분쟁 조정, 공지사항 전달<br/><br/>

                                <strong>3. 개인정보의 보유 및 이용 기간</strong><br/>
                                회원은 회원탈퇴를 요청하거나 개인정보의 수집 및 이용에 대한 동의를 철회하는 경우, 해당 정보를 즉시 파기합니다. 단, 관계 법령에 따라 보존할 필요가 있는 경우 해당 기간 동안 보관합니다.
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
                            <div className="input-unit relative-container">
                                <label className="auth-label">이름</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="예시) 김갑수"
                                    className="auth-input"
                                    disabled={isVerified}
                                    onMouseEnter={() => triggerTooltip('name')}
                                    onFocus={() => triggerTooltip('name')}
                                    onMouseLeave={hideTooltip}
                                    onBlur={hideTooltip}
                                />
                                {activeTooltip.field === 'name' && activeTooltip.visible && (
                                    <div className="mini-bubble">한글 또는 영문으로 2~10자 사이로 입력해주세요.</div>
                                )}
                            </div>
                            <div className="input-unit relative-container">
                                <label className="auth-label">핸드폰 번호</label>
                                <input
                                    type="text"
                                    placeholder="예시) 010-1234-5678"
                                    className="auth-input"
                                    value={formData.phone}
                                    onChange={handlePhoneChange}
                                    maxLength="13"
                                    disabled={isVerified}
                                    onMouseEnter={() => triggerTooltip('phone')}
                                    onFocus={() => triggerTooltip('phone')}
                                    onMouseLeave={hideTooltip}
                                    onBlur={hideTooltip}
                                />
                                {activeTooltip.field === 'phone' && activeTooltip.visible && (
                                    <div className="mini-bubble">하이픈(-)을 포함한 올바른 휴대전화 번호를 입력해주세요.</div>
                                )}
                            </div>
                            <div className="input-unit email-group">
                                <div className="auth-row-group">
                                    <div className="input-unit-flex">
                                        <label className="auth-label">이메일</label>
                                        <input type="text" name="email" placeholder="이메일 주소" className="auth-input" value={formData.email} onChange={handleInputChange} disabled={isVerified} onFocus={() => setEmailFocused(true)} onBlur={() => setTimeout(() => setEmailFocused(false), 200)} />
                                    </div>
                                    <button type="button" className="auth-verify-btn auth-btn-align-with-label" onClick={handleSendEmailRequest} disabled={isTimerActive || isVerified || isLoading}>
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
                                    <button type="button" className="auth-verify-btn auth-btn-align-with-label" onClick={handleSendEmailRequest} disabled={isVerified || isLoading}>재 전송</button>
                                )}
                            </div>
                            <div className="input-unit relative-container">
                                <label className="auth-label">비밀번호</label>
                                <input
                                    type="password"
                                    name="password"
                                    placeholder="비밀번호를 입력해주세요"
                                    className="auth-input"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    onMouseEnter={() => triggerTooltip('password')}
                                    onFocus={() => triggerTooltip('password')}
                                    onMouseLeave={hideTooltip}
                                    onBlur={hideTooltip}
                                />
                                {activeTooltip.field === 'password' && activeTooltip.visible && (
                                    <div className="mini-bubble">영문, 숫자, 특수문자를 포함하여 8~16자로 입력해주세요.</div>
                                )}
                            </div>
                            <div className="input-unit relative-container">
                                <label className="auth-label">비밀번호 확인</label>
                                <input
                                    type="password"
                                    name="passwordConfirm"
                                    placeholder="비밀번호를 다시 입력해주세요"
                                    className="auth-input"
                                    value={formData.passwordConfirm}
                                    onChange={handleInputChange}
                                    onMouseEnter={() => triggerTooltip('passwordConfirm')}
                                    onFocus={() => triggerTooltip('passwordConfirm')}
                                    onMouseLeave={hideTooltip}
                                    onBlur={hideTooltip}
                                />
                                {activeTooltip.field === 'passwordConfirm' && activeTooltip.visible && (
                                    <div className="mini-bubble">비밀번호가 일치하는지 확인해 주세요.</div>
                                )}
                            </div>
                        </div>
                        <div className="step-btn-group">
                            <button className="btn-rect-gray" onClick={() => setStep(step - 1)}>이전</button>
                            <button className="btn-rect-gray" onClick={nextStep}>다음</button>
                        </div>
                    </div>
                )}
                {step === 3 && (
                    <div className="step-box">
                        <div className="top-guide-box">정확한 차량 관리를 위해 내 차 정보를 입력해 주세요.</div>
                        <div className="register-form-inner">
                            {/* [수정] 차량 모델 입력창: 클릭 시 모달이 뜨도록 변경 */}
                            <div className="input-unit">
                                <label className="auth-label">차량 모델</label>
                                <input
                                    type="text"
                                    name="carModel"
                                    value={formData.carModel}
                                    placeholder="클릭하여 차량을 선택해 주세요"
                                    className="auth-input"
                                    onClick={() => setIsVehicleModalOpen(true)}
                                    readOnly // 직접 타이핑 방지 (모달 선택 유도)
                                    style={{ cursor: 'pointer' }}
                                />
                            </div>

                            {/* 차량 번호 */}
                            <div className="input-unit relative-container">
                                <label className="auth-label">차량 번호</label>
                                <input
                                    type="text"
                                    name="carNumber"
                                    value={formData.carNumber}
                                    onChange={handleInputChange}
                                    placeholder="12가 1234"
                                    className="auth-input"
                                    onMouseEnter={() => triggerTooltip('carNumber')}
                                    onFocus={() => triggerTooltip('carNumber')}
                                    onMouseLeave={hideTooltip}
                                    onBlur={hideTooltip}
                                />
                                {activeTooltip.field === 'carNumber' && activeTooltip.visible && (
                                    <div className="mini-bubble">올바른 차량번호 형식으로 입력해주세요. (예: 12가 3456)</div>
                                )}
                            </div>

                            {/* 연료 타입 */}
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
                                <input type="text" name="mileage" placeholder="예: 52,100km" className="auth-input" value={formData.mileage} onChange={handleMileageChange} onBlur={handleMileageBlur} onFocus={handleMileageFocus} />
                            </div>

                            <div className="input-unit">
                                <label className="auth-label">연간 예상 주행거리</label>
                                <select name="annualMileage" value={formData.annualMileage} onChange={handleInputChange} className="auth-input">
                                    <option value="">선택해주세요</option>
                                    <option value="10000">10,000km 미만</option>
                                    <option value="15000">10,000km ~ 20,000km</option>
                                    <option value="25000">20,000km 이상</option>
                                </select>
                            </div>

                            <div className="input-unit">
                                <label className="auth-label">주행 환경</label>
                                <select name="drivingEnv" value={formData.drivingEnv} onChange={handleInputChange} className="auth-input">
                                    <option value="">선택해주세요</option>
                                    <option value="CITY">도심 위주 (정체 구간 많음)</option>
                                    <option value="HIGHWAY">고속도로 위주 (장거리 주행)</option>
                                    <option value="MIXED">복합 주행</option>
                                </select>
                            </div>
                        </div>
                        <div className="step-btn-group">
                            <button className="btn-rect-gray" onClick={() => setStep(step - 1)}>이전</button>
                            <button className="btn-rect-gray" onClick={nextStep}>다음</button>
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

            {/* 차량 선택 모달 렌더링 */}
            {isVehicleModalOpen && (
                <VehicleEditModal
                    onClose={() => setIsVehicleModalOpen(false)}
                    onSelectComplete={handleVehicleSelect}
                    isRegisterMode={true}
                />
            )}

            {/* 커스텀 알림 모달 렌더링 */}
            {modalConfig.show && (
                <AuthAlertModal
                    title={modalConfig.title}
                    message={modalConfig.message}
                    onClose={closeModal}
                    onConfirm={closeModal}
                />
            )}
            <Footer />
        </div>
    );
};

export default Register;