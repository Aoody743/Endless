<p align="center">
  <img src="./docs/assets/endless-logo.svg" alt="Endless" width="520">
</p>

<p align="center">
  A quiet CMS for personal writing, bilingual pages, AI-assisted editing, and beautiful home cards.
</p>

<p align="center">
  <a href="./README.zh-CN.md">中文</a>
  ·
  <a href="./DEPLOYMENT.md">Deploy</a>
  ·
  <a href="https://github.com/AndyXeCM/Endless">GitHub</a>
</p>

---

## Why Endless

Endless is built for people who want a personal site that feels authored, not administered.

- Write in **Natural** or **Markdown** editors.
- Build bilingual pages with reusable sections.
- Publish thoughts, comments, friends, links, photos, resume, and lab pages from Studio.
- Add MBTI, location, avatar, map, quote, email, resume, and creator cards to the home page.
- Connect OpenAI-compatible writing AI and image AI with separate keys and models.

## One-Minute Start

```bash
pnpm install
cp .env.example .env
docker compose up -d
pnpm db:generate && pnpm db:push && pnpm db:seed
pnpm dev
```

Open `http://localhost:3000`, then enter Studio at `/studio`.

## Install Like a Blog System

Prefer a panel install? Build a zip, upload it, and open the installer.

```bash
./scripts/make-release.sh 1.0.0
```

Upload `dist/endless-1.0.0.zip`, unzip it, then visit:

```text
https://your-domain.com/install.php
```

Fill in PostgreSQL and Studio credentials. The installer writes `.env`, initializes Prisma, builds Endless, and starts PM2.

## Server Deploy

```bash
git clone https://github.com/AndyXeCM/Endless.git
cd Endless
cp .env.example .env
APP_NAME=endless-cms PORT=3000 ./scripts/deploy.sh
```

Reverse proxy your domain to `http://127.0.0.1:3000`.

## Requirements

- Node.js 20+
- PNPM 10+
- PostgreSQL 14+
- PHP 8.1+ only for the optional web installer

## License

Endless is prepared as a personal publishing system. Add your own license before redistributing a public fork.
