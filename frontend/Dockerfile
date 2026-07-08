# ===== Frontend (Nuxt 3, SSR) =====
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci || npm install
COPY . .
RUN npm run build

# ---- runtime ----
FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/.output ./.output

ENV NODE_ENV=production
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=3000
EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
