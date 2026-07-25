import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './TireDiagnosisFloating.css';

import tireIcon from '../../assets/image/tire/tire.jpg';

const TireDiagnosisFloating = () => {
    const navigate = useNavigate(); // 이동 함수 정의
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'bot', text: '안녕하세요! 타이어의 "바닥면(무늬)"이 잘 보이게 가까이서 찍은 사진을 올려주시면 AI가 상태를 진단해 드립니다.' }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef(null);

    //드래그 이동을 위한 상태 및 Ref
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const draggingRef = useRef(false);
    const offsetRef = useRef({ x: 0, y: 0 });

    const toggleWindow = () => {
        setIsOpen(!isOpen);
    };

    // 드래그 시작 핸들러
    const handleMouseDown = ( e ) => {
        draggingRef.current = true;
        offsetRef.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        };
    };

    // 드래그 로직
    useEffect(() => {
        const handleMouseMove = ( e ) => {
            if (!draggingRef.current) return;
            const nextX = e.clientX - offsetRef.current.x;
            const nextY = e.clientY - offsetRef.current.y;
            setPosition({ x: nextX, y: nextY });
        };

        const handleMouseUp = () => {
            draggingRef.current = false;
        };

        if (isOpen) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isOpen, position]);

    // 이미지 업로드 및 FastAPI 통신 핸들러
    const handleImageUpload = async ( e ) => {
        const file = e.target.files[0];
        if (!file || isLoading) return;

        const imageUrl = URL.createObjectURL(file);
        setMessages(prev => [...prev, { role: 'user', type: 'image', content: imageUrl }]);
        setIsLoading(true);

        const formData = new FormData();
        formData.append('file', file);

        try {
            /* [환경별 주소 설정 - 404 에러 방지 정밀 로직]
               1. window.location.port를 직접 확인하여 접속 환경을 판단합
               2. 8080 접속 시: 스프링을 거치지 않고 8000번 AI 서버로 직접 요청 (404 회피)
               3. 5173 접속 시: Vite 프록시(/predict) 활용
               4. 배포 환경: 도메인 기반 상대 경로(/predict) 활용
            */
            const currentPort = window.location.port;
            let finalUrl = '/predict'; // 기본값 (배포 환경)

            if (currentPort === '5173') {
                finalUrl = '/predict'; // Vite 프록시
            } else if (currentPort === '8080') {
                finalUrl = 'http://localhost:8000/predict'; // 로컬 스프링 접속 시 AI 서버 직접 호출
            }

            console.log(`[통신 정보] 현재 포트: ${currentPort || '80(배포)'}, 요청 주소: ${finalUrl}`);

            const response = await fetch(finalUrl, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`네트워크 응답 에러: ${response.status}`);
            }

            const res = await response.json();
            console.log("AI 서버 응답 데이터:", res);

            const status = res.status;   // 서버에서 보낸 "정상", "주의", "교체 권장"
            const message = res.message; // 서버에서 보낸 상세 메시지

            const showServiceLink = (status === "교체 권장" || status === "주의");
            const resultText = `[${status}]\n${message}`;

            setMessages(prev => [...prev, {
                role: 'bot',
                text: resultText,
                isWarning: showServiceLink
            }]);

        } catch (error) {
            console.error("통신 에러 발생:", error);
            setMessages(prev => [...prev, { role: 'bot', text: '서버와 연결할 수 없습니다. 다시 시도해 주세요.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`tire-wrapper ${isOpen ? 'is-open' : ''}`}>
            {isOpen && (
                <div
                    className="tire-window"
                    style={{
                        transform: `translate(${position.x}px, ${position.y}px)`,
                        transition: draggingRef.current ? 'none' : 'transform 0.1s ease-out'
                    }}
                >
                    <div className="tire-header" onMouseDown={handleMouseDown} style={{ cursor: 'move' }}>
                        <h3>TIRE AI DIAGNOSIS</h3>
                        <button className="close-btn" onClick={( e ) => {
                            e.stopPropagation();
                            toggleWindow();
                        }}>×</button>
                    </div>
                    <div className="tire-body">
                        {messages.map(( msg, index ) => (
                            <div key={index} className={`msg-bubble ${msg.role}-msg`}>
                                {msg.type === 'image' ? (
                                    <img src={msg.content} alt="업로드 이미지" className="uploaded-preview" />
                                ) : (
                                    <div className="text-content-wrapper">
                                        <div className="main-text">{msg.text}</div>
                                        {/* 서버 판단 결과에 따라 버튼 출력 */}
                                        {msg.isWarning && (
                                            <div className="service-guide-container">
                                                <button
                                                    className="service-link-btn"
                                                    onClick={() => navigate('/service')}
                                                >
                                                    정비소 찾기 →
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                        {isLoading && <div className="msg-bubble bot-msg">AI가 이미지를 분석 중입니다...</div>}
                    </div>
                    <div className="tire-footer">
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            style={{ display: 'none' }}
                        />
                        <button className="upload-main-btn" onClick={() => fileInputRef.current.click()} disabled={isLoading}>
                            {isLoading ? '분석 중...' : '타이어 사진 업로드'}
                        </button>
                    </div>
                </div>
            )}

            {!isOpen && (
                <div className="tire-tooltip" onClick={toggleWindow}>
                    타이어 상태가 걱정되시나요?
                </div>
            )}

            <div className="floating-tire" onClick={toggleWindow}>
                <img src={tireIcon} alt="타이어 진단" />
            </div>
        </div>
    );
};

export default TireDiagnosisFloating;