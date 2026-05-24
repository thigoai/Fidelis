# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=22

# ========== Base ==========
FROM node:${NODE_VERSION}-alpine AS base
WORKDIR /app

# ========== Deps (camada cacheada) ==========
FROM base AS deps
COPY package.json package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm \
    if [ -f package-lock.json ]; then npm ci; else npm install; fi

# ========== Dev (Vite dev server) ==========
FROM base AS dev
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ========== Builder (assets estáticos) ==========
FROM deps AS builder
ENV NODE_ENV=production
COPY . .
RUN npm run build

# ========== Runtime (nginx servindo estático) ==========
FROM nginx:1.27-alpine AS runtime
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
