# 15fenzhong

ETH 15 分钟 Up/Down 市场：自动追踪最新场 + 双边吃单（不挂单）

- 自动找最新 slug：eth-updown-15m-
- 条件触发：
  - bestAsk <= BUY_PRICE -> BUY（花 BUY_USDC）
  - bestBid >= SELL_PRICE 且持仓>0 -> SELL（卖 SELL_SHARES 或更少）
- 支持 FOK / FAK

## 快速开始

### 方式一：一键安装（推荐）

**Linux 服务器：**
```bash
curl -fsSL https://raw.githubusercontent.com/119969788/15fenzhong/main/install.sh | bash
```

**Windows 服务器：**
```powershell
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/119969788/15fenzhong/main/install.ps1" -OutFile "install.ps1"
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\install.ps1
```

### 方式二：手动安装

详细的手动安装步骤请参考：[MANUAL_INSTALL.md](MANUAL_INSTALL.md)

**快速手动安装：**
```bash
# 1. 克隆项目
git clone https://github.com/119969788/15fenzhong.git
cd 15fenzhong

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入你的私钥

# 4. 运行（开发模式）
npm run dev

# 或使用 PM2 后台运行
pm2 start ecosystem.config.js
pm2 save
```

## 安装文档

- 📖 [详细手动安装指南](MANUAL_INSTALL.md) - 完整的手动安装步骤
- 📖 [服务器安装指南](README_INSTALL.md) - 一键安装脚本说明

## 配置说明

编辑 `.env` 文件，必须配置：

```env
POLYMARKET_PRIVATE_KEY=0x你的私钥
```

可选配置项请参考 `.env.example` 文件。

## 运行

### 开发模式（前台运行）
```bash
npm run dev
```

### 生产模式（后台运行，推荐）
```bash
pm2 start ecosystem.config.js
pm2 save
```

## PM2 管理命令

```bash
pm2 status              # 查看状态
pm2 logs 15fenzhong     # 查看日志
pm2 restart 15fenzhong  # 重启服务
pm2 stop 15fenzhong     # 停止服务
pm2 monit               # 监控面板
```
