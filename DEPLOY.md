# Oracle Cloud 배포 가이드

## 1. Oracle Cloud VM 생성

1. [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/) 가입
2. **Compute > Instances > Create Instance**
3. Image: **Ubuntu 22.04**
4. Shape: **VM.Standard.E2.1.Micro** (Always Free)
5. **Public IP 할당** 확인
6. SSH 키 등록 (배포용 개인키 보관)

## 2. Security List (방화벽) — Oracle Console

Instance VCN > Security List > Ingress Rules 추가:

| Port | Source | 설명 |
|------|--------|------|
| 22 | 0.0.0.0/0 | SSH |
| 3000 | 0.0.0.0/0 | Frontend |
| 4000 | 0.0.0.0/0 | Backend / Swagger |

## 3. VM 접속 및 초기 셋업

```bash
ssh ubuntu@YOUR_PUBLIC_IP
git clone https://github.com/jeyounglim/2026_2H_study.git
cd 2026_2H_study
bash scripts/server-setup.sh
# 로그아웃 후 재접속
```

## 4. 프로덕션 환경변수

```bash
cp .env.production.example .env
nano .env
```

필수 수정:

```env
PUBLIC_HOST=123.45.67.89
MYSQL_ROOT_PASSWORD=강한비밀번호
JWT_SECRET=긴랜덤문자열
CLIENT_URL=http://123.45.67.89:3000
NUXT_PUBLIC_API_BASE=http://123.45.67.89:4000/api
```

## 5. Docker Compose 배포

```bash
docker compose up -d --build
docker compose exec backend npx prisma migrate deploy
docker compose ps
```

접속 확인:

- 서비스: `http://YOUR_PUBLIC_IP:3000`
- Swagger: `http://YOUR_PUBLIC_IP:4000/api-docs`

## 6. GitHub Actions 자동 배포

GitHub Repository > **Settings > Secrets and variables > Actions**:

| Secret | 예시 |
|--------|------|
| `SSH_HOST` | `123.45.67.89` |
| `SSH_USER` | `ubuntu` |
| `SSH_KEY` | SSH 개인키 전체 (PEM) |
| `DEPLOY_PATH` | `/home/ubuntu/2026_2H_study` |

`main` 브랜치 push 시 `.github/workflows/deploy.yml` 이 SSH 접속 후 `docker compose up -d --build` 실행.

수동 배포: VM에서 `bash scripts/deploy.sh`

## 7. 트러블슈팅

- **502 / 연결 안 됨**: Security List 포트, `docker compose ps`, `docker compose logs backend`
- **CORS 오류**: `CLIENT_URL` 이 실제 프론트 URL과 일치하는지 확인
- **API 호출 실패**: `NUXT_PUBLIC_API_BASE` 가 브라우저에서 접근 가능한 공인 IP인지 확인
