import React, { useState, useEffect } from 'react'; // useEffect 추가
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // 데이터 조회를 위한 axios 추가
import './LandingPage.css';
import Header from '../components/header/Header.jsx';
import landingHeroBg from '../assets/image/landing/landing_hero.png';
import chatbotImg from '../assets/image/landing/chatbot.png';
import searchIcon from "../assets/image/landing/search.png";
import repairImg from '../assets/image/landing/repair.png';
import tireImg from '../assets/image/landing/tire.png';
import oilImg from '../assets/image/landing/oil.png';

// 탭 메뉴 데이터 (기존 유지)
const tabData = [
    {
        id: 0,
        title: 'EXPERT REPAIR',
        desc: '견적부터 후기까지 한 번에\n비교하세요',
        imgUrl: repairImg,
    },
    {
        id: 1,
        title: 'TIRE CARE',
        desc: '내게 딱 맞는 타이어를,\n선택부터 장착까지 쉽게',
        imgUrl: tireImg,
    },
    {
        id: 2,
        title: 'OIL AUTO-TRACK',
        desc: '엔진오일 교체 주기를\n자동으로 추적하고 관리하세요',
        imgUrl: oilImg,
    }
];

const LandingPage = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [reviews, setReviews] = useState([]); // 서버 데이터를 저장할 상태
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

            {/* --- Section 2: Review (요청사항 반영 수정) --- */}
            <section className="section review-section">
                <div className="review-header">
                    <div>
                        <h2>Our Customers' Voice</h2>
                        <p>별점과 키워드로 증명된 정직한 정비 후기입니다.</p>
                    </div>
                    <div className="search-bar">
                        <img src={searchIcon} alt="search icon" className="search-icon-img" />
                        <input type="text" placeholder="차종이나 수리 키워드를 검색해 보세요" />
                    </div>
                </div>

                <div className="review-cards">
                    {reviews.map((review) => (
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
                                    수리부위 : {review.repairPart} | <strong>{review.shopName}</strong>
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* --- Section 3~5: Tab Menu (기존 유지) --- */}
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

            {/* 챗봇 버튼 (기존 유지) */}
            <div className="floating-chatbot">
                <img src={chatbotImg} alt="chatbot" />
            </div>
        </div>
    );
};

export default LandingPage;