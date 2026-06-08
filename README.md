# Endless CMS

Endless CMS is a TypeScript-first personal CMS for blogs, knowledge bases, portfolios, personal sites, and small showcase pages.

This repository currently implements Phase 0 and Phase 1:

- Monorepo foundation with Next.js, Prisma, shared design tokens, content rendering, and AI service contracts.
- A public personal-site experience with a configurable Bento home, posts, article reading, tags, search, RSS, sitemap, and OG image routes.
- A style-preserving AI editing abstraction. The first version is intentionally mock-only: human writing remains the source of truth.

## Getting Started

```bash
pnpm install
cp .env.example .env
docker compose up -d
pnpm db:generate
pnpm db:push
pnpm db:seed
pnpm dev
```

Then open http://localhost:3000.

The web app can also render from bundled seed fixtures when a database is not running, which keeps the first frontend iteration easy to inspect.
