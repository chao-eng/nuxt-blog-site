# Blog Release Web

这是一个基于 **Nuxt 3** 构建的现代化博客发布与管理系统。它集成了 Markdown 编辑器、文章管理、标签系统以及用户认证功能，旨在提供一个轻量级、高性能且易于部署的个人或团队博客解决方案。

## ✨ 主要特性

- **现代化技术栈**：基于 Nuxt 3、Vue 3 和 TypeScript 构建。
- **UI 组件库**：使用 Nuxt UI 提供美观且响应式的界面。
- **Markdown 编辑**：集成 Vditor 编辑器，支持所见即所得（WYSIWYG）、即时渲染（IR）和分屏预览（SV）模式。
- **文章管理**：支持文章的增删改查，支持标签管理。
- **用户认证**：基于 `@sidebase/nuxt-auth` 的本地认证系统。
- **评论系统**：集成 [Giscus](https://giscus.app/)，支持基于 GitHub Discussions 的评论功能。
- **数据存储**：使用 SQLite (Better SQLite3) 作为轻量级数据库，无需复杂的数据库配置。
- **部署灵活**：支持 Node.js 直接部署和 Docker 容器化部署。

## 🛠️ 技术栈

- **框架**: [Nuxt 3](https://nuxt.com/)
- **语言**: [TypeScript](https://www.typescriptlang.org/)
- **UI 库**: [Nuxt UI](https://ui.nuxt.com/) (基于 Tailwind CSS)
- **认证**: [Nuxt Auth](https://auth.sidebase.io/)
- **数据库**: [Better SQLite3](https://github.com/WiseLibs/better-sqlite3)
- **编辑器**: [Vditor](https://b3log.org/vditor/)
- **工具**: ESLint, Prettier

## 🚀 快速开始

### 前置要求

- Node.js >= 18 (推荐 v20 或 v22)
- Yarn (推荐) 或 NPM / PNPM

### 本地开发

1.  **克隆项目**

    ```bash
    git clone <repository-url>
    cd blog-release-web
    ```

2.  **安装依赖**

    ```bash
    yarn install
    ```

3.  **配置环境变量**

    复制 `.env.example` 为 `.env.development` 并根据需要修改配置。

    ```bash
    cp .env.example .env.development
    ```

4.  **启动开发服务器**

    ```bash
    yarn dev
    ```

    访问 `http://localhost:3000` 查看效果。

## 📦 部署方案

### 方案一：Node.js 直接部署

适用于有 Node.js 环境的服务器。

1.  **构建项目**

    ```bash
    yarn build
    ```

    构建产物将位于 `.output` 目录。

2.  **配置生产环境**

    创建 `.env` 文件或设置系统环境变量：

    ```bash
    export NUXT_DB_PATH="/path/to/your/database"
    export NUXT_BASE_PATH="/path/to/your/blog/files"
    export NUXT_STATIC_PATH="/path/to/your/static/files"
    export AUTH_SECRET="your-super-secret-key"
    ```

3.  **运行服务**

    ```bash
    node .output/server/index.mjs
    ```

    建议使用 PM2 等进程管理工具来守护进程：

    ```bash
    pm2 start .output/server/index.mjs --name "blog-web"
    ```

### 方案二：Docker 部署 (推荐)

项目包含优化过的 `Dockerfile`，支持多阶段构建，产物轻量。

1.  **构建镜像**

    ```bash
    docker build -t blog-release-web .
    ```

2.  **运行容器**

    需要挂载三个目录以持久化数据：
    - `/app/data`: 存放 SQLite 数据库文件
    - `/app/static`: 存放上传的静态资源（如图片）
    - `/blog`: 存放 Markdown 文章文件

    ```bash
    docker run -d \
      --name blog-web \
      -p 3000:3000 \
      -v $(pwd)/data:/app/data \
      -v $(pwd)/static:/app/static \
      -v $(pwd)/blog_files:/blog \
      blog-release-web
    ```

    > **注意**：请确保挂载的宿主机目录存在，并且具有适当的读写权限。


## 📄 应用配置 (app_config.yml)

项目使用 YAML 文件进行应用层面的配置（如站点信息、社交链接、评论系统等）。默认读取 `app_config.yml`，你可以通过环境变量 `APP_CONFIG_PATH` 指定其他路径。

配置文件示例：

```yaml
authSecret: 'your-super-secret-key' # 用于加密会话的密钥

navbarData:
  homeTitle: '布吉岛'

footerData:
  author: '布吉岛'
  aboutAuthor: '从事Java研发相关工作。'
  # ... 其他页脚信息

# ... 页面 SEO 信息

GiscusData:
  repo: 'your-username/your-repo'       # GitHub 仓库
  repoId: 'your-repo-id'                # 仓库 ID
  category: 'Announcements'             # Discussion 分类
  categoryId: 'your-category-id'        # 分类 ID
```

### 评论系统 (Giscus)

要启用评论功能，请在 `app_config.yml` 的 `GiscusData` 部分填入你的配置。你可以访问 [Giscus 官网](https://giscus.app/zh-CN) 获取这些 ID。

## 📂 目录结构

```
.
├── app/                # Nuxt 应用源码
│   ├── components/     # Vue 组件
│   ├── pages/          # 页面路由
│   ├── layouts/        # 布局文件
│   └── ...
├── server/             # 服务端 API 路由
├── public/             # 公共静态文件
├── Dockerfile          # Docker 构建文件
├── nuxt.config.ts      # Nuxt 配置文件
└── package.json        # 项目依赖配置
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目！

## 📄 许可证

[MIT](LICENSE)
