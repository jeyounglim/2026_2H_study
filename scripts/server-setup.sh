#!/usr/bin/env bash
# Oracle Cloud / Ubuntu VM 최초 셋업 스크립트
# 사용: bash scripts/server-setup.sh
set -euo pipefail

echo "==> 시스템 업데이트"
sudo apt-get update -y
sudo apt-get upgrade -y

echo "==> Docker 설치"
sudo apt-get install -y docker.io docker-compose-v2 git
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker "$USER"

echo "==> 방화벽 포트 (Ubuntu ufw 사용 시)"
if command -v ufw >/dev/null 2>&1; then
  sudo ufw allow 22/tcp
  sudo ufw allow 3000/tcp
  sudo ufw allow 4000/tcp
  echo "ufw 활성화는 Oracle Cloud Security List 와 함께 확인 후: sudo ufw enable"
fi

echo ""
echo "완료. 로그아웃 후 재접속하여 docker 그룹을 적용하세요."
echo "다음: git clone https://github.com/jeyounglim/2026_2H_study.git && cd 2026_2H_study"
echo "      cp .env.production.example .env  # PUBLIC_HOST 등 수정"
echo "      docker compose up -d --build"
