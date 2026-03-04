# ============= 构建阶段 (原生架构) =============
FROM --platform=$BUILDPLATFORM node:22-alpine AS builder

RUN corepack enable
WORKDIR /app

# 安装编译依赖
RUN apk add --no-cache python3 make g++ git sqlite-dev

# 安装 JS 依赖 (在宿主机原生架构下运行，极速)
COPY package.json yarn.lock .yarnrc ./
RUN yarn install --network-timeout 600000

# 构建项目
COPY . .
RUN yarn build


# ============= 最小运行时 (目标架构) =============
FROM node:22-alpine AS runtime

# 安装运行时必需的系统库
RUN apk add --no-cache curl libc6-compat sqlite-libs && \
    addgroup -g 1001 -S nodejs && adduser -S nuxt -u 1001 && \
    mkdir -p /app/data && chown -R nuxt:nodejs /app/data && \
    mkdir -p /app/static && chown -R nuxt:nodejs /app/static
WORKDIR /app

# 复制构建产物
COPY --from=builder --chown=nuxt:nodejs /app/.output /app/.output
COPY --from=builder --chown=nuxt:nodejs /app/package.json /app/yarn.lock /app/.yarnrc ./

# 关键：在目标架构下重新安装原生二进制模块
# Nuxt 3 内置了 sharp，但更好的做法是确保它和 better-sqlite3 一起被物理安装匹配架构
RUN corepack enable && \
    cd /app/.output/server && \
    yarn add better-sqlite3 sharp --production --network-timeout 600000

USER nuxt
EXPOSE 3000

ENV NODE_ENV=production
CMD ["node", ".output/server/index.mjs"]