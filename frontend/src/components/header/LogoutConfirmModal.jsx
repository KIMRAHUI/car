import React from 'react';
import deleteIcon from '../../assets/image/modal/Close.png';
import '../mypage/MyPageModal.css';

const LogoutConfirmModal = ({ onClose, onConfirm }) => {
    return (
        <div className="modal-overlay" onClick={onClose}>
            {/* 디자인 바이브 통일: withdraw-modal 클래스 스타일 재사용 */}
            <div className="modal-content withdraw-modal" onClick={(e) => e.stopPropagation()}>

                {/*헤더 */}
                <div className="modal-header-gray">
                    <h2>로그아웃 확인</h2>
                    <button className="modal-close-btn" onClick={onClose}>
                        <img src={deleteIcon} alt="Close" />
                    </button>
                </div>

                {/* 본문*/}
                <div className="modal-body-pad">
                    <p className="withdraw-desc">
                        정말 로그아웃 하시겠습니까?<br />
                        로그아웃 시 메인 페이지로 이동합니다.
                    </p>

                    <div className="modal-actions-row">
                        <button className="btn-cancel-gray" onClick={onClose}>취소</button>
                        {/* 확인 강조 */}
                        <button
                            className="btn-confirm-red"
                            style={{ backgroundColor: '#333' }}
                            onClick={onConfirm}
                        >
                            확인
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LogoutConfirmModal;