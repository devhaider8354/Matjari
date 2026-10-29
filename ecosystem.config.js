// تشغيل المتجر عبر PM2:  pm2 start ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'matjari',
      cwd: __dirname,
      script: 'node_modules/next/dist/bin/next',
      // يستمع على 127.0.0.1 فقط؛ nginx في aaPanel يمرّر الطلبات إليه
      args: 'start -H 127.0.0.1 -p 3000',
      exec_mode: 'fork',
      instances: 1,
      max_memory_restart: '400M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
