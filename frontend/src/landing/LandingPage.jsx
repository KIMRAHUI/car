import React, { useState, useEffect, useMemo } from 'react'; // useMemo 추가
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './LandingPage.css';
import Header from '../components/header/Header.jsx';
import landingHeroBg from '../assets/image/landing/landing_hero.png';
import chatbotImg from '../assets/image/landing/chatbot.png';
import searchIcon from "../assets/image/landing/search.png";
import partnerImg from '../assets/image/landing/partner.png';
import MapImg from '../assets/image/landing/Map.png';
import quickImg from '../assets/image/landing/quick_reserve.png';

// 탭 메뉴 데이터 (기존 유지)
const tabData = [
    {
        id: 0,
        title: 'FIND PARTNERS',
        desc: '전국 정비소 위치부터 생생한 후기까지\n내 차를 위한 최적의 파트너를 찾으세요',
        imgUrl: partnerImg,
    },
    {
        id: 1,
        title: 'SMART ROUTE',
        desc: '현재 위치에서 정비소까지의\n최적 경로와 예상 소요 시간을 확인하세요',
        imgUrl: MapImg,
    },
    {
        id: 2,
        title: 'QUICK RESERVE',
        desc: '복잡한 전화 없이 클릭 몇 번으로\n원하는 정비소에 간편하게 예약하세요',
        imgUrl: quickImg,
    }
];

const LandingPage = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [reviews, setReviews] = useState([]);
    const [searchTerm, setSearchTerm] = useState(''); // 검색어 상태 추가
    const navigate = useNavigate();

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

    // 카드 클릭 시 서비스 메뉴로 이동하며 해당 정비소 정보 전달
    const handleCardClick = (shopName) => {
        // location state를 통해 상호명을 전달하여 서비스 페이지에서 즉시 위치를 띄울 수 있게 함
        navigate('/service', { state: { targetShop: shopName } });
    };

    // 별점 렌더링 헬퍼 함수 (기존 유지)
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

            {/*  How It Works (Tab Menu */}
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
                                                    navigate('/service');
                                                }}
                                            >
                                                EXPLORE ↗
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <h3 className="inactive-tab-title">▪ {tab.title}</h3>
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

            {/* Review (검색 기능 포함) */}
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

                <div className="review-cards">
                    {filteredReviews.length > 0 ? (
                        filteredReviews.map((review) => (
                            <div
                                className="card"
                                key={review.id}
                                onClick={() => handleCardClick(review.shopName)} // 카드 클릭 시 이동 로직
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="card-img-placeholder">
                                    {/* 업로드한 1번째 이미지 반영 (WebConfig 매핑 활용) */}
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
                                        <span className="date">{review.createdAt || review.date}</span>
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
            </section>

            {/* 챗봇 버튼 (기존 유지) */}
            <div className="floating-chatbot">
                <img src={chatbotImg} alt="chatbot" />
            </div>
        </div>
    );
};

export default LandingPage;