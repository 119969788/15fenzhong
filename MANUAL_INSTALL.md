# 手动安装指南

本指南提供详细的手动安装步骤，适用于 Linux 和 Windows 系统。

## 目录

- [Linux 手动安装](#linux-手动安装)
- [Windows 手动安装](#windows-手动安装)
- [macOS 手动安装](#macos-手动安装)
- [验证安装](#验证安装)
- [常见问题](#常见问题)

---

## Linux 手动安装

### 步骤 1: 检查系统要求

```bash
# 检查操作系统版本
cat /etc/os-release

# 检查是否已安装 Node.js
node -v

# 检查是否已安装 npm
npm -v

# 检查是否已安装 Git
git --version
```

**要求：**
- Node.js >= 18.0.0
- npm >= 9.0.0
- Git >= 2.0.0

### 步骤 2: 安装 Node.js（如未安装）

#### Ubuntu/Debian 系统

```bash
# 更新包列表
sudo apt-get update

# 安装 Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node -v
npm -v
```

#### CentOS/RHEL 系统

```bash
# 安装 Node.js 20.x
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# 验证安装
node -v
npm -v
```

#### 使用 nvm（推荐，可管理多个 Node.js 版本）

```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 重新加载 shell 配置
source ~/.bashrc

# 安装 Node.js 20
nvm install 20
nvm use 20
nvm alias default 20

# 验证安装
node -v
npm -v
```

### 步骤 3: 安装 Git（如未安装）

#### Ubuntu/Debian

```bash
sudo apt-get update
sudo apt-get install -y git
```

#### CentOS/RHEL

```bash
sudo yum install -y git
```

### 步骤 4: 安装 PM2 进程管理器

```bash
# 全局安装 PM2
sudo npm install -g pm2

# 验证安装
pm2 -v
```

### 步骤 5: 克隆项目

```bash
# 进入你希望安装项目的目录（例如 home 目录）
cd ~

# 克隆项目
git clone https://github.com/119969788/15fenzhong.git

# 进入项目目录
cd 15fenzhong
```

### 步骤 6: 安装项目依赖

```bash
# 安装所有依赖包
npm install

# 等待安装完成，应该会看到类似输出：
# added 113 packages, and audited 114 packages
```

### 步骤 7: 配置环境变量

```bash
# 复制环境变量示例文件
cp .env.example .env

# 编辑 .env 文件（使用你喜欢的编辑器）
nano .env
# 或
vim .env
# 或
code .env  # 如果安装了 VS Code
```

**必须配置的项：**

```env
# 必需：你的 Polygon 钱包私钥（以 0x 开头）
POLYMARKET_PRIVATE_KEY=0x你的私钥在这里

# 可选：Polygon RPC 节点（默认使用公共节点）
POLYGON_RPC_URL=https://polygon-rpc.com
```

**可选配置项（使用默认值或根据需要修改）：**

```env
# 市场前缀
SLUG_PREFIX=eth-updown-15m-

# 买入价格阈值（当 bestAsk <= 此价格时买入）
BUY_PRICE=0.80

# 卖出价格阈值（当 bestBid >= 此价格时卖出）
SELL_PRICE=0.90

# 每次买入花费的 USDC 数量
BUY_USDC=20

# 每次卖出的份额数量
SELL_SHARES=20

# 每个方向的持仓上限
MAX_POS_EACH=200

# 订单类型：FOK (Fill-or-Kill) 或 FAK (Fill-and-Kill)
ORDER_TYPE=FOK

# 轮询间隔（毫秒）
POLL_MS=500

# 刷新市场 slug 的间隔（毫秒）
REFRESH_SLUG_MS=2000
```

### 步骤 8: 测试运行（可选）

```bash
# 直接运行测试（前台运行，按 Ctrl+C 停止）
npm run dev
```

如果看到类似以下输出，说明配置正确：

```
[MARKET] slug=eth-updown-15m-...
=== AUTO 15m ETH 双边吃单启动 ===
[TICK] slug=... bestBid=0.8500 bestAsk=0.8600
```

### 步骤 9: 使用 PM2 后台运行

```bash
# 启动服务（使用配置文件）
pm2 start ecosystem.config.cjs

# 查看服务状态
pm2 status

# 查看实时日志
pm2 logs 15fenzhong

# 保存 PM2 进程列表（重启后自动恢复）
pm2 save
```

### 步骤 10: 设置开机自启

```bash
# 生成并配置 systemd 启动脚本
sudo pm2 startup systemd -u $USER --hp $HOME

# 按照提示执行输出的命令（通常是 sudo 命令）
# 然后再次保存
pm2 save
```

---

## Windows 手动安装

### 步骤 1: 安装 Node.js

1. 访问 [Node.js 官网](https://nodejs.org/)
2. 下载 **LTS 版本**（推荐 20.x 或更高）
3. 运行安装程序，使用默认设置
4. 安装完成后，打开 PowerShell 或 CMD 验证：

```powershell
node -v
npm -v
```

### 步骤 2: 安装 Git

1. 访问 [Git 官网](https://git-scm.com/download/win)
2. 下载并安装 Git for Windows
3. 安装完成后验证：

```powershell
git --version
```

### 步骤 3: 安装 PM2

打开 PowerShell（以管理员身份运行）：

```powershell
npm install -g pm2
pm2 -v
```

### 步骤 4: 克隆项目

```powershell
# 进入你希望安装项目的目录
cd C:\Users\YourUsername

# 克隆项目
git clone https://github.com/119969788/15fenzhong.git

# 进入项目目录
cd 15fenzhong
```

### 步骤 5: 安装项目依赖

```powershell
npm install
```

### 步骤 6: 配置环境变量

```powershell
# 复制环境变量示例文件
Copy-Item .env.example .env

# 使用记事本编辑
notepad .env
```

按照 [Linux 步骤 7](#步骤-7-配置环境变量) 中的说明配置环境变量。

### 步骤 7: 测试运行（可选）

```powershell
npm run dev
```

### 步骤 8: 使用 PM2 后台运行

```powershell
# 启动服务
pm2 start ecosystem.config.cjs

# 查看状态
pm2 status

# 查看日志
pm2 logs 15fenzhong

# 保存配置
pm2 save
```

### 步骤 9: 设置开机自启（Windows）

Windows 上 PM2 的开机自启需要额外配置：

```powershell
# 安装 PM2 Windows Service
npm install -g pm2-windows-service

# 安装服务
pm2-service-install

# 启动服务
pm2-service-start
```

或者使用 Windows 任务计划程序手动配置。

---

## macOS 手动安装

### 步骤 1: 安装 Homebrew（如未安装）

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 步骤 2: 安装 Node.js

```bash
# 使用 Homebrew 安装 Node.js
brew install node

# 或使用 nvm（推荐）
brew install nvm
nvm install 20
nvm use 20
```

### 步骤 3: 安装 Git

```bash
# Git 通常已预装，如果没有：
brew install git
```

### 步骤 4: 安装 PM2

```bash
npm install -g pm2
```

### 步骤 5-9: 按照 Linux 步骤执行

从 [步骤 5](#步骤-5-克隆项目) 开始，按照 Linux 安装步骤执行。

---

## 验证安装

### 检查所有组件

```bash
# 检查 Node.js
node -v  # 应该显示 v18.x.x 或更高

# 检查 npm
npm -v  # 应该显示 9.x.x 或更高

# 检查 Git
git --version

# 检查 PM2
pm2 -v

# 检查项目文件
ls -la  # Linux/macOS
dir     # Windows
```

### 检查配置文件

```bash
# 检查 .env 文件是否存在
ls -la .env  # Linux/macOS
Test-Path .env  # Windows PowerShell

# 检查 .env 文件内容（不要显示私钥）
cat .env | grep -v PRIVATE_KEY  # Linux/macOS
Get-Content .env | Select-String -NotMatch "PRIVATE_KEY"  # Windows
```

### 测试运行

```bash
# 前台运行测试（按 Ctrl+C 停止）
npm run dev

# 应该看到类似输出：
# [MARKET] slug=eth-updown-15m-...
# === AUTO 15m ETH 双边吃单启动 ===
```

---

## 常见问题

### 问题 1: Node.js 版本过低

**错误信息：**
```
Error: Node.js version must be >= 18.0.0
```

**解决方法：**
```bash
# 使用 nvm 升级（推荐）
nvm install 20
nvm use 20

# 或重新安装 Node.js
# 参考步骤 2 中的安装方法
```

### 问题 2: npm install 失败

**可能原因：**
- 网络连接问题
- npm 镜像源问题

**解决方法：**
```bash
# 使用国内镜像源（中国用户）
npm config set registry https://registry.npmmirror.com

# 或使用 cnpm
npm install -g cnpm --registry=https://registry.npmmirror.com
cnpm install
```

### 问题 3: PM2 启动失败

**检查日志：**
```bash
pm2 logs 15fenzhong --err
```

**常见原因：**
- `.env` 文件未配置或私钥错误
- Node.js 版本不兼容
- 依赖包未正确安装

**解决方法：**
```bash
# 重新安装依赖
rm -rf node_modules package-lock.json
npm install

# 检查 .env 配置
cat .env
```

### 问题 4: 权限错误

**Linux/macOS：**
```bash
# 如果遇到权限错误，检查文件权限
chmod +x install.sh

# 或使用 sudo（不推荐）
sudo npm install -g pm2
```

**Windows：**
- 以管理员身份运行 PowerShell

### 问题 5: PM2 开机自启不工作

**Linux：**
```bash
# 重新配置
sudo pm2 unstartup systemd
sudo pm2 startup systemd -u $USER --hp $HOME
pm2 save
```

**Windows：**
```powershell
# 重新安装服务
pm2-service-uninstall
pm2-service-install
pm2-service-start
```

### 问题 6: 端口或网络问题

确保服务器可以访问：
- `https://gamma-api.polymarket.com` - Polymarket API
- `https://polygon-rpc.com` - Polygon RPC（或你配置的 RPC）

测试连接：
```bash
# Linux/macOS
curl https://gamma-api.polymarket.com/events

# Windows PowerShell
Invoke-WebRequest -Uri https://gamma-api.polymarket.com/events
```

---

## 下一步

安装完成后，你可以：

1. **查看日志**：`pm2 logs 15fenzhong`
2. **监控状态**：`pm2 monit`
3. **更新代码**：`git pull && npm install && pm2 restart 15fenzhong`
4. **调整配置**：编辑 `.env` 文件后重启服务

更多信息请参考 [README.md](README.md) 和 [README_INSTALL.md](README_INSTALL.md)。
