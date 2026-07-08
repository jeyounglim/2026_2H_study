# Frontend to FullStack - Build & Understand (하반기 과제)

프론트엔드 개발자가 백엔드/DB/인증까지 서비스 전체 흐름을 이해하기 위한 풀스택 게시판 서비스입니다.

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | Nuxt 3 (Vue 3), Pinia |
| Backend | Node.js, Express, Prisma ORM |
| Database | MySQL |
| Auth | JWT + bcrypt |
| API Docs | Swagger (swagger-ui-express + swagger-jsdoc) |
| Email | nodemailer (이메일 인증) |

## 프로젝트 구조

```
2026_2H_study/
├─ backend/        # Express + Prisma + MySQL REST API
├─ frontend/       # Nuxt 3 + Pinia 웹 클라이언트
├─ docker-compose.yml   # (선택) 로컬 MySQL + backend + frontend
└─ .github/workflows/   # (선택) 자동 배포
```

## 빠른 시작

### 1. 사전 준비
- Node.js 18+ (권장 20/22)
- MySQL 8+ (로컬 설치 또는 `docker compose up mysql`)

### 2. 백엔드
```bash
cd backend
cp .env.example .env      # DATABASE_URL, JWT_SECRET 등 설정
npm install
npx prisma migrate dev --name init
npm run dev               # http://localhost:4000, Swagger: /api-docs
```

### 3. 프론트엔드
```bash
cd frontend
cp .env.example .env      # NUXT_PUBLIC_API_BASE 설정
npm install
npm run dev               # http://localhost:3000
```

## 주요 기능 (필수 구현)

- 회원가입: 이메일 중복 검사, bcrypt 비밀번호 암호화, 이메일 인증
- 로그인: JWT 기반 인증, 토큰 발급, 인증 API 보호
- 게시판: 작성/목록/상세/수정/삭제 (본인 글만 수정·삭제)
- 댓글: 작성/조회/삭제 (본인 댓글만 삭제)
- 페이징: 게시글 목록 서버 페이징 + UI 페이지 처리

## 서비스 흐름 이해 (평가 대비 요약)

- **JWT payload**: `{ userId, email }` — 비밀번호 등 민감 정보는 포함하지 않음
- **상태 관리**: Pinia `auth` store 에서 `user`, `token` 관리
- **API 계층**: `composables/useApi.ts` 에서 공통 요청/에러 처리, 토큰 자동 첨부
- **토큰 저장**: `useCookie('token')` — 새로고침/SSR에서도 로그인 상태 유지
- **토큰 만료**: 401 응답 시 인터셉터에서 로그아웃 후 로그인 페이지로 이동
- **인증 페이지 접근 제어**: `middleware/auth.ts` 라우트 가드

자세한 API 명세는 백엔드 실행 후 `http://localhost:4000/api-docs` (Swagger) 참고.

## Docker 로 한 번에 실행 (선택)

Docker 및 Docker Compose가 설치되어 있다면 MySQL + 백엔드 + 프론트엔드를 한 번에 띄울 수 있습니다.

```bash
# 루트에서
docker compose up -d --build
# frontend: http://localhost:3000
# backend:  http://localhost:4000 (Swagger: /api-docs)
```

환경변수(`JWT_SECRET`, `SMTP_*` 등)는 루트 `.env` 또는 셸 환경에서 오버라이드할 수 있습니다.

## 자동 배포 (선택, GitHub Actions)

- `.github/workflows/ci.yml`: push/PR 시 백엔드 로드 체크 + 프론트엔드 빌드 검증
- `.github/workflows/deploy.yml`: `main` 브랜치 push 시 SSH로 클라우드 서버에 접속해 `docker compose up -d --build` 실행

배포 워크플로 사용 전, 저장소 `Settings > Secrets and variables > Actions` 에 다음을 등록하세요.

| Secret | 설명 |
|--------|------|
| `SSH_HOST` | 클라우드 서버 IP/호스트 |
| `SSH_USER` | SSH 사용자 |
| `SSH_KEY` | SSH 개인키 |
| `DEPLOY_PATH` | 서버 내 저장소 경로 |
