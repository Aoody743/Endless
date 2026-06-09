# Deployment

Endless supports two production deployment paths:

- **Command-line deployment** for VPS, BaoTa, PM2, Docker PostgreSQL, or any Linux server with Node.js.
- **PHP installer deployment** for panel-style hosting: upload the release zip, open `install.php`, fill in database and Studio credentials, then let the installer write `.env`, initialize Prisma, build, and start PM2.

Read the full guides here:

- English: [README.md](./README.md)
- 中文: [README.zh-CN.md](./README.zh-CN.md)

For BaoTa/Nginx, run Endless on a Node port such as `3000`, then reverse proxy the domain to `http://127.0.0.1:3000`.
