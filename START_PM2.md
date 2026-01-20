# PM2 启动指南

## ⚠️ 重要提示

**必须使用 `ecosystem.config.cjs` 而不是 `ecosystem.config.js`**

原因：项目使用 ES 模块（`package.json` 中有 `"type": "module"`），`.cjs` 扩展名表示这是 CommonJS 模块。

## 正确的启动命令

```bash
# 进入项目目录
cd ~/15fenzhong

# 使用正确的文件名启动（注意：.cjs 扩展名）
pm2 start ecosystem.config.cjs

# 查看状态
pm2 status

# 保存配置
pm2 save
```

## 如果文件不存在

### 方法一：从 GitHub 拉取最新代码

```bash
cd ~/15fenzhong
git pull
pm2 start ecosystem.config.cjs
pm2 save
```

### 方法二：手动创建文件

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

# 保存配置
pm2 save
```

## 完整启动流程

```bash
# 1. 进入项目目录
cd ~/15fenzhong

# 2. 确保文件存在
ls -la ecosystem.config.cjs

# 3. 如果文件不存在，从 GitHub 拉取
git pull

# 4. 启动服务（使用 .cjs 扩展名）
pm2 start ecosystem.config.cjs

# 5. 查看状态
pm2 status

# 6. 保存配置
pm2 save

# 7. 设置开机自启（可选）
sudo pm2 startup systemd -u $USER --hp $HOME
pm2 save

# 8. 查看日志
pm2 logs 15fenzhong
```

## 常见错误

### ❌ 错误命令
```bash
pm2 start ecosystem.config.js  # 错误：文件不存在
```

### ✅ 正确命令
```bash
pm2 start ecosystem.config.cjs  # 正确：使用 .cjs 扩展名
```

## 验证

运行以下命令验证服务是否正常启动：

```bash
# 检查 PM2 状态
pm2 status

# 应该看到类似输出：
# ┌─────┬──────────────┬─────────┬─────────┬──────────┐
# │ id  │ name         │ status  │ restart │ uptime   │
# ├─────┼──────────────┼─────────┼─────────┼──────────┤
# │ 0   │ 15fenzhong   │ online  │ 0       │ 5s       │
# └─────┴──────────────┴─────────┴─────────┴──────────┘

# 查看实时日志
pm2 logs 15fenzhong

# 应该看到类似输出：
# [MARKET] slug=eth-updown-15m-...
# === AUTO 15m ETH 双边吃单启动 ===
# [TICK] slug=... bestBid=0.8500 bestAsk=0.8600
```

## 如果仍有问题

1. **检查文件是否存在**：
   ```bash
   ls -la ecosystem.config.cjs
   ```

2. **检查项目目录**：
   ```bash
   pwd  # 应该显示 /root/15fenzhong
   ls -la  # 应该看到 package.json, ecosystem.config.cjs 等文件
   ```

3. **从 GitHub 重新拉取代码**：
   ```bash
   cd ~/15fenzhong
   git pull origin main
   ```

4. **检查 PM2 进程**：
   ```bash
   pm2 list
   pm2 delete 15fenzhong  # 如果存在旧进程，先删除
   pm2 start ecosystem.config.cjs
   ```
