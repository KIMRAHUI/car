import React, { useState, useEffect } from 'react';
import deleteIcon from '../../assets/image/modal/Close.png';
import addImageIcon from '../../assets/image/modal/addImage.png';
import useEmailAuth from '../../assets/javascript/useEmailAuth';
import AuthAlertModal from '../../components/auth/AuthAlertModal.jsx'; // [추가] 커스텀 모달 임포트
import './MyPageModal.css';
import '../../auth/Label.css';

const PersonalInfoEditModal = ({ onClose }) => {
    const [newEmail, setNewEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    //커스텀 모달 상태 관리
    const [alertConfig, setAlertConfig] = useState({
        show: false,
        title: '',
        message: '',
        onConfirm: null
    });

    // 커스텀 알림 호출 도우미
    const showAlert = (title, message, onConfirm = null) => {
        setAlertConfig({ show: true, title, message, onConfirm });
    };

    // 이메일 인증 훅
    const {
        timeLeft,
        isTimerActive,
        isVerified,
        isLoading,
        formatTime,
        sendVerificationEmail,
        verifyEmailCode
    } = useEmailAuth(newEmail, 'EDIT');

    // 버튼 활성화 조건 체크 (이메일 인증 완료 && 모든 필드 입력)
    const isFormValid = isVerified && currentPassword.trim() !== '' && newPassword.trim() !== '';

    /**
     * 서버 DB 업데이트 호출 함수
     */
    const handleUpdateInfo = () => {
        if (!isFormValid) return; // 버튼 비활성화 상태면 실행 안함

        setIsSubmitting(true);

        const xhr = new XMLHttpRequest();
        const fd = new FormData();

        /**
         * [500 에러 해결 핵심]
         * UserMapper.xml의 updateUserInfo는 phone 등 모든 필드를 업데이트합니다.
         * 프론트에서 password만 보내면 phone이 null이 되어 DB 에러가 발생하므로,
         * 백엔드 MyPageController에서 기존 유저 정보를 로드하여 병합하는 처리가 반드시 필요합니다.
         */
        fd.append('email', newEmail);
        fd.append('password', newPassword);
        fd.append('currentPassword', currentPassword);

        xhr.onreadystatechange = () => {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                setIsSubmitting(false);

                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const response = JSON.parse(xhr.responseText);

                        if (response.result === 'success') {
                            // 브라우저 alert 대신 커스텀 모달 실행
                            showAlert(
                                "수정 완료",
                                "개인정보가 성공적으로 변경되었습니다.\n안전한 이용을 위해 다시 로그인해 주세요.",
                                () => { window.location.href = "/user/logout"; }
                            );
                        } else if (response.result === 'wrong_password') {
                            showAlert("수정 실패", "기존 비밀번호가 일치하지 않습니다.");
                        } else {
                            showAlert("수정 실패", response.message || "정보 수정에 실패했습니다.");
                        }
                    } catch (e) {
                        showAlert("오류", "데이터 처리 중 오류가 발생했습니다.");
                    }
                } else {
                    showAlert("서버 오류", "서버 연결에 실패했습니다. (코드: " + xhr.status + ")");
                }
            }
        };

        xhr.open('POST', '/mypage/update');
        xhr.withCredentials = true;
        xhr.send(fd);
    };

    return (
        <>
            {/* 기존 개인정보 수정 모달 레이어 */}
            <div className="modal-overlay" onClick={onClose}>
                {(isLoading || isSubmitting) && (
                    <div className="auth-loading-overlay">
                        <div className="loading-spinner"></div>
                        <p className="loading-text">처리 중입니다...</p>
                    </div>
                )}

                <div className="modal-content personal-edit-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header-gray">
                        <h2>계정 수정</h2>
                        <button className="modal-close-btn" onClick={onClose}>
                            <img src={deleteIcon} alt="Close" />
                        </button>
                    </div>

                    <div className="modal-body-scroll">
                        <div className="profile-upload-section">
                            <div className="image-placeholder">
                                <img src={addImageIcon} alt="Add" className="add-img-icon" />
                            </div>
                            <p className="upload-guide">*프로필 사진을 선택해주세요</p>
                        </div>

                        <div className="edit-section">
                            <label className="auth-label">이메일 변경</label>
                            <div className="input-with-btn">
                                <input
                                    type="email"
                                    className="auth-input"
                                    placeholder="이메일 주소"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    disabled={isVerified}
                                />
                                <button
                                    className="auth-verify-btn"
                                    onClick={() => sendVerificationEmail(false)}
                                    disabled={isLoading || isTimerActive || isVerified || isSubmitting}
                                >
                                    {isVerified ? "인증완료" : "인증번호"}
                                </button>
                            </div>

                            <div className="input-with-btn">
                                <input
                                    type="text"
                                    className="auth-input"
                                    placeholder="인증번호 6자리"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value)}
                                    disabled={isVerified}
                                    maxLength={6}
                                />
                                <button
                                    className="auth-verify-btn red-bg"
                                    onClick={() => {
                                        if (verificationCode.length === 6) {
                                            verifyEmailCode(verificationCode);
                                        } else {
                                            sendVerificationEmail(true);
                                        }
                                    }}
                                    disabled={isLoading || isVerified || isSubmitting}
                                >
                                    {verificationCode.length === 6 && !isVerified ? "확인" : "재 전 송"}
                                </button>
                            </div>
                            <p className="timer-text" style={{ color: isVerified ? '#00c853' : '#e74c3c' }}>
                                {isVerified ? "*인증이 완료되었습니다" : `*인증가능시간 ${formatTime()}`}
                            </p>
                        </div>

                        <div className="edit-section">
                            <label className="auth-label">비밀번호 변경</label>
                            <input
                                type="password"
                                className="auth-input mb-10"
                                placeholder="기존 비밀번호"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                            />
                            <p className="helper-info">*비밀번호는 이메일 인증번호 입력 후 변경 가능합니다.</p>
                            <input
                                type="password"
                                className="auth-input"
                                placeholder="변경 비밀번호"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                        </div>

                        {/* 조건 충족 시 배경색 변경 (isFormValid 값에 따라 클래스 분기) */}
                        <button
                            className={`btn-primary-gray ${isFormValid ? 'active-black' : ''}`}
                            onClick={handleUpdateInfo}
                            disabled={isLoading || isSubmitting || !isFormValid}
                        >
                            확인
                        </button>
                    </div>
                </div>
            </div>

            {/* 커스텀 알림 모달을 오버레이 바깥 최상단으로 분리 */}
            {alertConfig.show && (
                <AuthAlertModal
                    title={alertConfig.title}
                    message={alertConfig.message}
                    onClose={() => {
                        const confirmAction = alertConfig.onConfirm;
                        setAlertConfig(prev => ({ ...prev, show: false }));
                        if (confirmAction) confirmAction();
                    }}
                />
            )}
        </>
    );
};

export default PersonalInfoEditModal;