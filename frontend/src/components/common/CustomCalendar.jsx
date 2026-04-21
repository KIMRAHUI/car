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
    const today = new Date();
    // 초기 뷰를 선택된 날짜가 있다면 그 날짜 기준으로, 없다면 오늘 기준으로 설정
    const [currentView, setCurrentView] = useState(selectedDate ? new Date(selectedDate) : new Date());

    const year = currentView.getFullYear();
    const month = currentView.getMonth();

    const handlePrevMonth = () => {
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

    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();

    const days = [];

    for (let i = 0; i < firstDay; i++) {
        days.push(<div key={`empty-${i}`} className="day empty"></div>);
    }

    for (let d = 1; d <= lastDate; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const isSelected = selectedDate === dateStr;
        const isMarked = markDay === d && today.getMonth() === month;

        // 요일 계산 (0: 일요일, 6: 토요일)
        const dayOfWeek = new Date(year, month, d).getDay();

        // 지난 날짜 및 오늘 예약 불가 시간 처리(옵션)를 위해 오늘 날짜와 비교
        const currentLoopDate = new Date(year, month, d);
        const isPast = isModal && currentLoopDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());

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
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    // 일요일은 붉은색, 토요일은 파란색 계열로 텍스트 색상만 살짝 변경 (선택 시 제외)
                    color: isSelected ? '#FFF' : (dayOfWeek === 0 ? '#ff4d4f' : dayOfWeek === 6 ? '#1890ff' : 'inherit'),
                    ...(isModal && isSelected ? { background: '#1A1A1A', color: '#FFF', borderRadius: '4px' } : {})
                }}
            >
                {d}
                {isMarked && timeMark && <span className="time-mark" style={{fontSize: '10px', marginTop: '2px'}}>{timeMark}</span>}
            </div>
        );
    }

    return (
        <div className="calendar-container" style={{ width: '100%' }}>
            <div className="cal-header" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px',
                padding: '0 5px'
            }}>
                <button
                    onClick={handlePrevMonth}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold', color: '#333' }}
                    disabled={isModal && month === today.getMonth() && year === today.getFullYear()}
                >
                    &lt;
                </button>
                <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                    {year}. {String(month + 1).padStart(2, '0')}
                </span>
                <button
                    onClick={handleNextMonth}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold', color: '#333' }}
                >
                    &gt;
                </button>
            </div>

            <div
                className={isModal ? "calendar-grid" : "cal-grid"}
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    width: '100%',
                    gap: '5px'
                }}
            >
                {['S','M','T','W','T','F','S'].map((name, idx) => (
                    <div key={name} className="day-name" style={{
                        fontWeight: 800,
                        color: idx === 0 ? '#ff4d4f' : idx === 6 ? '#1890ff' : '#999',
                        textAlign: 'center',
                        paddingBottom: '10px',
                        fontSize: '0.8rem'
                    }}>
                        {name}
                    </div>
                ))}
                {days}
            </div>
        </div>
    );
};

export default CustomCalendar;