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

    const statusReservations = (reservations || [])
        .filter(r => r.status === 'PENDING' || r.status === 'APPROVED')
        .sort((a, b) => new Date(b.reservedAt) - new Date(a.reservedAt))
        .slice(0, 5);

    const completedHistory = (reservations || [])
        .filter(r => r.status === 'COMPLETED')
        .sort((a, b) => new Date(b.reservedAt) - new Date(a.reservedAt))
        .slice(0, 5);

    const canceledReservations = (reservations || [])
        .filter(r => r.status === 'CANCELED')
        .sort((a, b) => new Date(b.reservedAt) - new Date(a.reservedAt))
        .slice(0, 5);

    const latestComplete = completedHistory.length > 0 ? completedHistory[0] : null;

    const headerCarImage = latestComplete && latestComplete.image1
        ? `http://localhost:8080${latestComplete.image1}`
        : carImage;
    const [editingReservation, setEditingReservation] = useState(null);
    //리뷰 모달에 넘겨줄 데이터를 저장할 바구니
    const [selectedHistory, setSelectedHistory] = useState(null);

    // [개선] 백엔드에서 계산된 점검/교체 데이터를 저장할 상태
    const [maintenanceData, setMaintenanceData] = useState([]);

    // [신규] 정비 입력 폼 및 슬라이드 인덱스 상태
    const [currentItemIndex, setCurrentItemIndex] = useState(0);
    // 상단 useState 모여있는 곳에 추가
    const [resSlideIndex, setResSlideIndex] = useState(0);
    const [formDate, setFormDate] = useState("");
    const [formMileage, setFormMileage] = useState("");


    // 좌측 탭 상태
    const [leftTab, setLeftTab] = useState('account');

    // 우측 탭 상태
    const [rightTab, setRightTab] = useState('status');

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
     * [개선] 주행거리 기반 소모품 점검/교체 데이터 조회 함수
     */
    const fetchMaintenanceData = () => {
        const xhr = new XMLHttpRequest();
        xhr.onreadystatechange = () => {
            if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
                try {
                    const data = JSON.parse(xhr.responseText);
                    if (data.result === "success") {
                        setMaintenanceData(data.maintenance);
                    }
                } catch (e) {
                    console.error("Maintenance Parsing Error:", e);
                }
            }
        };
        xhr.open('GET', '/mypage/maintenance');
        xhr.withCredentials = true;
        xhr.send();
    };

    /**
     * [개선] 정비 기록 업데이트 핸들러 (날짜/거리 통합 유효성 검증)
     */
    const handleMaintenanceUpdate = () => {
        const item = maintenanceData[currentItemIndex];
        const inputMileage = parseInt(formMileage);
        const inputDate = new Date(formDate);
        const today = new Date();

        // 1. 공백 체크
        if (!formDate || !formMileage) {
            showAlert("입력 오류", "정비 날짜와 주행거리를 모두 입력해주세요.");
            return;
        }

        // 2. 미래 날짜 체크
        if (inputDate > today) {
            showAlert("날짜 오류", "미래의 날짜는 정비 기록으로 등록할 수 없습니다.");
            return;
        }

        // 3. 현재 차량 누적 주행거리 초과 체크
        if (inputMileage > user.mileage) {
            showAlert("거리 오류", `입력 거리가 현재 차량 총 주행거리(${user.mileage.toLocaleString()}km)보다 클 수 없습니다.`);
            return;
        }

        // 4. 이전 기록보다 낮은지 체크 (데이터 정합성)
        if (item.lastServiceMileage && inputMileage < item.lastServiceMileage) {
            showAlert("거리 오류", `이전 기록(${item.lastServiceMileage.toLocaleString()}km)보다 낮은 거리는 입력할 수 없습니다.`);
            return;
        }

        const xhr = new XMLHttpRequest();
        xhr.onreadystatechange = () => {
            if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
                showAlert("저장 완료", `${item.itemName} 정비 기록이 업데이트 되었습니다.`);
                setFormDate("");
                setFormMileage("");
                fetchMaintenanceData(); // 화면 갱신
            }
        };
        xhr.open('POST', '/mypage/maintenance/manual');
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.withCredentials = true;
        xhr.send(JSON.stringify({
            email: user.email,
            itemName: item.itemName,
            lastDate: formDate,
            lastMileage: inputMileage
        }));
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
                    // 유저 정보 로드 성공 시 부가 데이터 로드
                    fetchReservations(data.user.email);
                    fetchMaintenanceData(); // [추가] 점검 데이터 동시 로드
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
                                정비 기록 입력
                            </button>

                            <button
                                className={`tab-btn ${leftTab === 'replace' ? 'active-replace' : ''}`}
                                onClick={() => setLeftTab('replace')}
                            >
                                다음 교체
                            </button>

                        </div>

                        <div className={`tab-content left-content-${leftTab}`}>

                            {/* ACCOUNT 탭 콘텐츠 영역 (하드코딩 제거 및 실제 데이터 연동) */}
                            {leftTab === 'account' && (
                                <div className="account-info">

                                    <div className="info-header">
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

                                    {/* [수정] 하드코딩된 날짜 대신 History 기반 최근 정비 날짜 출력 */}
                                    <p>최근 정비 : {latestComplete ? new Date(latestComplete.reservedAt).toLocaleDateString() : "이력 없음"}</p>
                                    <p>누적 주행거리 : {user?.mileage?.toLocaleString() || 0} km</p>
                                </div>
                            )}


                            {leftTab === 'check' && (
                                <div className="check-info-slider">
                                    <div className="slider-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                        <h3 style={{ margin: 0 }}>정비 기록 입력</h3>
                                        <span className="item-counter" style={{ fontSize: '0.85rem', color: '#888', fontWeight: 'bold' }}>
                {currentItemIndex + 1} / {maintenanceData.length}
            </span>
                                    </div>

                                    {maintenanceData.length > 0 ? (
                                        <div className="slider-item-card" style={{ border: '1px solid #eee', padding: '20px', borderRadius: '12px', background: '#fff' }}>
                                            {/* 상단 항목 정보 패널 */}
                                            <div className="item-status-summary" style={{ marginBottom: '20px', padding: '15px', background: '#f9f9f9', borderRadius: '8px' }}>
                    <span className="category-badge" style={{ background: '#e0e0e0', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem' }}>
                        {maintenanceData[currentItemIndex].category}
                    </span>
                                                <h4 style={{ fontSize: '1.1rem', margin: '8px 0' }}>{maintenanceData[currentItemIndex].itemName}</h4>
                                                <p style={{ fontSize: '0.85rem', color: '#666' }}>
                                                    현재 상태: <span style={{
                                                    fontWeight: 'bold',
                                                    color: maintenanceData[currentItemIndex].status === '정상' ? '#2ecc71' : (maintenanceData[currentItemIndex].status === '주의' ? '#f1c40f' : '#e74c3c')
                                                }}>{maintenanceData[currentItemIndex].status}</span>
                                                </p>
                                            </div>

                                            {/* [개선] 조건부 렌더링: 정상 상태일 때는 캡션 노출 및 입력 차단 */}
                                            {maintenanceData[currentItemIndex].status === '정상' ? (
                                                <div className="status-caption-box" style={{
                                                    padding: '30px 10px',
                                                    textAlign: 'center',
                                                    background: '#f8f9fa',
                                                    borderRadius: '8px',
                                                    border: '1px dashed #ccc'
                                                }}>
                                                    <p style={{ fontSize: '0.9rem', color: '#555', lineHeight: '1.5', margin: 0 }}>
                                                        현재 이 항목은 <strong>정상 상태</strong>입니다.<br/>
                                                        추가 정비 기록은 상태가 '주의'로 변경된 후에<br/>
                                                        입력하실 수 있습니다.
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="manual-input-form">
                                                    <div style={{ marginBottom: '12px' }}>
                                                        <label style={{ display: 'block', fontSize: '0.75rem', color: '#888', marginBottom: '4px' }}>마지막 정비 날짜</label>
                                                        <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} max={new Date().toISOString().split("T")[0]} />
                                                    </div>
                                                    <div style={{ marginBottom: '20px' }}>
                                                        <label style={{ display: 'block', fontSize: '0.75rem', color: '#888', marginBottom: '4px' }}>정비 당시 주행거리 (km)</label>
                                                        <input type="number" value={formMileage} placeholder="숫자만 입력" onChange={(e) => setFormMileage(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
                                                    </div>
                                                    <button onClick={handleMaintenanceUpdate} style={{ width: '100%', padding: '12px', background: '#000', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>기록 저장</button>
                                                </div>
                                            )}

                                            {/* 슬라이드 컨트롤러 */}
                                            <div className="slider-controls" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '25px', gap: '10px' }}>
                                                <button disabled={currentItemIndex === 0} onClick={() => { setCurrentItemIndex(prev => prev - 1); setFormDate(""); setFormMileage(""); }} style={{ flex: 1, padding: '10px', background: '#eee', border: 'none', borderRadius: '4px', cursor: 'pointer', opacity: currentItemIndex === 0 ? 0.3 : 1 }}>이전</button>
                                                <button disabled={currentItemIndex === maintenanceData.length - 1} onClick={() => { setCurrentItemIndex(prev => prev + 1); setFormDate(""); setFormMileage(""); }} style={{ flex: 1, padding: '10px', background: '#eee', border: 'none', borderRadius: '4px', cursor: 'pointer', opacity: currentItemIndex === maintenanceData.length - 1 ? 0.3 : 1 }}>다음</button>
                                            </div>
                                        </div>
                                    ) : <p className="no-data">데이터를 로드 중입니다...</p>}
                                </div>
                            )}


                            {/* 다음 교체 (그래프 논리 및 UX 개선) */}
                            {leftTab === 'replace' && (
                                <div className="replace-info-slider">
                                    <div className="slider-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                        <h3 style={{ margin: 0 }}>다음 교체 (Essential)</h3>
                                        <span className="item-counter" style={{ fontSize: '0.85rem', color: '#888', fontWeight: 'bold' }}>
                {currentItemIndex + 1} / {maintenanceData.length}
            </span>
                                    </div>

                                    {maintenanceData.length > 0 ? (
                                        <div className="slider-item-card" style={{ border: '1px solid #eee', padding: '20px', borderRadius: '12px', background: '#fff' }}>
                                            {/* 현재 인덱스의 아이템 데이터 추출 */}
                                            {(() => {
                                                const item = maintenanceData[currentItemIndex];
                                                const isNoData = item.lastServiceDate === "기록 없음";
                                                const isBrandNew = !isNoData && item.maintenanceProgress === 0;

                                                return (
                                                    <>
                                                        <div className="replace-item-info" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <span className="item-name" style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                                    {item.itemName} {isBrandNew && "✨"}
                                </span>
                                                            <span className="item-percent" style={{
                                                                fontSize: '1rem',
                                                                fontWeight: 'bold',
                                                                color: isNoData ? '#ccc' : (isBrandNew ? '#2ecc71' : '#333')
                                                            }}>
                                    {isNoData ? "미등록" : `${item.maintenanceProgress}%`}
                                </span>
                                                        </div>

                                                        {/* 프로그레스 바 */}
                                                        <div className="progress-container" style={{
                                                            width: '100%',
                                                            height: '14px',
                                                            backgroundColor: '#f0f0f0',
                                                            borderRadius: '7px',
                                                            overflow: 'hidden',
                                                            marginBottom: '15px',
                                                            border: isNoData ? '1px dashed #ccc' : 'none'
                                                        }}>
                                                            <div className="progress-fill" style={{
                                                                width: isNoData ? '0%' : (isBrandNew ? '5%' : `${item.maintenanceProgress}%`),
                                                                height: '100%',
                                                                backgroundColor: isNoData ? 'transparent' : (isBrandNew ? '#2ecc71' : (item.status === '정상' ? '#2ecc71' : (item.status === '주의' ? '#f1c40f' : '#e74c3c'))),
                                                                transition: 'width 0.5s ease-in-out'
                                                            }}></div>
                                                        </div>

                                                        {/* 상세 수치 정보 섹션 */}
                                                        <div className="replace-detail-box" style={{ background: '#f9f9f9', padding: '15px', borderRadius: '8px', fontSize: '0.85rem' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                                <span style={{ color: '#888' }}>최근 정비</span>
                                                                <span style={{ fontWeight: 'bold' }}>
                                        {isNoData ? "이력 없음" : `${item.lastServiceMileage?.toLocaleString()} km`}
                                    </span>
                                                            </div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                                <span style={{ color: '#888' }}>교체 주기</span>
                                                                <span>{item.replaceInterval?.toLocaleString()} km</span>
                                                            </div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #eee', paddingTop: '8px', marginTop: '8px' }}>
                                                                <span style={{ color: '#888' }}>남은 거리</span>
                                                                <span style={{ color: isBrandNew ? '#2ecc71' : '#e74c3c', fontWeight: 'bold' }}>
                                        {isNoData ? "-" : `${item.remainingMileage?.toLocaleString()} km`}
                                    </span>
                                                            </div>
                                                        </div>
                                                    </>
                                                );
                                            })()}

                                            {/* 슬라이드 컨트롤러 */}
                                            <div className="slider-controls" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', gap: '10px' }}>
                                                <button
                                                    disabled={currentItemIndex === 0}
                                                    onClick={() => setCurrentItemIndex(prev => prev - 1)}
                                                    style={{ flex: 1, padding: '10px', background: '#eee', border: 'none', borderRadius: '4px', cursor: 'pointer', opacity: currentItemIndex === 0 ? 0.3 : 1 }}
                                                >
                                                    이전
                                                </button>
                                                <button
                                                    disabled={currentItemIndex === maintenanceData.length - 1}
                                                    onClick={() => setCurrentItemIndex(prev => prev + 1)}
                                                    style={{ flex: 1, padding: '10px', background: '#eee', border: 'none', borderRadius: '4px', cursor: 'pointer', opacity: currentItemIndex === maintenanceData.length - 1 ? 0.3 : 1 }}
                                                >
                                                    다음
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="no-data">교체 데이터가 없습니다.</p>
                                    )}
                                </div>
                            )}

                        </div>
                    </div>
                </section>


                {/* 우측 패널 */}
                <section className="right-panel">
                    <div className="tabs right-tabs">
                        {/* 탭 버튼 3개로 확장 */}
                        <button
                            // 초기값이 'status'이므로 처음 진입 시 이 버튼에 'active' 클래스가 붙음
                            className={`tab-btn right-tab-btn ${rightTab === 'status' ? 'active' : ''}`}
                            onClick={() => setRightTab('status')}
                        >
                            예약 현황
                        </button>
                        <button
                            className={`tab-btn right-tab-btn ${rightTab === 'history' ? 'active' : ''}`}
                            onClick={() => setRightTab('history')}
                        >
                            정비 완료
                        </button>
                        <button
                            className={`tab-btn right-tab-btn ${rightTab === 'cancel' ? 'active' : ''}`}
                            onClick={() => setRightTab('cancel')}
                        >
                            취소 내역
                        </button>
                    </div>

                    <div className="right-content">
                        {/* 1. 예약 현황 탭 */}
                        {rightTab === 'status' && (
                            <div className="reservation-section">
                                <div className="calendar-mock" style={{ marginBottom: '25px' }}>
                                    <CustomCalendar reservations={reservations} isModal={false} />
                                </div>

                                {statusReservations.length === 0 ? (
                                    <div className="no-reservation-info" style={{ padding: '40px 0', textAlign: 'center', borderTop: '1px solid #eee', color: '#999' }}>
                                        현재 진행 중인 예약이 없습니다.
                                    </div>
                                ) : (
                                    <div className="reservation-slider-container" style={{ borderTop: '1px solid #eee', paddingTop: '20px' }}>
                                        {/* 카드 상단: 현재 순서 표시 */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>예약 내역 확인</span>
                                            <span style={{ fontSize: '0.75rem', color: '#888' }}>{resSlideIndex + 1} / {statusReservations.length}</span>
                                        </div>

                                        {/* 현재 인덱스의 예약 카드 1장만 출력 */}
                                        <div className="res-item-container" style={{
                                            padding: '20px',
                                            background: '#f9f9f9',
                                            borderRadius: '12px',
                                            minHeight: '200px',
                                            border: '1px solid #eee'
                                        }}>
                                            <div className="reservation-detail">
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                                    <h4 style={{ margin: 0, color: '#000' }}>{statusReservations[resSlideIndex].partnerName}</h4>
                                                    <span style={{ fontSize: '0.7rem', background: '#000', color: '#fff', padding: '2px 8px', borderRadius: '4px' }}>
                                {statusReservations[resSlideIndex].status}
                            </span>
                                                </div>

                                                <div className="repair-desc" style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                                                    <p style={{ margin: '5px 0' }}><strong>일시 :</strong> {new Date(statusReservations[resSlideIndex].reservedAt).toLocaleString('ko-KR')}</p>
                                                    <p style={{ margin: '5px 0' }}><strong>분류 :</strong> {statusReservations[resSlideIndex].category}</p>
                                                    <p style={{ margin: '5px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        <strong>항목 :</strong> {statusReservations[resSlideIndex].items?.join(', ') || "선택 없음"}
                                                    </p>
                                                </div>

                                                <div className="res-actions" style={{ marginTop: '15px', display: 'flex', gap: '8px' }}>
                                                    <button
                                                        onClick={() => handleCancelReservation(statusReservations[resSlideIndex].id)}
                                                        style={{ flex: 1, padding: '8px', background: '#fff', border: '1px solid #ddd', cursor: 'pointer', fontSize: '0.8rem' }}
                                                    >
                                                        예약 취소
                                                    </button>
                                                    <button
                                                        onClick={() => { setEditingReservation({...statusReservations[resSlideIndex]}); setActiveModal('resEdit'); }}
                                                        style={{ flex: 1, padding: '8px', background: '#000', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}
                                                    >
                                                        일정 변경
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 슬라이드 컨트롤 버튼 */}
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '15px' }}>
                                            <button
                                                disabled={resSlideIndex === 0}
                                                onClick={() => setResSlideIndex(prev => prev - 1)}
                                                style={{ padding: '5px 15px', background: '#eee', border: 'none', borderRadius: '4px', cursor: resSlideIndex === 0 ? 'default' : 'pointer', opacity: resSlideIndex === 0 ? 0.4 : 1 }}
                                            >
                                                이전
                                            </button>
                                            <button
                                                disabled={resSlideIndex === statusReservations.length - 1}
                                                onClick={() => setResSlideIndex(prev => prev + 1)}
                                                style={{ padding: '5px 15px', background: '#eee', border: 'none', borderRadius: '4px', cursor: resSlideIndex === statusReservations.length - 1 ? 'default' : 'pointer', opacity: resSlideIndex === statusReservations.length - 1 ? 0.4 : 1 }}
                                            >
                                                다음
                                            </button>
                                        </div>

                                        <p style={{ fontSize: '0.7rem', color: '#bbb', textAlign: 'center', marginTop: '15px' }}>
                                            * 최대 5건의 예약까지 화살표로 넘겨보실 수 있습니다.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 2. 정비 완료 탭 (completedHistory 사용) */}
                        {rightTab === 'history' && (
                            <div className="history-section">
                                <div className="history-list">
                                    {completedHistory.length === 0 ? (
                                        <div className="no-history-info" style={{padding: '50px 0', textAlign: 'center', color: '#999'}}>
                                            완료된 정비 이력이 없습니다.
                                        </div>
                                    ) : (
                                        completedHistory.map((his) => (
                                            <div key={his.id} className="history-card-wrapper">
                                                <div className="history-card">
                                                    <div className="history-header">
                                                        <div className="date-badge">
                                                            <span className="year-month">{new Date(his.reservedAt).getFullYear()}.{String(new Date(his.reservedAt).getMonth() + 1).padStart(2, '0')}</span>
                                                            <span className="day-strong">{String(new Date(his.reservedAt).getDate()).padStart(2, '0')}</span>
                                                        </div>
                                                        <div className="header-info-main">
                                                            <div className="tag-row">
                                                                <span className="tag-type">{his.category}</span>
                                                                {!his.reviewId ? (
                                                                    <button className="btn-review" onClick={() => { setSelectedHistory(his); setActiveModal('review'); }}>후기 작성</button>
                                                                ) : (
                                                                    <div className="review-edit-group" style={{display: 'flex', gap: '5px'}}>
                                                                        <button className="btn-review-edit" onClick={() => { setSelectedHistory(his); setActiveModal('review'); }} style={{ background: '#666', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer' }}>후기 수정</button>
                                                                        <button className="btn-review-delete" onClick={() => handleDeleteReview(his.reviewId)} style={{ background: '#ff4d4d', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer' }}>후기 삭제</button>
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
                                                                <span className="value" style={{ fontWeight: 'bold', color: '#333' }}>{his.items?.join(', ') || "상세 내역 없음"}</span>
                                                            </div>
                                                            <div className="desc-item">
                                                                <span className="label">정비상태</span>
                                                                <span className="value" style={{ color: '#2ecc71', fontWeight: 'bold' }}>정비 완료</span>
                                                            </div>
                                                        </div>
                                                        {(his.image1 || his.image2) && (
                                                            <div className="history-images" style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                                                                {his.image1 && <img src={`${SERVER_URL}${his.image1}`} alt="h1" style={{ width: '60px', height: '60px', borderRadius: '4px', objectFit: 'cover' }}/>}
                                                                {his.image2 && <img src={`${SERVER_URL}${his.image2}`} alt="h2" style={{ width: '60px', height: '60px', borderRadius: '4px', objectFit: 'cover' }}/>}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="history-divider" style={{ margin: '20px 0', borderBottom: '1px solid #eee' }}></div>
                                            </div>
                                        ))
                                    )}
                                    {completedHistory.length > 0 && <p style={{fontSize: '0.75rem', color: '#bbb', textAlign: 'center'}}>* 최근 5건의 정비 이력만 표시됩니다.</p>}
                                </div>
                            </div>
                        )}

                        {/* 3. 취소 내역 탭 (canceledReservations 사용) */}
                        {rightTab === 'cancel' && (
                            <div className="cancel-section">
                                {canceledReservations.length === 0 ? (
                                    <div style={{padding: '50px 0', textAlign: 'center', color: '#999'}}>
                                        취소된 내역이 없습니다.
                                    </div>
                                ) : (
                                    <div className="cancel-list">
                                        {canceledReservations.map((can) => (
                                            <div key={can.id} style={{padding: '20px', borderBottom: '1px solid #f5f5f5', color: '#999', marginBottom: '10px'}}>
                                                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                                    <h4 style={{margin: 0, textDecoration: 'line-through'}}>{can.partnerName}</h4>
                                                    <span style={{fontSize: '0.8rem', fontWeight: 'bold'}}>CANCELED</span>
                                                </div>
                                                <p style={{fontSize: '0.85rem', margin: '8px 0'}}>일시: {new Date(can.reservedAt).toLocaleString()}</p>
                                                <p style={{fontSize: '0.85rem'}}>항목: {can.items?.join(', ') || "항목 없음"}</p>
                                            </div>
                                        ))}
                                        <p style={{fontSize: '0.75rem', color: '#bbb', textAlign: 'center', marginTop: '20px'}}>* 최근 5건의 취소 내역만 표시됩니다.</p>
                                    </div>
                                )}
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

            {/* 6. 예약 수정 모달 */}
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
                        <h2 style={{marginBottom: '20px', fontSize: '1.2rem', fontWeight: 'bold'}}>예약 일시 변경</h2>

                        {/* 1. 방문 일시 수정 (이 기능은 백엔드에서 정상 작동함) */}
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

                        {/* 2. 상세 요청사항(textarea) 대신 선택 항목(Items) 표시로 변경 */}
                        <div style={{marginBottom: '20px'}}>
                            <label style={{display: 'block', marginBottom: '5px', fontSize: '0.9rem'}}>선택한 수리 항목</label>
                            <div style={{
                                padding: '12px',
                                background: '#f9f9f9',
                                border: '1px solid #eee',
                                borderRadius: '4px',
                                fontSize: '0.85rem',
                                color: '#333',
                                lineHeight: '1.4',
                                minHeight: '60px'
                            }}>
                                {editingReservation.items && editingReservation.items.length > 0
                                    ? editingReservation.items.join(', ')
                                    : "선택된 항목이 없습니다."}
                            </div>
                            <p style={{fontSize: '0.7rem', color: '#999', marginTop: '7px'}}>
                                * 수리 항목 변경은 예약 취소 후 다시 진행해 주세요.
                            </p>
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