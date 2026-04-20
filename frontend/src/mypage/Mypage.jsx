import React, {useState, useEffect, useRef} from 'react';
import Header from '../components/header/Header.jsx';
import './MyPage.css';
import {Link} from "react-router-dom";
import carImage from '../assets/image/mypage/ProfileImage.png';

// [수정] 실제 경로와 파일명에 맞춰서 임포트 (경로: src/assets/image/modal)
import Hyundai from '../assets/image/modal/Hyundai.png';
import Kia from '../assets/image/modal/Kia.png';
import Chevrolet from '../assets/image/modal/Chevrolet.png';
import SsangYong from '../assets/image/modal/SsangYong.png';
import Renault from '../assets/image/modal/Renault.png';
import Ford from '../assets/image/modal/Ford.png';
import MINI from '../assets/image/modal/MINI.png';
import Lincoln from '../assets/image/modal/Lincoln.png';
import MercedesBenz from '../assets/image/modal/Mercedes-Benz.png';
import BMW from '../assets/image/modal/BMW.png';
import Audi from '../assets/image/modal/Audi.png';
import Volvo from '../assets/image/modal/Volvo.png';
import Toyota from '../assets/image/modal/Toyota.png';
import Nissan from '../assets/image/modal/Nissan.png';

// [추가] 분리된 모달 컴포넌트들 임포트
import WithdrawModal from '../components/mypage/WithdrawModal.jsx';
import EditChoiceModal from '../components/mypage/EditChoiceModal.jsx';
import VehicleEditModal from '../components/mypage/VehicleEditModal.jsx';
import PersonalInfoEditModal from '../components/mypage/PersonalInfoEditModal.jsx';
import AuthAlertModal from '../components/auth/AuthAlertModal.jsx';
import ReviewModal from '../components/mypage/ReviewModal.jsx'; // 👈 후기 모달 임포트

const MyPage = () => {

    // [추가] 파일 입력을 위한 Ref
    const fileInputRef = useRef(null);

    // 페이지 진입 시 스크롤 최상단 이동
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // 로그인 여부 상태
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // 사용자 정보
    const [user, setUser] = useState(null);

    // 좌측 탭 상태
    const [leftTab, setLeftTab] = useState('account');

    // 우측 탭 상태
    const [rightTab, setRightTab] = useState('reservation');

    // 모달 렌더링 상태 관리 (null, 'withdraw', 'editChoice', 'vehicleEdit', 'personalEdit', 'review')
    const [activeModal, setActiveModal] = useState(null);

    // 알림용 모달 상태 관리 (alert 대체용)
    const [alertConfig, setAlertConfig] = useState({
        show: false,
        title: '',
        message: '',
        onConfirm: null
    });

    // 수리 이미지
    const repairImageUrl = "https://images.unsplash.com/photo-1625047509168-a7026f36de04?auto=format&fit=crop&q=80&w=300";

    // 알림 모달 호출 도우미 함수
    const showAlert = (title, message, onConfirm = null) => {
        setAlertConfig({ show: true, title, message, onConfirm });
    };

    /**
     * [개선] 임포트된 이미지 변수들을 활용하여 브랜드 로고를 리턴하는 함수
     */
    const getBrandLogo = (brandName) => {
        if (!brandName) return Ford; // 기본값
        const name = brandName.toLowerCase();

        if (name.includes('현대') || name.includes('hyundai')) return Hyundai;
        if (name.includes('기아') || name.includes('kia')) return Kia;
        if (name.includes('쉐보레') || name.includes('chevrolet')) return Chevrolet;
        if (name.includes('쌍용') || name.includes('ssangyong')) return SsangYong;
        if (name.includes('르노') || name.includes('renault')) return Renault;
        if (name.includes('포드') || name.includes('ford')) return Ford;
        if (name.includes('미니') || name.includes('mini')) return MINI;
        if (name.includes('링컨') || name.includes('lincoln')) return Lincoln;
        if (name.includes('벤츠') || name.includes('mercedes')) return MercedesBenz;
        if (name.includes('bmw')) return BMW;
        if (name.includes('아우디') || name.includes('audi')) return Audi;
        if (name.includes('볼보') || name.includes('volvo')) return Volvo;
        if (name.includes('토요타') || name.includes('toyota')) return Toyota;
        if (name.includes('닛산') || name.includes('nissan')) return Nissan;

        return Ford; // 매칭되는게 없으면 기본값
    };

    /**
     * [개선] 마이페이지 사용자 정보 조회 함수화
     * 재사용이 가능하도록 useEffect 외부로 분리하였습니다.
     */
    const fetchUserInfo = () => {
        const xhr = new XMLHttpRequest();
        xhr.onreadystatechange = () => {
            if (xhr.readyState !== XMLHttpRequest.DONE) return;
            if (xhr.status < 200 || xhr.status >= 400) {
                setIsLoggedIn(false);
                return;
            }
            try {
                const data = JSON.parse(xhr.responseText);
                if (data.result === "success") {
                    setIsLoggedIn(true);
                    setUser(data.user);
                } else {
                    setIsLoggedIn(false);
                }
            } catch (e) {
                console.error("JSON Parsing Error:", e);
                setIsLoggedIn(false);
            }
        };
        xhr.open('GET', '/mypage/info');
        xhr.withCredentials = true;
        xhr.send();
    };

    // 초기 로드 시 실행
    useEffect(() => {
        fetchUserInfo();
    }, []);

    /**
     * [추가] 이미지 즉시 업로드 핸들러
     * 이미지 클릭 시 인증 없이 프로필 사진만 즉시 업데이트합니다.
     */
    const handleImageClickUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const fd = new FormData();
        fd.append('profileImage', file);
        fd.append('email', user.email);
        // 비밀번호와 현재비밀번호는 빈 값을 보내 사진만 수정함을 서버에 알림
        fd.append('password', "");
        fd.append('currentPassword', "");

        const xhr = new XMLHttpRequest();
        xhr.onreadystatechange = () => {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const data = JSON.parse(xhr.responseText);
                        if (data.result === "success") {
                            fetchUserInfo(); // 화면 갱신
                        }
                    } catch (e) {
                        console.error("Parse Error");
                    }
                }
            }
        };
        xhr.open('POST', '/mypage/update');
        xhr.withCredentials = true;
        xhr.send(fd);
    };


    // 탈퇴 실제 처리 핸들러 (alert -> showAlert 교체)
    const handleWithdrawConfirm = () => {
        const xhr = new XMLHttpRequest();

        xhr.onreadystatechange = () => {
            if (xhr.readyState !== XMLHttpRequest.DONE) return;

            if (xhr.status >= 200 && xhr.status < 400) {
                try {
                    const data = JSON.parse(xhr.responseText);

                    // resolveResult 응답 규격인 "success" 확인
                    if (data.result === "success") {
                        setActiveModal(null); // 모달 닫기

                        // 커스텀 알림창 띄우기
                        showAlert(
                            "탈퇴 처리 완료",
                            "회원 탈퇴가 정상적으로 처리되었습니다.\n메인 화면으로 이동합니다.",
                            () => {
                                window.location.href = "/"; // 메인으로 리다이렉트
                            }
                        );
                    } else {
                        showAlert("탈퇴 실패", "탈퇴 처리 중 오류가 발생했습니다.");
                    }
                } catch (e) {
                    console.error("JSON 파싱 에러:", e);
                }
            } else {
                showAlert("서버 오류", "네트워크 상태를 확인해 주세요.");
            }
        };

        // DELETE 메서드로 요청 전송
        xhr.open('DELETE', '/user/withdraw');
        xhr.withCredentials = true; // 세션 정보 유지를 위해 필수
        xhr.send();
    };


    // 비로그인 상태 화면
    if (!isLoggedIn) {
        return (
            <div className="mypage-wrapper">
                <div className="auth-header-layer">
                    <Header isBlack={true}/>
                </div>

                <div className="guest-container">
                    <div className="guest-box">
                        <h2>로그인이 필요한 서비스입니다.</h2>

                        <p>
                            COMMIT CAR.의 회원이 되시면 내 차에 딱 맞는
                            <br/>
                            맞춤형 정비 알림과 예약 관리 서비스를 이용하실 수 있습니다.
                        </p>

                        <div className="guest-buttons">

                            {/* 로그인 이동 */}
                            <Link to="/login" className="btn-login">
                                로그인
                            </Link>

                            {/* 회원가입 이동 */}
                            <Link to="/register" className="btn-signup">
                                회원가입
                            </Link>

                        </div>
                    </div>
                </div>
            </div>
        );
    }


    // 로그인 상태 화면
    return (
        <div className="mypage-wrapper">

            <div className="auth-header-layer">
                <Header isBlack={true}/>
            </div>

            <main className="mypage-main">

                {/* 좌측 패널 */}
                <section className="left-panel">

                    <div className="car-header">
                        {/* [수정] 텍스트 대신 임포트한 브랜드 로고 이미지 동적 출력 */}
                        <div className="brand-logo-container">
                            <img
                                src={getBrandLogo(user?.brandName)}
                                alt={user?.brandName || "brand"}
                                className="brand-logo-img"
                            />
                        </div>
                        <h1 className="car-name">{user?.carNumber || "MUSTANG"}</h1>
                    </div>

                    {/* [수정] 프로필 이미지 클릭 시 파일 탐색기 즉시 실행 및 캐시 방지 적용 */}
                    <div className="car-image-container" onClick={() => fileInputRef.current.click()} style={{ cursor: 'pointer' }}>
                        <img
                            src={user?.profileImage
                                ? `${user.profileImage}?t=${new Date().getTime()}`
                                : carImage
                            }
                            alt="Profile"
                            className="car-image"
                            onError={(e) => { e.target.src = carImage; }}
                        />
                        {/* 숨겨진 파일 인풋 (실제 탐색기를 여는 역할) */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageClickUpload}
                            accept="image/*"
                            style={{ display: 'none' }}
                        />
                    </div>

                    <div className="left-tabs-container">

                        <div className="tabs">

                            <button
                                className={`tab-btn ${leftTab === 'account' ? 'active-account' : ''}`}
                                onClick={() => setLeftTab('account')}
                            >
                                ACCOUNT
                            </button>

                            <button
                                className={`tab-btn ${leftTab === 'check' ? 'active-check' : ''}`}
                                onClick={() => setLeftTab('check')}
                            >
                                다음 점검
                            </button>

                            <button
                                className={`tab-btn ${leftTab === 'replace' ? 'active-replace' : ''}`}
                                onClick={() => setLeftTab('replace')}
                            >
                                다음 교체
                            </button>

                        </div>

                        <div className={`tab-content left-content-${leftTab}`}>

                            {/* ACCOUNT */}
                            {leftTab === 'account' && (
                                <div className="account-info">

                                    <div className="info-header">

                                        <h3>
                                            {/* [수정] 서버 데이터 modelName과 brandName 연동 */}
                                            {user?.brandName || "브랜드 정보 없음"} {user?.modelName ? `(${user.modelName})` : ""} / {user?.name}
                                        </h3>

                                        <div className="info-actions">
                                            {/* 버튼 클릭 시 activeModal 상태 변경 */}
                                            <button onClick={() => setActiveModal('withdraw')}>탈퇴</button>
                                            <button onClick={() => setActiveModal('editChoice')}>수정</button>
                                        </div>

                                    </div>

                                    {/* DB 컬럼명 phone에 맞춰 데이터 출력 */}
                                    <p>{user?.phone || "연락처 정보 없음"}</p>
                                    <p>{user?.email}</p>

                                    <p>최근 점검 : 2026-02-05</p>
                                    <p>타이어교체 : 2026-02-05</p>

                                </div>
                            )}


                            {/* 다음 점검 */}
                            {leftTab === 'check' && (
                                <div className="check-info">

                                    <h3>성능 및 안전 (Performance)</h3>

                                    <p>배터리 전압 : 2026-01-10 / 상태: 정상 (12.6V)</p>
                                    <p>와이퍼 블레이드 : 2026-02-01 / 상태: 양호</p>
                                    <p>브레이크 액 : 2024-12-05 / 다음 점검: 2026-12-05</p>
                                    <p>냉각수 (부동액) : 2025-11-20 / 상태: 정상</p>

                                </div>
                            )}


                            {/* 다음 교체 */}
                            {leftTab === 'replace' && (
                                <div className="replace-info">

                                    <h3>필수 소모품 (Essential)</h3>

                                    <p>엔진오일 교체 : 2026-02-05 / 다음 교체: 15,000km</p>
                                    <p>브레이크 패드 : 2025-11-20 / 상태: 양호</p>
                                    <p>에어컨 필터 : 2025-08-15 / 점검 필요</p>
                                    <p>브레이크 오일 : 2024-05-22 / 교체 권장</p>

                                </div>
                            )}

                        </div>
                    </div>
                </section>



                {/* 우측 패널 */}
                <section className="right-panel">

                    <div className="tabs right-tabs">

                        <button
                            className={`tab-btn right-tab-btn ${rightTab === 'reservation' ? 'active' : ''}`}
                            onClick={() => setRightTab('reservation')}
                        >
                            Reservation
                        </button>

                        <button
                            className={`tab-btn right-tab-btn ${rightTab === 'history' ? 'active' : ''}`}
                            onClick={() => setRightTab('history')}
                        >
                            History
                        </button>

                    </div>



                    <div className="right-content">

                        {/* 예약 */}
                        {rightTab === 'reservation' && (
                            <div className="reservation-section">

                                {/* 달력 */}
                                <div className="calendar-mock">

                                    <div className="cal-header">
                                        <span>2월</span>
                                        <span>2026</span>
                                    </div>

                                    <div className="cal-grid">

                                        <div className="day-name">S</div>
                                        <div className="day-name">M</div>
                                        <div className="day-name">T</div>
                                        <div className="day-name">W</div>
                                        <div className="day-name">T</div>
                                        <div className="day-name">F</div>
                                        <div className="day-name">S</div>

                                        <div className="day empty"></div>
                                        <div className="day">1</div>
                                        <div className="day">2</div>
                                        <div className="day">3</div>
                                        <div className="day">4</div>

                                        <div className="day active-day">
                                            5
                                            <span className="time-mark">am 10:00</span>
                                        </div>

                                        <div className="day">6</div>
                                        <div className="day">7</div>
                                        <div className="day">8</div>
                                        <div className="day">9</div>
                                        <div className="day">10</div>
                                        <div className="day">11</div>
                                        <div className="day">12</div>
                                        <div className="day">13</div>
                                        <div className="day">14</div>
                                        <div className="day">15</div>
                                        <div className="day">16</div>
                                        <div className="day">17</div>
                                        <div className="day">18</div>
                                        <div className="day">19</div>
                                        <div className="day">20</div>
                                        <div className="day">21</div>
                                        <div className="day">22</div>
                                        <div className="day">23</div>
                                        <div className="day">24</div>
                                        <div className="day">25</div>
                                        <div className="day">26</div>
                                        <div className="day">27</div>
                                        <div className="day">28</div>
                                        <div className="day">29</div>
                                        <div className="day">30</div>

                                        <div className="day empty"></div>
                                        <div className="day empty"></div>
                                        <div className="day empty"></div>
                                        <div className="day empty"></div>

                                    </div>
                                </div>


                                {/* 예약 상세 */}
                                <div className="reservation-detail">

                                    <h4 className="shop-name">
                                        대구 수성구 지범로 41-4 현대그린서비스
                                    </h4>

                                    <p className="shop-phone">
                                        0507-1441-0012
                                    </p>

                                    <div className="repair-images">
                                        <img src={repairImageUrl} alt="repair1"/>
                                        <img src={repairImageUrl} alt="repair2"/>
                                    </div>

                                    <div className="repair-desc">
                                        <p>수리부위 : 앞범퍼, 후드</p>
                                        <p>수리기간 : 5일 소요</p>
                                        <p>수리방식 : 보험 수리(피해자)</p>
                                    </div>

                                    <div className="res-actions">
                                        <button>예약 취소</button>
                                        <button>예약 변경</button>
                                    </div>

                                </div>

                            </div>
                        )}


                        {/* 히스토리 */}
                        {rightTab === 'history' && (
                            <div className="history-section">

                                <div className="history-card">

                                    <div className="history-header">
                                        <h2>2026-02-05</h2>
                                        <span className="tag-type">보험 수리</span>
                                        {/* [수정] 버튼 클릭 시 activeModal을 review로 변경 */}
                                        <button className="btn-review" onClick={() => setActiveModal('review')}>
                                            후기 작성
                                        </button>
                                    </div>

                                    <h4 className="shop-name">
                                        대구 수성구 지범로 41-4 현대그린서비스
                                    </h4>

                                    <p className="shop-phone">
                                        0507-1441-0012
                                    </p>

                                    <div className="repair-images">
                                        <img src={repairImageUrl} alt="repair1"/>
                                        <img src={repairImageUrl} alt="repair2"/>
                                    </div>

                                    <div className="repair-desc">
                                        <p>수리부위 : 앞범퍼, 후드</p>
                                        <p>수리기간 : 5일 소요</p>
                                        <p>수리방식 : 보험 수리(피해자)</p>
                                    </div>

                                </div>

                            </div>
                        )}

                    </div>
                </section>

            </main>

            {/* 모달 컴포넌트 렌더링 영역 */}

            {/* 1. 탈퇴 확인 모달 */}
            {activeModal === 'withdraw' && (
                <WithdrawModal
                    onClose={() => setActiveModal(null)}
                    onConfirm={handleWithdrawConfirm}
                />
            )}

            {/* 2. 수정 항목 선택 모달 */}
            {activeModal === 'editChoice' && (
                <EditChoiceModal
                    onClose={() => setActiveModal(null)}
                    onSelectVehicle={() => setActiveModal('vehicleEdit')}
                    onSelectPersonal={() => setActiveModal('personalEdit')}
                />
            )}

            {/* 3. 차량 정보 수정 모달 [개선]
                수정 성공 시 데이터 갱신을 위해 fetchUserInfo를 onSuccess로 전달합니다.
            */}
            {activeModal === 'vehicleEdit' && (
                <VehicleEditModal
                    onClose={() => setActiveModal(null)}
                    onSuccess={() => {
                        fetchUserInfo(); // 데이터 새로고침
                        setActiveModal(null);
                    }}
                />
            )}

            {/* 4. 개인정보 수정 모달 [개선]
                이미지 변경 후 즉시 반영을 위해 onSuccess 콜백 추가
            */}
            {activeModal === 'personalEdit' && (
                <PersonalInfoEditModal
                    onClose={() => setActiveModal(null)}
                    onSuccess={() => {
                        fetchUserInfo(); // 데이터 새로고침
                        setActiveModal(null);
                    }}
                />
            )}

            {/* 5. 후기 작성 모달 [추가] */}
            {activeModal === 'review' && (
                <ReviewModal
                    onClose={() => setActiveModal(null)}
                />
            )}

            {/* 6. 커스텀 알림 모달 */}
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

export default MyPage;