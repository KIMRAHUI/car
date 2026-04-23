import React, {useState, useEffect, useRef} from 'react';
import Header from '../components/header/Header.jsx';
import CustomCalendar from '../components/common/CustomCalendar.jsx';
import './MyPage.css';
import {Link} from "react-router-dom";
import carImage from '../assets/image/mypage/ProfileImage.png';

// 실제 경로와 파일명에 맞춰서 임포트 (경로: src/assets/image/modal)
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

//분리된 모달 컴포넌트들 임포트
import WithdrawModal from '../components/mypage/WithdrawModal.jsx';
import EditChoiceModal from '../components/mypage/EditChoiceModal.jsx';
import VehicleEditModal from '../components/mypage/VehicleEditModal.jsx';
import PersonalInfoEditModal from '../components/mypage/PersonalInfoEditModal.jsx';
import AuthAlertModal from '../components/auth/AuthAlertModal.jsx';
import ReviewModal from '../components/mypage/ReviewModal.jsx';

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

    // [추가] 예약 목록 및 수정 데이터 상태
    const [reservations, setReservations] = useState([]);
    const [editingReservation, setEditingReservation] = useState(null);
    //리뷰 모달에 넘겨줄 데이터를 저장할 바구니
    const [selectedHistory, setSelectedHistory] = useState(null);
    // 좌측 탭 상태
    const [leftTab, setLeftTab] = useState('account');

    // 우측 탭 상태
    const [rightTab, setRightTab] = useState('reservation');

    // 모달 렌더링 상태 관리 (null, 'withdraw', 'editChoice', 'vehicleEdit', 'personalEdit', 'review', 'resEdit')
    const [activeModal, setActiveModal] = useState(null);

    // 알림용 모달 상태 관리 (alert 대체용)
    const [alertConfig, setAlertConfig] = useState({
        show: false,
        title: '',
        message: '',
        onConfirm: null
    });

    /**
     * [수정] 이미지 경로 상수화
     * 서버의 주소와 포트를 변수로 관리하여 경로 결합 시 사용합니다.
     */
    const SERVER_URL = "http://localhost:8080";

    // 알림 모달 호출 도우미 함수
    const showAlert = (title, message, onConfirm = null) => {
        setAlertConfig({show: true, title, message, onConfirm});
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
     * [추가] 예약 목록 조회 함수
     */
    const fetchReservations = (email) => {
        const xhr = new XMLHttpRequest();
        xhr.onreadystatechange = () => {
            if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
                try {
                    const data = JSON.parse(xhr.responseText);
                    setReservations(data);
                } catch (e) {
                    console.error("Reservation Parsing Error:", e);
                }
            }
        };
        xhr.open('GET', `/service/reservation/?email=${encodeURIComponent(email)}`);
        xhr.withCredentials = true;
        xhr.send();
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
                    // 유저 정보 로드 성공 시 예약 목록도 함께 가져옴
                    fetchReservations(data.user.email);
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
     * 이미지 즉시 업로드 핸들러
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

    /**
     * [추가] 예약 취소 핸들러
     */
    const handleCancelReservation = (id) => {
        if (!window.confirm("정말로 예약을 취소하시겠습니까?")) return;

        const xhr = new XMLHttpRequest();
        xhr.onreadystatechange = () => {
            if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
                const data = JSON.parse(xhr.responseText);
                if (data.result === "success") {
                    showAlert("취소 완료", "예약이 정상적으로 취소되었습니다.");
                    fetchReservations(user.email);
                } else {
                    showAlert("취소 실패", "이미 처리되었거나 오류가 발생했습니다.");
                }
            }
        };
        xhr.open('DELETE', `/service/reservation/${id}`);
        xhr.withCredentials = true;
        xhr.send();
    };

    /**
     * [추가] 예약 수정 핸들러 (PATCH)
     */
    const handleUpdateReservation = () => {
        const xhr = new XMLHttpRequest();
        xhr.onreadystatechange = () => {
            if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
                const data = JSON.parse(xhr.responseText);
                if (data.result === "success") {
                    showAlert("수정 완료", "예약 정보가 변경되었습니다.");
                    setActiveModal(null);
                    fetchReservations(user.email);
                }
            }
        };
        xhr.open('PATCH', '/service/reservation/');
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.withCredentials = true;
        xhr.send(JSON.stringify(editingReservation));
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

    /**
     * 후기 삭제 핸들러
     */
    const handleDeleteReview = (reviewId) => {
        if (!window.confirm("작성하신 후기를 정말로 삭제하시겠습니까?")) return;

        const xhr = new XMLHttpRequest();
        xhr.onreadystatechange = () => {
            if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
                if (xhr.responseText === "success") {
                    showAlert("삭제 완료", "후기가 정상적으로 삭제되었습니다.");
                    fetchUserInfo(); // 마일리지 및 버튼 상태 동기화를 위해 재조회
                } else {
                    showAlert("삭제 실패", "후기 삭제 중 오류가 발생했습니다.");
                }
            }
        };
        xhr.open('DELETE', `/api/review/${reviewId}`);
        xhr.withCredentials = true;
        xhr.send();
    };

    // 1. 전체 예약 중 'COMPLETED'(정비 완료) 상태인 것만 골라냅니다.
    const completedHistory = reservations.filter(r => r.status === 'COMPLETED');

// 2. 가장 최근 완료된 건(배열의 첫 번째)을 가져옵니다.
    const latestComplete = completedHistory.length > 0 ? completedHistory[0] : null;

// 3. 사진이 있으면 서버 경로를 붙이고, 없으면 기본 carImage를 사용합니다.
    const headerCarImage = latestComplete && latestComplete.image1
        ? `${SERVER_URL}${latestComplete.image1}`
        : carImage;


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
                    <div className="car-image-container" onClick={() => fileInputRef.current.click()}
                         style={{cursor: 'pointer'}}>
                        <img
                            src={user?.profileImage
                                ? `${user.profileImage}?t=${new Date().getTime()}`
                                : carImage
                            }
                            alt="Profile"
                            className="car-image"
                            onError={(e) => {
                                e.target.src = carImage;
                            }}
                        />
                        {/* 숨겨진 파일 인풋 (실제 탐색기를 여는 역할) */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageClickUpload}
                            accept="image/*"
                            style={{display: 'none'}}
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

                            {/* ACCOUNT 탭 콘텐츠 영역 */}
                            {leftTab === 'account' && (
                                <div className="account-info">

                                    <div className="info-header">
                                        {/* [수정] 이 위치의 고정 아이콘을 후기 이미지로 변경 */}
                                        {/*<div className="info-car-icon-container">*/}
                                        {/*    <img*/}
                                        {/*        src={headerCarImage}*/}
                                        {/*        alt="Latest Repair"*/}
                                        {/*        className="info-car-icon"*/}
                                        {/*        style={{*/}
                                        {/*            width: '50px',       // 적절한 크기로 조절*/}
                                        {/*            height: '50px',*/}
                                        {/*            objectFit: 'cover',  // 비율 유지*/}
                                        {/*            borderRadius: '4px'  // 살짝 둥글게*/}
                                        {/*        }}*/}
                                        {/*    />*/}
                                        {/*</div>*/}

                                        <h3>
                                            {user?.brandName || "브랜드 정보 없음"} {user?.modelName ? `(${user.modelName})` : ""} / {user?.name}
                                        </h3>

                                        <div className="info-actions">
                                            <button onClick={() => setActiveModal('withdraw')}>탈퇴</button>
                                            <button onClick={() => setActiveModal('editChoice')}>수정</button>
                                        </div>
                                    </div>


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

                                {/* [개선] 캘린더 영역: 단일 정보 대신 reservations 배열 전체를 전달 */}
                                <div className="calendar-mock" style={{marginBottom: '30px'}}>
                                    <CustomCalendar
                                        // 현재 뷰 기준: 예약이 있다면 첫 번째 예약 날짜, 없다면 오늘 날짜
                                        selectedDate={null}
                                        onDateClick={null}

                                        // [수정] 중요: reservations 배열 전체를 전달하여
                                        // 달력 내부에서 모든 예약 날짜에 빨간 점을 찍을 수 있게 함
                                        reservations={reservations}

                                        isModal={false}
                                    />
                                </div>

                                {/* [개선] 하단 목록 영역: 예약 데이터에 따라 메시지 또는 리스트 출력 */}
                                {reservations.length === 0 ? (
                                    <div className="no-reservation-info"
                                         style={{padding: '50px 0', textAlign: 'center', borderTop: '1px solid #eee'}}>
                                        현재 예약된 내역이 없습니다.
                                    </div>
                                ) : (
                                    <div className="reservation-list"
                                         style={{borderTop: '1px solid #eee', paddingTop: '20px'}}>
                                        {reservations.map((res) => (
                                            <div key={res.id} className="res-item-container" style={{
                                                marginBottom: '40px',
                                                borderBottom: '1px solid #eee',
                                                paddingBottom: '20px'
                                            }}>
                                                {/* 예약 상세 */}
                                                <div className="reservation-detail">
                                                    <h4 className="res-shop-name">{res.partnerName}</h4>
                                                    <p className="shop-phone">상태: {res.status}</p>


                                                    <div className="repair-images">
                                                        {res.category !== '일반' && (
                                                            <div style={{display: 'flex', gap: '10px'}}>
                                                                {/* image1이 있을 때만 렌더링 */}
                                                                {res.image1 && (
                                                                    <img
                                                                        src={`${SERVER_URL}${res.image1}`}
                                                                        alt="repair1"
                                                                        style={{
                                                                            borderRadius: '4px',
                                                                            objectFit: 'cover',
                                                                            width: '100px',
                                                                            height: '100px'
                                                                        }}
                                                                        onError={(e) => {
                                                                            e.target.style.display = 'none';
                                                                        }}
                                                                    />
                                                                )}

                                                                {/* image2가 있을 때만 렌더링 */}
                                                                {res.image2 && (
                                                                    <img
                                                                        src={`${SERVER_URL}${res.image2}`}
                                                                        alt="repair2"
                                                                        style={{
                                                                            borderRadius: '4px',
                                                                            objectFit: 'cover',
                                                                            width: '100px',
                                                                            height: '100px'
                                                                        }}
                                                                        onError={(e) => {
                                                                            e.target.style.display = 'none';
                                                                        }}
                                                                    />
                                                                )}

                                                                {/* 사고/고장 수리인데 사진을 안 올렸을 경우만 텍스트 표시 (원치 않으시면 이 부분도 삭제 가능) */}
                                                                {!res.image1 && !res.image2 && (
                                                                    <p style={{fontSize: '0.8rem', color: '#ccc'}}>첨부된
                                                                        사진이 없습니다.</p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="repair-desc">
                                                        <p>분류 : {res.category}</p>

                                                        {/*상세 항목 리스트 출력 (쉼표로 연결 및 말줄임 처리) */}
                                                        {res.category === '일반' && (
                                                            <p className="item-ellipsis" title={res.items?.join(', ')}>
                                                                항목 : {res.items && res.items.length > 0
                                                                ? res.items.join(', ')
                                                                : "선택된 항목이 없습니다."}
                                                            </p>
                                                        )}

                                                        <p>일시 : {new Date(res.reservedAt).toLocaleString('ko-KR')}</p>

                                                        {res.category !== '일반' && (
                                                            <p>상세 : {res.description || "내용 없음"}</p>
                                                        )}

                                                    </div>
                                                    <div className="res-actions">
                                                        <button onClick={() => handleCancelReservation(res.id)}>예약 취소
                                                        </button>
                                                        <button onClick={() => {
                                                            setEditingReservation({...res});
                                                            setActiveModal('resEdit');
                                                        }}>예약 변경
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}


                        {/* 히스토리 (History) 섹션: status가 'COMPLETED'인 데이터만 출력 */}
                        {rightTab === 'history' && (
                            <div className="history-section">
                                <div className="history-list">
                                    {reservations.filter(r => r.status === 'COMPLETED').length === 0 ? (
                                        <div className="no-history-info"
                                             style={{padding: '50px 0', textAlign: 'center', color: '#999'}}>
                                            완료된 정비 이력이 없습니다.
                                        </div>
                                    ) : (
                                        reservations
                                            .filter(r => r.status === 'COMPLETED')
                                            .map((his) => (
                                                <div key={his.id} className="history-card-wrapper">
                                                    <div className="history-card">
                                                        <div className="history-header">
                                                            <div className="date-badge">
                                                                {/* 서버 날짜 데이터(reservedAt)를 연.월 / 일로 분리 */}
                                                                <span className="year-month">
                                            {new Date(his.reservedAt).getFullYear()}.{String(new Date(his.reservedAt).getMonth() + 1).padStart(2, '0')}
                                        </span>
                                                                <span className="day-strong">
                                            {String(new Date(his.reservedAt).getDate()).padStart(2, '0')}
                                        </span>
                                                            </div>
                                                            <div className="header-info-main">
                                                                <div className="tag-row">
                                                                    <span className="tag-type">{his.category}</span>
                                                                    {/* ★ 리뷰 존재 여부(his.reviewId)에 따른 버튼 분기 처리 */}
                                                                    {!his.reviewId ? (
                                                                        <button className="btn-review" onClick={() => {
                                                                            setSelectedHistory(his);
                                                                            setActiveModal('review');
                                                                        }}>
                                                                            후기 작성
                                                                        </button>
                                                                    ) : (
                                                                        <div className="review-edit-group"
                                                                             style={{display: 'flex', gap: '5px'}}>
                                                                            <button className="btn-review-edit"
                                                                                    onClick={() => {
                                                                                        setSelectedHistory(his);
                                                                                        setActiveModal('review');
                                                                                    }} style={{
                                                                                background: '#666',
                                                                                color: '#fff',
                                                                                border: 'none',
                                                                                padding: '4px 8px',
                                                                                borderRadius: '4px',
                                                                                fontSize: '0.8rem',
                                                                                cursor: 'pointer'
                                                                            }}>
                                                                                후기 수정
                                                                            </button>
                                                                            <button className="btn-review-delete"
                                                                                    onClick={() => handleDeleteReview(his.reviewId)}
                                                                                    style={{
                                                                                        background: '#ff4d4d',
                                                                                        color: '#fff',
                                                                                        border: 'none',
                                                                                        padding: '4px 8px',
                                                                                        borderRadius: '4px',
                                                                                        fontSize: '0.8rem',
                                                                                        cursor: 'pointer'
                                                                                    }}>
                                                                                후기 삭제
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <h4 className="shop-name">{his.partnerName}</h4>
                                                            </div>
                                                        </div>

                                                        <div className="history-body">
                                                            <div className="repair-desc">
                                                                <div className="desc-item">
                                                                    <span className="label">점검항목</span>
                                                                    <span className="value">
                                                {/* 일반 점검은 items 리스트를, 사고/고장은 description을 우선 출력 */}
                                                                        {his.items && his.items.length > 0
                                                                            ? his.items.join(', ')
                                                                            : (his.description || "상세 내역 없음")}
                                                                    </span>
                                                                </div>
                                                                <div className="desc-item">
                                                                    <span className="label">정비상태</span>
                                                                    <span className="value" style={{
                                                                        color: '#2ecc71',
                                                                        fontWeight: 'bold'
                                                                    }}>정비 완료</span>
                                                                </div>
                                                            </div>

                                                            {/* 완료된 정비에 첨부된 사진이 있다면 표시 (선택 사항) */}
                                                            {(his.image1 || his.image2) && (
                                                                <div className="history-images" style={{
                                                                    marginTop: '15px',
                                                                    display: 'flex',
                                                                    gap: '10px'
                                                                }}>
                                                                    {his.image1 &&
                                                                        <img src={`${SERVER_URL}${his.image1}`}
                                                                             alt="history1" style={{
                                                                            width: '60px',
                                                                            height: '60px',
                                                                            borderRadius: '4px',
                                                                            objectFit: 'cover'
                                                                        }}/>}
                                                                    {his.image2 &&
                                                                        <img src={`${SERVER_URL}${his.image2}`}
                                                                             alt="history2" style={{
                                                                            width: '60px',
                                                                            height: '60px',
                                                                            borderRadius: '4px',
                                                                            objectFit: 'cover'
                                                                        }}/>}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="history-divider" style={{
                                                        margin: '20px 0',
                                                        borderBottom: '1px solid #eee'
                                                    }}></div>
                                                </div>
                                            ))
                                    )}
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
                이미지 변경 후 즉시 반영을 위해 onSuccess 콜측 추가
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

            {/* 5. 후기 작성 모달*/}
            {activeModal === 'review' && selectedHistory && (
                <ReviewModal
                    onClose={() => {
                        setActiveModal(null);
                        setSelectedHistory(null);
                    }}
                    reservation={selectedHistory}
                    userEmail={user.email}
                    onSuccess={fetchUserInfo}
                    currentTotalKm={user.mileage}
                />
            )}

            {/* 6. 예약 수정 모달*/}
            {activeModal === 'resEdit' && editingReservation && (
                <div className="modal-overlay" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div className="modal-content"
                         style={{background: '#fff', padding: '30px', borderRadius: '10px', width: '400px'}}>
                        <h2 style={{marginBottom: '20px', fontSize: '1.2rem', fontWeight: 'bold'}}>예약 변경</h2>
                        <div style={{marginBottom: '15px'}}>
                            <label style={{display: 'block', marginBottom: '5px', fontSize: '0.9rem'}}>방문 일시</label>
                            <input
                                type="datetime-local"
                                style={{width: '100%', padding: '10px', border: '1px solid #ddd'}}
                                value={editingReservation.reservedAt.substring(0, 16)}
                                onChange={(e) => setEditingReservation({
                                    ...editingReservation,
                                    reservedAt: e.target.value
                                })}
                            />
                        </div>
                        <div style={{marginBottom: '20px'}}>
                            <label style={{display: 'block', marginBottom: '5px', fontSize: '0.9rem'}}>상세 요청사항</label>
                            <textarea
                                style={{
                                    width: '100%',
                                    height: '100px',
                                    padding: '10px',
                                    border: '1px solid #ddd',
                                    resize: 'none'
                                }}
                                value={editingReservation.description}
                                onChange={(e) => setEditingReservation({
                                    ...editingReservation,
                                    description: e.target.value
                                })}
                            />
                        </div>
                        <div style={{display: 'flex', justifyContent: 'flex-end', gap: '10px'}}>
                            <button onClick={handleUpdateReservation} style={{
                                padding: '10px 20px',
                                background: '#000',
                                color: '#fff',
                                border: 'none',
                                cursor: 'pointer'
                            }}>변경 저장
                            </button>
                            <button onClick={() => setActiveModal(null)} style={{
                                padding: '10px 20px',
                                background: '#eee',
                                border: 'none',
                                cursor: 'pointer'
                            }}>취소
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 7. 커스텀 알림 모달 */}
            {alertConfig.show && (
                <AuthAlertModal
                    title={alertConfig.title}
                    message={alertConfig.message}
                    onClose={() => {
                        if (alertConfig.onConfirm) alertConfig.onConfirm();
                        setAlertConfig({...alertConfig, show: false});
                    }}
                />
            )}
        </div>
    );
};

export default MyPage;