module.exports = {
  apps: [
    {
      name: "endless-cms",
      cwd: "/www/wwwroot/endless.aoodyconcor.de",
      script: "apps/web/start.mjs",
      env: {
        NODE_ENV: "production",
        PORT: "3000"
      }
    }
  ]
};
