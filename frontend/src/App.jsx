import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './landing/LandingPage.jsx';
import Login from './auth/login/Login.jsx';
import Register from './auth/register/Register.jsx';
import Service from './service/Service.jsx';
import MyPage from './mypage/Mypage.jsx';

function App() {
    return (
        <Router>
            <div>
                <Routes>
                    {/* 메인 랜딩페이지 */}
                    <Route path="/" element={<LandingPage />} />

                    <Route path="/login" element={<Login />} />

                    <Route path="/register" element={<Register />} />

                    <Route path="/service" element={<Service />} />

                    <Route path="/mypage" element={<MyPage />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;