import React, { useState } from 'react';
import './ReservationModal.css';
import CustomCalendar from '../common/CustomCalendar'; // 공통 컴포넌트 경로에 맞춰 임포트

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

const ReservationModal = ({ partner, onClose }) => {
    const reviews = [
        { id: 1, user: "카밋매니아", rating: 5, content: "도색 퀄리티가 미쳤습니다. 수입차 전문이라 그런지 이질감이 전혀 없네요!", date: "2026.03.15" },
        { id: 2, user: "안전운전해용", rating: 4, content: "상담도 친절하시고 예약 시간 딱 맞춰서 작업해주셔서 좋았습니다.", date: "2026.03.10" }
    ];

    const calculateTotalRating = () => {
        const idBase = parseInt(partner.id?.slice(-3) || '123') % 9;
        const externalRating = 4.0 + (idBase * 0.1);
        const internalRating = reviews.reduce((acc, cur) => acc + cur.rating, 0) / reviews.length;
        const total = (externalRating * 0.7) + (internalRating * 0.3);
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
    const [accidentDesc, setAccidentDesc] = useState('');
    const [selectedDate, setSelectedDate] = useState('2026-04-21');
    const [selectedTime, setSelectedTime] = useState('11:30 AM');

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
        <div className="res-modal-overlay" onClick={onClose}>
            <div className="res-modal-content" onClick={(e) => e.stopPropagation()}>
                <header className="res-header">
                    <h2>점검 및 수리 예약</h2>
                    <button className="close-x" onClick={onClose}>✕</button>
                </header>

                <div className="res-body">
                    {step === 1 && (
                        <div className="step-container step-1">
                            <div className="partner-info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                <h3 style={{ margin: 0 }}>{partner.place_name}</h3>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                                        <span className="rating-text" style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1A1A1A' }}>
                                            ★ {finalRating}
                                        </span>
                                        <span style={{ cursor: 'help', fontSize: '0.8rem', color: '#ccc' }} title="포털 리뷰 지수 및 플랫폼 데이터를 종합한 Carmit 전용 평점입니다.">ⓘ</span>
                                    </div>
                                    <div style={{ fontSize: '0.65rem', color: '#888', fontWeight: '500' }}>Carmmit 통합 신뢰 지수</div>
                                </div>
                            </div>

                            <div style={{
                                width: '100%',
                                height: '180px',
                                backgroundColor: '#f2f2f2',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                margin: '10px 0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <img
                                    src={theme.banner}
                                    alt="partner banner"
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'contain',
                                        padding: '10px'
                                    }}
                                />
                            </div>
                            <div className="location-text" style={{fontSize: '0.8rem', color: '#666', marginBottom: '10px'}}>{partner.address_name}</div>
                            <div className="tab-menu">
                                <button className={tab === 'intro' ? 'active' : ''} onClick={() => setTab('intro')}>업체소개</button>
                                <button className={tab === 'review' ? 'active' : ''} onClick={() => setTab('review')}>후기({reviews.length})</button>
                            </div>
                            <div className="tab-content">
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
                                    <div className="review-list">
                                        {reviews.map(r => (
                                            <div key={r.id} className="review-item" style={{borderBottom:'1px solid #eee', padding:'10px 0'}}>
                                                <div className="review-top"><strong>{r.user}</strong> <span style={{color:'#f39c12'}}>⭐{r.rating}</span></div>
                                                <p style={{fontSize:'0.8rem', margin:'5px 0'}}>{r.content}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <button className="next-btn-black" onClick={() => setStep(2)}>정비 예약하기</button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="step-container step-2">
                            <h3 style={{marginBottom:'40px'}}>카테고리를 선택해주세요</h3>
                            <div className="cat-list">
                                <button className="cat-btn" onClick={() => {setCategory('일반'); setStep(3);}}>
                                    <img src={wrenchIcon} alt="w" /> 일반 점검 및 소모품 교체
                                </button>
                                <button className="cat-btn" onClick={() => {setCategory('고장'); setStep(3);}}>
                                    <img src={fixIcon} alt="f" /> 고장 수리
                                </button>
                                <button className="cat-btn" onClick={() => {setCategory('사고'); setStep(3);}}>
                                    <img src={crashIcon} alt="c" /> 사고 수리
                                </button>
                            </div>
                        </div>
                    )}

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
                                    <button className="next-btn-gray" onClick={() => setStep(4)}>예약 하기</button>
                                </div>
                            )}

                            {category === '사고' && (
                                <div className="accident-select">
                                    <h3 style={{fontSize:'1rem'}}>파손 부위를 선택해주세요</h3>
                                    <div className="car-svg-area" style={{ background: '#f9f9f9', borderRadius: '8px', marginBottom: '10px', padding: '15px' }}>
                                        <CarSVGSelector selectedParts={selectedParts} onPartClick={togglePart} />
                                    </div>
                                    <div className="tag-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', minHeight: '30px' }}>
                                        {selectedParts.map(p => <span key={p} className="tag" style={{marginRight: '5px'}}>#{p}</span>)}
                                    </div>
                                    <textarea
                                        placeholder="사고 경위를 입력해주세요. (예: 주차장 기둥에 긁힘)"
                                        className="desc-area"
                                        style={{width:'100%', height:'80px', marginTop:'10px', padding:'10px', border: '1px solid #ddd', borderRadius: '4px'}}
                                        value={accidentDesc}
                                        onChange={(e) => setAccidentDesc(e.target.value)}
                                    ></textarea>
                                    <button className="next-btn-gray" onClick={() => setStep(4)}>다음</button>
                                </div>
                            )}

                            {category === '고장' && (
                                <div className="fix-input">
                                    <h3 style={{fontSize:'1rem'}}>어떤 불편함이 있으신가요?</h3>
                                    <select style={{width:'100%', padding:'10px', marginBottom:'15px', border: '1px solid #ddd'}}>
                                        <option>엔진/출력 저하</option>
                                        <option>소음/진동 발생</option>
                                        <option>경고등 점등</option>
                                    </select>
                                    <textarea placeholder="상세 증상을 입력해주세요." style={{width:'100%', height:'120px', padding:'10px', border: '1px solid #ddd', borderRadius: '4px'}}></textarea>
                                    <button className="next-btn-gray" onClick={() => setStep(4)}>예약 하기</button>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 4 && (
                        <div className="step-container step-4">
                            {/*<h3 style={{fontSize:'1.2rem', marginBottom:'10px'}}>4월 2026</h3>*/}
                            <CustomCalendar
                                year={2026}
                                month={3} // 0부터 시작하므로 3은 4월
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
                            <button className="next-btn-black" onClick={() => setStep(5)}>다음</button>
                        </div>
                    )}

                    {step === 5 && (
                        <div className="step-container step-5" style={{paddingTop:0}}>
                            <img src={completeImage} alt="complete" style={{width:'100%', marginBottom:'20px'}} />
                            <h2 style={{fontSize:'1.1rem', marginBottom: '10px'}}>{selectedDate} am {selectedTime} 예약 완료되었습니다.</h2>
                            <p className="guide-msg" style={{fontSize: '0.75rem', color: '#666', marginBottom: '20px', lineHeight: '1.5'}}>
                                "*간혹 매장 사정에 따라 실시간 영업 상태가 반영되지 않을 수 있습니다.<br/>
                                원활한 점검을 위해 예약 시간 전 업체에서 드리는 확인 연락을 꼭 받아주세요."
                            </p>
                            <div className="final-info" style={{textAlign:'left', background: '#f5f5f5', padding: '15px', borderRadius: '4px'}}>
                                <p style={{margin:'0 0 5px 0'}}><strong>{partner.address_name} {partner.place_name}</strong></p>
                                <p style={{margin:'0', fontSize:'0.8rem', color: '#555'}}>{partner.phone || "0507-0000-0000"}</p>
                            </div>
                            <button className="next-btn-gray" onClick={onClose} style={{marginTop: '20px'}}>확인</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReservationModal;