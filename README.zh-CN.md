<p align="center">
  <img src="./docs/assets/endless-logo.svg" alt="Endless" width="520">
</p>

<p align="center">
  一个安静、漂亮、可长期维护的个人发布系统。
</p>

<p align="center">
  <a href="./README.md">English</a>
  ·
  <a href="./DEPLOYMENT.md">部署文档</a>
  ·
  <a href="https://github.com/AndyXeCM/Endless">GitHub</a>
</p>

---

## 为什么是 Endless

Endless 不是传统后台皮肤，而是一套真正围绕个人站点写作和页面发布设计的 CMS。

- 用 **Natural** 或 **Markdown** 编辑器写文章。
- 用双语页面编辑器搭首页、关于、实验室和展示页。
- 在 Studio 管理 thoughts 朋友圈、评论、友链、链接、照片墙和简历页。
- 从卡片库加入 MBTI、地点、地图、头像、引言、邮箱、简历、创造者技能栈等首页卡片。
- 文本 AI 与生图 AI 分开配置，兼容 OpenAI 风格接口。

## 一分钟启动

```bash
pnpm install
cp .env.example .env
docker compose up -d
pnpm db:generate && pnpm db:push && pnpm db:seed
pnpm dev
```

打开 `http://localhost:3000`，后台入口是 `/studio`。

## 像博客程序一样安装

喜欢宝塔/面板式部署的话，可以直接生成 zip，上传后打开安装程序。

```bash
./scripts/make-release.sh 1.0.0
```

上传 `dist/endless-1.0.0.zip` 并解压，然后访问：

```text
https://你的域名/install.php
```

填入 PostgreSQL 和 Studio 账户信息后，安装器会自动写入 `.env`、初始化 Prisma、构建 Endless，并启动 PM2。

## 服务器部署

```bash
git clone https://github.com/AndyXeCM/Endless.git
cd Endless
cp .env.example .env
APP_NAME=endless-cms PORT=3000 ./scripts/deploy.sh
```

然后在 Nginx/宝塔里把域名反代到 `http://127.0.0.1:3000`。

## 环境要求

- Node.js 20+
- PNPM 10+
- PostgreSQL 14+
- PHP 8.1+ 仅用于可选网页安装器

## 许可

Endless 目前按个人发布系统准备。公开二次分发前，请补充你自己的许可证说明。
