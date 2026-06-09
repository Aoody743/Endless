# Deploy Endless

Endless has two production paths: command-line deployment and the PHP web installer.

## Requirements

- Node.js 20+
- PNPM 10+
- PostgreSQL 14+
- PM2 for long-running production service
- PHP 8.1+ only if you use `install.php`

## Environment

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/endless?schema=public"
NEXT_PUBLIC_SITE_URL="https://your-domain.com"
AI_CREDENTIALS_SECRET="use-a-long-random-secret"
STUDIO_OWNER_EMAIL="owner@example.com"
STUDIO_OWNER_PASSWORD="use-a-strong-password"
STUDIO_SESSION_SECRET="use-another-long-random-secret"
```

## Command Line

```bash
git clone https://github.com/AndyXeCM/Endless.git
cd Endless
cp .env.example .env
APP_NAME=endless-cms PORT=3000 ./scripts/deploy.sh
```

Optional:

```bash
WITH_POSTGRES=1 ./scripts/deploy.sh
SEED_DATABASE=0 ./scripts/deploy.sh
APP_NAME=my-site PORT=3100 ./scripts/deploy.sh
```

## PHP Installer

Create a release package:

```bash
./scripts/make-release.sh 1.0.0
```

Upload `dist/endless-1.0.0.zip`, unzip it in the website root, then open:

```text
https://your-domain.com/install.php
```

The installer writes `.env`, runs `pnpm install`, initializes Prisma, seeds content, builds the app, and starts PM2. Delete `install.php` after installation.

## Nginx / BaoTa Reverse Proxy

```nginx
location / {
  proxy_pass http://127.0.0.1:3000;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}
```

If BaoTa uses a custom Node path, set it in the PHP installer or run:

```bash
PATH=/root/.hermes/node/bin:$PATH APP_NAME=endless-cms PORT=3000 ./scripts/deploy.sh
```
