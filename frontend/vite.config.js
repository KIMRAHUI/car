import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
    // 현재 모드(development/production)에 따른 환경 변수를 로드합니다.
    const env = loadEnv(mode, process.cwd(), '');

    // 배포 환경이면 실제 도메인(HTTPS)을, 로컬이면 localhost를 타겟으로 설정합니다.
    const apiTarget = mode === 'production'
        ? 'https://car.rhui.dev'
        : 'http://localhost:8080';

    return {
        plugins: [react()],
        server: {
            port: 5173,
            proxy: {
                '/service': {
                    target: apiTarget,
                    changeOrigin: true,
                    secure: mode === 'production',
                    cookieDomainRewrite: "localhost",
                },
                // 1. 스프링 부트 백엔드 API (경로별 중복을 방지하기 위해 공통 타겟 사용)
                '/api': {
                    target: apiTarget,
                    changeOrigin: true,
                    secure: mode === 'production',
                },
                '/user': {
                    target: apiTarget,
                    changeOrigin: true,
                    secure: mode === 'production',
                    cookieDomainRewrite: "localhost",
                },
                '/mypage': {
                    target: apiTarget,
                    changeOrigin: true,
                    secure: mode === 'production',
                    cookieDomainRewrite: "localhost",
                },
                '/oauth2': {
                    target: apiTarget,
                    changeOrigin: true,
                    secure: mode === 'production',
                },
                '/login': {
                    target: apiTarget,
                    changeOrigin: true,
                    secure: mode === 'production',
                    cookieDomainRewrite: "localhost",
                },
                '/upload': {
                    target: apiTarget,
                    changeOrigin: true,
                    secure: mode === 'production',
                },

                // 2. 타이어 AI 진단 서버 (FastAPI)
                '/predict': {
                    target: mode === 'production' ? 'http://127.0.0.1:8000' : 'http://localhost:8000',
                    changeOrigin: true,
                    secure: false,
                },

                // 3. 카카오 모빌리티 API
                '/v1/directions': {
                    target: 'https://apis-navi.kakaomobility.com',
                    changeOrigin: true,
                    secure: true,
                    rewrite: (path) => path.replace(/^\/v1\/directions/, '/v1/directions')
                }
            }
        },
        build: {
            // 빌드 결과물이 스프링 부트 정적 리소스 폴더로 바로 들어가도록 설정
            outDir: '../backend/src/main/resources/static',
            emptyOutDir: true,
        }
    }
})