#  COMMIT CAR

> **Spring Boot · React · FastAPI · VGG19**를 결합한
> 차량 결함 AI 진단 + 정비소 예약 풀스택 웹 플랫폼

---

##  프로젝트 개요

| 항목 | 내용 |
| --- | --- |
| 개발 기간 | 2026.04.03 ~ 2026.06.15 (74일) |
| 개발 인원 | 1인 (기획 · 프론트엔드 · 백엔드 · AI 모델 · 배포 전 과정) |
| 소개 | 오프라인으로 흩어져 있던 정비 예약 과정을 웹으로 모으고, 사용자가 올린 타이어 이미지의 마모·결함 상태를 AI로 진단해 가까운 정비소 예약까지 한 흐름으로 연결합니다. |

---

##  Tech Stack

| 영역 | 기술 |
| --- | --- |
| Frontend | React, Vite |
| Backend | Java 17, Spring Boot, Spring Security, MariaDB |
| AI Server | Python, FastAPI, TensorFlow / Keras (VGG19) |
| Infra | GCP Compute Engine, Nginx, Cloudflare |

---

##  System Architecture

비즈니스 로직(Spring Boot)과 AI 추론(FastAPI)을 별도 서버로 나눠, 모델을 교체하거나 AI 서버만 따로 재시작해도 예약·회원 기능에는 영향이 없도록 구성했습니다. 외부 트래픽은 Cloudflare → Nginx 한 경로로만 들어오고, 각 애플리케이션 포트와 DB는 외부에 노출하지 않습니다.

```text
[ Web Client (React) ]
        │  HTTPS
        ▼
[ Cloudflare (DNS · Proxy) ]
        │
        ▼
[ GCP Instance ── Nginx Reverse Proxy ]
        │
   ┌────┴──────────────────────┐
   ▼                           ▼
[ Spring Boot :8081 ]  ──▶  [ FastAPI :8000 ]
 REST API · 예약 · 회원        VGG19 추론
   │
   ▼
[ MariaDB :3306 (localhost only) ]
```

---

##  핵심 구현 & 문제 해결

### 1. 예약 취소 시 데이터 유실 → 상태 전이 방식으로 변경

- **문제:** 예약 취소를 물리 삭제(`DELETE`)로 처리하자, 해당 예약을 참조하던 하위 데이터의 참조 무결성이 깨지고 화면에서 예외가 발생했습니다.
- **해결:**
  - 행을 지우는 대신 예약 상태를 `ACTIVE` → `CANCELLED`로 바꾸는 소프트 삭제로 리팩토링해, 취소된 예약도 이력으로 조회할 수 있게 했습니다.
  - 상태 변경과 연관 데이터 처리를 `@Transactional` 하나로 묶어 중간에 실패해도 일부만 반영되지 않도록 했습니다.

<!-- TODO: 핵심 코드 링크 추가 예) [ReservationService.java#L42](backend/src/main/java/.../ReservationService.java) -->

### 2. 적은 데이터로 타이어 마모 분류 → VGG19 전이학습

- **문제:** 데이터셋(Kaggle 타이어 이미지)이 적어, CNN을 처음부터 학습시키면 과적합이 심하고 미세한 마모를 잘 구분하지 못했습니다.
- **해결:** ImageNet 사전학습 가중치를 가진 VGG19를 불러와 합성곱층은 고정하고, 분류층만 타이어 데이터로 미세 조정(Fine-tuning)했습니다.
- **결과:**

<!-- TODO: 실제 측정값으로 채우기. 숫자가 없으면 이 표는 삭제 -->
| 모델 | Train Acc | Validation Acc |
| --- | --- | --- |
| CNN (Scratch) | 00% | 00% |
| VGG19 (Fine-tuning) | 00% | 00% |

### 3. 요청마다 모델 로딩 → 서버 시작 시 1회 로딩

- **문제:** 요청마다 모델 가중치를 다시 불러와, 이미지가 연속으로 들어오면 메모리가 급증하고 AI 서버가 다운됐습니다.
- **해결:**
  - FastAPI 기동 시점에 VGG19 가중치를 메모리에 한 번만 로드하고 모든 요청이 공유하도록 변경했습니다.
  - 파일 형식·크기 검사를 추론 전에 먼저 수행해 잘못된 요청은 모델까지 가지 않게 했습니다.
- **결과:** <!-- TODO: 예) 추론 응답 0.0s → 0.0s, 연속 요청 N건에서 다운 없음 --> 추론 응답 시간 `0.0s → 0.0s`

### 4. 그 외 기능

- **정비소 조회 · 예약:** 정비소 목록 조회, 날짜·시간·정비 항목 선택 예약, `ReservationValidator`로 입력값 검증
- **회원 관리:** 이메일 인증, 비밀번호 BCrypt 암호화 저장, Spring Security로 공개/인증 경로 분리

---

##  로컬 실행 방법

```bash
# 1. Backend (Spring Boot)
cd backend
cp src/main/resources/application-example.yml src/main/resources/application.yml   # DB 정보 입력
./mvnw spring-boot:run          # http://localhost:8081

# 2. AI Server (FastAPI)
cd ai-server
pip install -r requirements.txt
uvicorn main:app --port 8000    # http://localhost:8000/docs

# 3. Frontend (React)
cd frontend
npm install
npm run dev                     # http://localhost:5173
```

> DB 비밀번호, 메일 계정 등 민감 정보는 저장소에 포함하지 않으며 환경 변수로 주입합니다.

---

##  배포 (GCP · Nginx · Cloudflare)

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

> FastAPI 서버도 같은 방식으로 `uvicorn main:app --host 127.0.0.1 --port 8000`을 별도 서비스로 등록합니다.

---

## 📝 회고

<!-- TODO: 2~3줄. 아쉬웠던 점 / 다음에 개선할 점 예) Docker 컨테이너화, GitHub Actions 배포 자동화, 모델 정확도 개선 -->
- 아쉬운 점:
- 다음 개선:
