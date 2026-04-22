import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            // 백엔드 연동 설정: /user 뿐만 아니라 소셜 로그인 관련 경로도 추가
            '/user': {
                target: 'http://localhost:8080',
                changeOrigin: true,
                secure: false,
            },
            // 마이페이지 API 프록시 설정
            '/mypage': {
                target: 'http://localhost:8080',
                changeOrigin: true,
                secure: false,
            },
            // [추가] 예약 서비스 API 프록시 설정 (5173 포트에서 예약 내역 확인을 위해 필수)
            '/service': {
                target: 'http://localhost:8080',
                changeOrigin: true,
                secure: false,
            },
            // [추가] 소셜 로그인(OAuth2) 시작 경로 프록시
            '/oauth2': {
                target: 'http://localhost:8080',
                changeOrigin: true,
                secure: false,
            },
            // 소셜 로그인 콜백 경로 프록시 (보안을 위해 추가)
            '/login/oauth2': {
                target: 'http://localhost:8080',
                changeOrigin: true,
                secure: false,
            },
            // 이미지 파일을 불러오기 위한 프록시 (image1, image2 출력용)
            '/upload': {
                target: 'http://localhost:8080',
                changeOrigin: true,
                secure: false,
            },
            // 2. 카카오 모빌리티 API
            '/v1/directions': {
                target: 'https://apis-navi.kakaomobility.com',
                changeOrigin: true,
            }
        }
    },
    build: {
        outDir: '../backend/src/main/resources/static',
        emptyOutDir: true,
    }
})