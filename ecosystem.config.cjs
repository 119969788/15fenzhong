// PM2 配置文件 - 使用 .cjs 扩展名以支持 CommonJS 语法
// 因为 package.json 中设置了 "type": "module"
module.exports = {
  apps: [{
    name: '15fenzhong',
    script: 'npm',
    args: 'run dev',
    interpreter: 'none',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};
