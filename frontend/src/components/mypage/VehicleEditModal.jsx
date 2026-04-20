import React, { useState, useMemo } from 'react';

// 닫기 버튼 및 모델 대체 이미지
import deleteIcon from '../../assets/image/modal/Close.png';
import carMockImage from '../../assets/image/modal/car.png';

import './MyPageModal.css';

// 브랜드 이미지 임포트 (대소문자/파일명 엄격 준수)
import Hyundai from '../../assets/image/modal/Hyundai.png';
import Kia from '../../assets/image/modal/Kia.png';
import Chevrolet from '../../assets/image/modal/Chevrolet.png';
import SsangYong from '../../assets/image/modal/SsangYong.png';
import Renault from '../../assets/image/modal/Renault.png';
import Ford from '../../assets/image/modal/Ford.png';
import MINI from '../../assets/image/modal/MINI.png';
import Lincoln from '../../assets/image/modal/Lincoln.png';
import MercedesBenz from '../../assets/image/modal/Mercedes-Benz.png';
import BMW from '../../assets/image/modal/BMW.png';
import Audi from '../../assets/image/modal/Audi.png';
import Volvo from '../../assets/image/modal/Volvo.png';
import Toyota from '../../assets/image/modal/Toyota.png';
import Nissan from '../../assets/image/modal/Nissan.png';

const VehicleEditModal = ({ onClose }) => {
    const [step, setStep] = useState(1);
    const [selectedMake, setSelectedMake] = useState('');
    const [selectedModel, setSelectedModel] = useState('');
    const [licensePlate, setLicensePlate] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const carMakes = useMemo(() => [
        { id: 'Hyundai', name: '현대', image: Hyundai },
        { id: 'Kia', name: '기아', image: Kia },
        { id: 'Chevrolet', name: '쉐보레', image: Chevrolet },
        { id: 'SsangYong', name: '쌍용', image: SsangYong },
        { id: 'MINI', name: '미니', image: MINI },
        { id: 'Renault', name: '르노', image: Renault },
        { id: 'Lincoln', name: '링컨', image: Lincoln },
        { id: 'Ford', name: '포드', image: Ford },
        { id: 'MercedesBenz', name: '벤츠', image: MercedesBenz },
        { id: 'Audi', name: '아우디', image: Audi },
        { id: 'BMW', name: 'BMW', image: BMW },
        { id: 'Volvo', name: '볼보', image: Volvo },
        { id: 'Toyota', name: '도요타', image: Toyota },
        { id: 'Nissan', name: '닛산', image: Nissan },
    ], []);

    const allModels = [
        '그랜저 HG', '그랜저 IG', '아반떼 AD', '아반떼 CN7', '싼타페 TM', '싼타페 MX5',
        '쏘나타 DN8', '팰리세이드', 'G80', 'GV80', 'K5', 'K8', '쏘렌토', '카니발',
        '스포티지', '머스탱 GT', '머스탱 에코부스트', '익스플로러', 'E클래스', 'S클래스',
        '5시리즈', '3시리즈', 'Model 3', 'Model Y'
    ];

    const filteredModels = useMemo(() => {
        if (!searchQuery.trim()) return allModels.slice(0, 5);
        return allModels.filter(model =>
            model.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery]);

    const getSelectedMakeImage = () => {
        const found = carMakes.find(m => m.name === selectedMake);
        return found ? found.image : carMockImage;
    };

    const handleMakeSelect = (makeName) => {
        setSelectedMake(makeName);
        setStep(2);
        setSearchQuery('');
    };

    const handleModelSelect = (model) => {
        setSelectedModel(model);
        setStep(3);
    };

    const handleFinalSubmit = () => {
        if (!licensePlate.trim()) {
            alert("차량 번호를 입력해 주세요.");
            return;
        }
        console.log(`[API 호출] 브랜드: ${selectedMake}, 모델: ${selectedModel}, 차량번호: ${licensePlate}`);
        alert("차량 정보가 성공적으로 변경되었습니다.");
        onClose();
    };

    // 1단계: 브랜드 목록
    const renderStep1 = () => (
        <div className="modal-body-scroll no-padding">
            <div className="car-make-grid">
                {carMakes.map(make => (
                    <button key={make.id} className="car-make-item" onClick={() => handleMakeSelect(make.name)}>
                        <div className="logo-circle">
                            <img src={make.image} alt={make.name} />
                        </div>
                        <span>{make.name}</span>
                    </button>
                ))}
            </div>
        </div>
    );

    // 2단계: 모델 검색
    const renderStep2 = () => (
        <div className="modal-body-scroll">
            <div className="selected-make-display">
                <div className="logo-circle large">
                    <img src={getSelectedMakeImage()} alt={selectedMake} />
                </div>
                <p className="step-desc"><strong>{selectedMake}</strong>의 모델명을 검색해 주세요.</p>
            </div>

            <div className="search-bar-container">
                <input
                    type="text"
                    className="auth-input"
                    placeholder="모델명을 검색해 주세요."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                />
            </div>

            <div className="car-model-list">
                {filteredModels.length > 0 ? (
                    filteredModels.map(model => (
                        <button key={model} className="car-model-item" onClick={() => handleModelSelect(model)}>
                            <img src={getSelectedMakeImage()} alt={model} className="model-small-logo" />
                            <span>{model}</span>
                        </button>
                    ))
                ) : (
                    <p className="no-result">검색 결과가 없습니다.</p>
                )}
            </div>
        </div>
    );

    // 3단계: 차량번호 입력
    const renderStep3 = () => (
        <div className="modal-body-scroll">
            <div className="selected-summary">
                <div className="logo-circle">
                    <img src={getSelectedMakeImage()} alt={selectedMake} />
                </div>
                <p className="step-desc">선택하신 차량: <strong>{selectedMake} {selectedModel}</strong></p>
            </div>
            <p className="step-desc">새로운 차량 번호를 입력해 주세요.</p>

            <div className="license-plate-input-area">
                <input
                    type="text"
                    placeholder="예: 123가 4567"
                    value={licensePlate}
                    onChange={(e) => setLicensePlate(e.target.value)}
                    className="auth-input"
                />
            </div>

            <button className="btn-primary-gray" onClick={handleFinalSubmit} style={{ marginTop: '2rem' }}>
                수정 완료
            </button>
        </div>
    );

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content vehicle-edit-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header-gray">
                    {/* [수정] 기호(<) 대신 '이전' 텍스트 사용 */}
                    {step > 1 && (
                        <button className="btn-back-text" onClick={() => {
                            setStep(step - 1);
                            setSearchQuery('');
                        }}>
                            이전
                        </button>
                    )}
                    <h2>{step === 1 ? "내 차량 선택" : "차량 정보 변경하기"}</h2>
                    <button className="modal-close-btn" onClick={onClose}>
                        <img src={deleteIcon} alt="Close" />
                    </button>
                </div>

                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
            </div>
        </div>
    );
};

export default VehicleEditModal;