import React, { useState, useEffect, useRef } from 'react'; // useRef 추가
import deleteIcon from '../../assets/image/modal/Close.png';
import addImageIcon from '../../assets/image/modal/addImage.png';
import useEmailAuth from '../../assets/javascript/useEmailAuth';
import AuthAlertModal from '../../components/auth/AuthAlertModal.jsx';
import './MyPageModal.css';
import '../../auth/Label.css';

const PersonalInfoEditModal = ({ onClose }) => {
    const [newEmail, setNewEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // [추가] 이미지 관련 상태 및 Ref
    const [selectedFile, setSelectedFile] = useState(null); // 서버 전송용
    const [previewUrl, setPreviewUrl] = useState(null);    // 화면 표시용
    const fileInputRef = useRef(null); // input 태그에 직접 접근하기 위함

    const [alertConfig, setAlertConfig] = useState({
        show: false,
        title: '',
        message: '',
        onConfirm: null
    });

    const showAlert = (title, message, onConfirm = null) => {
        setAlertConfig({ show: true, title, message, onConfirm });
    };

    const {
        timeLeft,
        isTimerActive,
        isVerified,
        isLoading,
        formatTime,
        sendVerificationEmail,
        verifyEmailCode
    } = useEmailAuth(newEmail, 'EDIT');

    const isFormValid = isVerified && currentPassword.trim() !== '' && newPassword.trim() !== '';

    // [추가] 박스 클릭 시 숨겨진 input 실행
    const handlePlaceholderClick = () => {
        fileInputRef.current.click();
    };

    // [추가] 파일 선택 시 미리보기 생성
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result); // Base64로 미리보기 이미지 설정
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpdateInfo = () => {
        if (!isFormValid) return;

        setIsSubmitting(true);

        const xhr = new XMLHttpRequest();
        const fd = new FormData();

        // [핵심] 이미지 파일이 있으면 FormData에 추가
        if (selectedFile) {
            fd.append('profileImage', selectedFile);
        }
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
                        {/* [수정 부분] 클릭 이벤트 추가 및 숨겨진 Input 배치 */}
                        <div className="profile-upload-section">
                            <div
                                className="image-placeholder"
                                onClick={handlePlaceholderClick}
                                style={{ cursor: 'pointer', overflow: 'hidden' }}
                            >
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <img src={addImageIcon} alt="Add" className="add-img-icon" />
                                )}
                            </div>
                            {/* 실제 파일 선택창 (숨김 처리) */}
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                style={{ display: 'none' }}
                            />
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