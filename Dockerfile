# Dockerfile.minimal
# ============= 构建阶段 =============
FROM node:22-alpine AS builder

# 启用 Corepack 并安装构建依赖
RUN corepack enable
WORKDIR /app

# 安装编译依赖 (增加了 vips-dev 以支持 sharp，以及 git 等常用构建工具)
RUN apk add --no-cache --virtual .build-deps \
    python3 \
    make \
    g++ \
    git \
    sqlite-dev \
    vips-dev \
    fftw-dev

# 复制依赖定义
COPY package.json yarn.lock .yarnrc ./

# 使用更标准的 Yarn 缓存路径并暂时移除缓存挂载，以排除并发或路径权限导致的问题
# 如果确定没有 lockfile 冲突，可以重新加回缓存挂载
RUN yarn install --network-timeout 600000

COPY . .
RUN yarn build


# 关键：在构建产物中重新安装 better-sqlite3，确保编译产物完整适配
RUN cp /app/yarn.lock /app/.output/server/
RUN cd /app/.output/server && yarn add better-sqlite3 --frozen-lockfile --production

# 移除编译依赖
RUN apk del .build-deps

# ============= 最小运行时 =============
FROM node:22-alpine AS runtime

# 安装运行时必需的库：SQLite 共享库
RUN apk add --no-cache curl libc6-compat sqlite-libs && \
    addgroup -g 1001 -S nodejs && adduser -S nuxt -u 1001 && \
    mkdir -p /app/data && chown -R nuxt:nodejs /app/data && \
    mkdir -p /app/static && chown -R nuxt:nodejs /app/static
WORKDIR /app

# 🔥 只复制运行时必需的文件
# 复制 Nuxt 构建产物和必要配置
COPY --from=builder --chown=nuxt:nodejs /app/.output /app/.output
COPY --chown=nuxt:nodejs package.json ./

# 🔥 不安装任何 npm 包，Nuxt 构建后是自包含的
USER nuxt
EXPOSE 3000

ENV NODE_ENV=production
CMD ["node", ".output/server/index.mjs"]