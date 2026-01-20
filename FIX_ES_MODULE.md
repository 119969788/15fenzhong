# 修复 ES 模块错误 - 快速指南

## 问题
```
[PM2][ERROR] File ecosystem.config.js not found
ReferenceError: module is not defined in ES module scope
```

## 原因
项目使用 ES 模块（`package.json` 中有 `"type": "module"`），但 PM2 配置文件使用了 CommonJS 语法。

## 解决方案

### 方法一：从 GitHub 拉取最新代码（推荐）

```bash
cd ~/15fenzhong
git pull
pm2 start ecosystem.config.cjs
pm2 save
```

### 方法二：手动创建配置文件

如果无法拉取代码，可以手动创建 `ecosystem.config.cjs` 文件：

```bash
cd ~/15fenzhong

# 创建 ecosystem.config.cjs 文件
cat > ecosystem.config.cjs << 'EOF'
// PM2 配置文件 - 使用 .cjs 扩展名以支持 CommonJS 语法
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
EOF

# 创建日志目录
mkdir -p logs

# 启动服务
pm2 start ecosystem.config.cjs

# 查看状态
pm2 status

# 保存配置
pm2 save
```

### 方法三：如果已有旧进程在运行

```bash
# 停止并删除旧进程
pm2 delete 15fenzhong

# 使用新配置文件启动
pm2 start ecosystem.config.cjs

# 保存配置
pm2 save

# 设置开机自启（如果需要）
sudo pm2 startup systemd -u $USER --hp $HOME
pm2 save
```

## 验证

运行以下命令验证：

```bash
# 检查文件是否存在
ls -la ecosystem.config.cjs

# 检查 PM2 状态
pm2 status

# 查看日志
pm2 logs 15fenzhong
```

## 重要提示

⚠️ **必须使用 `ecosystem.config.cjs` 而不是 `ecosystem.config.js`**

- ✅ 正确：`pm2 start ecosystem.config.cjs`
- ❌ 错误：`pm2 start ecosystem.config.js`
