import React, { useEffect, useState, useRef } from 'react';
import Header from '../components/header/Header.jsx';
import Footer from "../components/footer/footer.jsx";
import './Service.css';
import swapIcon from "../assets/image/service/Change.png";
import searchIcon from "../assets/image/landing/search.png"; // [추가] 돋보기 아이콘 임포트
import ReservationModal from '../components/service/ReservationModal.jsx'; // 예약 모달 컴포넌트
import AuthAlertModal from '../components/auth/AuthAlertModal.jsx';
import doubleLeftIcon from "../assets/image/common/Double Left.png";
import doubleRightIcon from "../assets/image/common/Double Right.png";



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

    //정비소 상호명/지역 검색어 상태 관리
    const [keywordInput, setKeywordInput] = useState('');   // 입력창 실시간 바인딩용
    const [searchKeyword, setSearchKeyword] = useState(''); // 실제 카카오 API 호출에 반영할 검색어

    //로딩 상태 관리 상태 변수
    const [isLocationReady, setIsLocationReady] = useState(false);

    // 주소 모달 상태 관리
    const [isAddrModalOpen, setIsAddrModalOpen] = useState(false);
    const addrWrapperRef = useRef(null);

    //예약 모달 상태
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

    const REST_API_KEY = import.meta.env.VITE_KAKAO_REST_KEY;

    // 유틸리티 및 핸들러 함수 (useEffect 상단으로 이동)

    const formatTimeString = (seconds) => {
        const totalMinutes = Math.round(seconds / 60);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`;
    };

    const showAlert = (title, message) => setModalConfig({ show: true, title, message });
    const closeModal = () => setModalConfig({ ...modalConfig, show: false });

    const handleOpenReservation = (partner) => {
        setSelectedPartner(partner);
        setIsReservationModalOpen(true);
    };

    // 정형외과 등 엉뚱한 업종 노출 방지를 위해 자동차 전문 업체 락 가이드를 임베딩한 로직
    const fetchNearbyPartners = (centerPos, currentMap) => {
        const ps = new window.kakao.maps.services.Places();

        // 1순위 직접 입력한 검색어 -> 2순위 선택한 태그 필터 -> 3순위 기본값 '자동차정비'
        let searchKeywordValue = '자동차정비';

        if (searchKeyword.trim() !== '') {
            //사용자가 입력한 키워드 뒤에 강제로 " 자동차정비" 카테고리 접미사를 붙여 수리/차량 전용 결과만 유도
            searchKeywordValue = `${searchKeyword} 자동차정비`;
        } else if (selectedTag !== '전체' && selectedTag) {
            searchKeywordValue = selectedTag;
        }

        const placesSearchCB = (data, status, paginationObj) => {
            if (status === window.kakao.maps.services.Status.OK) {
                setPartners(data);
                setPagination(paginationObj);
                displayPartnerMarkers(data, currentMap);
            } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
                setPartners([]);
                setPagination(null);
                // 결과가 없을 때 이전 마커 잔상이 남지 않도록 완벽히 비우기
                partnerMarkersRef.current.forEach(m => m.setMap(null));
                partnerMarkersRef.current = [];
            }
        };

        ps.keywordSearch(searchKeywordValue, placesSearchCB, {
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
                setEnd(place.address_name);
                currentMap.panTo(position);
                handleOpenReservation(place);
            };

            const customOverlay = new window.kakao.maps.CustomOverlay({
                position: position,
                content: content,
                yAnchor: 1.2,
                zIndex: 3
            });

            customOverlay.setMap(currentMap);
            partnerMarkersRef.current.push(customOverlay);
        });
    };

    const initializeMap = () => {
        const container = document.getElementById('map_div');
        if (container) {
            const defaultPos = new window.kakao.maps.LatLng(35.859, 128.625);
            const options = { center: defaultPos, level: 4 };
            const createdMap = new window.kakao.maps.Map(container, options);
            setMap(createdMap);

            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        const userPos = new window.kakao.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
                        createdMap.setCenter(userPos);
                        fetchNearbyPartners(userPos, createdMap);
                        setIsLocationReady(true);
                    },
                    () => {
                        fetchNearbyPartners(defaultPos, createdMap);
                        setIsLocationReady(true);
                    }
                );
            } else {
                fetchNearbyPartners(defaultPos, createdMap);
                setIsLocationReady(true);
            }
            setTimeout(() => createdMap.relayout(), 100);
        }
    };

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

    // --- Side Effects ---

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // 의존성 배열에 searchKeyword를 바인딩하여 텍스트 검색 트리거 시 맵 데이터 리프레시 유도
    useEffect(() => {
        if (map) updateSearchCenter();
    }, [sortMode, selectedTag, start, searchKeyword]);

    useEffect(() => {
        loadScripts();
    }, []);

    // --- 비즈니스 로직 함수 ---

    const openAddrSearch = (type) => {
        setIsAddrModalOpen(true);
        setTimeout(() => {
            if (addrWrapperRef.current) {
                new window.daum.Postcode({
                    oncomplete: (data) => {
                        if (type === 'start') {
                            setStart(data.address);
                        } else {
                            const displayName = data.buildingName ? data.buildingName : data.address;
                            setEnd(displayName);
                            setSelectedPartner({
                                place_name: displayName,
                                address_name: data.address,
                                phone: "",
                                x: "",
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

        const destPos = linePath[linePath.length - 1];
        const destContent = document.createElement('div');
        destContent.className = 'custom-marker-label';
        destContent.style.cursor = 'pointer';
        destContent.innerHTML = `
            <span class="marker-name">${end}</span>
            <div class="marker-arrow"></div>
        `;

        destContent.onclick = () => {
            const partnerData = selectedPartner || { place_name: end, address_name: end };
            handleOpenReservation(partnerData);
        };

        const destOverlay = new window.kakao.maps.CustomOverlay({
            position: destPos,
            content: destContent,
            yAnchor: 1.3,
            zIndex: 10
        });
        destOverlay.setMap(map);

        setRouteInfo({
            distance: (route.summary.distance / 1000).toFixed(1),
            duration: formatTimeString(route.summary.duration)
        });

        const bounds = new window.kakao.maps.LatLngBounds();
        linePath.forEach(p => bounds.extend(p));
        map.setBounds(bounds);

        markersRef.current = [
            new window.kakao.maps.Marker({ position: linePath[0], map: map }),
            destOverlay
        ];
    };

    const handleSearch = async () => {
        if (!map || !start || !end) {
            showAlert("입력 오류", "출발지와 도착지 주소를 모두 입력해주세요.");
            return;
        }

        const geocoder = new window.kakao.maps.services.Geocoder();
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

    // 텍스트 검색 실행 핸들러 (엔터 및 검색버튼 연동)
    const handleKeywordSearchSubmit = (e) => {
        if (e) e.preventDefault();
        setSelectedTag('전체'); // 텍스트 독립 검색이 우선하므로 태그 활성화는 초기화
        setSearchKeyword(keywordInput);
        setCurrentPage(1);
    };

    //태그 클릭 시 기존 검색창 입력 데이터 완전히 리셋
    const handleTagClick = (tag) => {
        setKeywordInput('');
        setSearchKeyword('');
        setSelectedTag(tag);
        setCurrentPage(1);
    };

    return (
        <div className="page-container">
            {/* 로딩 오버레이 구현 */}
            {!isLocationReady && (
                <div className="auth-loading-overlay">
                    <div className="loading-spinner"></div>
                    <p className="loading-text">현재 위치 기반 정비소를 찾는 중입니다...</p>
                </div>
            )}

            <div className="auth-header-layer">
                <Header isBlack={true} />
            </div>

            <main className="main-content">
                <section className="left-section">
                    <h2 className="section-title">NEARBY SERVICE</h2>
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
                        <form className="partner-search-bar" onSubmit={handleKeywordSearchSubmit}>
                            <img src={searchIcon} alt="search" className="partner-search-icon" />
                            <input
                                type="text"
                                placeholder="정비소 상호명을 검색해주세요"
                                value={keywordInput}
                                onChange={(e) => setKeywordInput(e.target.value)}
                            />
                        </form>

                    </div>

                    {/* 해시태그 목록 */}
                    <div className="right-filter-bottom">
                        {/*<div className="tag-row">*/}
                        {/* {['전체', '현대블루핸즈', '기아오토큐', '공임나라'].map((tag) => (*/}
                        {/* <span*/}
                        {/* key={tag}*/}
                        {/* className={`tag clickable ${selectedTag === tag ? 'active' : ''}`}*/}
                        {/* onClick={() => handleTagClick(tag)}*/}
                        {/* >*/}
                        {/* #{tag}*/}
                        {/* </span>*/}
                        {/* ))}*/}
                        {/*</div>*/}
                        {/* 오른쪽 블록: 가까운순 / 정확도순 전용 슬라이딩 토글 */}
                        <div className="sort-toggle-container">
                            <div className={`sort-option ${sortMode === 'distance' ? 'active' : ''}`} onClick={() => setSortMode('distance')}>가까운 순</div>
                            <div className={`sort-option ${sortMode === 'accuracy' ? 'active' : ''}`} onClick={() => setSortMode('accuracy')}>정확도순</div>
                            <div className={`sort-slider ${sortMode}`}></div>
                        </div>
                    </div>

                    <div className="partner-grid">
                        {isLocationReady && (partners.length > 0 ? partners.map((p, i) => (
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
                            <div className="loading-msg">조건에 맞는 정비소를 찾을 수 없습니다. 새로운 검색어로 시도해 보세요.</div>
                        ))}
                    </div>

                    {pagination && (
                        <div className="pagination">
                            <button
                                className="page-btn nav-btn"
                                disabled={currentPage === 1}
                                onClick={() => {
                                    pagination.gotoPage(1);
                                    setCurrentPage(1);
                                }}
                            >
                                <img src={doubleLeftIcon} alt="처음으로" className="nav-icon" />
                            </button>

                            {/* 페이지 번호 그룹화*/}
                            {(() => {
                                const pageSize = 4;
                                const currentGroup = Math.ceil(currentPage / pageSize);
                                const startPage = (currentGroup - 1) * pageSize + 1;
                                const endPage = Math.min(startPage + pageSize - 1, pagination.last);

                                const pages = [];
                                for (let i = startPage; i <= endPage; i++) {
                                    pages.push(
                                        <button
                                            key={i}
                                            className={`page-btn ${currentPage === i ? 'active' : ''}`}
                                            onClick={() => {
                                                pagination.gotoPage(i);
                                                setCurrentPage(i);
                                            }}
                                        >
                                            {i}
                                        </button>
                                    );
                                }
                                return pages;
                            })()}
                            <button
                                className="page-btn nav-btn"
                                disabled={currentPage === pagination.last}
                                onClick={() => {
                                    pagination.gotoPage(pagination.last);
                                    setCurrentPage(pagination.last);
                                }}
                            >
                                <img src={doubleRightIcon} alt="끝으로" className="nav-icon" />
                            </button>
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

            {isReservationModalOpen && (
                <ReservationModal
                    partner={selectedPartner}
                    onClose={() => setIsReservationModalOpen(false)}
                />
            )}

            {modalConfig.show && (
                <AuthAlertModal
                    title={modalConfig.title}
                    message={modalConfig.message}
                    onClose={closeModal}
                />
            )}
            <Footer />
        </div>
    );
};

export default Service;