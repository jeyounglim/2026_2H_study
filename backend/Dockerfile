# ===== Backend (Express + Prisma) =====
FROM node:20-alpine

WORKDIR /app

# 의존성 설치 (레이어 캐시 활용)
COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

# Prisma 스키마 복사 후 클라이언트 생성
COPY prisma ./prisma
RUN npx prisma generate

# 소스 복사
COPY . .

ENV NODE_ENV=production
EXPOSE 4000

# 컨테이너 기동 시 마이그레이션 적용 후 서버 시작
CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]
