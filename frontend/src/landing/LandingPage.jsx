import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 네비게이션을 위한 추가
import './LandingPage.css';
import Header from '../components/header/Header.jsx';
import landingHeroBg from '../assets/image/landing/landing_hero.png';
import chatbotImg from '../assets/image/landing/chatbot.png';
import searchIcon from "../assets/image/landing/search.png";
import repairImg from '../assets/image/landing/repair.png';
import tireImg from '../assets/image/landing/tire.png';
import oilImg from '../assets/image/landing/oil.png';

// 탭 메뉴 데이터
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

// 조언 반영: 정형화된 리뷰 데이터 (별점 및 태그 포함)
const reviewData = [
    {
        id: 1,
        carModel: '2020 메르세데스벤츠 A클래스',
        date: '2026.02.05',
        rating: 5,
        tags: ['#친절한 설명', '#꼼꼼한 수리', '#정직한 점검'],
        info: '수리부위 : 앞범퍼, 후드 | 수리방식 : 보험 수리'
    },
    {
        id: 2,
        carModel: 'BMW 320d',
        date: '2026.02.01',
        rating: 4,
        tags: ['#합리적인 가격', '#신속한 작업'],
        info: '수리부위 : 엔진오일, 필터류 | 일반 정비'
    },
    {
        id: 3,
        carModel: '현대 그랜저 IG',
        date: '2026.01.28',
        rating: 5,
        tags: ['#전문적인 정비', '#친절한 설명', '#정직한 점검'],
        info: '수리부위 : 타이어 4본 교체 | 소모품 교체'
    },
    {
        id: 4,
        carModel: '제네시스 GV80',
        date: '2026.01.20',
        rating: 4,
        tags: ['#꼼꼼한 수리', '#신속한 작업'],
        info: '수리부위 : 측면 도색 | 보험 수리'
    }
];

const LandingPage = () => {
    const [activeTab, setActiveTab] = useState(0);
    const navigate = useNavigate(); // 페이지 이동 함수 초기화

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

            {/* --- Section 2: Review --- */}
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
                    {reviewData.map((review) => (
                        <div className="card" key={review.id}>
                            <div className="card-img-placeholder">
                                {/* 정비 전/후 이미지가 들어갈 자리 */}
                            </div>
                            <div className="card-content">
                                {renderStars(review.rating)}

                                <div className="card-info-header">
                                    <h3>{review.carModel}</h3>
                                    <span className="date">{review.date}</span>
                                </div>

                                <div className="review-tags">
                                    {review.tags.map((tag, index) => (
                                        <span key={index} className="tag">{tag}</span>
                                    ))}
                                </div>

                                <p className="review-info-text">{review.info}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* --- Section 3~5: Tab Menu --- */}
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
                                            {/* 조언 반영: 서비스 페이지로 이동하는 링크 추가 */}
                                            <button
                                                className="explore-btn"
                                                onClick={() => navigate('/service')}
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

            {/* 챗봇 버튼 */}
            <div className="floating-chatbot">
                <img src={chatbotImg} alt="chatbot" />
            </div>
        </div>
    );
};

export default LandingPage;