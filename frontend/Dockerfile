# syntax=docker/dockerfile:1

# --- Etapa 1: dependencias + build ---
FROM node:20-alpine AS builder
WORKDIR /workspace

COPY package.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json

RUN npm install

COPY frontend frontend

ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build -w frontend

# --- Etapa 2: runtime ligero ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /workspace/frontend/package.json ./package.json
COPY --from=builder /workspace/frontend/.next ./.next
COPY --from=builder /workspace/frontend/next-env.d.ts ./next-env.d.ts
COPY --from=builder /workspace/node_modules ./node_modules

EXPOSE 3000
CMD ["npx", "next", "start", "-p", "3000"]
