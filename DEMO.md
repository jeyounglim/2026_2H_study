# 데모 시나리오 (평가/발표용)

## 사전 준비 (5분)

1. MySQL 실행 (로컬) 또는 `docker compose up -d`
2. `backend`: `npm run dev` → http://localhost:4000
3. `frontend`: `npm run dev` → http://localhost:3000
4. Swagger: http://localhost:4000/api-docs

## 데모 흐름 (10~15분)

### 1. 아키텍처 설명 (1분)

- Nuxt(프론트) → Express REST API → MySQL
- JWT 인증, Pinia 상태관리, Swagger 문서

### 2. Swagger에서 API 구조 (2분)

- `/api/auth/*`, `/api/posts/*`, `/api/comments/*` 엔드포인트 설명
- Bearer JWT 인증 방식 시연

### 3. 회원가입 + 이메일 인증 (2분)

1. `/register` 에서 계정 생성
2. SMTP 미설정 시: 백엔드 터미널 또는 응답의 `verifyUrl` 로 인증
3. `/verify-email?token=...` → 인증 완료

### 4. 로그인 + 상태 유지 (2분)

1. `/login` 로그인
2. 새로고침 → 로그인 유지 (`useCookie` + `fetchMe` 설명)
3. `/posts/new` 접근 → auth middleware 동작

### 5. 게시판 CRUD + 페이징 (3분)

1. 글 작성
2. 목록에서 페이징 확인
3. 상세 → 수정 → 삭제 (본인만)

### 6. 댓글 CRUD (2분)

1. 댓글 작성
2. 본인 댓글 수정
3. 본인 댓글 삭제

### 7. 코드 하이라이트 (3분, 질문 대비)

| 질문 | 답변 + 파일 |
|------|-------------|
| JWT에 뭐 담았나? | `{ userId, email }` — `backend/src/lib/jwt.js` |
| 상태관리? | Pinia, `user`/`token` — `frontend/stores/auth.ts` |
| API 호출 구조? | `useApi` composable — `frontend/composables/useApi.ts` |
| 토큰 전달? | `Authorization: Bearer` 헤더 |
| 401 처리? | interceptor → logout + `/login` |
| 이메일 인증? | verifyToken → `/verify-email` → `isVerified=true` |
| 테이블 관계? | User 1:N Post, User 1:N Comment, Post 1:N Comment |

## 배포 데모 (클라우드 완료 시)

- 서비스 URL 접속 → 동일 흐름 시연
- Swagger 공개 URL 제출

자세한 배포: [DEPLOY.md](DEPLOY.md)
