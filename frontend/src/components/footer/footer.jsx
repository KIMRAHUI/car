import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
    const navigate = useNavigate();

    // 이용약관이나 개인정보처리방침 클릭 시 동작할 핸들러 (회원가입 1단계 연동)
    const handleLinkClick = (type) => {
        console.log(`${type} 링크 클릭됨`);

        //회원가입 페이지로 이동하면서 어떤 약관을 눌렀는지 state로 전달
        navigate('/register', { state: { scrollTo: 'terms-section', targetTab: type } });
    };

    return (
        <footer className="minimal-footer">
            <div className="footer-inner">
                {/* 카피라이트 표기 */}
                <p className="footer-copyright">
                    &copy; 2026 COMMIT CAR. All rights reserved.
                </p>

                {/* 필수 약관 및 정보 링크 영역 */}
                <div className="footer-links">
                    <button type="button" onClick={() => handleLinkClick('terms')}>이용약관</button>
                    <span className="footer-divider">|</span>
                    <button type="button" className="bold-link" onClick={() => handleLinkClick('privacy')}>개인정보처리방침</button>
                </div>
            </div>
        </footer>
    );
};

export default Footer;