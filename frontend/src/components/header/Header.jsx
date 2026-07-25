import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Header.css';
//커스텀 로그아웃 모달 임포트
import LogoutConfirmModal from './LogoutConfirmModal.jsx';

const Header = ({ isBlack }) => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    //실시간 시간 상태 관리
    const [currentTime, setCurrentTime] = useState(new Date());

    //모달 오픈 상태 관리
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    useEffect(() => {
        const checkLoginStatus = () => {
            const xhr = new XMLHttpRequest();
            xhr.onreadystatechange = () => {
                if (xhr.readyState === XMLHttpRequest.DONE) {
                    if (xhr.status === 200) {
                        try {
                            const response = JSON.parse(xhr.responseText);
                            if (response.isLoggedIn) {
                                setIsLoggedIn(true);
                            } else {
                                setIsLoggedIn(false);
                            }
                        } catch (e) {
                            console.error("JSON 파싱 에러:", e);
                        }
                    }
                }
            };

            //배포 환경 대응: 도메인(localhost:8080)을 제거하고 상대 경로를 사용
            xhr.open('GET', '/user/status', true);
            xhr.withCredentials = true;
            xhr.send();
        };

        checkLoginStatus();

        //1초마다 시간 업데이트 타이머
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        const handleScroll = () => {
            if (window.scrollY >= window.innerHeight) setIsScrolled(true);
            else setIsScrolled(false);
        };

        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
            clearInterval(timer); // 언마운트 시 타이머 정리
        };
    }, []);

    /* --- 로그아웃 버튼 클릭 시 모달만 띄움 --- */
    const openLogoutModal = (e) => {
        e.preventDefault();
        setShowLogoutModal(true);
    };

    /* --- 모달에서 '확인' 눌렀을 때 실제 로그아웃 처리 --- */
    const handleLogoutConfirm = () => {
        //로그아웃 주소 역시 상대 경로로 수정하여 현재 도메인 세션을 종료합니다.
        window.location.href = "/user/logout";
    };

    // 시간 포맷팅 헬퍼
    const formatTime = () => {
        const hours = currentTime.getHours();
        const minutes = currentTime.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12; // 0시를 12시로 표시
        const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;

        return {
            ampm,
            timeStr: `${displayHours} : ${displayMinutes}`
        };
    };

    const { ampm, timeStr } = formatTime();

    return (
        <header className={`header ${isScrolled ? 'scrolled' : ''} ${isBlack ? 'black-header' : ''}`}>
            <div className="header-left">
                <Link to="/" className="logo" style={{ textDecoration: 'none', color: 'inherit' }}>
                    COMMIT<br />CAR.
                </Link>
                <div className="time">
                    {ampm}<br />{timeStr}
                </div>
            </div>
            <nav className="header-right">
                <ul>
                    <li>
                        <Link to="/service" style={{ textDecoration: 'none', color: 'inherit' }}>
                            SERVICE
                        </Link>
                    </li>
                    <li>
                        <Link to="/mypage" style={{ textDecoration: 'none', color: 'inherit' }}>
                            MY PAGE
                        </Link>
                    </li>
                    <li>
                        {isLoggedIn ? (
                            <a
                                href="#"
                                onClick={openLogoutModal}
                                style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
                            >
                                LOGOUT
                            </a>
                        ) : (
                            <Link to="/login" style={{ textDecoration: 'none', color: 'inherit' }}>
                                LOGIN
                            </Link>
                        )}
                    </li>
                </ul>
            </nav>

            {/*로그아웃 모달 렌더링 */}
            {showLogoutModal && (
                <LogoutConfirmModal
                    onClose={() => setShowLogoutModal(false)}
                    onConfirm={handleLogoutConfirm}
                />
            )}
        </header>
    );
};

export default Header;