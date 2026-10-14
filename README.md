# COMMIT CAR

> **Spring Boot · React · FastAPI · VGG19**를 결합한
> 차량 결함 AI 진단 + 정비소 예약 풀스택 웹 플랫폼

<!-- TODO: 스크린샷 (PPT 캡처 활용) 예) 정비소 지도 / 타이어 AI 진단 / 예약 / 마이페이지
| 주변 정비소 | 타이어 AI 진단 | 예약 | 마이페이지 |
| :---: | :---: | :---: | :---: |
| ![map](docs/images/map.png) | ![tire](docs/images/tire.png) | ![reserve](docs/images/reserve.png) | ![mypage](docs/images/mypage.png) |
-->

---

## 프로젝트 개요

| 항목 | 내용 |
| --- | --- |
| 개발 기간 | 2026.04.03 ~ 2026.06.15 (74일) |
| 개발 인원 | 1인 (기획 · 프론트엔드 · 백엔드 · AI 모델 · 배포 전 과정) |
| 소개 | 오프라인으로 흩어져 있던 정비 예약 과정을 웹으로 모으고, 사용자가 올린 타이어 사진의 마모 상태를 AI로 진단해 가까운 정비소 예약까지 한 흐름으로 연결합니다. LLM 챗봇으로 차량 증상 상담도 제공합니다. |

---

## Tech Stack

| 영역 | 기술 |
| --- | --- |
| Frontend | React, Vite |
| Backend | Java 17, Spring Boot 3, Spring Security, MyBatis, MariaDB |
| AI Server | Python, FastAPI, TensorFlow / Keras (VGG19) |
| LLM | Groq API (`llama-3.1-8b-instant`) |
| External API | Kakao Map · Kakao Mobility(길찾기), 카카오 · 네이버 소셜 로그인(OAuth2), SMTP(이메일 인증) |
| Infra | GCP Compute Engine, Nginx, Cloudflare |

---

## System Architecture

화면(React), 인증·예약 등 비즈니스 로직(Spring Boot), 타이어 이미지 추론(FastAPI)을 별도 서버로 나눠, 모델을 교체하거나 AI 서버만 따로 재시작해도 예약·회원 기능에는 영향이 없도록 구성했습니다. 외부 트래픽은 Cloudflare → Nginx 한 경로로만 들어오고, 각 애플리케이션 포트와 DB는 외부에 노출하지 않습니다.

```text
[ Web Client (React) ] ── Kakao Map / Kakao Mobility API
        │  HTTPS
        ▼
[ Cloudflare (DNS · Proxy) ]
        │
        ▼
[ GCP Instance ── Nginx Reverse Proxy ]
        │                                   │
        │ /, /api, /user, /service          │ /predict
        ▼                                   ▼
[ Spring Boot :8081 ]                [ FastAPI :8000 ]
 React 빌드 · 인증 · 예약 · 리뷰       VGG19 타이어 마모 추론
 마이페이지 · 챗봇
        │            │
        ▼            ▼
[ MariaDB ]    [ Groq API ] (차량 상담 챗봇)
(localhost only)
```

---

## 주요 기능

- **주변 정비소 탐색:** 카카오맵으로 주변 정비소를 표시하고 거리순 / 정확도순 정렬, 출발지 → 정비소 길찾기
- **정비 예약:** 카테고리(일반 점검·소모품 교체 / 고장 수리 / 사고 수리) 선택 → 교체 항목 체크, 고장 증상 선택 + 사진 첨부(최대 2장), 파손 부위 선택 → 날짜·시간 선택 → 예약 완료
- **타이어 AI 진단:** 타이어 바닥면 사진을 올리면 VGG19 모델이 점수를 내고 `정상 / 주의 / 교체 권장`으로 판정합니다. 교체가 필요하면 바로 정비소 찾기로 연결합니다.
- **차량 상담 챗봇:** 사용자가 입력한 증상을 Groq LLM에 보내 원인과 조치를 한국어로 안내합니다.
- **마이페이지:** 내 차량 정보, 예약 현황 캘린더, 예약 수정 · 취소, 정비 기록과 소모품 다음 교체 시기, 정비소 리뷰 작성
- **회원가입 · 로그인:** 약관 동의 → 개인정보 + 이메일 인증 → 차량 정보 입력의 단계별 가입, 카카오 · 네이버 소셜 로그인

### 주요 API

| 경로 | 설명 |
| --- | --- |
| `POST /user/register` | 회원가입 (비밀번호 BCrypt 암호화 저장) |
| `POST /user/email` · `POST /user/verify-email` | 이메일 인증 코드 발급 · 확인 |
| `POST /service/reservation` | 예약 생성 (`ReservationValidator` 검증, 사진 첨부) |
| `GET /service/reservation` | 로그인한 사용자의 예약 목록 |
| `PATCH /service/reservation` · `DELETE /service/reservation/{id}` | 본인 예약의 일시 변경 · 취소 |
| `POST /api/chat/ask` | 차량 증상 상담 (Spring Boot → Groq API) |
| `POST /predict` | 타이어 이미지 마모 진단 (FastAPI) |

---

## 핵심 구현 & 문제 해결

### 1. 예약 취소 시 데이터 유실 → 상태값 변경 방식으로 변경

- **문제:** 예약 취소를 물리 삭제(`DELETE`)로 처리하자, 예약을 참조하던 상세 항목과 이력이 함께 사라졌고 마이페이지 · 캘린더 화면에서 빈 값 때문에 오류가 났습니다.
- **해결:**
  - 예약에 상태값(`PENDING` · `CONFIRMED` · `COMPLETED` · `CANCELED`)을 두고, 취소는 행을 지우지 않고 `status`를 `CANCELED`로 바꾸는 방식으로 리팩토링했습니다. 취소된 예약도 이력으로 조회할 수 있습니다.
  - 예약 생성 · 수정 · 취소 · 완료 처리를 서비스 계층의 `@Transactional` 메서드로 묶어, 중간에 오류가 나면 함께 롤백되도록 했습니다.

### 2. 다른 사람의 예약을 조회 · 취소할 수 있던 문제 → 세션 기반 소유자 검증

- **문제:** 예약 조회 API가 요청에 담긴 이메일을 그대로 믿고, 수정 · 취소 API는 예약 번호만 받았습니다. 다른 사람의 이메일이나 예약 번호를 넣으면 남의 예약을 보거나 취소할 수 있는 구조였습니다.
- **해결:**
  - 조회 · 등록은 요청 값 대신 세션에 저장된 로그인 사용자의 이메일을 기준으로 처리합니다.
  - 수정 · 취소 전에 해당 예약이 로그인한 사용자의 것인지 확인하고, 아니면 실패를 반환합니다.
  - 사용자 수정 요청에서는 예약 일시만 반영하고 상태값은 바꿀 수 없게 했습니다.

### 3. 적은 데이터로 타이어 마모 분류 → VGG19 전이학습

- **문제:** 데이터셋(Kaggle 타이어 이미지)이 적어, CNN을 처음부터 학습시키면 과적합이 심하고 미세한 균열 · 홈 깊이를 잘 구분하지 못했습니다.
- **해결:** ImageNet 사전학습 가중치를 가진 VGG19 위에 분류층(Dense 4096 → Dropout → Dense 100 → Sigmoid)을 얹어 타이어 데이터로 미세 조정(Fine-tuning)했습니다. 모델은 0~1 점수를 내고, 서버에서 `0.8 초과 정상 / 0.4 초과 주의 / 그 외 교체 권장`으로 판정합니다.
- **VGG19를 고른 이유:**
  - 3×3 필터 3개를 쌓으면 7×7 필터 1개와 같은 수용 영역을 보면서도 파라미터가 적습니다 (3 × 3² = 27 < 7² = 49).
  - 층마다 ReLU가 들어가 비선형성이 커지므로, 타이어 표면의 불규칙한 마모 질감을 구분하는 데 유리하다고 판단했습니다.
  - 검증된 구조를 그대로 쓰고 분류층 조정에만 집중할 수 있어 1인 개발 일정에 맞았습니다.

> 학습은 별도 환경에서 진행했고, 이 레포에는 학습된 가중치를 불러와 추론하는 서버 코드만 있습니다.

### 4. 요청마다 모델 로딩 → 서버 시작 시 1회 로딩

- **문제:** 추론 요청마다 VGG19 모델을 만들고 가중치 파일을 다시 읽어, 이미지가 연속으로 들어오면 메모리가 급증하고 AI 서버가 강제 종료됐습니다.
- **해결:**
  - FastAPI 서버가 뜰 때 모델 구조를 만들고 가중치를 한 번만 불러온 뒤, 모든 요청이 같은 모델을 공유하도록 바꿨습니다.
  - 이미지 전처리(RGB 변환 → 224×224 리사이즈 → VGG19 전처리)를 별도 함수로 분리했습니다.
  - 가중치 로드에 실패하거나 추론 중 오류가 나도 서버가 죽지 않고 오류 메시지를 응답하도록 예외 처리를 넣었습니다.

### 5. 챗봇 LLM 선택 → Gemini 대신 Groq

- **고민:** 챗봇은 사용자가 답을 기다리는 화면이라 첫 응답이 늦으면 체감 품질이 크게 떨어집니다. 테스트와 운영 비용도 1인 프로젝트에서 부담이었습니다.
- **선택:** 추론 전용 하드웨어(LPU)로 응답이 빠르고 무료 티어를 쓸 수 있는 Groq API(`llama-3.1-8b-instant`)를 선택했습니다. Spring Boot의 `ChatService`가 서버에서 Groq를 호출하므로 API 키가 브라우저에 노출되지 않습니다. 시스템 프롬프트로 외국어 · 한자가 섞이지 않은 한국어 답변만 하도록 제한했습니다.

---

## 로컬 실행 방법

### 1. Backend (Spring Boot, :8080)

설정 파일은 저장소에 포함하지 않습니다. `backend/src/main/resources/application.yml`을 만들고 아래 값을 채웁니다.

```yaml
spring:
  datasource:
    url: jdbc:mariadb://localhost:3306/car
    username: <db_user>
    password: <db_password>
  mail:            # 이메일 인증 (SMTP)
    host: smtp.gmail.com
    port: 587
    username: <mail_address>
    password: <app_password>
  security:
    oauth2:
      client:
        registration:   # 카카오 · 네이버 소셜 로그인 client-id / secret
          kakao: { client-id: <id>, client-secret: <secret> }
          naver: { client-id: <id>, client-secret: <secret> }

groq:
  api:
    key: <groq_api_key>

file:
  upload-dir: <업로드 파일 저장 경로>
```

```bash
cd backend
mvn spring-boot:run
```

### 2. AI Server (FastAPI, :8000)

학습된 가중치 파일 `tire_vgg19_model.h5`는 용량 때문에 저장소에 포함하지 않습니다. `ai-server/models/`에 넣은 뒤 실행합니다.

```bash
cd ai-server
pip install -r requirements.txt
python models/main.py
```

### 3. Frontend (React, :5173)

```bash
cd frontend
npm install
npm run dev
```

> 개발 서버는 Vite 프록시로 `/api`, `/user`, `/service` 요청을 Spring Boot(8080)로, `/predict` 요청을 FastAPI(8000)로 보냅니다.

---

## 배포 (GCP · Nginx · Cloudflare)

### 1. 패키지 설치

```bash
sudo timedatectl set-timezone Asia/Seoul
sudo apt update
sudo apt install openjdk-17-jdk nginx mariadb-server python3-venv -y
```

### 2. MariaDB — 외부 접속 차단, 최소 권한 계정

DB는 애플리케이션과 같은 인스턴스에서만 접근하므로 외부 접속을 막고, 서비스 계정에는 해당 스키마 권한만 부여합니다.

```ini
# /etc/mysql/mariadb.conf.d/50-server.cnf
bind-address = 127.0.0.1
```

```sql
CREATE DATABASE car;
CREATE USER 'commitcar'@'localhost' IDENTIFIED BY '<강력한_비밀번호>';
GRANT SELECT, INSERT, UPDATE, DELETE ON car.* TO 'commitcar'@'localhost';
FLUSH PRIVILEGES;
```

```bash
sudo systemctl restart mariadb
sudo mysql car < schema.sql
```

### 3. 방화벽

GCP 방화벽 규칙에서 **80/443만 허용**하고, 8081(Spring) · 8000(FastAPI) · 3306(DB)은 외부에 열지 않습니다.

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

    # 타이어 AI 진단 → FastAPI
    location /predict {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 그 외 화면 · API → Spring Boot
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

> FastAPI 서버도 같은 방식으로 `uvicorn main:app --app-dir /opt/commit-car/ai-server/models --host 127.0.0.1 --port 8000`을 별도 서비스로 등록합니다.

---

## 회고

- **상태 변경은 신중하게:** 기능 로직을 화면 쪽에 몰아넣지 않고, 예약 상태와 처리 로직을 백엔드 트랜잭션 안에 명시적으로 두는 것이 데이터를 지키는 방법이라는 걸 배웠습니다.
- **"누가 요청했는가"를 서버가 확인해야 한다:** 프론트에서 로그인한 사용자 정보를 보내니 안전하다고 생각했는데, 요청 값은 얼마든지 바꿀 수 있다는 걸 리팩토링하며 깨달았습니다. 이후로는 권한 판단을 항상 서버 세션 기준으로 합니다.
- **모듈 간 결합 줄이기:** 프론트 · 백엔드 · AI 서버를 처음부터 나눠 설계한 덕분에, AI 서버 장애가 예약 기능으로 번지지 않았습니다.
- **다음 개선:** 예약 · 취소처럼 사용자에게 가장 중요한 흐름에 자동화된 테스트를 추가하고, AI 서버에도 업로드 파일 형식 · 크기 검증을 넣을 계획입니다.
