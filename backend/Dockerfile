# syntax=docker/dockerfile:1

# --- Etapa 1: dependencias + build ---
FROM node:20-alpine AS builder
WORKDIR /workspace

# Copiamos primero los manifiestos para aprovechar la cache de capas de Docker.
COPY package.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json

RUN npm install

# Copiamos el resto del código y compilamos solo el workspace de backend.
COPY backend backend

RUN npm run prisma:generate -w backend
RUN npm run build -w backend

# --- Etapa 2: runtime ligero ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /workspace/backend/package.json ./package.json
COPY --from=builder /workspace/backend/prisma ./prisma
COPY --from=builder /workspace/backend/dist ./dist
COPY --from=builder /workspace/node_modules ./node_modules

EXPOSE 3001
CMD ["node", "dist/main.js"]
