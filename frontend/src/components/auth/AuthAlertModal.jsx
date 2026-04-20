import React from 'react';
import deleteIcon from '../../assets/image/modal/Close.png';
import '../mypage/MyPageModal.css'; // 디자인 통일을 위해 기존 CSS 공유

const AuthAlertModal = ({ title, message, onClose }) => {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content withdraw-modal" onClick={(e) => e.stopPropagation()}>

                {/* 상단 회색 헤더 */}
                <div className="modal-header-gray">
                    <h2>{title || "알림"}</h2>
                    <button className="modal-close-btn" onClick={onClose}>
                        <img src={deleteIcon} alt="Close" />
                    </button>
                </div>

                {/* 본문 영역 */}
                <div className="modal-body-pad">
                    <p className="withdraw-desc" style={{ whiteSpace: 'pre-line' }}>
                        {message}
                    </p>

                    <div className="modal-actions-row">
                        <button
                            className="btn-confirm-red"
                            style={{ backgroundColor: '#333', width: '100%', flex: 'none' }}
                            onClick={onClose}
                        >
                            확인
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthAlertModal;