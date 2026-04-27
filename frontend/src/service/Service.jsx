
import React, { useEffect, useState, useRef } from 'react';
import Header from '../components/header/Header.jsx';
import './Service.css';
import swapIcon from "../assets/image/service/Change.png";
import ReservationModal from '../components/service/ReservationModal.jsx'; // 예약 모달 컴포넌트
import AuthAlertModal from '../components/auth/AuthAlertModal.jsx';


const Service = () => {
    const [map, setMap] = useState(null);
    const [start, setStart] = useState('');
    const [end, setEnd] = useState('');
    const [routeInfo, setRouteInfo] = useState(null);

    const [partners, setPartners] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortMode, setSortMode] = useState('distance');
    const [selectedTag, setSelectedTag] = useState('전체');

    // 주소 모달 상태 관리
    const [isAddrModalOpen, setIsAddrModalOpen] = useState(false);
    const addrWrapperRef = useRef(null);
    const [activeAddrType, setActiveAddrType] = useState('');

    // --- 예약 모달 상태 추가 ---
    const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
    const [selectedPartner, setSelectedPartner] = useState(null);

    const polylineRef = useRef(null);
    const markersRef = useRef([]);
    const partnerMarkersRef = useRef([]);

    const [modalConfig, setModalConfig] = useState({
        show: false,
        title: '',
        message: ''
    });

    // 초 단위를 시간/분 문자열로 변환해주는 도우미 함수
    const formatTimeString = (seconds) => {
        const totalMinutes = Math.round(seconds / 60);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`;
    };

    const showAlert = (title, message) => setModalConfig({ show: true, title, message });
    const closeModal = () => setModalConfig({ ...modalConfig, show: false });

    const REST_API_KEY = import.meta.env.VITE_KAKAO_REST_KEY;

    // 페이지 진입 시 스크롤을 최상단으로 이동시키는 로직
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // 정렬 모드, 태그, 혹은 출발지가 변경될 때마다 정비소 목록 업데이트
    useEffect(() => {
        if (map) updateSearchCenter();
    }, [sortMode, selectedTag, start]);

    useEffect(() => {
        const loadScripts = () => {
            if (!document.getElementById('kakao-map-script')) {
                const mapScript = document.createElement('script');
                mapScript.id = 'kakao-map-script';
                mapScript.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${import.meta.env.VITE_KAKAO_JS_KEY}&libraries=services&autoload=false`;
                mapScript.async = true;
                document.head.appendChild(mapScript);
                mapScript.onload = () => {
                    window.kakao.maps.load(() => initializeMap());
                };
            } else if (window.kakao && window.kakao.maps) {
                window.kakao.maps.load(initializeMap);
            }

            if (!document.getElementById('daum-postcode-script')) {
                const postScript = document.createElement('script');
                postScript.id = 'daum-postcode-script';
                postScript.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
                postScript.async = true;
                document.head.appendChild(postScript);
            }
        };

        const initializeMap = () => {
            const container = document.getElementById('map_div');
            if (container) {
                const defaultPos = new window.kakao.maps.LatLng(35.859, 128.625);
                const options = { center: defaultPos, level: 4 };
                const createdMap = new window.kakao.maps.Map(container, options);
                setMap(createdMap);
                fetchNearbyPartners(defaultPos, createdMap);

                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        (pos) => {
                            const userPos = new window.kakao.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
                            createdMap.setCenter(userPos);
                            fetchNearbyPartners(userPos, createdMap);
                        },
                        () => console.log("기본 위치 사용")
                    );
                }
                setTimeout(() => createdMap.relayout(), 100);
            }
        };
        loadScripts();
    }, []);

    const openAddrSearch = (type) => {
        setActiveAddrType(type);
        setIsAddrModalOpen(true);
        setTimeout(() => {
            if (addrWrapperRef.current) {
                new window.daum.Postcode({
                    oncomplete: (data) => {
                        if (type === 'start') {
                            // 출발지는 주소 텍스트만 저장
                            setStart(data.address);
                        } else {
                            /**
                             * [수정 포인트]
                             * 1. buildingName: '현대블루핸즈 송탄점' 같은 상호명을 가져옴
                             * 2. 상호명이 없으면 기본 주소를 사용.
                             */
                            const displayName = data.buildingName ? data.buildingName : data.address;

                            // 도착지 입력창 및 나중에 그릴 마커의 텍스트로 사용
                            setEnd(displayName);

                            // [추가] 주소 검색으로 선택한 경우에도 예약 모달이 정상 작동하도록 가짜 파트너 객체 생성
                            setSelectedPartner({
                                place_name: displayName,
                                address_name: data.address,
                                phone: "", // 주소 API에서는 전화번호를 제공하지 않으므로 빈값 처리
                                x: "", // x, y 좌표는 나중에 handleSearch의 Geocoder를 통해 채워집니다.
                                y: ""
                            });
                        }
                        setIsAddrModalOpen(false);
                    },
                    width: '100%',
                    height: '100%',
                    theme: {
                        bgColor: "#F0F0F0",
                        searchBgColor: "#1A1A1A",
                        contentBgColor: "#FFFFFF",
                        pageBgColor: "#F0F0F0",
                        textColor: "#333333",
                        queryTextColor: "#FFFFFF",
                        postcodeTextColor: "#258FFF",
                        emphTextColor: "#1A1A1A",
                        outlineColor: "#E0E0E0"
                    }
                }).embed(addrWrapperRef.current);
            }
        }, 0);
    };

    const updateSearchCenter = async () => {
        if (!map) return;
        if (start) {
            const geocoder = new window.kakao.maps.services.Geocoder();
            geocoder.addressSearch(start, (result, status) => {
                if (status === window.kakao.maps.services.Status.OK) {
                    const startPos = new window.kakao.maps.LatLng(result[0].y, result[0].x);
                    map.setCenter(startPos);
                    fetchNearbyPartners(startPos, map);
                }
            });
        } else {
            fetchNearbyPartners(map.getCenter(), map);
        }
    };

    const fetchNearbyPartners = (centerPos, currentMap) => {
        const ps = new window.kakao.maps.services.Places();
        const searchKeyword = (selectedTag === '전체' || !selectedTag) ? '자동차정비' : selectedTag;

        const placesSearchCB = (data, status, paginationObj) => {
            if (status === window.kakao.maps.services.Status.OK) {
                setPartners(data);
                setPagination(paginationObj);
                displayPartnerMarkers(data, currentMap);
            } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
                setPartners([]);
            }
        };

        ps.keywordSearch(searchKeyword, placesSearchCB, {
            location: centerPos,
            radius: 5000,
            sort: sortMode === 'distance' ? window.kakao.maps.services.SortBy.DISTANCE : window.kakao.maps.services.SortBy.ACCURACY,
            size: 6
        });
    };

    const displayPartnerMarkers = (places, currentMap) => {
        partnerMarkersRef.current.forEach(m => m.setMap(null));
        partnerMarkersRef.current = [];

        places.forEach(place => {
            const position = new window.kakao.maps.LatLng(place.y, place.x);

            const content = document.createElement('div');
            content.className = 'custom-marker-label';
            content.innerHTML = `
                <span class="marker-name">${place.place_name}</span>
                <div class="marker-arrow"></div>
            `;

            content.onclick = () => {
                // 1. 도착 주소 자동 입력 및 지도 중심 이동 (기존 기능)
                setEnd(place.address_name);
                currentMap.panTo(position);

                // 2.클릭 시 바로 예약 모달 띄우기
                handleOpenReservation(place);
            };

            const customOverlay = new window.kakao.maps.CustomOverlay({
                position: position,
                content: content,
                yAnchor: 1.2,
                zIndex: 3 // 마커가 경로선보다 위에 보이도록 설정
            });

            customOverlay.setMap(currentMap);
            partnerMarkersRef.current.push(customOverlay);
        });
    };

    const handleSearch = async () => {
        // 1. 입력 검증
        if (!map || !start || !end) {
            showAlert("입력 오류", "출발지와 도착지 주소를 모두 입력해주세요.");
            return;
        }

        const geocoder = new window.kakao.maps.services.Geocoder();

        // 주소 검색 결과가 있으면 주소를 사용하고, 없으면 입력창 텍스트(end)를 그대로 사용
        const startAddr = start;
        const endAddr = selectedPartner?.address_name || end;

        const getCoord = (addr) => new Promise((res, rej) => {
            geocoder.addressSearch(addr, (result, status) => {
                if (status === window.kakao.maps.services.Status.OK) {
                    res(result[0]);
                } else {
                    rej(new Error(`좌표를 찾을 수 없는 주소입니다.`));
                }
            });
        });

        try {
            const origin = await getCoord(startAddr);
            const destination = await getCoord(endAddr);

            const url = `https://apis-navi.kakaomobility.com/v1/directions?origin=${origin.x},${origin.y}&destination=${destination.x},${destination.y}&priority=RECOMMEND`;

            const response = await fetch(url, {
                headers: {
                    Authorization: `KakaoAK ${REST_API_KEY}`
                }
            });

            const data = await response.json();

            if (data.routes && data.routes.length > 0) {
                drawRoute(data.routes[0]);
            } else {
                showAlert("경로 없음", "해당 구간의 이동 경로를 찾을 수 없습니다.");
            }
        } catch (e) {
            console.error(e);
            showAlert("탐색패배", "주소가 정확하지 않거나\n경로를 계산할 수 없습니다.");
        }
    };

    const drawRoute = (route) => {
        if (polylineRef.current) polylineRef.current.setMap(null);
        markersRef.current.forEach(m => m.setMap(null));

        const linePath = [];
        route.sections[0].roads.forEach(road => {
            road.vertexes.forEach((v, i) => {
                if (i % 2 === 0) linePath.push(new window.kakao.maps.LatLng(road.vertexes[i+1], v));
            });
        });

        const polyline = new window.kakao.maps.Polyline({
            path: linePath,
            strokeWeight: 7,
            strokeColor: '#258fff',
            strokeOpacity: 0.9
        });
        polyline.setMap(map);
        polylineRef.current = polyline;

        // --- 도착지 검정 상호명 마커 생성 로직 추가 ---
        const destPos = linePath[linePath.length - 1];
        const destContent = document.createElement('div');
        destContent.className = 'custom-marker-label';
        destContent.style.cursor = 'pointer'; // 클릭 가능하다는 표시
        destContent.innerHTML = `
        <span class="marker-name">${end}</span>
        <div class="marker-arrow"></div>
    `;

        // 마커 클릭 시 예약 모달 오픈 연동
        destContent.onclick = () => {
            // 주소 검색으로 찾은 경우 selectedPartner가 없을 수 있으므로
            // 최소한의 정보를 담은 객체를 넘겨주거나 예외 처리를 합니다.
            const partnerData = selectedPartner || { place_name: end, address_name: end };
            handleOpenReservation(partnerData);
        };

        const destOverlay = new window.kakao.maps.CustomOverlay({
            position: destPos,
            content: destContent,
            yAnchor: 1.3, // 핀보다 약간 위로 조정
            zIndex: 10
        });
        destOverlay.setMap(map);

        // --- 상태 업데이트 및 범위 조정 ---
        setRouteInfo({
            distance: (route.summary.distance / 1000).toFixed(1),
            duration: formatTimeString(route.summary.duration) // 시간 포맷팅 함수 분리 추천
        });

        const bounds = new window.kakao.maps.LatLngBounds();
        linePath.forEach(p => bounds.extend(p));
        map.setBounds(bounds);

        // markersRef에 추가하여 나중에 지울 수 있게 관리
        markersRef.current = [
            new window.kakao.maps.Marker({ position: linePath[0], map: map }), // 출발지는 기본 핀
            destOverlay // 도착지는 검정 상호명
        ];
    };

    const handleTagClick = (tag) => {
        setSelectedTag(tag);
    };

    // --- 모달 열기 핸들러 ---
    const handleOpenReservation = (partner) => {
        setSelectedPartner(partner);
        setIsReservationModalOpen(true);
    };

    return (
        <div className="page-container">
            <div className="auth-header-layer">
                <Header isBlack={true} />
            </div>

            <main className="main-content">
                <section className="left-section">
                    <h2 className="section-title">OUR PARTNERS</h2>
                    <div className="search-row">
                        <input className="input-box clickable" value={start} readOnly onClick={() => openAddrSearch('start')} placeholder="출발 주소" />
                        <img src={swapIcon} alt="swap" className="swap-icon" />
                        <input className="input-box clickable" value={end} readOnly onClick={() => openAddrSearch('end')} placeholder="도착 주소" />
                        <button className="search-btn" onClick={handleSearch}>길 찾기</button>
                    </div>
                    <div className="map-container-relative">
                        <div id="map_div" className="map-wrapper"></div>
                        {routeInfo && (
                            <div className="route-info-overlay">
                                <div className="info-content">
                                    <span className="label">추천 경로</span>
                                    <div className="time-display">약 <strong>{routeInfo.duration}</strong> 소요</div>
                                    <span className="distance-label">{routeInfo.distance}km</span>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                <section className="right-section">
                    <div className="right-filter">
                        <div className="sort-toggle-container">
                            <div className={`sort-option ${sortMode === 'distance' ? 'active' : ''}`} onClick={() => setSortMode('distance')}>가까운 순</div>
                            <div className={`sort-option ${sortMode === 'accuracy' ? 'active' : ''}`} onClick={() => setSortMode('accuracy')}>정확도순</div>
                            <div className={`sort-slider ${sortMode}`}></div>
                        </div>
                        <div className="tag-row">
                            {['전체', '현대블루핸즈', '기아오토큐', '공임나라'].map((tag) => (
                                <span
                                    key={tag}
                                    className={`tag clickable ${selectedTag === tag ? 'active' : ''}`}
                                    onClick={() => handleTagClick(tag)}
                                >
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="partner-grid">
                        {partners.length > 0 ? partners.map((p, i) => (
                            <div
                                className={`partner-card ${sortMode === 'accuracy' && i < 2 ? 'recommended-highlight' : ''}`}
                                key={i}
                                onClick={() => {
                                    setEnd(p.address_name);
                                    map.panTo(new window.kakao.maps.LatLng(p.y, p.x));
                                }}
                            >
                                <div className="card-header">
                                    <span className="brand-title">{p.place_name}</span>
                                    {/* 추가된 More 버튼 */}
                                    <button
                                        className="more-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenReservation(p);
                                        }}
                                    >
                                        More
                                    </button>
                                </div>

                                <div className="badge-container">
                                    <div className="status-badge open">정비소</div>
                                    {sortMode === 'accuracy' && i < 2 && ( <div className="accuracy-badge">BEST MATCH</div> )}
                                </div>
                                <p className="info-line">{p.address_name}</p>
                                <p className="info-line">{p.phone || "053-000-0000"}</p>
                                <p className="info-line distance">거리: {(p.distance / 1000).toFixed(1)}km</p>
                            </div>
                        )) : (
                            <div className="loading-msg">조건에 맞는 정비소를 찾고 있습니다...</div>
                        )}
                    </div>

                    {pagination && (
                        <div className="pagination">
                            {Array.from({ length: pagination.last }, (_, i) => i + 1).map(page => (
                                <button key={page} className={`page-btn ${currentPage === page ? 'active' : ''}`}
                                        onClick={() => { pagination.gotoPage(page); setCurrentPage(page); }}>{page}</button>
                            ))}
                        </div>
                    )}
                </section>
            </main>

            {isAddrModalOpen && (
                <div className="addr-modal-overlay" onClick={() => setIsAddrModalOpen(false)}>
                    <div className="addr-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="addr-modal-header">
                            <h3>주소 검색</h3>
                            <button className="close-x" onClick={() => setIsAddrModalOpen(false)}>✕</button>
                        </div>
                        <div ref={addrWrapperRef} className="addr-embed-wrapper"></div>
                    </div>
                </div>
            )}

            {/* 실제 예약 모달 연동 부분 */}
            {isReservationModalOpen && (
                <ReservationModal
                    partner={selectedPartner}
                    onClose={() => setIsReservationModalOpen(false)}
                />
            )}

            {/*커스텀 알림 모달 (AuthAlertModal) */}
            {modalConfig.show && (
                <AuthAlertModal
                    title={modalConfig.title}
                    message={modalConfig.message}
                    onClose={closeModal}
                />
            )}
        </div>
    );
};

export default Service;