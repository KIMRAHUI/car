import React, { useState } from 'react';

/**
 * CustomCalendar - 연/월 이동 및 선택 기능이 추가된 버전
 */
const CustomCalendar = ({
                            selectedDate,
                            onDateClick,
                            markDay,
                            timeMark,
                            isModal = false
                        }) => {
    // 1. 현재 날짜 및 로컬 상태 관리
    const today = new Date();
    const [currentView, setCurrentView] = useState(new Date()); // 현재 보고 있는 달력 기준

    const year = currentView.getFullYear();
    const month = currentView.getMonth();

    // 2. 월 이동 핸들러
    const handlePrevMonth = () => {
        // 예약 모드(Modal)인 경우 현재 달보다 이전으로 이동 불가
        if (isModal) {
            const prevMonthDate = new Date(year, month - 1, 1);
            if (prevMonthDate < new Date(today.getFullYear(), today.getMonth(), 1)) {
                return;
            }
        }
        setCurrentView(new Date(year, month - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentView(new Date(year, month + 1, 1));
    };

    // 3. 달력 날짜 계산 로직
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();

    const days = [];

    // 1일 이전 빈칸 처리
    for (let i = 0; i < firstDay; i++) {
        days.push(<div key={`empty-${i}`} className="day empty"></div>);
    }

    // 실제 날짜 렌더링
    for (let d = 1; d <= lastDate; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const isSelected = selectedDate === dateStr;
        const isMarked = markDay === d && today.getMonth() === month; // 마이페이지용 표시

        // 지난 날짜 비활성화 여부 (오늘 이전 날짜 선택 방지 - 필요 시 적용)
        const isPast = isModal && new Date(year, month, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

        days.push(
            <div
                key={d}
                className={`day ${isSelected || isMarked ? 'active-day' : ''} ${isPast ? 'disabled-day' : ''}`}
                onClick={() => {
                    if (!isPast && onDateClick) onDateClick(dateStr);
                }}
                style={{
                    cursor: isPast ? 'default' : 'pointer',
                    opacity: isPast ? 0.3 : 1,
                    // 모달 선택 시 스타일 유지
                    ...(isModal && isSelected ? { background: '#1A1A1A', color: '#FFF' } : {})
                }}
            >
                {d}
                {isMarked && timeMark && <span className="time-mark">{timeMark}</span>}
            </div>
        );
    }

    return (
        <div className="calendar-container" style={{ width: '100%' }}>
            {/* 연/월 이동 네비게이션 영역 */}
            <div className="cal-header" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px',
                padding: '0 5px'
            }}>
                <button
                    onClick={handlePrevMonth}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}
                    disabled={isModal && month === today.getMonth() && year === today.getFullYear()}
                >
                    &lt;
                </button>
                <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                    {year}. {String(month + 1).padStart(2, '0')}
                </span>
                <button
                    onClick={handleNextMonth}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}
                >
                    &gt;
                </button>
            </div>

            {/* 달력 그리드 영역 */}
            <div
                className={isModal ? "calendar-grid" : "cal-grid"}
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    width: '100%'
                }}
            >
                {['S','M','T','W','T','F','S'].map(name => (
                    <div key={name} className="day-name" style={{ fontWeight: 800, color: '#999', textAlign: 'center', paddingBottom: '10px' }}>
                        {name}
                    </div>
                ))}
                {days}
            </div>
        </div>
    );
};

export default CustomCalendar;