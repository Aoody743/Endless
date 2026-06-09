# Endless

[中文说明](./README.zh-CN.md)

Endless is a personal publishing CMS built for long-form writing, bilingual pages, lightweight thoughts, and a highly editable home page. It combines a polished public site with a focused Studio backend for writing, page building, AI assistance, navigation management, and reusable home-card presets.

## Highlights

- **Writing Studio**: natural-language editor, Markdown editor, drafts, publishing, revisions, summaries, SEO fields, and bilingual article content.
- **AI workflows**: OpenAI-compatible chat, formatting, translation, summary, and image generation. Writing AI and image AI have separate base URL, API key, and model settings.
- **Bilingual pages**: page titles, sections, cards, hero copy, and previews support Chinese and English editing.
- **Home card library**: editable card presets for MBTI, location, map, avatar, resume, email, quote, text, creator stacks, and image cards.
- **Page presets**: home, about, lab, friends, links, photo wall, resume, thoughts, and comments pages can be created and dragged into the public header order.
- **Special pages**: thoughts use a lightweight moments-style editor surface, while comments use a moderation-oriented stream instead of a normal article editor.
- **Public site**: responsive header synced from Studio settings, RSS, sitemap, search, tags, posts, projects, theme switcher, and localized navigation.

## Stack

- Next.js 14 App Router
- React 18 and TypeScript
- Prisma 6 with PostgreSQL
- PNPM workspace packages
- PM2 or any Node process manager for production
- Optional PHP installer for panel-style deployment

## Local Development

Requirements:

- Node.js 20+
- PNPM 10.24+
- PostgreSQL 14+ or Docker

```bash
pnpm install
cp .env.example .env
docker compose up -d
pnpm db:generate
pnpm db:push
pnpm db:seed
pnpm dev
```

Open `http://localhost:3000`.

Studio is available at `/studio`. If `STUDIO_OWNER_PASSWORD` is empty, Studio auth is disabled for local development. Set a password before any public deployment.

## Environment

```env
DATABASE_URL="postgresql://endless:endless@localhost:5432/endless?schema=public"
NEXT_PUBLIC_SITE_URL="https://example.com"
AI_CREDENTIALS_SECRET="change-this-to-a-long-random-secret"
STUDIO_OWNER_EMAIL="owner@example.com"
STUDIO_OWNER_PASSWORD="change-this-password"
STUDIO_SESSION_SECRET="change-this-to-another-long-random-secret"
# ENDLESS_DISABLE_DATABASE="1" # optional: render bundled fixtures without PostgreSQL
```

AI provider credentials are configured inside Studio after login:

- `Settings -> AI`: writing chat, formatting, translation, and summary
- `Settings -> AI Image`: image generation base URL, API key, and model

Both providers are OpenAI-compatible. API keys are encrypted before being stored in the database.

## Production Deploy With Script

This is the recommended route for a VPS, BaoTa panel server, or any Linux host where you can run Node.js.

```bash
git clone https://github.com/AndyXeCM/Endless.git
cd Endless
cp .env.example .env
```

Edit `.env`, then run:

```bash
APP_NAME=endless-cms PORT=3000 ./scripts/deploy.sh
```

The script installs dependencies, generates Prisma client, pushes the database schema, optionally seeds demo content, builds the Next.js app, and starts or restarts PM2.

Useful options:

```bash
WITH_POSTGRES=1 ./scripts/deploy.sh     # start docker-compose PostgreSQL first
SEED_DATABASE=0 ./scripts/deploy.sh     # skip seed data
APP_NAME=my-site PORT=3100 ./scripts/deploy.sh
```

After PM2 starts the app, configure Nginx/BaoTa reverse proxy:

```nginx
location / {
  proxy_pass http://127.0.0.1:3000;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}
```

## PHP Installer Deploy

Endless also ships with a Typecho-style installer for panel users. It is still a Next.js application, so the server must have Node.js, PNPM, PostgreSQL access, and permission for PHP to execute shell commands.

Create a release zip:

```bash
./scripts/make-release.sh
```

Upload the generated `dist/endless-*.zip` to the website root, unzip it, then open:

```text
https://your-domain.com/install.php
```

Fill in:

- Site URL
- PostgreSQL host, port, database, username, password, schema
- Studio owner email and password
- Node PATH if your panel uses a custom Node path
- PM2 app name and app port

The installer writes `.env`, runs the selected install commands, seeds content if enabled, builds the app, and starts PM2. When installation succeeds it creates `.endless-installed`; delete `install.php` after verifying the site.

If your PHP host disables `proc_open` or has no Node runtime, use the command-line deployment script instead.

## Release Package

```bash
./scripts/make-release.sh 1.0.0
```

The package excludes `.env`, `.git`, `node_modules`, `.next`, build caches, media uploads, and local sketch files. It includes `install.php`, deployment scripts, source code, Prisma schema, and seed fixtures.

## Common Operations

```bash
pnpm dev            # start local dev server
pnpm build          # production build
pnpm start          # start built Next.js app
pnpm typecheck      # TypeScript checks
pnpm db:generate    # Prisma client
pnpm db:push        # apply schema to database
pnpm db:seed        # seed demo content
```

## Studio Workflow

1. Open `/studio/settings/site` and set the public site title, owner profile, language, navigation order, and AI providers.
2. Open `/studio/pages` to create preset pages and drag them into the public header order.
3. Open the home page editor and use the home-card library to add, edit, remove, and reorder cards.
4. Use `/studio/writing` for articles, drafts, Natural editor, Markdown editor, AI translation, AI formatting, summaries, and image generation.
5. Manage thoughts and comments from their dedicated special-page editors.

## Security Notes

- Always set `STUDIO_OWNER_PASSWORD` in production.
- Keep `AI_CREDENTIALS_SECRET` and `STUDIO_SESSION_SECRET` stable after deployment; changing them invalidates stored AI keys and sessions.
- Delete `install.php` after a PHP installer deployment.
- Do not commit `.env`, uploaded media, `.next`, or generated release zips.
