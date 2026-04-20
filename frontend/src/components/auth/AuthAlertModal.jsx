import React from 'react';
import deleteIcon from '../../assets/image/modal/Close.png';
import '../mypage/MyPageModal.css'; // 디자인 통일을 위해 기존 CSS 공유

const AuthAlertModal = ({ title, message, onClose }) => {
    return (
        <div className="modal-overlay" onClick={onClose}>
            {/* 디자인 바이브 통일을 위해 LogoutConfirmModal과 동일한
                withdraw-modal 클래스 스타일을 적용합니다.
            */}
            <div className="modal-content withdraw-modal" onClick={(e) => e.stopPropagation()}>

                {/* 상단 회색 헤더: 사진 2와 동일한 구조 */}
                <div className="modal-header-gray">
                    <h2>{title || "알림"}</h2>
                    <button className="modal-close-btn" onClick={onClose}>
                        <img src={deleteIcon} alt="Close" />
                    </button>
                </div>

                {/* 본문 영역: 패딩 및 텍스트 스타일 통일 */}
                <div className="modal-body-pad">
                    <p className="withdraw-desc" style={{ whiteSpace: 'pre-line' }}>
                        {message}
                    </p>

                    <div className="modal-actions-row">
                        {/* 알림창이므로 확인 버튼 하나만 배치하며,
                            너비를 100%로 설정하여 꽉 차게 디자인합니다.
                        */}
                        <button
                            className="btn-confirm-red"
                            style={{
                                backgroundColor: '#333',
                                width: '100%',
                                flex: 'none'
                            }}
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