import React, { useState } from 'react';
import deleteIcon from '../../assets/image/modal/Close.png';
// 별점 이미지 임포트
import starFull from '../../assets/image/modal/Star.png';
import starEmpty from '../../assets/image/modal/emptyStar.png';
// 이미지 추가 아이콘 (목업의 회색 박스 안 아이콘)
import addImgIcon from '../../assets/image/modal/addImage.png'; // 적절한 추가 아이콘으로 대체 가능

import './MyPageModal.css';

const ReviewModal = ({ onClose, shopName = "현대그린서비스" }) => {
    const [rating, setRating] = useState(4);
    const [mileage, setMileage] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);

    const tags = [
        "친절한 설명", "꼼꼼한 수리", "합리적인 가격", "정직한 점검",
        "부족한 설명", "아쉬운 응대", "부담스러운 가격", "긴 정비 시간"
    ];

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

                {/* 헤더 */}
                <div className="modal-header-gray">
                    <h2>서비스 이용 후기</h2>
                    <button className="modal-close-btn" onClick={onClose}>
                        <img src={deleteIcon} alt="Close" />
                    </button>
                </div>

                <div className="modal-body-scroll">
                    <p className="review-guide">방문하신 정비소에 대한 후기를 남겨주세요.</p>

                    {/* 사진 업로드 영역 */}
                    <div className="review-photo-row">
                        <div className="photo-upload-box">
                            <img src={addImgIcon} alt="add" className="add-icon-small" />
                        </div>
                        <div className="photo-upload-box">
                            <img src={addImgIcon} alt="add" className="add-icon-small" />
                        </div>
                    </div>
                    <p className="photo-helper">*최소 1장 이상 사진을 남겨주세요</p>

                    {/* 정비 항목 태그 (목업 상단) */}
                    <div className="repair-type-tags">
                        <span>#사고 수리</span>
                        <span>#앞범퍼</span>
                        <span>#후드</span>
                    </div>

                    {/* 별점 영역 */}
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

                    {/* 리뷰 선택 태그 그리드 */}
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

                    {/* 주행거리 입력 */}
                    <div className="mileage-input-box">
                        <input
                            type="text"
                            placeholder="현재 주행 km를 입력해주세요(점검/교체 정보 제공용)"
                            value={mileage}
                            onChange={(e) => setMileage(e.target.value)}
                        />
                    </div>
                    <p className="mileage-helper">※ 최근 주행Km 기준으로 점검/교체 맞춤 정보를 제공해드립니다.</p>

                    {/* 하단 버튼 */}
                    <div className="modal-actions-row">
                        <button className="btn-cancel-gray" onClick={onClose}>닫기</button>
                        <button className="btn-confirm-gray" onClick={() => {
                            alert("후기가 공유되었습니다.");
                            onClose();
                        }}>공유하기</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReviewModal;