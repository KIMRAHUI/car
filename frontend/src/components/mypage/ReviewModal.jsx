import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import deleteIcon from '../../assets/image/modal/Close.png';
import starFull from '../../assets/image/modal/Star.png';
import starEmpty from '../../assets/image/modal/emptyStar.png';
import addImgIcon from '../../assets/image/modal/addImage.png';

import './MyPageModal.css';

/**
 * @param onClose: 모달 닫기 함수
 * @param reservation: MyPage에서 선택된 예약 객체 (reviewId 포함 여부로 수정 모드 판단)
 * @param userEmail: 사용자 이메일
 * @param onSuccess: 성공 시 목록 갱신 콜백
 */
const ReviewModal = ({ onClose, reservation, userEmail, onSuccess }) => {
    // 1. 상태 관리
    const [rating, setRating] = useState(4);
    const [mileage, setMileage] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);
    const [imageFiles, setImageFiles] = useState([null, null]);
    const [previews, setPreviews] = useState([null, null]);

    const fileInputRef = useRef(null);
    const currentSlotIdx = useRef(0);

    // 수정 모드 여부 확인
    const isEditMode = !!reservation.reviewId;

    const tags = [
        "친절한 설명", "꼼꼼한 수리", "합리적인 가격", "정직한 점검",
        "부족한 설명", "아쉬운 응대", "부담스러운 가격", "긴 정비 시간"
    ];

    // [추가] 수정 모드일 경우 기존 데이터 불러오기
    useEffect(() => {
        if (isEditMode) {
            axios.get(`/api/review/${reservation.reviewId}`)
                .then(res => {
                    const data = res.data;
                    setRating(data.rating);
                    setMileage(data.mileage);
                    setSelectedTags(data.selectedTags || []);

                    // 기존 이미지 경로를 프리뷰에 셋팅 (서버 URL 결합)
                    setPreviews([
                        data.image1 ? `http://localhost:8080${data.image1}` : null,
                        data.image2 ? `http://localhost:8080${data.image2}` : null
                    ]);
                })
                .catch(err => {
                    console.error("기존 후기 로드 실패:", err);
                });
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

    // 3. 후기 공유/수정 처리
    const handleConfirm = () => {
        if (!mileage || mileage <= 0) {
            alert("정확한 현재 주행 km를 입력해주세요.");
            return;
        }

        const formData = new FormData();
        // 수정 모드라면 기존 리뷰 ID를 함께 보냄 (서버에서 Update 시 필요)
        if (isEditMode) {
            formData.append('id', reservation.reviewId);
        }
        formData.append('reservationId', reservation.id);
        formData.append('userEmail', userEmail);
        formData.append('rating', rating);
        formData.append('mileage', mileage);

        selectedTags.forEach(tag => formData.append('selectedTags', tag));

        // 새로 선택된 파일이 있는 슬롯만 images에 담음
        imageFiles.forEach(file => {
            if (file) formData.append('images', file);
        });

        // 수정 모드면 PATCH/PUT, 일반 모드면 POST 호출 (여기선 편의상 POST로 통일하거나 분기 가능)
        const apiUrl = isEditMode ? '/api/review/update' : '/api/review/register';

        axios.post(apiUrl, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            withCredentials: true
        })
            .then(res => {
                if (res.data === 'success') {
                    alert(isEditMode ? "후기가 수정되었습니다." : "후기가 공유되었습니다.");
                    if (onSuccess) onSuccess();
                    onClose();
                } else {
                    alert("처리에 실패했습니다. 다시 시도해주세요.");
                }
            })
            .catch(err => {
                console.error("Review Submit Error:", err);
                alert("서버 통신 중 오류가 발생했습니다.");
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
        if (num === 5) return "5점 (최고예요!)";
        if (num === 4) return "4점 (매우 만족)";
        if (num === 3) return "3점 (보통이에요)";
        if (num === 2) return "2점 (불만족)";
        return "1점 (별로예요)";
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content review-modal" onClick={(e) => e.stopPropagation()}>

                {/* 헤더: 모드에 따라 제목 변경 */}
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
                            : <strong>{reservation?.partnerName || "정비소"}</strong> + " 방문 후기를 남겨주세요."
                        }
                    </p>

                    <div className="review-photo-row">
                        {[0, 1].map((idx) => (
                            <div
                                key={idx}
                                className="photo-upload-box"
                                onClick={() => handleSlotClick(idx)}
                                style={{ cursor: 'pointer', overflow: 'hidden' }}
                            >
                                {previews[idx] ? (
                                    <img
                                        src={previews[idx]}
                                        alt={`preview-${idx}`}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <img src={addImgIcon} alt="add" className="add-icon-small" />
                                )}
                            </div>
                        ))}

                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            accept="image/*"
                            onChange={handleImageChange}
                        />
                    </div>
                    <p className="photo-helper">*사진을 클릭하여 변경할 수 있습니다.</p>

                    <div className="repair-type-tags">
                        <span>#{reservation?.category}</span>
                        {reservation?.items && reservation.items.map((item, idx) => (
                            <span key={idx}>#{item}</span>
                        ))}
                    </div>

                    <div className="rating-section">
                        <h3 className="section-title">서비스 만족도는 어떠셨나요?</h3>
                        <div className="star-group">
                            {[1, 2, 3, 4, 5].map((num) => (
                                <img
                                    key={num}
                                    src={num <= rating ? starFull : starEmpty}
                                    alt="star"
                                    onClick={() => setRating(num)}
                                    className="star-img"
                                />
                            ))}
                        </div>
                        <p className="rating-result-text">{getRatingText(rating)}</p>
                    </div>

                    <div className="review-tag-grid">
                        {tags.map(tag => (
                            <button
                                key={tag}
                                className={`tag-item ${selectedTags.includes(tag) ? 'active' : ''}`}
                                onClick={() => handleTagClick(tag)}
                            >
                                # {tag}
                            </button>
                        ))}
                    </div>

                    <div className="mileage-input-box">
                        <input
                            type="number"
                            placeholder="현재 주행 km를 입력해주세요"
                            value={mileage}
                            onChange={(e) => setMileage(e.target.value)}
                        />
                    </div>
                    <p className="mileage-helper">※ 최근 주행Km 기준으로 맞춤 정보를 제공해드립니다.</p>

                    <div className="modal-actions-row">
                        <button className="btn-cancel-gray" onClick={onClose}>닫기</button>
                        <button className="btn-confirm-gray" onClick={handleConfirm}>
                            {isEditMode ? "수정 완료" : "공유하기"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReviewModal;