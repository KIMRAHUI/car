import React from 'react';
import deleteIcon from '../../assets/image/modal/Close.png';
import carIcon from '../../assets/image/modal/car.png';
import userIcon from '../../assets/image/modal/user.png';
import './MyPageModal.css';

const EditChoiceModal = ({ onClose, onSelectVehicle, onSelectPersonal }) => {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content edit-choice-modal" onClick={(e) => e.stopPropagation()}>

                {/* 회색 헤더 영역 */}
                <div className="modal-header-gray">
                    <h2>계정 수정</h2>
                    {/* 닫기 버튼을 헤더 안으로 이동 (CSS에서 절대 위치로 고정) */}
                    <button className="modal-close-btn" onClick={onClose}>
                        <img src={deleteIcon} alt="Close" />
                    </button>
                </div>

                {/* 본문 영역 */}
                <div className="modal-body-pad">
                    <p className="edit-choice-desc">변경할 정보를 선택해 주세요</p>

                    <div className="choice-buttons-col">
                        {/* 차량 정보 변경 버튼 */}
                        <button className="btn-edit-choice" onClick={onSelectVehicle}>
                            <img src={carIcon} alt="차량 아이콘" className="btn-icon-img" />
                            <span>차량 정보 변경하기</span>
                        </button>

                        {/* 개인정보 변경 버튼 */}
                        <button className="btn-edit-choice" onClick={onSelectPersonal}>
                            <img src={userIcon} alt="유저 아이콘" className="btn-icon-img" />
                            <span>개인정보 변경하기</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditChoiceModal;