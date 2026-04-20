import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Header.css';
// [추가] 커스텀 로그아웃 모달 임포트
import LogoutConfirmModal from './LogoutConfirmModal.jsx';

const Header = ({ isBlack }) => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // [추가] 모달 오픈 상태 관리
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

            xhr.open('GET', 'http://localhost:8080/user/status', true);
            xhr.withCredentials = true;
            xhr.send();
        };

        checkLoginStatus();

        const handleScroll = () => {
            if (window.scrollY >= window.innerHeight) setIsScrolled(true);
            else setIsScrolled(false);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    /* --- [수정] 로그아웃 버튼 클릭 시 모달만 띄움 --- */
    const openLogoutModal = (e) => {
        e.preventDefault();
        setShowLogoutModal(true);
    };

    /* --- [추가] 모달에서 '확인' 눌렀을 때 실제 로그아웃 처리 --- */
    const handleLogoutConfirm = () => {
        window.location.href = "http://localhost:8080/user/logout";
    };

    return (
        <header className={`header ${isScrolled ? 'scrolled' : ''} ${isBlack ? 'black-header' : ''}`}>
            <div className="header-left">
                <Link to="/" className="logo" style={{ textDecoration: 'none', color: 'inherit' }}>
                    COMMIT<br />CAR.
                </Link>
                <div className="time">
                    AM<br />10 : 34
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

            {/* [추가] 로그아웃 모달 렌더링 */}
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