import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import deleteIcon from '../../assets/image/modal/Close.png';
import starFull from '../../assets/image/modal/Star.png';
import starEmpty from '../../assets/image/modal/emptyStar.png';
import addImgIcon from '../../assets/image/modal/addImage.png';

// 공통 알림 모달 임포트
import AuthAlertModal from '../auth/AuthAlertModal.jsx';

import './MyPageModal.css';

/**
 * ReviewModal 컴포넌트
 * @param {Function} onClose - 모달 닫기 함수
 * @param {Object} reservation - 선택된 예약 정보
 * @param {string} userEmail - 사용자 이메일
 * @param {Function} onSuccess - 성공 시 목록 갱신 콜백
 * @param {number} currentTotalKm - 데이터 무결성 검사용 현재 누적 주행거리
 */
const ReviewModal = ({ onClose, reservation, userEmail, onSuccess, currentTotalKm }) => {

    // 1. 상태 관리
    const [rating, setRating] = useState(4);
    const [mileage, setMileage] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);
    const [imageFiles, setImageFiles] = useState([null, null]);
    const [previews, setPreviews] = useState([null, null]);

    // 공통 알림 모달 상태
    const [alertConfig, setAlertConfig] = useState({
        show: false,
        title: '',
        message: '',
        onConfirm: null
    });

    const fileInputRef = useRef(null);
    const currentSlotIdx = useRef(0);

    const isEditMode = !!reservation.reviewId;

    const tags = [
        "친절한 설명", "꼼꼼한 수리", "합리적인 가격", "정직한 점검",
        "부족한 설명", "아쉬운 응대", "부담스러운 가격", "긴 정비 시간"
    ];

    const showAlert = (title, message, onConfirm = null) => {
        setAlertConfig({ show: true, title, message, onConfirm });
    };

    // [Lifecycle] 수정 모드 시 기존 데이터 로드
    useEffect(() => {
        if (isEditMode) {
            axios.get(`/api/review/${reservation.reviewId}`)
                .then(res => {
                    const data = res.data;
                    setRating(data.rating);
                    setMileage(data.mileage);
                    setSelectedTags(data.selectedTags || []);
                    setPreviews([
                        data.image1 ? `http://localhost:8080${data.image1}` : null,
                        data.image2 ? `http://localhost:8080${data.image2}` : null
                    ]);
                })
                .catch(err => console.error("기존 후기 로드 실패:", err));
        }
    }, [isEditMode, reservation.reviewId]);

    const handleSlotClick = (idx) => {
        currentSlotIdx.current = idx;
        fileInputRef.current.click();
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const idx = currentSlotIdx.current;
        const newFiles = [...imageFiles];
        newFiles[idx] = file;
        setImageFiles(newFiles);

        const newPreviews = [...previews];
        if (newPreviews[idx] && !newPreviews[idx].startsWith('http')) {
            URL.revokeObjectURL(newPreviews[idx]);
        }
        newPreviews[idx] = URL.createObjectURL(file);
        setPreviews(newPreviews);
        e.target.value = '';
    };

    // ---------------------------------------------------------
    // [개선] 후기 공유/수정 처리 (무결성 차단 및 공통 모달 적용)
    // ---------------------------------------------------------
    const handleConfirm = () => {
        const inputMileage = Number(mileage);
        const prevMileage = Number(currentTotalKm);

        // [검증 1] 필수 입력 체크
        if (!mileage || inputMileage <= 0) {
            showAlert("입력 오류", "정확한 현재 주행 km를 입력해주세요.");
            return;
        }

        // [검증 2] 주행거리 역행 시 'AuthAlertModal'을 통한 강제 보정 안내
        if (prevMileage > 0 && inputMileage < prevMileage) {
            showAlert(
                "주행거리 확인",
                `입력하신 거리(${inputMileage}km)가\n예전 기록(${prevMileage}km)보다 낮습니다.\n\n이전 기록인\n'${prevMileage}km'로 안전하게 유지해 드리겠습니다.\n\n정확한 맞춤 점검을 위해 꼭 확인해 주세요!`,
                () => {
                    // 유저가 확인을 누르면 보정된 값으로 저장 프로세스 진행
                    setMileage(prevMileage);
                    executeSubmit(prevMileage);
                }
            );
            return;
        }

        // 정상적인 수치일 경우 즉시 제출
        executeSubmit(inputMileage);
    };

    // 실제 서버 전송 로직 분리
    const executeSubmit = (targetMileage) => {
        const formData = new FormData();
        if (isEditMode) formData.append('id', reservation.reviewId);
        formData.append('reservationId', reservation.id);
        formData.append('userEmail', userEmail);
        formData.append('rating', rating);
        formData.append('mileage', targetMileage);

        selectedTags.forEach(tag => formData.append('selectedTags', tag));
        imageFiles.forEach(file => { if (file) formData.append('images', file); });

        // 403 Forbidden 에러 대응을 위해 POST 메서드 엔드포인트 유지
        const apiUrl = isEditMode ? '/api/review/update' : '/api/review/register';

        axios.post(apiUrl, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            withCredentials: true
        })
            .then(res => {
                if (res.data === 'success') {
                    showAlert(
                        "처리 완료",
                        isEditMode ? "후기가 수정되었습니다." : "후기가 공유되었습니다.",
                        () => {
                            if (onSuccess) onSuccess();
                            onClose();
                        }
                    );
                } else {
                    showAlert("처리 실패", "데이터 처리 중 오류가 발생했습니다.");
                }
            })
            .catch(err => {
                console.error("Review Submit Error:", err);
                showAlert("서버 오류", "서버 통신 중 오류가 발생했습니다. 보안 설정을 확인해주세요.");
            });
    };

    const handleTagClick = (tag) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter(t => t !== tag));
        } else {
            setSelectedTags([...selectedTags, tag]);
        }
    };

    const getRatingText = (num) => {
        const texts = { 5: "5점 (최고예요!)", 4: "4점 (매우 만족)", 3: "3점 (보통이에요)", 2: "2점 (불만족)", 1: "1점 (별로예요)" };
        return texts[num];
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content review-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header-gray">
                    <h2>{isEditMode ? "후기 수정하기" : "서비스 이용 후기"}</h2>
                    <button className="modal-close-btn" onClick={onClose}>
                        <img src={deleteIcon} alt="Close" />
                    </button>
                </div>

                <div className="modal-body-scroll">
                    <p className="review-guide">
                        {isEditMode
                            ? "기존에 작성하신 내용을 수정하실 수 있습니다."
                            : <><strong style={{color: '#000'}}>{reservation?.partnerName || "정비소"}</strong> 방문 후기를 남겨주세요.</>
                        }
                    </p>

                    <div className="review-photo-row">
                        {[0, 1].map((idx) => (
                            <div key={idx} className="photo-upload-box" onClick={() => handleSlotClick(idx)} style={{ cursor: 'pointer', overflow: 'hidden' }}>
                                {previews[idx] ? <img src={previews[idx]} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <img src={addImgIcon} alt="add" className="add-icon-small" />}
                            </div>
                        ))}
                        <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleImageChange} />
                    </div>
                    <p className="photo-helper">*사진을 클릭하여 변경할 수 있습니다.</p>

                    <div className="repair-type-tags">
                        <span>#{reservation?.category}</span>
                        {reservation?.items && reservation.items.map((item, idx) => <span key={idx}>#{item}</span>)}
                    </div>

                    <div className="rating-section">
                        <h3 className="section-title">서비스 만족도는 어떠셨나요?</h3>
                        <div className="star-group">
                            {[1, 2, 3, 4, 5].map((num) => (
                                <img key={num} src={num <= rating ? starFull : starEmpty} alt="star" onClick={() => setRating(num)} className="star-img" />
                            ))}
                        </div>
                        <p className="rating-result-text">{getRatingText(rating)}</p>
                    </div>

                    <div className="review-tag-grid">
                        {tags.map(tag => (
                            <button key={tag} className={`tag-item ${selectedTags.includes(tag) ? 'active' : ''}`} onClick={() => handleTagClick(tag)}># {tag}</button>
                        ))}
                    </div>

                    <div className="mileage-input-box">
                        <input type="number" placeholder="현재 주행 km를 입력해주세요" value={mileage} onChange={(e) => setMileage(e.target.value)} />
                    </div>
                    <p className="mileage-helper">※ 최근 주행Km 기준으로 맞춤 정보를 제공해드립니다.</p>

                    <div className="modal-actions-row">
                        <button className="btn-cancel-gray" onClick={onClose}>닫기</button>
                        <button className="btn-confirm-gray" onClick={handleConfirm}>{isEditMode ? "수정 완료" : "공유하기"}</button>
                    </div>
                </div>
            </div>

            {alertConfig.show && (
                <AuthAlertModal
                    title={alertConfig.title}
                    message={alertConfig.message}
                    onClose={() => {
                        if (alertConfig.onConfirm) alertConfig.onConfirm();
                        setAlertConfig({ ...alertConfig, show: false });
                    }}
                />
            )}
        </div>
    );
};

export default ReviewModal;