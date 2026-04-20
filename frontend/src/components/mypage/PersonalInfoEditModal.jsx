import React, { useState, useEffect } from 'react';
import deleteIcon from '../../assets/image/modal/Close.png';
import addImageIcon from '../../assets/image/modal/addImage.png';
import './MyPageModal.css';
import '../../auth/Label.css';

const PersonalInfoEditModal = ({ onClose }) => {
    const [timer, setTimer] = useState(180);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [resendCount, setResendCount] = useState(0);
    const [newEmail, setNewEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');

    useEffect(() => {
        let interval = null;
        if (isTimerRunning && timer > 0) {
            interval = setInterval(() => setTimer(prev => prev - 1), 1000);
        } else if (timer === 0) {
            clearInterval(interval);
            setIsTimerRunning(false);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning, timer]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `*인증가능시간 ${String(m).padStart(2, '0')} : ${String(s).padStart(2, '0')}`;
    };

    const handleSendCode = () => {
        if (!newEmail) return alert("이메일 주소를 입력해 주세요.");
        setTimer(180);
        setIsTimerRunning(true);
        setResendCount(0);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content personal-edit-modal" onClick={(e) => e.stopPropagation()}>

                {/* 상단 회색 헤더 */}
                <div className="modal-header-gray">
                    <h2>계정 수정</h2>
                    <button className="modal-close-btn" onClick={onClose}>
                        <img src={deleteIcon} alt="Close" />
                    </button>
                </div>

                <div className="modal-body-scroll">
                    {/* 프로필 사진 영역 */}
                    <div className="profile-upload-section">
                        <div className="image-placeholder">
                            <img src={addImageIcon} alt="Add" className="add-img-icon" />
                        </div>
                        <p className="upload-guide">*프로필 사진을 선택해주세요</p>
                    </div>

                    {/* 이메일 변경 섹션 */}
                    <div className="edit-section">
                        <label className="auth-label">이메일 변경</label>
                        <div className="input-with-btn">
                            <input
                                type="email"
                                className="auth-input"
                                placeholder="이메일 주소"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                            />
                            <button className="auth-verify-btn" onClick={handleSendCode}>인증번호</button>
                        </div>

                        <div className="input-with-btn">
                            <input
                                type="text"
                                className="auth-input"
                                placeholder="인증번호 6자리"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                            />
                            <button className="auth-verify-btn red-bg" onClick={() => {/* 재전송 로직 */}}>재 전 송</button>
                        </div>
                        <p className="timer-text">{formatTime(timer)}</p>
                    </div>

                    {/* 비밀번호 변경 섹션 */}
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

                    {/* 하단 확인 버튼 */}
                    <button className="btn-primary-gray" onClick={() => {/* 최종 확인 */}}>
                        확인
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PersonalInfoEditModal;