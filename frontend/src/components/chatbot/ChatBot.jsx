import React, { useState, useRef, useEffect } from 'react';
import './ChatBot.css';

const ChatBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    // 대화 내역 상태 관리
    const [messages, setMessages] = useState([
        { role: 'bot', text: '안녕하세요! 자동차 정비에 대해 궁금한 점이 있으신가요?' }
    ]);
    const [isLoading, setIsLoading] = useState(false);

    //드래그 이동을 위한 상태 및 Ref
    const [position, setPosition] = useState({ x: 0, y: 0 }); // 이동 거리 상태
    const draggingRef = useRef(false);
    const offsetRef = useRef({ x: 0, y: 0 });

    const toggleChat = () => {
        setIsOpen(!isOpen);
    };

    //드래그 핸들러 로직
    const handleMouseDown = (e) => {
        // 헤더 클릭 시 드래그 시작
        draggingRef.current = true;
        offsetRef.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        };
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
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

    const handleSend = () => {
        if (!input.trim() || isLoading) return;


        const userMsg = { role: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        const currentInput = input; // 전송할 텍스트 임시 저장
        setInput('');
        setIsLoading(true);

        const xhr = new XMLHttpRequest();

        xhr.onreadystatechange = () => {
            if (xhr.readyState !== XMLHttpRequest.DONE) {
                return;
            }
            if (xhr.status >= 200 && xhr.status < 400) {

                const responseData = JSON.parse(xhr.responseText);
                setMessages(prev => [...prev, { role: 'bot', text: responseData.response }]);
            } else {

                console.error("챗봇 통신 오류 발생");
                setMessages(prev => [...prev, { role: 'bot', text: '죄송합니다. 서버와 연결할 수 없습니다.' }]);
            }
            setIsLoading(false);
        };

        // Vite 프록시 설정(/api/chat)에 맞게 경로 설정
        xhr.open('POST', '/api/chat/ask');
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify({ message: currentInput }));
    };

    return (
        /* isOpen 상태에 따라 is-open 클래스를 동적으로 부여하여 CSS 이중 제어 */
        <div className={`chatbot-wrapper ${isOpen ? 'is-open' : ''}`}>
            {/* 챗봇 대화창 (열려있을 때만 표시) */}
            {isOpen && (
                <div
                    className="chat-window"
                    style={{
                        transform: `translate(${position.x}px, ${position.y}px)`,
                        transition: draggingRef.current ? 'none' : 'transform 0.1s ease-out'
                    }}
                >
                    <div
                        className="chat-header"
                        onMouseDown={handleMouseDown}
                        style={{ cursor: 'move' }}
                    >
                        <h3>COMMIT CAR AI</h3>
                        <button className="close-btn" onClick={(e) => {
                            e.stopPropagation(); // 드래그 이벤트 전파 방지
                            toggleChat();
                        }}>×</button>
                    </div>
                    <div className="chat-body">
                        {/* 대화 내역 렌더링 */}
                        {messages.map((msg, index) => (
                            <div key={index} className={`msg-bubble ${msg.role}-msg`}>
                                {msg.text}
                            </div>
                        ))}
                        {isLoading && <div className="msg-bubble bot-msg">답변을 생각 중입니다...</div>}
                    </div>
                    <div className="chat-footer">
                        <input
                            type="text"
                            placeholder={isLoading ? "답변 대기 중..." : "메시지를 입력하세요..."}
                            value={input}
                            disabled={isLoading}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        />
                        <button onClick={handleSend} disabled={isLoading}>
                            {isLoading ? '...' : '전송'}
                        </button>
                    </div>
                </div>
            )}

            {/*말풍선: 대화창이 닫혀있을 때(!isOpen)만 렌더링됨 */}
            {!isOpen && (
                <div className="chatbot-tooltip" onClick={toggleChat}>
                    혹시 어떤게 궁금하신가요?
                </div>
            )}

            {/* 플로팅 버튼 (이미지 제거 후 텍스트 로고 적용) */}
            <div className="floating-chatbot" onClick={toggleChat}>
                <div className="chatbot-text-logo">
                    <span>COMMIT</span>
                    <span>CAR</span>
                </div>
            </div>
        </div>
    );
};

export default ChatBot;