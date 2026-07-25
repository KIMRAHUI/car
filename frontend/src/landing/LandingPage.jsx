import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './LandingPage.css';
import Header from '../components/header/Header.jsx';
import Footer from '../components/footer/footer.jsx'
import ChatBot from '../components/chatbot/ChatBot.jsx';
import TireDiagnosisFloating from '../components/tire/TireDiagnosisFloating.jsx';
import landingHeroBg from '../assets/image/landing/landing_hero.png';
import searchIcon from "../assets/image/landing/search.png";
import carRepairImg from '../assets/image/landing/CAR.png';
import bullsoneImg from '../assets/image/landing/BULLS.png';
import tstationImg from '../assets/image/landing/T-STATION.png';

// 탭 메뉴 데이터 (브랜드 공식 슬로건 및 라우팅 옵션 적용)
const tabData = [
    {
        id: 0,
        title: 'EXPERT REPAIR',
        desc: '전국 정비소 위치부터 생생한 후기까지\n내 집 근처 최적의 정비 파트너를 검색하세요',
        imgUrl: carRepairImg,
        isExternal: false,
        link: '/service'
    },
    {
        id: 1,
        title: 'BULLS_CARE',
        desc: '“I LOVE MY CAR”\n새차처럼 쌩쌩하게, 불스원샷 셀프 엔진 케어',
        imgUrl: bullsoneImg,
        isExternal: true,
        link: 'https://bullsonemall.com'
    },
    {
        id: 2,
        title: 'T\'STATION',
        desc: '“올바른 타이어, 올바른 서비스”\n티스테이션 all my T',
        imgUrl: tstationImg,
        isExternal: true,
        link: 'https://www.tstation.com'
    }
];

const LandingPage = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [reviews, setReviews] = useState([]);
    const [searchTerm, setSearchTerm] = useState(''); // 검색어 상태 추가
    const navigate = useNavigate();

    // 캐러셀 인덱스 제어 및 DOM 접근용 Ref 선언
    const [currentSlide, setCurrentSlide] = useState(0);
    const sliderRef = useRef(null);

    // 날짜 포맷팅 유틸리티 함수
    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const hh = String(date.getHours()).padStart(2, '0');
        const min = String(date.getMinutes()).padStart(2, '0');
        return `${yyyy}.${mm}.${dd} ${hh}:${min}`;
    };

    // 서버로부터 최신 후기 목록을 가져오는 로직
    useEffect(() => {
        const fetchReviews = async () => {
            try {
                // 백엔드 ReviewController의 리스트 API 호출
                const response = await axios.get('/api/review/list');
                setReviews(response.data);
            } catch (error) {
                console.error("후기 데이터를 가져오는 중 오류가 발생했습니다.", error);
            }
        };
        fetchReviews();
    }, []);

    // --- 실시간 자동 검색 필터링 로직 ---
    // carModel(차종)과 repairPart(수리부위)를 합쳐 검색어가 포함된 항목을 찾습니다.
    const filteredReviews = useMemo(() => {
        return reviews.filter((review) => {
            const carModel = review.carModel || "";
            const repairPart = review.repairPart || "";
            const searchTarget = (carModel + repairPart).toLowerCase();
            return searchTarget.includes(searchTerm.toLowerCase());
        });
    }, [reviews, searchTerm]);

    //사용자가 검색어를 타이핑하면 캐러셀 트랙 인덱스를 즉시 첫 위치로 정렬 리셋
    useEffect(() => {
        setCurrentSlide(0);
    }, [searchTerm]);

    //캐러셀 트랙 이전 버튼 제어 핸들러
    const handlePrevSlide = () => {
        setCurrentSlide((prev) => Math.max(prev - 1, 0));
    };

    //캐러셀 트랙 다음 버튼 제어 핸들러
    const handleNextSlide = () => {
        // 최대 이동 가능 인덱스는 총 아이템 개수에서 노출 개수(4개)를 제외한 값
        const maxSlide = Math.max(filteredReviews.length - 4, 0);
        setCurrentSlide((prev) => Math.min(prev + 1, maxSlide));
    };

    // 카드 클릭 시 서비스 메뉴로 이동하며 해당 정비소 정보 전달
    const handleCardClick = (shopName) => {
        // location state를 통해 상호명을 전달하여 서비스 페이지에서 즉시 위치를 띄울 수 있게 함
        navigate('/service', { state: { targetShop: shopName } });
    };

    // EXPLORE 버튼 클릭 시 내부 이동과 외부 공식사 새 탭 이동을 분기 처리하는 핸들러
    const handleExploreClick = (tab) => {
        if (tab.isExternal) {
            // 외부 공식 사이트 링크일 경우 안전한 새 탭 속성으로 열기
            window.open(tab.link, '_blank', 'noopener,noreferrer');
        } else {
            // 내부 서비스 페이지로 이동
            navigate(tab.link);
        }
    };

    // 별점 렌더링 헬퍼 함수
    const renderStars = (rating) => {
        return (
            <div className="star-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className={`star ${star <= rating ? 'filled' : ''}`}>
                        ★
                    </span>
                ))}
                <span className="rating-text">{rating}.0</span>
            </div>
        );
    };

    return (
        <div className="landing-container">
            {/* --- Header --- */}
            <Header />

            {/* --- Section 1: Hero --- */}
            <section className="section hero-section">
                <div className="hero-text-wrapper">
                    <h1 className="hero-text">COMMIT CAR</h1>
                </div>

                <div
                    className="hero-bg-overlay"
                    style={{
                        backgroundImage: `url("${landingHeroBg}")`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundColor: 'transparent'
                    }}
                ></div>
            </section>

            {/* How It Works (Tab Menu) */}
            <section className="section how-it-works-section">
                <div className="how-left">
                    <h2 className="how-title">HOW IT<br/>WORKS:</h2>

                    <div className="Landingtab-menu">
                        {tabData.map((tab, index) => (
                            <div
                                key={tab.id}
                                className={`tab-item ${activeTab === index ? 'active' : ''}`}
                                onClick={() => setActiveTab(index)}
                            >
                                {activeTab === index ? (
                                    <div className="active-tab-content">
                                        <div className="vertical-line"></div>
                                        <div className="tab-text-group">
                                            <h3>{tab.title}</h3>
                                            <p>{tab.desc}</p>
                                            <button
                                                className="explore-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation(); // 카드 이동과 중복 방지
                                                    handleExploreClick(tab); // 조건별 링크 핸들러 적용
                                                }}
                                            >
                                                EXPLORE ↗
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <h3 className="inactive-tab-title">{tab.title}</h3>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="how-right">
                    <div className="image-container">
                        <img
                            src={tabData[activeTab].imgUrl}
                            alt={tabData[activeTab].title}
                            className="tab-image"
                        />
                    </div>
                </div>
            </section>

            {/* Review*/}
            <section className="section review-section">
                <div className="review-header">
                    <div>
                        <h2>Our Customers' Voice</h2>
                        <p>별점과 키워드로 증명된 정직한 정비 후기입니다.</p>
                    </div>
                    <div className="search-bar">
                        <img src={searchIcon} alt="search icon" className="search-icon-img" />
                        <input
                            type="text"
                            placeholder="차종이나 수리 키워드를 검색해 보세요"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)} // 자동 검색 입력 바인딩
                        />
                    </div>
                </div>

                {/* 1열 레이아웃 붕괴를 영구적으로 격리 차단하기 위한 래퍼 및 인터랙션 컨트롤 트랙 구성 */}
                <div className="review-slider-wrapper">
                    {/* 데이터 배열 결과가 4개를 초과하여 쌓였을 때만 화면 상에 제어 인디케이터 화살표 버튼을 바인딩 */}
                    {filteredReviews.length > 4 && (
                        <>
                            <button
                                className="slider-arrow-btn prev"
                                onClick={handlePrevSlide}
                                disabled={currentSlide === 0}
                            >
                                ‹
                            </button>
                            <button
                                className="slider-arrow-btn next"
                                onClick={handleNextSlide}
                                disabled={currentSlide >= filteredReviews.length - 4}
                            >
                                ›
                            </button>
                        </>
                    )}

                    <div className="review-cards-container" ref={sliderRef}>
                        <div
                            className="review-cards"
                            style={{
                                transform: `translateX(-${currentSlide * (100 / 4)}%)`
                            }}
                        >
                            {filteredReviews.length > 0 ? (
                                filteredReviews.map((review) => (
                                    <div
                                        className="card"
                                        key={review.id}
                                        onClick={() => handleCardClick(review.shopName)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="card-img-placeholder">
                                            {review.image1 ? (
                                                <img src={review.image1} alt="정비 사진" className="review-card-img" />
                                            ) : (
                                                <div className="no-image-text">정비 사진 없음</div>
                                            )}
                                        </div>
                                        <div className="card-content">
                                            {renderStars(review.rating)}

                                            <div className="card-info-header">
                                                <h3>{review.carModel}</h3>
                                                {/* 포맷팅된 날짜 출력 */}
                                                <span className="date">{formatDate(review.createdAt || review.date)}</span>
                                            </div>

                                            <div className="review-tags">
                                                {(review.selectedTags || []).map((tag, index) => (
                                                    <span key={index} className="tag">#{tag}</span>
                                                ))}
                                            </div>

                                            {/* 자동차 정비 상호명 내용 추가 */}
                                            <p className="review-info-text">
                                                {review.repairPart} | <strong>{review.shopName}</strong>
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="no-results" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '50px', color: '#999' }}>
                                    검색 조건에 맞는 후기가 없습니다.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* 타이어 진단 플로팅 버튼 - 챗봇 위에 표시됨 */}
            <TireDiagnosisFloating />

            {/* 분리된 챗봇 컴포넌트 적용 */}
            <ChatBot />

            <Footer />
        </div>
    );
};

export default LandingPage;