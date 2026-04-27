import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './ReservationModal.css';
import CustomCalendar from '../common/CustomCalendar'; // 공통 컴포넌트 경로에 맞춰 임포트
import AuthAlertModal from '../../components/auth/AuthAlertModal.jsx'; // 공통 알럿 모달 임포트

// 이미지 자산 경로 유지
import wrenchIcon from '../../assets/image/modal/Wrench.png';
import fixIcon from '../../assets/image/modal/Fix Car.png';
import crashIcon from '../../assets/image/modal/Crashed Car.png';

import completeImage from '../../assets/image/modal/service.png';

// 차량 4면 일러스트
import carBack from '../../assets/image/modal/back.png';
import carSide from '../../assets/image/modal/side(L).png';
import carTop from '../../assets/image/modal/top.png';
import carFront from '../../assets/image/modal/front.png';

// 업체별 배너 이미지
import imgBlueHands from '../../assets/image/modal/stroeImgae/BlueHands.png';
import imgCadillac from '../../assets/image/modal/stroeImgae/Cadillac.png';
import imgKiaAutoQ from '../../assets/image/modal/stroeImgae/KiaAutoQ.png';
import imgMaserati from '../../assets/image/modal/stroeImgae/Maserati.png';
import imgSpeedMate from '../../assets/image/modal/stroeImgae/SpeedMate.png';
import imgTStation from '../../assets/image/modal/stroeImgae/T-Station.png';
import imgGongim from '../../assets/image/modal/stroeImgae/공임나라.png';
import imgDefault from '../../assets/image/modal/stroeImgae/default.jpg';

/**
 * 내부 컴포넌트: 차량 일러스트 선택기
 */
const CarSVGSelector = ({ selectedParts, onPartClick }) => {
    const views = [
        {
            title: '후면',
            img: carBack,
            parts: [
                { name: '뒷유리', x: 50, y: 30 },
                { name: '트렁크', x: 50, y: 48 },
                { name: '뒷 범퍼', x: 50, y: 75 },
                { name: '후미등(좌)', x: 18, y: 55 },
                { name: '후미등(우)', x: 82, y: 55 },
                { name: '사이드미러(뒤좌)', x: 12, y: 35 },
                { name: '사이드미러(뒤우)', x: 88, y: 35 }
            ]
        },
        {
            title: '측면',
            img: carSide,
            parts: [
                { name: '앞 도어', x: 60, y: 48 },
                { name: '뒷 도어', x: 30, y: 48 },
                { name: '앞 타이어', x: 80, y: 55 },
                { name: '뒤 타이어', x: 15, y: 55 },
                { name: '앞 휀다', x: 82, y: 45 },
                { name: '뒤 휀다', x: 15, y: 45 },
                { name: '사이드미러(측면)', x: 65, y: 42 }
            ]
        },
        {
            title: '상단',
            img: carTop,
            parts: [
                { name: '루프', x: 50, y: 45 },
                { name: '본네트', x: 15, y: 45 },
                { name: '앞유리', x: 30, y: 45 },
                { name: '사이드미러(상좌)', x: 35, y: 20 },
                { name: '사이드미러(상우)', x: 35, y: 75 }
            ]
        },
        {
            title: '정면',
            img: carFront,
            parts: [
                { name: '본네트(정면)', x: 50, y: 45 },
                { name: '앞 범퍼', x: 50, y: 60 },
                { name: '앞유리(정면)', x: 50, y: 30 },
                { name: '사이드미러(좌)', x: 12, y: 35 },
                { name: '사이드미러(우)', x: 88, y: 35 },
                { name: '전조등(좌)', x: 25, y: 58 },
                { name: '전조등(우)', x: 75, y: 58 },
                { name: '앞 휀다(좌)', x: 15, y: 55 },
                { name: '앞 휀다(우)', x: 85, y: 55 }
            ]
        }
    ];

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '15px',
            width: '100%',
            maxWidth: '380px',
            margin: '0 auto'
        }}>
            {views.map((view, vIdx) => (
                <div key={vIdx} style={{ position: 'relative', width: '100%', aspectRatio: '1/1', background: '#fff', borderRadius: '4px' }}>
                    <img src={view.img} alt={view.title} style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain'
                    }} />

                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                        {view.parts.map((part, pIdx) => {
                            const isSelected = selectedParts.includes(part.name);
                            return (
                                <div
                                    key={pIdx}
                                    onClick={() => onPartClick(part.name)}
                                    style={{
                                        position: 'absolute',
                                        left: `${part.x}%`,
                                        top: `${part.y}%`,
                                        width: '28px',
                                        height: '28px',
                                        transform: 'translate(-50%, -50%)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        zIndex: 10
                                    }}
                                >
                                    {isSelected && (
                                        <div style={{
                                            width: '18px',
                                            height: '18px',
                                            borderRadius: '50%',
                                            background: '#FF4D4F',
                                            color: '#fff',
                                            fontSize: '11px',
                                            fontWeight: 'bold',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                        }}>!</div>
                                    )}
                                    {!isSelected && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(0,0,0,0.03)' }} />}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};

const ReservationModal = ({ partner, onClose, userEmail }) => {
    const fileInputRef = useRef(null);

    const [alertConfig, setAlertConfig] = useState({
        show: false,
        title: '',
        message: '',
        onConfirm: null
    });

    const [currentUser, setCurrentUser] = useState(null);
    const [uploadImages, setUploadImages] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [isLoadingReviews, setIsLoadingReviews] = useState(true);

    useEffect(() => {
        const fetchCurrentSession = async () => {
            try {
                const res = await axios.get('/api/mypage/info');
                if (res.data.result === 'success') {
                    setCurrentUser(res.data.user);
                }
            } catch (e) {
                console.error("Session check failed", e);
            }
        };
        const fetchReviews = async () => {
            if (!partner?.id) return;
            try {
                setIsLoadingReviews(true);
                // 백엔드 ReviewController의 @GetMapping("/partner/{partnerId}") 호출
                const res = await axios.get(`/api/review/partner/${partner.id}`);
                // 컨트롤러가 List<Review>를 직접 리턴하므로 res.data가 곧 배열입니다.
                if (Array.isArray(res.data)) {
                    setReviews(res.data);
                } else if (res.data.reviews) {
                    // 만약 CommonResult 등으로 감싸서 보냈을 경우를 대비
                    setReviews(res.data.reviews);
                }
            } catch (e) {
                console.error("Failed to fetch reviews", e);
                setReviews([]);
            } finally {
                setIsLoadingReviews(false);
            }
        };

        fetchCurrentSession();
        fetchReviews();
    }, [partner.id]);


    const showAlert = (title, message, onConfirm = null) => {
        setAlertConfig({ show: true, title, message, onConfirm });
    };

    const getTodayString = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };


    const calculateTotalRating = () => {
        // 1. 업체 고유 ID 기반 알고리즘 점수 생성 (30% 비중)
        // 데이터가 아예 없을 때만 100% 노출되고, 리뷰가 생기면 보조 수단으로 전환됩니다.
        const idBase = parseInt(partner.id?.slice(-3) || '123') % 9;
        const externalRating = 4.0 + (idBase * 0.1);

        // 2. 우리 플랫폼 실제 사용자 리뷰 평균 계산 (70% 비중)
        const internalRating = reviews.length > 0
            ? reviews.reduce((acc, cur) => acc + cur.rating, 0) / reviews.length
            : 0;

        // 3. 최종 신뢰 지수 산출
        // 실제 리뷰가 하나라도 있다면 사용자 점수 7, 알고리즘 점수 3의 비율로 섞습니다.
        const total = reviews.length > 0
            ? (internalRating * 0.7) + (externalRating * 0.3)
            : externalRating;

        return total.toFixed(1);
    };

    const finalRating = calculateTotalRating();

    const getPartnerTheme = () => {
        const name = partner.place_name;
        let selectedBanner = imgDefault;
        let isBrand = false;

        if (name.includes('블루핸즈')) {
            selectedBanner = imgBlueHands;
            isBrand = true;
        } else if (name.includes('오토큐')) {
            selectedBanner = imgKiaAutoQ;
            isBrand = true;
        } else if (name.includes('캐딜락')) {
            selectedBanner = imgCadillac;
            isBrand = true;
        } else if (name.includes('마세라티')) {
            selectedBanner = imgMaserati;
            isBrand = true;
        } else if (name.includes('스피드메이트')) {
            selectedBanner = imgSpeedMate;
        } else if (name.includes('티스테이션')) {
            selectedBanner = imgTStation;
        } else if (name.includes('공임나라')) {
            selectedBanner = imgGongim;
        } else if (name.includes('서비스센터') || name.includes('직영')) {
            isBrand = true;
        }

        return { isBrand, banner: selectedBanner };
    };

    const theme = getPartnerTheme();
    const isBrand = theme.isBrand;

    const [step, setStep] = useState(1);
    const [tab, setTab] = useState('intro');
    const [category, setCategory] = useState('');

    const [selectedGeneralItems, setSelectedGeneralItems] = useState([]);
    const [selectedParts, setSelectedParts] = useState([]);
    const [selectedAccidentKeywords, setSelectedAccidentKeywords] = useState([]); // 사고 키워드 6개용
    const [accidentDesc, setAccidentDesc] = useState('');

    const [selectedRepairKeywords, setSelectedRepairKeywords] = useState([]); // 고장 키워드 6개용
    const [repairDesc, setRepairDesc] = useState('');

    const [selectedDate, setSelectedDate] = useState(getTodayString());
    const [selectedTime, setSelectedTime] = useState('11:30 AM');

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (uploadImages.length + files.length > 2) {
            showAlert("업로드 제한", "이미지는 최대 2장까지 등록 가능합니다.");
            return;
        }

        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setUploadImages(prev => [...prev, { file, preview: reader.result }]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index) => {
        setUploadImages(prev => prev.filter((_, i) => i !== index));
    };

    const toggleGeneralItem = (item) => {
        setSelectedGeneralItems(prev =>
            prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
        );
    };

    const togglePart = (partName) => {
        setSelectedParts(prev =>
            prev.includes(partName) ? prev.filter(p => p !== partName) : [...prev, partName]
        );
    };

    // [추가] 사고 키워드 토글
    const toggleAccidentKeyword = (word) => {
        setSelectedAccidentKeywords(prev =>
            prev.includes(word) ? prev.filter(w => w !== word) : [...prev, word]
        );
    };

    // [추가] 고장 키워드 토글
    const toggleRepairKeyword = (word) => {
        setSelectedRepairKeywords(prev =>
            prev.includes(word) ? prev.filter(w => w !== word) : [...prev, word]
        );
    };

    const handleSubmit = async () => {
        const finalEmail = currentUser?.email || userEmail;

        if (!finalEmail) {
            showAlert("오류", "로그인 세션이 만료되었습니다. 다시 로그인해 주세요.");
            return;
        }

        let finalItems = [];
        if (category === '일반') finalItems = selectedGeneralItems;
        else if (category === '사고') finalItems = [...selectedParts, ...selectedAccidentKeywords];
        else if (category === '고장') finalItems = selectedRepairKeywords;

        if (finalItems.length === 0) {
            showAlert("선택 필요", "항목을 하나 이상 선택해 주세요.");
            return;
        }

        const formData = new FormData();
        formData.append('userEmail', finalEmail);
        formData.append('partnerId', partner.id);
        formData.append('partnerName', partner.place_name);
        formData.append('category', category);

        finalItems.forEach(item => formData.append('items', item));
        formData.append('description', category === '사고' ? accidentDesc : (category === '고장' ? repairDesc : ''));
        formData.append('selectedDate', selectedDate);
        formData.append('selectedTime', selectedTime);

        if (category !== '일반' && uploadImages.length > 0) {
            uploadImages.forEach((imgObj) => {
                formData.append(`images`, imgObj.file);
            });
        }

        try {
            const response = await axios.post('/service/reservation/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.result === 'success') {
                setStep(5);
            } else {
                showAlert("오류", "예약 처리 중 문제가 발생했습니다.");
            }
        } catch (error) {
            console.error("Reservation Submit Error:", error);
            showAlert("통신 오류", "서버와의 연결이 원활하지 않습니다.");
        }
    };

    const dynamicContent = isBrand ? {
        slogan: "💎 제조사 공식 인증 서비스의 전문성을 경험하세요.",
        features: [
            "✓ 해당 브랜드 순정 부품 100% 사용 보증",
            "✓ 제조사 공식 최신 진단 장비 및 데이터 활용",
            "✓ 정비 이력 전산화를 통한 통합 관리",
            "✓ 전문 교육을 이수한 브랜드 전담 정비사"
        ]
    } : {
        slogan: "🛠️ 합리적인 가격과 신뢰를 바탕으로 정성껏 정비합니다.",
        features: [
            "✓ 거품 없는 투명한 공임 및 정비 비용",
            "✓ 30년 경력 베테랑 정비사의 1:1 맞춤 진단",
            "✓ 고객 지참 부품(공임나라 방식) 작업 환영",
            "✓ 지역화폐 및 지역 결제 수단 사용 가능"
        ]
    };

    return (
        <>
            <div className="res-modal-overlay" onClick={onClose}>
                <div className="res-modal-content" onClick={(e) => e.stopPropagation()}>
                    <header className="res-header">
                        <h2>점검 및 수리 예약</h2>
                        <button className="close-x" onClick={onClose}>✕</button>
                    </header>

                    <div className="res-body">
                        {/* STEP 1: 업체 정보 및 후기 조회 */}
                        {step === 1 && (
                            <div className="step-container step-1">
                                {/* 1. 업체 요약 정보 영역 (상단 고정) */}
                                <div className="partner-info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                    <h3 style={{ margin: 0 }}>{partner.place_name}</h3>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                                <span className="rating-text" style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1A1A1A' }}>
                                    ★ {finalRating}
                                </span>
                                            <span style={{ cursor: 'help', fontSize: '0.8rem', color: '#ccc' }} title="카밋 자체 데이터 기반 신뢰 점수입니다.">ⓘ</span>
                                        </div>
                                        <div style={{ fontSize: '0.65rem', color: '#888', fontWeight: '500' }}>Carmmit 통합 신뢰 지수</div>
                                    </div>
                                </div>

                                {/* 2. 업체 배너 및 주소 */}
                                <div style={{ width: '100%', height: '180px', backgroundColor: '#f2f2f2', borderRadius: '8px', overflow: 'hidden', margin: '10px 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <img src={theme.banner} alt="banner" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '10px' }} />
                                </div>
                                <div className="location-text" style={{fontSize: '0.8rem', color: '#666', marginBottom: '10px'}}>{partner.address_name}</div>

                                {/* 3. 탭 메뉴 (소개 vs 후기) */}
                                <div className="tab-menu">
                                    <button className={tab === 'intro' ? 'active' : ''} onClick={() => setTab('intro')}>업체소개</button>
                                    <button className={tab === 'review' ? 'active' : ''} onClick={() => setTab('review')}>후기({reviews.length})</button>
                                </div>

                                {/* 4. 탭별 상세 내용 영역 */}
                                <div className="tab-content" style={{ minHeight: '200px' }}>
                                    {tab === 'intro' ? (
                                        <div className="intro-content">
                                            <p>{dynamicContent.slogan}</p>
                                            <p>✨ <strong>{partner.place_name}</strong>만의 차별화 서비스</p>
                                            <ul style={{listStyle:'none', padding:0, fontSize:'0.85rem'}}>
                                                {dynamicContent.features.map((feature, idx) => (
                                                    <li key={idx} style={{marginBottom:'4px'}}>{feature}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    ) : (
                                        <div className="review-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                            {isLoadingReviews ? (
                                                <div style={{ textAlign: 'center', padding: '40px 0', color: '#999', fontSize: '0.85rem' }}>후기를 불러오는 중입니다...</div>
                                            ) : reviews.length > 0 ? (
                                                reviews.map((r) => (
                                                    <div key={r.id} className="review-item" style={{ borderBottom: '1px solid #eee', padding: '12px 0' }}>
                                                        <div className="review-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <div>
                                                                <strong style={{ fontSize: '0.9rem' }}>{r.userEmail ? r.userEmail.split('@')[0] : '익명'}님</strong>
                                                                <span style={{ fontSize: '0.7rem', color: '#888', marginLeft: '8px' }}>
                                                        {r.carModel || '차종 정보 없음'} | {r.repairPart || '일반 정비'}
                                                    </span>
                                                            </div>
                                                            <span style={{ color: '#f39c12', fontWeight: 'bold' }}>⭐ {r.rating}</span>
                                                        </div>
                                                        <p style={{ fontSize: '0.8rem', margin: '8px 0', color: '#444', lineHeight: '1.4' }}>
                                                            {r.content}
                                                        </p>
                                                        {/* 후기 이미지 출력 */}
                                                        {(r.image1 || r.image2) && (
                                                            <div style={{ display: 'flex', gap: '5px', marginBottom: '8px' }}>
                                                                {r.image1 && <img src={r.image1} alt="review-1" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />}
                                                                {r.image2 && <img src={r.image2} alt="review-2" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />}
                                                            </div>
                                                        )}
                                                        <div style={{ fontSize: '0.65rem', color: '#bbb', textAlign: 'right' }}>
                                                            {r.createdAt ? r.createdAt.split('T')[0] : ''}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div style={{ textAlign: 'center', padding: '40px 0', color: '#bbb', fontSize: '0.8rem' }}>
                                                    아직 등록된 후기가 없습니다.<br />첫 후기를 작성해 보세요!
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <button className="next-btn-black" onClick={() => setStep(2)}>정비 예약하기</button>
                            </div>
                        )}

                        {/* STEP 2: 카테고리 선택 */}
                        {step === 2 && (
                            <div className="step-container step-2">
                                <h3 style={{marginBottom:'40px'}}>카테고리를 선택해주세요</h3>
                                <div className="cat-list">
                                    <button className="cat-btn" onClick={() => {setCategory('일반'); setUploadImages([]); setStep(3);}}>
                                        <img src={wrenchIcon} alt="w" /> 일반 점검 및 소모품 교체
                                    </button>
                                    <button className="cat-btn" onClick={() => {setCategory('고장'); setUploadImages([]); setStep(3);}}>
                                        <img src={fixIcon} alt="f" /> 고장 수리
                                    </button>
                                    <button className="cat-btn" onClick={() => {setCategory('사고'); setUploadImages([]); setStep(3);}}>
                                        <img src={crashIcon} alt="c" /> 사고 수리
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* STEP 3: 상세 항목 및 이미지 업로드 */}
                        {step === 3 && (
                            <div className="step-container step-3">
                                {category === '일반' && (
                                    <div className="general-select">
                                        <h3 style={{fontSize:'1rem'}}>교체 또는 점검이 필요한 항목을<br/>모두 선택해 주세요.</h3>
                                        <div className="check-group" style={{textAlign:'left', overflowY:'auto', maxHeight:'300px'}}>
                                            <p style={{fontWeight:800, margin:'15px 0 10px'}}>오일 및 케미컬</p>
                                            {['엔진오일 및 필터 세트', '브레이크 오일', '미션 오일', '냉각수 보충'].map(item => (
                                                <label key={item} style={{display:'block', marginBottom:'8px', cursor: 'pointer'}}>
                                                    <input type="checkbox" checked={selectedGeneralItems.includes(item)} onChange={() => toggleGeneralItem(item)} /> {item}
                                                </label>
                                            ))}
                                            <p style={{fontWeight:800, margin:'20px 0 10px'}}>필터 및 일반 소모품</p>
                                            {['에어컨/히터 필터', '와이퍼 블레이드 세트', '스마트키 배터리 교환'].map(item => (
                                                <label key={item} style={{display:'block', marginBottom:'8px', cursor: 'pointer'}}>
                                                    <input type="checkbox" checked={selectedGeneralItems.includes(item)} onChange={() => toggleGeneralItem(item)} /> {item}
                                                </label>
                                            ))}
                                        </div>
                                        <button className="next-btn-gray" onClick={() => setStep(4)} style={{marginTop:'20px'}}>일시 선택하기</button>
                                    </div>
                                )}

                                {category === '사고' && (
                                    <div className="accident-select">
                                        <h3 style={{fontSize:'1rem'}}>파손 부위 및 상세 상태를 선택해주세요</h3>
                                        <div className="car-svg-area" style={{ background: '#f9f9f9', borderRadius: '8px', marginBottom: '10px', padding: '15px' }}>
                                            <CarSVGSelector selectedParts={selectedParts} onPartClick={togglePart} />
                                        </div>

                                        <p style={{fontWeight:800, fontSize:'0.8rem', textAlign:'left', margin:'10px 0'}}>상세 상태 (키워드 선택)</p>
                                        <div className="keyword-grid" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'15px'}}>
                                            {['단순 긁힘/스크래치', '찌그러짐/덴트', '도색 벗겨짐', '부품 깨짐/파손', '프레임 변형', '유리 금감/파손'].map(word => (
                                                <button
                                                    key={word}
                                                    className={`keyword-btn ${selectedAccidentKeywords.includes(word) ? 'active' : ''}`}
                                                    onClick={() => toggleAccidentKeyword(word)}
                                                    style={{padding:'8px', fontSize:'0.75rem', border:'1px solid #ddd', borderRadius:'4px', background: selectedAccidentKeywords.includes(word) ? '#000' : '#fff', color: selectedAccidentKeywords.includes(word) ? '#fff' : '#000'}}
                                                >
                                                    {word}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="image-upload-wrapper" style={{display:'flex', gap:'10px', marginBottom:'10px'}}>
                                            {uploadImages.map((img, idx) => (
                                                <div key={idx} style={{position:'relative', width:'60px', height:'60px'}}>
                                                    <img src={img.preview} alt="preview" style={{width:'100%', height:'100%', objectFit:'cover', borderRadius:'4px'}} />
                                                    <button onClick={() => removeImage(idx)} style={{position:'absolute', top:'-5px', right:'-5px', background:'#ff4d4f', color:'#fff', border:'none', borderRadius:'50%', width:'18px', height:'18px', fontSize:'10px', cursor:'pointer'}}>✕</button>
                                                </div>
                                            ))}
                                            {uploadImages.length < 2 && (
                                                <div onClick={() => fileInputRef.current.click()} style={{width:'60px', height:'60px', border:'1px dashed #ccc', borderRadius:'4px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:'20px', color:'#ccc'}}>+</div>
                                            )}
                                            <input type="file" ref={fileInputRef} style={{display:'none'}} onChange={handleImageChange} accept="image/*" multiple />
                                        </div>
                                        <button className="next-btn-gray" onClick={() => setStep(4)} style={{marginTop:'15px'}}>일시 선택하기</button>
                                    </div>
                                )}

                                {category === '고장' && (
                                    <div className="fix-input">
                                        <h3 style={{fontSize:'1rem'}}>고장 증상을 선택하고 사진을 등록해주세요</h3>
                                        <div className="keyword-grid" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'20px'}}>
                                            {['시동 불량/지연', '이상 소음 발생', '비정상적 진동', '계기판 경고등', '출력 저하/가속 안됨', '냉각수/오일 누유'].map(word => (
                                                <button
                                                    key={word}
                                                    className={`keyword-btn ${selectedRepairKeywords.includes(word) ? 'active' : ''}`}
                                                    onClick={() => toggleRepairKeyword(word)}
                                                    style={{padding:'10px', fontSize:'0.75rem', border:'1px solid #ddd', borderRadius:'4px', background: selectedRepairKeywords.includes(word) ? '#000' : '#fff', color: selectedRepairKeywords.includes(word) ? '#fff' : '#000'}}
                                                >
                                                    {word}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="image-upload-wrapper" style={{display:'flex', gap:'10px', marginBottom:'15px'}}>
                                            {uploadImages.map((img, idx) => (
                                                <div key={idx} style={{position:'relative', width:'60px', height:'60px'}}>
                                                    <img src={img.preview} alt="preview" style={{width:'100%', height:'100%', objectFit:'cover', borderRadius:'4px'}} />
                                                    <button onClick={() => removeImage(idx)} style={{position:'absolute', top:'-5px', right:'-5px', background:'#ff4d4f', color:'#fff', border:'none', borderRadius:'50%', width:'18px', height:'18px', fontSize:'10px', cursor:'pointer'}}>✕</button>
                                                </div>
                                            ))}
                                            {uploadImages.length < 2 && (
                                                <div onClick={() => fileInputRef.current.click()} style={{width:'60px', height:'60px', border:'1px dashed #ccc', borderRadius:'4px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:'20px', color:'#ccc'}}>+</div>
                                            )}
                                            <input type="file" ref={fileInputRef} style={{display:'none'}} onChange={handleImageChange} accept="image/*" multiple />
                                        </div>
                                        <button className="next-btn-gray" onClick={() => setStep(4)} style={{marginTop:'20px'}}>일시 선택하기</button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* STEP 4: 예약 일시 선택 */}
                        {step === 4 && (
                            <div className="step-container step-4">
                                <CustomCalendar
                                    year={2026}
                                    month={3}
                                    selectedDate={selectedDate}
                                    onDateClick={(date) => setSelectedDate(date)}
                                    isModal={true}
                                />
                                <p style={{fontSize:'0.8rem', fontWeight:800, textAlign:'left', marginBottom: '10px', marginTop: '20px'}}>TIME</p>
                                <div className="time-grid">
                                    {['10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:30 PM'].map(t => (
                                        <button key={t} className={selectedTime === t ? 'active' : ''} onClick={() => setSelectedTime(t)}>{t}</button>
                                    ))}
                                </div>
                                <button className="next-btn-black" onClick={handleSubmit}>예약 완료하기</button>
                            </div>
                        )}

                        {/* STEP 5: 예약 완료 결과 */}
                        {step === 5 && (
                            <div className="step-container step-5" style={{paddingTop:0}}>
                                <img src={completeImage} alt="complete" style={{width:'100%', marginBottom:'20px'}} />
                                <h2 style={{fontSize:'1.1rem', marginBottom: '10px'}}>{selectedDate} {selectedTime} 예약 완료되었습니다.</h2>
                                <p className="guide-msg" style={{fontSize: '0.75rem', color: '#666', marginBottom: '20px', lineHeight: '1.5'}}>
                                    "*간혹 매장 사정에 따라 실시간 영업 상태가 반영되지 않을 수 있습니다.<br/>
                                    원활한 점검을 위해 확인 연락을 꼭 받아주세요."
                                </p>
                                <div className="final-info" style={{textAlign:'left', background: '#f5f5f5', padding: '15px', borderRadius: '4px'}}>
                                    <p style={{margin:'0 0 5px 0'}}><strong>{partner.place_name}</strong></p>
                                    <p style={{margin:'0', fontSize:'0.8rem', color: '#555'}}>{partner.phone || "0507-0000-0000"}</p>
                                </div>
                                <button className="next-btn-gray" onClick={onClose} style={{marginTop: '20px'}}>확인</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {alertConfig.show && (
                <AuthAlertModal
                    title={alertConfig.title}
                    message={alertConfig.message}
                    onClose={() => {
                        const confirmAction = alertConfig.onConfirm;
                        setAlertConfig(prev => ({ ...prev, show: false }));
                        if (confirmAction) confirmAction();
                    }}
                />
            )}
        </>
    );
};

export default ReservationModal;