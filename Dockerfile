# Dockerfile.minimal
# ============= 构建阶段 =============
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare yarn@stable --activate
WORKDIR /app

# 安装编译依赖
RUN apk add --no-cache --virtual .build-deps \
    python3 \
    make \
    g++ \
    sqlite-dev

COPY package.json yarn.lock .yarnrc ./

# 强制替换锁文件中的镜像源地址为官方源，确保下载稳定性
RUN sed -i 's|https://registry.npmmirror.com|https://registry.npmjs.org|g' yarn.lock && \
    sed -i 's|https://mirrors.huaweicloud.com/repository/npm|https://registry.npmjs.org|g' yarn.lock && \
    yarn config set registry https://registry.npmjs.org/ && \
    yarn install --frozen-lockfile

COPY . .
RUN yarn build


# 关键：在构建产物中重新安装 better-sqlite3，确保编译产物完整适配
RUN cp /app/yarn.lock /app/.output/server/
RUN cd /app/.output/server && yarn add better-sqlite3 --registry https://registry.npmjs.org/ --production

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