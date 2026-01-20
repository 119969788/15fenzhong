# PM2 快速修复指南

## 问题：找不到 ecosystem.config.cjs

### 原因
你不在项目目录中，或者项目还没有克隆。

### 解决方法

#### 步骤 1: 检查项目目录

```bash
# 检查是否在项目目录中
pwd
ls -la

# 如果看到 package.json 和 src 目录，说明在正确的目录
# 如果没有，需要进入项目目录或克隆项目
```

#### 步骤 2: 进入项目目录（如果已克隆）

```bash
# 如果项目在 ~/15fenzhong
cd ~/15fenzhong

# 或者如果项目在其他位置
cd /path/to/15fenzhong
```

#### 步骤 3: 如果项目不存在，克隆项目

```bash
# 克隆项目
cd ~
git clone https://github.com/119969788/15fenzhong.git
cd 15fenzhong
```

#### 步骤 4: 检查 ecosystem.config.cjs 是否存在

```bash
# 检查文件是否存在
ls -la ecosystem.config.cjs

# 如果不存在，创建它
cat > ecosystem.config.cjs << 'EOF'
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
```

#### 步骤 5: 确保依赖已安装

```bash
# 安装依赖（如果还没安装）
npm install
```

#### 步骤 6: 配置环境变量

```bash
# 复制环境变量示例文件
cp .env.example .env

# 编辑 .env 文件，填入你的私钥
nano .env
# 或使用 vim
# vim .env
```

#### 步骤 7: 启动 PM2

```bash
# 确保在项目目录中
pwd  # 应该显示包含 ecosystem.config.cjs 的目录

# 启动服务
pm2 start ecosystem.config.cjs

# 查看状态
pm2 status

# 保存配置
pm2 save
```

#### 步骤 8: 设置开机自启

```bash
# 生成启动脚本
sudo pm2 startup systemd -u $USER --hp $HOME

# 按照输出的提示执行命令（通常是 sudo 命令）
# 然后再次保存
pm2 save
```

## 完整的一键修复命令

如果你已经在项目目录中，但缺少 ecosystem.config.cjs，运行：

```bash
# 创建 ecosystem.config.cjs
cat > ecosystem.config.cjs << 'EOF'
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
pm2 save
```

## 验证安装

```bash
# 检查 PM2 状态
pm2 status

# 应该看到类似输出：
# ┌─────┬──────────────┬─────────┬─────────┬──────────┐
# │ id  │ name         │ status  │ restart │ uptime   │
# ├─────┼──────────────┼─────────┼─────────┼──────────┤
# │ 0   │ 15fenzhong   │ online  │ 0       │ 5s       │
# └─────┴──────────────┴─────────┴─────────┴──────────┘

# 查看日志
pm2 logs 15fenzhong
```

## 常见错误

### 错误 1: "File ecosystem.config.cjs not found"
**解决**: 确保在项目根目录中，并且文件存在

### 错误 2: "PM2 is not managing any process"
**解决**: 先运行 `pm2 start ecosystem.config.cjs`，然后再 `pm2 save`

### 错误 3: "Cannot find module"
**解决**: 运行 `npm install` 安装依赖

### 错误 4: "Missing POLYMARKET_PRIVATE_KEY"
**解决**: 编辑 `.env` 文件，填入私钥
