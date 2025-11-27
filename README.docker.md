## docker构建
```shell
docker build -f Dockerfile -t nuxt-blog:latest .
```
## 导出 docker 镜像
```shell
docker images
docker save -o ~/Downloads/nuxt-blog.tar  nuxt-blog:latest
```
## 启动
```shell
docker run -d \
  -v ./mysite:/mysite/content/blog \  # 映射日志目录
  -v ./data:/app/data \  # 映射数据目录
  -p 3999:3000 \  # 映射端口
  --name nuxt-blog nuxt-blog:latest
```