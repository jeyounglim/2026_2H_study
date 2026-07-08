# Frontend to FullStack - Build & Understand (하반기 과제)

프론트엔드 개발자가 백엔드/DB/인증까지 서비스 전체 흐름을 이해하기 위한 풀스택 게시판 서비스입니다.

## 제출 정보

| 항목 | URL |
|------|-----|
| GitHub Repository | https://github.com/jeyounglim/2026_2H_study |
| 서비스 URL (로컬) | http://localhost:3000 |
| Swagger API 문서 (로컬) | http://localhost:4000/api-docs |
| 서비스 URL (배포) | Oracle Cloud 배포 후 `http://YOUR_PUBLIC_IP:3000` ([DEPLOY.md](DEPLOY.md) 참고) |
| Swagger (배포) | `http://YOUR_PUBLIC_IP:4000/api-docs` |

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | Nuxt 3 (Vue 3), Pinia |
| Backend | Node.js, Express, Prisma ORM |
| Database | MySQL |
| Auth | JWT + bcryptjs |
| API Docs | Swagger (swagger-ui-express + swagger-jsdoc) |
| Email | nodemailer (이메일 인증) |
| Deploy | Docker Compose, GitHub Actions |

## 프로젝트 구조

```
2026_2H_study/
├─ backend/              # Express + Prisma + MySQL REST API
├─ frontend/             # Nuxt 3 + Pinia 웹 클라이언트
├─ docker-compose.yml    # MySQL + backend + frontend
├─ scripts/              # 서버 셋업/배포 스크립트
├─ DEPLOY.md             # Oracle Cloud 배포 가이드
├─ DEMO.md               # 평가/발표 데모 시나리오
└─ .github/workflows/    # CI + 자동 배포
```

## 빠른 시작 (로컬)

### 1. 사전 준비
- Node.js 18+
- MySQL 8+ (로컬 설치 또는 `docker compose up -d mysql`)

### 2. 백엔드
```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npm run dev               # http://localhost:4000, Swagger: /api-docs
```

### 3. 프론트엔드
```bash
cd frontend
cp .env.example .env
npm install
npm run dev               # http://localhost:3000
```

## 주요 기능 (필수 구현)

- 회원가입: 이메일 중복 검사, bcrypt 비밀번호 암호화, 이메일 인증
- 로그인: JWT 기반 인증, 토큰 발급, 인증 API 보호
- 게시판: 작성/목록/상세/수정/삭제 (본인 글만 수정·삭제)
- 댓글: 작성/조회/수정/삭제 (본인 댓글만 수정·삭제)
- 페이징: 게시글 목록 서버 페이징 + UI 페이지 처리
- (보너스) 게시글 검색

## 평가 대비 Q&A

### Backend / JWT
- **JWT payload**: `{ userId, email }` — 비밀번호 등 민감 정보 미포함 (`backend/src/lib/jwt.js`)
- **인증 API 보호**: `authRequired` 미들웨어가 Bearer 토큰 검증 (`backend/src/middleware/auth.js`)

### Database
- **테이블 관계**: User 1:N Post, User 1:N Comment, Post 1:N Comment (cascade delete)
- **설계 기준**: 게시글/댓글은 작성자 FK로 소유권 판별, 삭제 시 orphan 방지를 위해 cascade

### Frontend / 상태관리
- **라이브러리**: Pinia — Vue 3 공식 상태관리, Nuxt `@pinia/nuxt` 모듈과 통합
- **관리 데이터**: `user`(프로필), `token`(JWT) — `frontend/stores/auth.ts`
- **선택 이유**: Composition API 친화, 보일러플ate 적음, Nuxt 공식 지원

### API 연동
- **호출 방식**: Nuxt `$fetch` 기반 `useApi()` composable
- **로직 위치**: `frontend/composables/useApi.ts`
- **공통 처리**: baseURL, JWT 헤더 자동 첨부, 401 시 logout + redirect
- **토큰 전달**: `Authorization: Bearer <token>`

### 에러 처리
- **프론트**: API 에러 `e?.data?.message` 표시, 401은 interceptor에서 공통 처리
- **백엔드**: `errorHandler` 미들웨어로 `{ message }` 형태 통일

### 로그인
- **상태 확인**: Pinia `isLoggedIn` (= user 존재), API `/auth/me`로 검증
- **저장 위치**: token → `useCookie('token')`, user → Pinia store
- **새로고침 유지**: `plugins/auth.ts`에서 `fetchMe()` 호출
- **페이지 접근 제어**: `middleware/auth.ts` 라우트 가드
- **토큰 만료**: 401 응답 → token 삭제 → `/login` 이동

### 회원가입 / 이메일 인증
- **방식**: 가입 시 `verifyToken` 발급 → 이메일(또는 콘솔) 링크 → `GET /auth/verify-email?token=` → `isVerified=true`
- **SMTP 미설정 시**: 백엔드 콘솔 + API 응답에 `verifyUrl` 출력 (개발 편의)

## Docker / 클라우드 배포

```bash
cp .env.production.example .env   # PUBLIC_HOST, JWT_SECRET 등 수정
docker compose up -d --build
```

Oracle Cloud 배포 상세: [DEPLOY.md](DEPLOY.md)

## GitHub Actions

- **CI** (`.github/workflows/ci.yml`): push/PR 시 빌드 검증
- **Deploy** (`.github/workflows/deploy.yml`): Secrets 설정 시 main push → SSH 배포

| Secret | 설명 |
|--------|------|
| `SSH_HOST` | 클라우드 서버 IP |
| `SSH_USER` | SSH 사용자 (예: ubuntu) |
| `SSH_KEY` | SSH 개인키 |
| `DEPLOY_PATH` | 서버 내 repo 경로 |

## 데모 시나리오

평가/발표용 단계별 시연: [DEMO.md](DEMO.md)
