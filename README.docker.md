# Docker 部署指南

## 方式一：使用预构建镜像（推荐）

### 1. 拉取镜像
```shell
docker pull bujidec/nuxt-blog-site:latest
```

### 2. 启动容器
```shell
docker run -d \
  -v ./data:/app/data \           # 映射数据目录（数据库文件）
  -v ./blog:/blog \                # 映射博客文章目录
  -v ./uploads:/app/static \       # 映射静态资源目录
  -p 3000:3000 \                   # 映射端口
  --name nuxt-blog \
  bujidec/nuxt-blog-site:latest
```

**镜像信息：**
- Docker Hub: [bujidec/nuxt-blog-site](https://hub.docker.com/r/bujidec/nuxt-blog-site)
- 支持架构: `linux/amd64`, `linux/arm64`
- 自动构建: 每次 master 分支更新时自动构建并推送

---

## 方式二：本地构建镜像

### 1. 构建镜像
```shell
docker build -f Dockerfile -t nuxt-blog-site:latest .
```

### 2. 导出镜像（可选）
```shell
docker save -o ~/Downloads/nuxt-blog-site.tar nuxt-blog-site:latest
```

### 3. 启动容器
```shell
docker run -d \
  -v ./data:/app/data \           # 映射数据目录
  -v ./blog:/blog \                # 映射博客文章目录
  -v ./uploads:/app/static \       # 映射静态资源目录
  -p 3000:3000 \                   # 映射端口
  --name nuxt-blog \
  nuxt-blog-site:latest
```

---

## 使用 Docker Compose（推荐用于生产环境）

创建 `docker-compose.yml` 文件：

```yaml
version: '3.8'

services:
  nuxt-blog:
    image: bujidec/nuxt-blog-site:latest
    container_name: nuxt-blog
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
      - ./blog:/blog
      - ./uploads:/app/static
    environment:
      - NODE_ENV=production
      - NUXT_DB_PATH=/app/data/blog.db
      - NUXT_BASE_PATH=/blog
      - NUXT_STATIC_PATH=/app/static
    restart: unless-stopped
```

启动服务：
```shell
docker-compose up -d
```

---

## 常用 Docker 命令

```shell
# 查看运行中的容器
docker ps

# 查看容器日志
docker logs nuxt-blog

# 停止容器
docker stop nuxt-blog

# 启动容器
docker start nuxt-blog

# 重启容器
docker restart nuxt-blog

# 删除容器
docker rm nuxt-blog

# 更新镜像并重启
docker pull bujidec/nuxt-blog-site:latest
docker stop nuxt-blog
docker rm nuxt-blog
# 然后重新运行 docker run 命令
```