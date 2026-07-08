#!/usr/bin/env bash
# 서버에서 수동 배포/재배포
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "오류: 루트 .env 파일이 없습니다. cp .env.production.example .env 후 설정하세요."
  exit 1
fi

echo "==> git pull"
git pull origin main

echo "==> docker compose build & up"
docker compose up -d --build

echo "==> migrate (backend 컨테이너)"
docker compose exec backend npx prisma migrate deploy

echo "==> 상태 확인"
docker compose ps

echo ""
echo "Frontend: http://${PUBLIC_HOST:-localhost}:3000"
echo "Swagger:  http://${PUBLIC_HOST:-localhost}:4000/api-docs"
