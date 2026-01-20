# 服务器一键安装指南

本指南提供在 Linux 和 Windows 服务器上的一键安装脚本。

## Linux 服务器安装

### 快速安装

```bash
# 下载并运行安装脚本
curl -fsSL https://raw.githubusercontent.com/119969788/15fenzhong/main/install.sh | bash
```

或者手动下载：

```bash
# 下载安装脚本
wget https://raw.githubusercontent.com/119969788/15fenzhong/main/install.sh

# 添加执行权限
chmod +x install.sh

# 运行安装脚本
./install.sh
```

### 安装脚本功能

安装脚本会自动完成以下操作：

1. ✅ **检测操作系统** - 支持 Ubuntu/Debian/CentOS
2. ✅ **安装 Node.js** - 自动安装 Node.js 20 LTS（如未安装）
3. ✅ **安装 Git** - 安装 Git（如未安装）
4. ✅ **安装 PM2** - 进程管理器，用于后台运行
5. ✅ **克隆项目** - 从 GitHub 克隆项目代码
6. ✅ **安装依赖** - 自动安装 npm 依赖包
7. ✅ **配置环境** - 创建 `.env` 文件并提示配置
8. ✅ **配置 PM2** - 创建 PM2 配置文件
9. ✅ **启动服务** - 启动服务并设置开机自启

### 手动安装步骤

如果不使用自动脚本，可以手动执行以下步骤：

```bash
# 1. 安装 Node.js (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. 安装 PM2
sudo npm install -g pm2

# 3. 克隆项目
git clone https://github.com/119969788/15fenzhong.git
cd 15fenzhong

# 4. 安装依赖
npm install

# 5. 配置环境变量
cp .env.example .env
nano .env  # 编辑并填入私钥

# 6. 启动服务
pm2 start ecosystem.config.js
pm2 save
sudo pm2 startup systemd -u $USER --hp $HOME
```

## Windows 服务器安装

### 快速安装

1. 下载安装脚本：
   ```powershell
   Invoke-WebRequest -Uri "https://raw.githubusercontent.com/119969788/15fenzhong/main/install.ps1" -OutFile "install.ps1"
   ```

2. 以管理员身份运行 PowerShell，执行：
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   .\install.ps1
   ```

### 安装脚本功能

Windows 安装脚本会自动完成：

1. ✅ **检查 Node.js** - 检测 Node.js 是否安装
2. ✅ **检查 Git** - 检测 Git 是否安装
3. ✅ **安装 PM2** - 全局安装 PM2
4. ✅ **克隆项目** - 从 GitHub 克隆代码
5. ✅ **安装依赖** - 安装 npm 依赖
6. ✅ **配置环境** - 创建 `.env` 文件
7. ✅ **配置 PM2** - 创建配置文件
8. ✅ **启动服务** - 启动服务

### 手动安装步骤

```powershell
# 1. 安装 Node.js
# 访问 https://nodejs.org/ 下载并安装

# 2. 安装 PM2
npm install -g pm2

# 3. 克隆项目
git clone https://github.com/119969788/15fenzhong.git
cd 15fenzhong

# 4. 安装依赖
npm install

# 5. 配置环境变量
Copy-Item .env.example .env
notepad .env  # 编辑并填入私钥

# 6. 启动服务
pm2 start ecosystem.config.js
pm2 save
```

## 配置环境变量

编辑 `.env` 文件，填入以下信息：

```env
# 必需配置
POLYMARKET_PRIVATE_KEY=0x你的私钥

# 可选配置
POLYGON_RPC_URL=https://polygon-rpc.com
SLUG_PREFIX=eth-updown-15m-
BUY_PRICE=0.80
SELL_PRICE=0.90
BUY_USDC=20
SELL_SHARES=20
MAX_POS_EACH=200
ORDER_TYPE=FOK
POLL_MS=500
REFRESH_SLUG_MS=2000
```

## PM2 管理命令

### 查看状态
```bash
pm2 status
```

### 查看日志
```bash
# 实时日志
pm2 logs 15fenzhong

# 查看最近 100 行
pm2 logs 15fenzhong --lines 100
```

### 重启服务
```bash
pm2 restart 15fenzhong
```

### 停止服务
```bash
pm2 stop 15fenzhong
```

### 删除服务
```bash
pm2 delete 15fenzhong
```

### 查看监控
```bash
pm2 monit
```

## 故障排除

### 服务无法启动

1. 检查 Node.js 版本：
   ```bash
   node -v  # 需要 >= 18
   ```

2. 检查 `.env` 文件：
   ```bash
   cat .env  # 确保私钥已正确配置
   ```

3. 查看错误日志：
   ```bash
   pm2 logs 15fenzhong --err
   ```

### PM2 开机自启失败

**Linux:**
```bash
# 重新生成启动脚本
sudo pm2 unstartup systemd
sudo pm2 startup systemd -u $USER --hp $HOME
pm2 save
```

**Windows:**
```powershell
# 使用 PM2 Windows Service Wrapper
npm install -g pm2-windows-service
pm2-service-install
```

### 更新代码

```bash
cd 15fenzhong
git pull
npm install
pm2 restart 15fenzhong
```

## 安全建议

1. ⚠️ **不要将 `.env` 文件提交到 Git**
2. ⚠️ **使用环境变量或密钥管理服务存储私钥**
3. ⚠️ **定期检查日志，监控异常活动**
4. ⚠️ **使用防火墙限制服务器访问**
5. ⚠️ **定期更新依赖包：`npm audit fix`**

## 系统要求

- **操作系统**: Ubuntu 20.04+, Debian 11+, CentOS 8+, Windows Server 2016+
- **Node.js**: 18.0.0 或更高版本
- **内存**: 至少 512MB RAM
- **磁盘**: 至少 500MB 可用空间
- **网络**: 稳定的互联网连接

## 技术支持

如有问题，请提交 Issue 到 GitHub: https://github.com/119969788/15fenzhong/issues
