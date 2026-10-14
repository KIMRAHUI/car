# COMMIT CAR

> **Spring Boot · React · FastAPI · VGG19**를 결합한
> 차량 결함 AI 진단 + 정비소 예약 풀스택 웹 플랫폼

---

## 프로젝트 개요

| 항목 | 내용 |
| --- | --- |
| 개발 기간 | 2026.04.03 ~ 2026.06.15 (74일) |
| 개발 인원 | 1인 (기획 · 프론트엔드 · 백엔드 · AI 모델 · 배포 전 과정) |
| 소개 | 오프라인으로 흩어져 있던 정비 예약 과정을 웹으로 모으고, 사용자가 올린 타이어 이미지의 마모 상태를 AI로 진단해 가까운 정비소 예약까지 한 흐름으로 연결합니다. LLM 챗봇으로 차량 증상 상담도 제공합니다. |

---

## Tech Stack

| 영역 | 기술 |
| --- | --- |
| Frontend | React, Vite |
| Backend | Java 17, Spring Boot, Spring Security, MariaDB |
| AI Server | Python, FastAPI, TensorFlow / Keras (VGG19), Groq API (Llama) |
| External API | Kakao Map (주변 정비소 · 길찾기), SMTP (이메일 인증) |
| Infra | GCP Compute Engine, Nginx, Cloudflare |

---

## System Architecture

화면 라우팅(React), 인증·예약 등 비즈니스 로직(Spring Boot), AI 추론(FastAPI)을 별도 계층으로 나눠, 모델을 교체하거나 AI 서버만 따로 재시작해도 예약·회원 기능에는 영향이 없도록 구성했습니다. 외부 트래픽은 Cloudflare → Nginx 한 경로로만 들어오고, 각 애플리케이션 포트와 DB는 외부에 노출하지 않습니다.

```text
[ Web Client (React) ] ── Kakao Map API
        │  HTTPS
        ▼
[ Cloudflare (DNS · Proxy) ]
        │
        ▼
[ GCP Instance ── Nginx Reverse Proxy ]
        │
        ▼
[ Spring Boot :8081 ]  ──────────▶  [ FastAPI :5000 ]
 Auth · Reservation · Review           ├─ VGG19 타이어 마모 추론
 MyPage                                └─ Groq API 호출 (차량 상담 챗봇)
        │
        ▼
[ MariaDB :3306 (localhost only) ]
```

---

## 주요 기능

- **주변 정비소 탐색:** 카카오맵으로 현재 위치 주변 정비소를 표시하고 거리순 / 정확도순 정렬, 출발지 → 정비소 길찾기
- **정비 예약:** 카테고리(일반 점검·소모품 교체 / 고장 수리 / 사고 수리) 선택 → 교체 항목 체크, 고장 증상 선택 + 사진 첨부, 파손 부위 선택 → 날짜·시간 선택 → 예약 완료
- **타이어 AI 진단:** 타이어 바닥면 사진을 올리면 VGG19 모델이 마모 상태를 판정하고, 교체가 필요하면 바로 정비소 찾기로 연결
- **차량 상담 챗봇:** 사용자가 입력한 증상을 바탕으로 Groq(Llama) 기반 LLM이 원인과 조치를 안내
- **마이페이지:** 내 차량 정보, 예약 현황 캘린더, 정비 기록 입력, 소모품 다음 교체 시기, 취소 내역 조회
- **회원가입 4단계:** 약관 동의 → 개인정보 + 이메일 인증(인증 코드 만료 시간 · 재시도 횟수 관리) → 차량 정보(브랜드 · 모델 · 연료 · 주행거리) → 완료

### 주요 API

| 경로 | 설명 |
| --- | --- |
| `POST /api/user/register` | 회원가입, 이메일 인증 토큰 발급, 비밀번호 암호화 저장 |
| `POST /api/reservation` | 정비소 · 날짜 · 시간 · 정비 항목 지정 예약 생성 (`ReservationValidator` 검증) |
| `POST /api/chat` | 차량 증상 입력 → AI 서버 경유 LLM 답변 생성 |

---

## 핵심 구현 & 문제 해결

### 1. 예약 취소 시 데이터 유실 → 상태 전이 방식으로 변경

- **문제:** 예약 취소를 물리 삭제(`DELETE`)로 처리하자 여러 문제가 함께 생겼습니다.
  - 예약을 참조하던 하위 데이터가 부모를 잃어 이력이 끊겼습니다.
  - 조회 시 비어 있는 값에 대한 예외 처리가 없어 마이페이지와 캘린더 화면이 깨졌습니다.
  - 삭제 도중 같은 예약에 다른 요청이 들어오면 데이터가 꼬였습니다.
- **해결:**
  - 행을 지우는 대신 예약 상태를 `ACTIVE` → `CANCELLED`로 바꾸는 소프트 삭제로 리팩토링해, 취소된 예약도 이력으로 조회할 수 있게 했습니다.
  - 상태 변경과 연관 데이터 처리를 `@Transactional` 하나로 묶어, 중간에 오류가 나면 전체가 롤백되도록 했습니다.
  - 예약·취소 이력 기록은 비즈니스 트랜잭션과 분리된 로깅 모듈로 처리했습니다.

<!-- TODO: 핵심 코드 링크 추가 예) [ReservationService.java#L42](backend/src/main/java/.../ReservationService.java) -->

### 2. 적은 데이터로 타이어 마모 분류 → VGG19 전이학습

- **문제:** 데이터셋(Kaggle 타이어 이미지)이 적어, CNN을 처음부터 학습시키면 과적합이 심하고 미세한 균열·홈 깊이를 잘 구분하지 못했습니다. 하이퍼파라미터 튜닝에도 시간이 많이 들었습니다.
- **해결:** ImageNet 사전학습 가중치를 가진 VGG19를 불러와 하위 합성곱층은 고정(Frozen)하고, 분류층만 타이어 데이터로 미세 조정(Fine-tuning)했습니다.
- **VGG19를 고른 이유:**
  - 3×3 필터 3개를 쌓으면 7×7 필터 1개와 같은 수용 영역을 보면서도 파라미터가 적습니다 (3 × 3² = 27 < 7² = 49).
  - 층마다 ReLU가 들어가 비선형성이 커지므로, 타이어 표면의 불규칙한 마모 질감을 구분하는 데 유리하다고 판단했습니다.
  - 검증된 구조를 그대로 쓰고 분류층 조정에만 집중할 수 있어 1인 개발 일정에 맞았습니다.

<!-- TODO: 실제 측정값이 있으면 아래 표를 주석 밖으로 꺼내서 채우기
- **결과:**

| 모델 | Train Acc | Validation Acc |
| --- | --- | --- |
| CNN (Scratch) | 00% | 00% |
| VGG19 (Fine-tuning) | 00% | 00% |
-->

### 3. 요청마다 모델 로딩 → 서버 시작 시 1회 로딩

- **문제:** 추론 요청마다 VGG19 모델을 초기화하고 가중치 파일을 다시 읽도록 되어 있었습니다. 이미지가 연속으로 들어오면 전처리와 가중치 로딩이 한 스레드에 몰려 메모리 한계를 넘었고, AI 서버 프로세스가 반복적으로 강제 종료됐습니다.
- **해결:**
  - FastAPI 기동 시점에 VGG19 가중치를 메모리에 한 번만 로드하고 모든 요청이 공유하도록 변경했습니다.
  - 이미지 전처리를 별도 모듈로 분리하고, 파일 형식·크기 검사를 추론 전에 먼저 수행해 잘못된 요청은 모델까지 가지 않게 했습니다.
  - 파일이 비어 있거나 누락된 요청은 예외 처리로 막아 서버가 죽지 않도록 했습니다.

<!-- TODO: 측정값이 있으면 추가
- **결과:** 추론 응답 시간 `0.0s → 0.0s`, 연속 요청 N건에서 다운 없음
-->

### 4. 챗봇 LLM 선택 → Gemini 대신 Groq

- **고민:** 챗봇은 사용자가 답을 기다리는 화면이라 첫 응답이 늦으면 체감 품질이 크게 떨어집니다. 테스트와 운영 비용도 1인 프로젝트에서 부담이었습니다.
- **선택:** 추론 전용 하드웨어(LPU)로 첫 토큰 응답이 빠르고 무료 티어를 쓸 수 있는 Groq API(Llama 계열)를 선택했습니다. API 키는 AI 서버에서만 보관하고, 프론트는 Spring Boot를 거쳐 호출합니다.

### 5. 그 외

- **입력값 검증:** `ReservationValidator`로 예약 날짜·시간·항목을 서버에서 다시 검증
- **회원 보안:** 이메일 인증, 비밀번호 BCrypt 암호화 저장, Spring Security로 공개 / 인증 경로 분리

---

## 로컬 실행 방법

```bash
# 1. Backend (Spring Boot)
cd backend
cp src/main/resources/application-example.yml src/main/resources/application.yml   # DB · SMTP 정보 입력
./mvnw spring-boot:run          # http://localhost:8081

# 2. AI Server (FastAPI)
cd ai-server
pip install -r requirements.txt
export GROQ_API_KEY=<your_key>
uvicorn main:app --port 5000    # http://localhost:5000/docs

# 3. Frontend (React)
cd frontend
npm install
npm run dev                     # http://localhost:5173
```

> DB 비밀번호, 메일 계정, Groq · Kakao API 키 등 민감 정보는 저장소에 포함하지 않으며 환경 변수로 주입합니다.

---

## 배포 (GCP · Nginx · Cloudflare)

### 1. 패키지 설치

```bash
sudo timedatectl set-timezone Asia/Seoul
sudo apt update
sudo apt install openjdk-17-jdk nginx mariadb-server -y
```

### 2. MariaDB — 외부 접속 차단, 최소 권한 계정

DB는 애플리케이션과 같은 인스턴스에서만 접근하므로 외부 접속을 막고, 서비스 계정에는 해당 스키마 권한만 부여합니다.

```ini
# /etc/mysql/mariadb.conf.d/50-server.cnf
bind-address = 127.0.0.1
```

```sql
CREATE DATABASE commit_car;
CREATE USER 'commitcar'@'localhost' IDENTIFIED BY '<강력한_비밀번호>';
GRANT SELECT, INSERT, UPDATE, DELETE ON commit_car.* TO 'commitcar'@'localhost';
FLUSH PRIVILEGES;
```

```bash
sudo systemctl restart mariadb
sudo mysql commit_car < schema.sql
```

### 3. 방화벽

GCP 방화벽 규칙에서 **80/443만 허용**하고, 8081(Spring) · 5000(FastAPI) · 3306(DB)은 외부에 열지 않습니다.

### 4. Nginx 리버스 프록시 & Cloudflare

- Cloudflare DNS에 인스턴스 공인 IP를 등록하고 Proxy(주황 구름)를 켭니다. SSL 모드는 **Full (strict)** + Cloudflare Origin 인증서를 사용합니다.

```nginx
# /etc/nginx/sites-available/commit-car  (sites-enabled에 심볼릭 링크)
server {
    listen 443 ssl;
    server_name your_domain.com;

    ssl_certificate     /etc/ssl/cloudflare/origin.pem;
    ssl_certificate_key /etc/ssl/cloudflare/origin.key;

    client_max_body_size 10M;   # 이미지 업로드

    location / {
        proxy_pass http://127.0.0.1:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 5. systemd 서비스 등록 (전용 계정으로 실행)

애플리케이션은 root가 아닌 전용 계정으로 실행하고, 민감 정보는 별도 환경 파일(권한 600)로 분리합니다.

```bash
sudo useradd -r -s /usr/sbin/nologin commitcar
sudo mkdir -p /opt/commit-car && sudo chown commitcar: /opt/commit-car
```

```ini
# /etc/systemd/system/commit-car.service
[Unit]
Description=Commit Car Spring Boot
After=network.target mariadb.service

[Service]
User=commitcar
Group=commitcar
EnvironmentFile=/etc/commit-car/env
ExecStart=/usr/bin/java -jar /opt/commit-car/app.jar --server.address=127.0.0.1 --server.port=8081
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now commit-car
```

> FastAPI 서버도 같은 방식으로 `uvicorn main:app --host 127.0.0.1 --port 5000`을 별도 서비스로 등록합니다.

---

## 회고

- **상태 변경은 신중하게:** 기능 로직을 화면 쪽에 몰아넣지 않고, 예약 상태와 처리 로직을 백엔드 트랜잭션 안에 명시적으로 두는 것이 데이터를 지키는 방법이라는 걸 배웠습니다.
- **모듈 간 결합 줄이기:** 프론트 · 백엔드 · AI 서버를 처음부터 나눠 설계한 덕분에, AI 서버 장애가 예약 기능으로 번지지 않았습니다.
- **다음 개선:** 예약 · 취소처럼 사용자에게 가장 중요한 흐름에 자동화된 단위 테스트를 추가하고, 프론트와 백엔드 양쪽의 입력값 검증을 더 강화할 계획입니다.
