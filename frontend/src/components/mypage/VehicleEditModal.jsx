import React, {useState, useEffect, useMemo} from 'react';
import deleteIcon from '../../assets/image/modal/Close.png';
import carMockImage from '../../assets/image/modal/car.png';
import AuthAlertModal from '../../components/auth/AuthAlertModal.jsx'; // [추가] 커스텀 모달 임포트
import './MyPageModal.css';

// 로고 이미지 임포트
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

const VehicleEditModal = ({ onClose, onSelectComplete, isRegisterMode = false }) => {
    const [step, setStep] = useState(1);
    const [brands, setBrands] = useState([]);
    const [models, setModels] = useState([]);

    const [selectedBrand, setSelectedBrand] = useState(null);
    const [selectedModel, setSelectedModel] = useState(null);
    const [licensePlate, setLicensePlate] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false); // 로딩 상태 추가

    // [추가] 커스텀 모달 상태 관리
    const [alertConfig, setAlertConfig] = useState({
        show: false,
        title: '',
        message: '',
        onConfirm: null
    });

    // [추가] 커스텀 알림 호출 도우미
    const showAlert = (title, message, onConfirm = null) => {
        setAlertConfig({ show: true, title, message, onConfirm });
    };

    const logoMap = {
        'Hyundai.png': Hyundai, 'Kia.png': Kia, 'Chevrolet.png': Chevrolet,
        'SsangYong.png': SsangYong, 'MINI.png': MINI, 'Renault.png': Renault,
        'Lincoln.png': Lincoln, 'Ford.png': Ford, 'Mercedes-Benz.png': MercedesBenz,
        'Audi.png': Audi, 'BMW.png': BMW, 'Volvo.png': Volvo,
        'Toyota.png': Toyota, 'Nissan.png': Nissan
    };

    useEffect(() => {
        const xhr = new XMLHttpRequest();
        xhr.onreadystatechange = () => {
            if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
                const data = JSON.parse(xhr.responseText);
                setBrands(data);
            }
        };
        xhr.open('GET', '/user/car-brands');
        xhr.send();
    }, []);

    const handleMakeSelect = (brand) => {
        setSelectedBrand(brand);
        const xhr = new XMLHttpRequest();
        xhr.onreadystatechange = () => {
            if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
                const data = JSON.parse(xhr.responseText);
                setModels(data);
                setStep(2);
                setSearchQuery('');
            }
        };
        xhr.open('GET', `/user/car-models?brandId=${brand.id}`);
        xhr.send();
    };

    const filteredModels = useMemo(() => {
        if (!searchQuery.trim()) return models.slice(0, 8);
        return models.filter(m =>
            m.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery, models]);

    const handleModelSelect = (model) => {
        if (isRegisterMode && onSelectComplete) {
            onSelectComplete(selectedBrand.name, model.name, model.id);
        } else {
            setSelectedModel(model);
            setStep(3);
        }
    };

    const handleFinalSubmit = () => {
        if (!licensePlate.trim()) {
            showAlert("입력 오류", "차량 번호를 입력해 주세요.");
            return;
        }

        setIsSubmitting(true);
        const xhr = new XMLHttpRequest();
        xhr.onreadystatechange = () => {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                setIsSubmitting(false);
                if (xhr.status === 200) {
                    try {
                        const data = JSON.parse(xhr.responseText);
                        if (data.result === 'success') {
                            // [수정] 브라우저 alert 대신 커스텀 모달 사용
                            showAlert(
                                "수정 완료",
                                "차량 정보가 성공적으로 변경되었습니다.",
                                () => { window.location.reload(); }
                            );
                        } else {
                            showAlert("수정 실패", "차량 수정에 실패했습니다. 올바른 정보를 선택해 주세요.");
                        }
                    } catch (e) {
                        showAlert("오류", "데이터 처리 중 오류가 발생했습니다.");
                    }
                } else {
                    showAlert("서버 오류", "네트워크 상태를 확인해 주세요.");
                }
            }
        };

        xhr.open('POST', '/user/update-vehicle');
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.withCredentials = true;

        const params = `carModelId=${selectedModel.id}&carNumber=${encodeURIComponent(licensePlate)}`;
        xhr.send(params);
    };

    const renderStep1 = () => (
        <div className="modal-body-scroll no-padding">
            <div className="car-make-grid">
                {brands.map(brand => (
                    <button key={brand.id} className="car-make-item" onClick={() => handleMakeSelect(brand)}>
                        <div className="logo-circle">
                            <img src={logoMap[brand.image] || carMockImage} alt={brand.name} />
                        </div>
                        <span>{brand.name}</span>
                    </button>
                ))}
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="modal-body-scroll">
            <div className="selected-make-display">
                <div className="logo-circle large">
                    <img src={logoMap[selectedBrand.image] || carMockImage} alt={selectedBrand.name} />
                </div>
                <p className="step-desc"><strong>{selectedBrand.name}</strong>의 모델명을 검색해 주세요.</p>
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
                        <button key={model.id} className="car-model-item" onClick={() => handleModelSelect(model)}>
                            <img src={logoMap[selectedBrand.image] || carMockImage} alt={model.name} className="model-small-logo" />
                            <span>{model.name}</span>
                        </button>
                    ))
                ) : (
                    <p className="no-result">검색 결과가 없습니다.</p>
                )}
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="modal-body-scroll">
            <div className="selected-summary">
                <div className="logo-circle">
                    <img src={logoMap[selectedBrand.image] || carMockImage} alt={selectedBrand.name} />
                </div>
                <p className="step-desc">선택하신 차량: <strong>{selectedBrand.name} {selectedModel.name}</strong></p>
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
            <button
                className={`btn-primary-gray ${licensePlate.trim() ? 'active-black' : ''}`}
                onClick={handleFinalSubmit}
                style={{ marginTop: '2rem' }}
                disabled={isSubmitting}
            >
                {isSubmitting ? "처리 중..." : "수정 완료"}
            </button>
        </div>
    );

    return (
        <>
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content vehicle-edit-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header-gray">
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
                    {!isRegisterMode && step === 3 && renderStep3()}
                </div>
            </div>

            {/* [추가] 커스텀 알림 모달 */}
            {alertConfig.show && (
                <AuthAlertModal
                    title={alertConfig.title}
                    message={alertConfig.message}
                    onClose={() => {
                        const confirmAction = alertConfig.onConfirm;
                        setAlertConfig(prev => ({ ...prev, show: false }));
                        if (confirmAction) confirmAction();
                    }}
                />
            )}
        </>
    );
};

export default VehicleEditModal;