# Deploying Endless CMS on BaoTa

Target domain: `endless.aoodyconcor.de`

The project is shaped so BaoTa's Node.js project manager can recognize it from the root `package.json`, while PM2 can also run it through `ecosystem.config.cjs`.

## Production Build

```bash
pnpm install --frozen-lockfile
pnpm db:generate
pnpm build
```

The Next.js app uses standalone output, so the production entrypoint is:

```bash
node apps/web/.next/standalone/apps/web/server.js
```

## BaoTa / PM2

- Project root: `/www/wwwroot/endless.aoodyconcor.de`
- Start command: `node apps/web/.next/standalone/apps/web/server.js`
- Port: `3000`
- Reverse proxy target: `http://127.0.0.1:3000`
- PM2 config: `ecosystem.config.cjs`

## Environment

Copy `.env.example` to `.env` and set:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/endless?schema=public"
NEXT_PUBLIC_SITE_URL="https://endless.aoodyconcor.de"
AI_CREDENTIALS_SECRET="change-me-ai-secret"
```

After PostgreSQL is reachable:

```bash
pnpm db:push
pnpm db:seed
```

Use BaoTa's website SSL panel to request Let's Encrypt for `endless.aoodyconcor.de` after DNS and reverse proxy are active.
