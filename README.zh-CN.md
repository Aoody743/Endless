# Endless

[English README](./README.md)

Endless 是一个面向个人站点、长期写作、双语页面、朋友圈 thoughts 和首页卡片库的内容管理系统。它把正式发行版前台站点和创作者后台 Studio 放在一起：写文章、搭页面、配置顶栏、管理特殊页面、接入 AI、维护首页卡片，都在同一套系统里完成。

## 功能亮点

- **Writing Studio**：自然语言编辑器、Markdown 编辑器、草稿、发布、版本、摘要、SEO 字段和双语正文。
- **AI 工作流**：兼容 OpenAI 接口的对话、排版、翻译、总结和 AI 生图；文字 AI 与生图 AI 分别配置 base URL、API key 和模型。
- **双语页面编辑器**：页面标题、区块、卡片、Hero 文案和预览都支持中文/英文编辑。
- **首页卡片库**：内置 MBTI、地点、地图、头像、简历、邮箱、引言、文字、创造者技能栈、图片地点等卡片预设，卡片上的文字、链接、图片和布局字段都可编辑。
- **页面预设**：首页、关于、实验室、友链、链接、照片墙、简历、朋友圈 thoughts、评论页都可以创建，并直接拖入公开顶栏排序。
- **特殊页面**：thoughts 是轻量朋友圈发布流；comments 是评论管理流，不再当普通文章页面处理。
- **前台站点**：顶栏标题同步后台站点设置，支持 RSS、sitemap、搜索、标签、文章、项目、主题切换和中英文导航。

## 技术栈

- Next.js 14 App Router
- React 18 + TypeScript
- Prisma 6 + PostgreSQL
- PNPM workspace
- 生产环境推荐 PM2 或其他 Node 进程管理器
- 可选 PHP 网页安装器，适合宝塔/面板式部署

## 本地开发

需要：

- Node.js 20+
- PNPM 10.24+
- PostgreSQL 14+ 或 Docker

```bash
pnpm install
cp .env.example .env
docker compose up -d
pnpm db:generate
pnpm db:push
pnpm db:seed
pnpm dev
```

打开 `http://localhost:3000`。

Studio 后台在 `/studio`。如果 `STUDIO_OWNER_PASSWORD` 为空，本地会关闭后台登录保护；公开部署前一定要设置密码。

## 环境变量

```env
DATABASE_URL="postgresql://endless:endless@localhost:5432/endless?schema=public"
NEXT_PUBLIC_SITE_URL="https://example.com"
AI_CREDENTIALS_SECRET="change-this-to-a-long-random-secret"
STUDIO_OWNER_EMAIL="owner@example.com"
STUDIO_OWNER_PASSWORD="change-this-password"
STUDIO_SESSION_SECRET="change-this-to-another-long-random-secret"
# ENDLESS_DISABLE_DATABASE="1" # 可选：不连接 PostgreSQL，直接使用内置演示内容
```

AI 接口在后台登录后配置：

- `Settings -> AI`：对话、排版、翻译、总结
- `Settings -> AI Image`：AI 生图 base URL、API key 和模型

两套配置都兼容 OpenAI 风格接口，API key 会加密存入数据库。

## 命令行生产部署

适合 VPS、宝塔服务器或任何可以运行 Node.js 的 Linux 主机。

```bash
git clone https://github.com/AndyXeCM/Endless.git
cd Endless
cp .env.example .env
```

编辑 `.env` 后运行：

```bash
APP_NAME=endless-cms PORT=3000 ./scripts/deploy.sh
```

脚本会安装依赖、生成 Prisma client、推送数据库结构、按需写入演示内容、构建 Next.js，并用 PM2 启动或重启服务。

常用参数：

```bash
WITH_POSTGRES=1 ./scripts/deploy.sh     # 先启动 docker-compose PostgreSQL
SEED_DATABASE=0 ./scripts/deploy.sh     # 不写入演示内容
APP_NAME=my-site PORT=3100 ./scripts/deploy.sh
```

PM2 启动后，在 Nginx/宝塔里把域名反代到应用端口：

```nginx
location / {
  proxy_pass http://127.0.0.1:3000;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}
```

## PHP 普通安装器部署

Endless 提供了一个类似 Typecho 的 `install.php` 安装入口：把 zip 上传到网站目录，打开安装页面，填写数据库和后台信息即可初始化。

注意：Endless 本体仍然是 Next.js 应用，不是纯 PHP 程序。所以服务器仍需具备 Node.js、PNPM、PostgreSQL 访问权限，并允许 PHP 执行 shell 命令。

先生成发行 zip：

```bash
./scripts/make-release.sh
```

把生成的 `dist/endless-*.zip` 上传到网站根目录并解压，然后打开：

```text
https://你的域名/install.php
```

安装页面需要填写：

- 站点地址
- PostgreSQL 主机、端口、数据库名、用户名、密码、schema
- Studio 后台邮箱和密码
- Node PATH，适合宝塔这类自定义 Node 路径
- PM2 应用名和应用端口

安装器会写入 `.env`、执行安装命令、按需初始化内容、构建应用并启动 PM2。成功后会生成 `.endless-installed` 锁文件；确认站点可访问后，请删除 `install.php`。

如果 PHP 禁用了 `proc_open`，或者面板环境没有 Node 运行时，请改用上面的命令行部署脚本。

## 发行包

```bash
./scripts/make-release.sh 1.0.0
```

发行包会排除 `.env`、`.git`、`node_modules`、`.next`、构建缓存、上传媒体和本地草图目录；会包含 `install.php`、部署脚本、源代码、Prisma schema 和初始化内容。

## 常用命令

```bash
pnpm dev            # 本地开发
pnpm build          # 生产构建
pnpm start          # 启动已构建应用
pnpm typecheck      # TypeScript 检查
pnpm db:generate    # 生成 Prisma client
pnpm db:push        # 同步数据库结构
pnpm db:seed        # 写入初始化内容
```

## Studio 使用流程

1. 打开 `/studio/settings/site`，设置公开站点标题、作者信息、语言、顶栏顺序和 AI 配置。
2. 打开 `/studio/pages`，创建预设页面，并把需要公开的页面拖进顶栏排序。
3. 打开首页编辑器，通过首页卡片库添加、编辑、移除和调整卡片。
4. 打开 `/studio/writing`，使用自然语言编辑器或 Markdown 编辑器写文章，并使用 AI 翻译、排版、总结和生图。
5. 在 thoughts 和 comments 的专用编辑器里管理朋友圈和评论。

## 安全提醒

- 生产环境必须设置 `STUDIO_OWNER_PASSWORD`。
- 部署后不要随意更换 `AI_CREDENTIALS_SECRET` 和 `STUDIO_SESSION_SECRET`，否则已保存的 AI key 和登录态会失效。
- 使用 PHP 安装器部署后，请删除 `install.php`。
- 不要提交 `.env`、上传媒体、`.next` 或生成的发行 zip。
