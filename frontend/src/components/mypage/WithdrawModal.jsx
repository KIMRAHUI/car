import React from 'react';
import deleteIcon from '../../assets/image/modal/Close.png';
import './MyPageModal.css';

const WithdrawModal = ({ onClose, onConfirm }) => {
    return (
        <div className="modal-overlay" onClick={onClose}>
            {/* 다른 모달들과 통일감을 위해 withdraw-modal 클래스 적용 */}
            <div className="modal-content withdraw-modal" onClick={(e) => e.stopPropagation()}>

                {/* 상단 회색 헤더 영역 - 디자인 바이브 통일 */}
                <div className="modal-header-gray">
                    <h2>탈퇴 확인</h2>
                    <button className="modal-close-btn" onClick={onClose}>
                        <img src={deleteIcon} alt="Close" />
                    </button>
                </div>

                {/* 본문 영역 - 패딩 처리된 바디 */}
                <div className="modal-body-pad">
                    <h3 className="warning-title">계정 복구 불가 알림</h3>
                    <p className="withdraw-desc">
                        탈퇴 시 계정 복구는 불가능합니다.<br />
                        정말 탈퇴하시겠습니까?
                    </p>

                    <div className="modal-actions-row">
                        <button className="btn-cancel-gray" onClick={onClose}>취소</button>
                        <button className="btn-confirm-red" onClick={onConfirm}>탈퇴</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WithdrawModal;