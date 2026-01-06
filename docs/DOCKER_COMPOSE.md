# Docker Compose 部署指南

## 📋 快速开始

### 1. 准备环境变量

创建 `.env` 文件：

```bash
# 生成强随机密钥
export AUTH_SECRET=$(openssl rand -base64 32)

# 创建 .env 文件
cat > .env << EOF
AUTH_SECRET=${AUTH_SECRET}
EOF
```

### 2. 准备目录结构

```bash
# 创建必要的目录
mkdir -p data blog static

# 设置权限
chmod 755 data blog static
```

### 3. 启动服务

```bash
# 使用 docs 目录下的 compose.yml
docker-compose -f docs/compose.yml up -d

# 或者复制到项目根目录
cp docs/compose.yml docker-compose.yml
docker-compose up -d
```

### 4. 验证部署

```bash
# 查看日志
docker-compose logs -f blog

# 检查服务状态
docker-compose ps

# 访问服务
curl http://localhost:3000
```

---

## 🔧 配置说明

### 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `NUXT_DB_PATH` | `/app/data/blog.db` | SQLite 数据库路径 |
| `NUXT_BASE_PATH` | `/app/blog` | Markdown 文章目录 |
| `NUXT_STATIC_PATH` | `/app/static` | 静态文件上传目录 |
| `NUXT_AUTH__SECRET` | `change-me-in-production` | JWT 密钥（必须修改）|

### 卷挂载

| 容器路径 | 宿主机路径 | 用途 |
|---------|-----------|------|
| `/app/data` | `./data` | 数据库文件 |
| `/app/blog` | `./blog` | Markdown 文章 |
| `/app/static` | `./static` | 上传的图片等 |

---

## 📝 常用命令

### 启动和停止

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose stop

# 重启服务
docker-compose restart

# 停止并删除容器
docker-compose down
```

### 日志查看

```bash
# 查看实时日志
docker-compose logs -f

# 查看最近 100 行日志
docker-compose logs --tail=100

# 查看特定服务的日志
docker-compose logs -f blog
```

### 更新镜像

```bash
# 拉取最新镜像
docker-compose pull

# 重新创建容器
docker-compose up -d --force-recreate
```

---

## 🔄 数据备份

### 备份数据

```bash
# 备份所有数据
tar -czf backup-$(date +%Y%m%d).tar.gz data blog static

# 仅备份数据库
cp data/blog.db data/blog.db.backup
```

### 恢复数据

```bash
# 解压备份
tar -xzf backup-20260106.tar.gz

# 重启服务
docker-compose restart
```

---

## 🚀 生产环境部署

### 1. 使用自定义配置

```yaml
version: '3.8'

services:
  blog:
    image: bujidec/nuxt-blog-site:latest
    container_name: nuxt-blog-prod
    ports:
      - "3000:3000"
    environment:
      - NUXT_DB_PATH=/app/data/blog.db
      - NUXT_BASE_PATH=/app/blog
      - NUXT_STATIC_PATH=/app/static
      - NUXT_AUTH__SECRET=${AUTH_SECRET}
    volumes:
      - /var/lib/blog/data:/app/data
      - /var/lib/blog/articles:/app/blog
      - /var/lib/blog/static:/app/static
    restart: always
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### 2. 使用 Nginx 反向代理

```nginx
server {
    listen 80;
    server_name blog.example.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. 配置 HTTPS

```bash
# 使用 Certbot 获取 SSL 证书
certbot --nginx -d blog.example.com
```

---

## ⚠️ 注意事项

1. **生产环境必须修改 `AUTH_SECRET`**
   ```bash
   # 生成强随机密钥
   openssl rand -base64 32
   ```

2. **定期备份数据**
   - 数据库文件
   - Markdown 文章
   - 上传的图片

3. **监控磁盘空间**
   ```bash
   # 检查磁盘使用
   df -h
   
   # 检查目录大小
   du -sh data blog static
   ```

4. **日志管理**
   - 配置日志轮转
   - 定期清理旧日志

---

## 🐛 故障排查

### 服务无法启动

```bash
# 查看详细日志
docker-compose logs blog

# 检查容器状态
docker-compose ps

# 检查端口占用
lsof -i:3000
```

### 数据库连接失败

```bash
# 检查数据库文件权限
ls -la data/blog.db

# 检查目录挂载
docker-compose exec blog ls -la /app/data
```

### 无法访问服务

```bash
# 检查防火墙
sudo ufw status

# 检查端口映射
docker port nuxt-blog
```

---

## 📚 相关文档

- [Docker Compose 官方文档](https://docs.docker.com/compose/)
- [项目 README](../README.md)
- [环境变量配置](.env.example)

---

## ✅ 完成

部署完成后访问 `http://localhost:3000` 即可看到您的博客！🎉
