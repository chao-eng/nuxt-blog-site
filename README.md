# Nuxt Blog Site

## 📖 简介 (Introduction)

**Nuxt Blog Site** 是一个基于 **Nuxt 4** 构建的现代化全栈个人博客系统模板。它不仅具备传统静态博客的内容展示功能，还内置了强大的后台管理系统（CMS）。

该项目旨在为开发者提供一个**高性能**、**易扩展**、**设计美观**的个人站点解决方案。无论是作为技术博客、个人作品集，还是知识管理工具，它都能完美胜任。

**主要用途：**
- ✍️ **内容创作**：撰写和发布技术文章、生活随笔，支持 Markdown 和富文本。
- 🌏 **作品展示**：优雅地展示个人项目、简历和经历。
- 🗂 **知识沉淀**：通过标签和分类体系，构建个人知识库。
- 🗺 **足迹记录**：内置交互式旅行地图，记录你的旅行足迹。

---

## 🏗 系统架构预览 (Architecture)

本项目采用现代化的全栈开发架构，前后端紧密集成，部署轻量。

- **前端 (Frontend)**: 
  - 基于 **Nuxt** (Vue 3) 框架，支持服务端渲染 (SSR) 以获得最佳 SEO 表现。
  - 使用 **Nuxt UI** (TailwindCSS) 构建响应式、现代化的用户界面。
- **后端 (Backend)**: 
  - 利用 Nuxt 内置的 **Nitro** 引擎提供高性能 API 服务。
  - 实现了基于 JWT 的身份验证和权限管理。
- **数据库 (Database)**: 
  - 采用 **SQLite** (Better SQLite3)，轻量级、零配置，非常适合个人站点，数据易于备份和迁移。
- **存储 (Storage)**: 
  - 本地文件系统存储上传的图片和资源（可扩展至对象存储）。

---

## 🛠 关键技术栈 (Tech Stack)

| 类别 | 技术/库 | 说明 |
| --- | --- | --- |
| **核心框架** | [Nuxt](https://nuxt.com) (v4.x) | 下一代 Vue 框架，提供 SSR、路由、自动导入等特性 |
| **UI 框架** | [Nuxt UI](https://ui.nuxt.com) | 基于 TailwindCSS 的现代化组件库 |
| **编程语言** | TypeScript | 全类型安全开发体验 |
| **数据库** | [Better SQLite3](https://github.com/WiseLibs/better-sqlite3) | 高性能 Node.js SQLite 驱动 |
| **鉴权** | [Nuxt Auth](https://sidebase.io/nuxt-auth) | 安全灵活的身份验证模块 |
| **国际化** | [Nuxt I18n](https://i18n.nuxtjs.org) | 完整的国际化解决方案 (i18n) |
| **编辑器** | [Vditor](https://github.com/Vanessa219/vditor) | 所见即所得的 Markdown 编辑器 |
| **可视化** | [ECharts](https://echarts.apache.org) | 强大的数据可视化图表库 |
| **工具库** | VueUse, Zod, Date-fns | 常用组合式 API、Schema 验证、日期处理 |

---

## 🚀 快速开始 (Quick Start)

### 前置要求
- **Node.js**: >= 20.0.0
- **包管理器**: pnpm (推荐), yarn, 或 npm

### 1. 获取代码
```bash
git clone <repository-url>
cd nuxt-blog-site
```

### 2. 安装依赖
```bash
pnpm install
```

### 3. 启动开发环境
```bash
pnpm dev
```
启动成功后，访问 `http://localhost:3000` 即可预览网站。

---

## � 安装与设置 (Installation & Setup)

### 1. 环境变量配置
项目根目录提供了 `.env.development.example` 和 `.env.production.example` 模板文件。

**开发环境：**
复制并重命名为 `.env.development`：
```bash
cp .env.development.example .env.development
```

**关键配置项说明：**
```yml
# 数据库文件存储路径
NUXT_DB_PATH: /data/blog.db

# 文章存放路径
NUXT_BASE_PATH: '/data/blog'

# 身份验证密钥 (生产环境请务必生成强随机字符串)
NUXT_AUTH_SECRET: your_super_secret_key

# 静态资源上传路径
NUXT_STATIC_PATH: /uploads
```

### 2. 数据库初始化
项目启动时会自动检测并初始化 SQLite 数据库表结构，无需手动运行 SQL 脚本。请确保 `NUXT_DB_PATH` 指定的目录存在且具有写入权限。

---

## ⚙️ 配置指南 (Configuration)

为了方便个性化定制，项目将大部分文案和站点信息抽离到了配置文件中。

### 站点信息 (`app_config.yml`)
位于项目根目录的 `app_config.yml` 是站点的核心配置文件，你可以修改以下内容：
- **Navbar**: 网站标题。
- **Footer**: 页脚版权信息、作者简介。
- **Pages**: 首页、博客页、关于页的标题和描述文案。
- **SEO**: 默认的 Meta 标签信息。
- **Social Links**: 社交媒体链接（GitHub, 掘金, Bilibili 等）。

### 国际化 (i18n)
多语言文件位于 `i18n/` 目录下：
- `en.json`: 英文翻译
- `zh-CN.json`: 简体中文翻译

如有新增字段或修改文案，请同步更新这两个文件。

---

## ✨ 功能列表 (Features)

### 🖥 公共前台 (Public)
- **响应式布局**：完美适配桌面、平板和移动端设备。
- **深色模式 (Dark Mode)**：支持系统自动切换或手动切换亮/暗主题。
- **多语言支持**：内置中/英双语切换。
- **文章系统**：
  - 文章列表分页与筛选。
  - 文章详情页（支持目录导航、代码高亮）。
  - 按标签 (Tags) 分类浏览。
- **关于页面**：展示个人简介及社交媒体入口。
- **评论系统**：集成 Giscus 评论（需在代码中配置 Repo 信息）。

### 🔐 管理后台 (Admin)
访问 `/admin/login` 进入后台管理系统。

- **仪表盘 (Dashboard)**：查看文章统计、近期动态。
- **文章管理**：
  - **Markdown 编辑器**：集成 Vditor，支持实时预览、图片粘贴上传。
  - **元数据管理**：设置文章封面、标题、描述、发布时间、标签。
  - **状态管理**：草稿/发布状态切换。
- **旅行地图 (Travel Map)**：
  - 可视化管理旅行足迹。
  - 支持世界地图与中国地图钻取。
  - 记录旅行时间与地点。
- **文件管理**：图片资源的上传与管理。
- **系统设置**：管理员账户设置。

---

## � 部署 (Deployment)

### 环境变量配置
复制并重命名为 `.env.production`：
```bash
cp .env.production.example .env.production
```

### Docker 部署 (推荐)
项目包含 `Dockerfile`，可直接构建镜像：

```bash
docker build -t nuxt-blog-site .
docker run -d -p 3000:3000 -v $(pwd)/data:/app/data nuxt-blog-site
```

### 常规部署
1. 构建生产包：
   ```bash
   pnpm build
   ```
2. 运行服务：
   ```bash
   node .output/server/index.mjs
   ```

---

