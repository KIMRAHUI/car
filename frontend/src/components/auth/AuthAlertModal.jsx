import React from 'react';
import deleteIcon from '../../assets/image/modal/Close.png';
import '../mypage/MyPageModal.css';

const AuthAlertModal = ({ title, message, onClose, onConfirm, showCancel }) => {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content withdraw-modal" onClick={(e) => e.stopPropagation()}>

                <div className="modal-header-gray">
                    <h2>{title || "알림"}</h2>
                    <button className="modal-close-btn" onClick={onClose}>
                        <img src={deleteIcon} alt="Close" />
                    </button>
                </div>

                <div className="modal-body-pad">
                    <p className="withdraw-desc" style={{ whiteSpace: 'pre-line' }}>
                        {message}
                    </p>

                    <div className="modal-actions-row">
                        {/* showCancel prop이 true일 때만 '취소' 버튼을 보여줌 */}
                        {showCancel && (
                            <button
                                className="btn-cancel-gray"
                                onClick={onClose} // 취소 버튼은 onClose 실행
                            >
                                취소
                            </button>
                        )}

                        <button
                            className="btn-confirm-red"
                            style={{
                                backgroundColor: '#333',
                                // 버튼이 하나일 때(알림)는 가로 전체, 두 개일 때(확인/취소)는 가변 너비
                                width: !showCancel ? '100%' : 'auto',
                                flex: !showCancel ? 'none' : '1'
                            }}
                            onClick={onConfirm} // 확인 버튼은 onConfirm 실행
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