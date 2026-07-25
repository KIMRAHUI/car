


# 🚗 COMMIT CAR
> **Spring Boot, React, FastAPI 및 VGG19 인공지능 모델**을
> 결합한엔드투엔드 차량 관리 및 실시간 정비 예약·결함 진단 시스템

---

## 📌 프로젝트 개요
* **프로젝트명:** COMMIT CAR
* **개발 기간:** 2026.04.03 ~ 2026.06.15 (74일)
* **개발 인원:** 개인 프로젝트 (KIM RAHHUI)
* **소개:** 복잡한 오프라인 차량 정비 예약 과정을 웹 환경으로 일원화하고, 사용자가 업로드한 차량/타이어 이미지의 결함 상태를 AI(VGG19)로 실시간 진단하여 가까운 정비소 매칭 및 예약까지 원스톱으로 제공하는 풀스택 웹 플랫폼입니다.

---

## 🛠️ Tech Stack

### **Frontend**
* React, Vite

### **Backend (Core)**
* Java, Spring Boot, Spring Security, MariaDB

### **AI & Sub Backend**
* Python, FastAPI, TensorFlow, Keras

### **Infrastructure & Deployment**
* Google Cloud Platform (GCP), Cloudflare, Nginx

---

## 🏗️ System Architecture

프론트엔드, 백엔드 비즈니스 로직, 그리고 AI 모델 추론 파이프라인의 결합도를 완벽하게 분리(Decoupled Philosophy)하여 수평 확장과 유지보수 용이성을 확보했습니다.    
또한 Cloudflare를 앞단에 두어 DNS 관리 및 보안/프록시 경로를 최적화했습니다.

```text
[ Web Client (React) ] 
       │ (HTTPS / DNS & Proxy)
       ▼
[ Cloudflare Edge ] ──> [ GCP Instance (Nginx Reverse Proxy) ]
                              │
         ┌────────────────────┴────────────────────┐
         ▼                                         ▼
[ Spring Boot Backend ]                    [ FastAPI AI Server ]
 (REST API & Core Logic)                     (VGG19 Inference)
         │                                   
         ▼
    [ MariaDB ]

```

---

## 💡 Key Features & Core Engineering

### 1. 백엔드 코어: 데이터 정합성 확보 (Physical Deletion 문제 해결)



* **Problem:** 기존 예약 취소 로직에서 물리적 삭제(`DELETE`)를 적용하여 하위 연결 엔티티들의 참조 무결성이 깨지고 데이터 유실 및 UI 예외가 발생했습니다.


* **Solution:**
* 행을 직접 삭제하는 방식 대신 명시적 상태 전이 아키텍처(`ACTIVE` ➔ `CANCELLED`)를 도입하여 100% 이력 조회가 가능하도록 리팩토링했습니다.


* `@Transactional` 제어를 통해 트랜잭션 경계를 보호하고 예약 데이터의 무결성을 보장했습니다.





### 2. AI 파이프라인: 추론 서버 병목 현상 개선 및 모델 최적화 (Kaggle + VGG19)



* **Problem:**
* 소량의 타이어 이미지 데이터셋 환경에서 일반적인 CNN 구조를 바닥부터(Scratch) 학습시킬 경우 심각한 오버피팅(과적합)과 미세 균열 인지 한계가 발생했습니다.


* 다량의 이미지 유입 시 단일 추론 스레드에서 무거운 모델 가중치 로딩과 전처리 연산이 중복 수행되면서 서버 크래시가 유발되었습니다.




* **Solution (Model Selection - VGG19 vs 일반 CNN):**
* **Kaggle Baseline 한계 극복:** ImageNet 사전학습 가중치(Transfer Learning)를 활용하는 **VGG19**를 채택하여 소량의 데이터에서도 높은 일반화 성능을 확보했습니다.


* **질감 특화 인지:** 3x3 컨볼루션 필터를 적층한 구조를 통해 타이어 홈의 깊이와 미세 마모 질감을 정밀하게 파악하도록 분류층을 미세 조정(Fine-tuning)했습니다.




* **Solution (Serving Optimization):**
* **전처리 독립 분할:** FastAPI 단에서 요청 유효성을 사전 검사하고 고속 이미지 전처리를 분리 처리했습니다.


* **가중치 고정 로드:** 애플리케이션 기동 시 VGG19 가중치를 메모리에 단 1회 로드(`Weight Loading`)하여 추론 오버헤드를 극적으로 제거했습니다.





### 3. 주요 API 및 보안 체계

* **실시간 정비소 탐색 및 예약:** 공임나라, 블루핸즈 등 목록 조회 및 날짜/시간/정비 항목 지정 예약, `ReservationValidator`를 통한 철저한 입력값 검증.


* **안전한 회원 관리:** 이메일 인증 토큰 발급 및 비밀번호 암호화 저장, `Spring Security`를 활용한 Public/Protected 경로 분리.



---

## 🚀 Deployment Guide

Google Cloud Platform(GCP), Cloudflare, Nginx 환경에서의 서비스 배포 및 운영 가이드입니다.

### 1. 서버 환경 설정 및 패키지 설치

```bash
# 타임존 설정
sudo tzselect
sudo dpkg-reconfigure tzdata

# 필수 패키지 설치 (OpenJDK 17, Nginx, MariaDB, Net-tools)
sudo apt update
sudo apt install openjdk-17-jdk nginx mariadb-server net-tools -y

```

### 2. MariaDB 설정 및 데이터베이스 복원

```ini
# /etc/mysql/mariadb.conf.d/50-server.cnf 설정 수정
bind-address = 0.0.0.0

```

```bash
sudo service mysql restart

# 데이터베이스 및 계정 생성
sudo mysql -u root
CREATE USER 'username'@'%' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON *.* TO 'username'@'%';
EXIT;

# 덤프 파일 복원 (portfolio.sql)
sudo mysql -u root --database=schema_name < portfolio.sql

```

### 3. Nginx 및 Cloudflare 연동 설정

* **Cloudflare 설정:** 도메인 DNS 레코드 설정에서 GCP 서버의 공인 IP를 등록하고, 프록시(Proxy) 상태를 활성화(`Proxied`, 주황색 구름)하여 보안 및 성능 최적화를 적용합니다.
* **Nginx 리버스 프록시 설정:** `sudo vi /etc/nginx/sites-enabled/was-forward` 파일을 생성하여 도메인별 포트 포워딩을 구성합니다.



```nginx
server {
    listen 80;
    server_name your_domain.com;
    location / {
        proxy_pass http://localhost:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

```

### 4. WAS(Systemd) 서비스 등록 및 구동 (.jar 기준)

`/etc/systemd/system/server-car.service` 파일을 생성하여 백엔드 `.jar` 서비스를 상시 구동합니다.

```ini
[Unit]
Description=Commit Car Spring Boot JAR Service
After=syslog.target network.target mysql.service

[Service]
ExecStart=/bin/bash -c "sudo java -jar /home/ubuntu/app.jar --server.port=8081"
Restart=on-failure
RestartSec=10
User=root
Group=root

[Install]
WantedBy=multi-user.target

```

```bash
# 서비스 등록, 리로드 및 시작
sudo systemctl enable server-car
sudo systemctl daemon-reload
sudo systemctl start server-car

```


