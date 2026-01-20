#!/bin/bash

# ETH 15分钟自动交易机器人 - 一键安装脚本
# 适用于 Ubuntu/Debian/CentOS 服务器

set -e

echo "========================================="
echo "  ETH 15分钟自动交易机器人 - 安装脚本"
echo "========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否为 root 用户
if [ "$EUID" -eq 0 ]; then 
   echo -e "${YELLOW}警告: 建议不要使用 root 用户运行此脚本${NC}"
   read -p "是否继续? (y/n) " -n 1 -r
   echo
   if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      exit 1
   fi
fi

# 检测操作系统
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        VER=$VERSION_ID
    elif type lsb_release >/dev/null 2>&1; then
        OS=$(lsb_release -si | tr '[:upper:]' '[:lower:]')
        VER=$(lsb_release -sr)
    else
        echo -e "${RED}无法检测操作系统类型${NC}"
        exit 1
    fi
    echo -e "${GREEN}检测到操作系统: $OS $VER${NC}"
}

# 安装 Node.js (如果未安装)
install_nodejs() {
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        echo -e "${GREEN}Node.js 已安装: $NODE_VERSION${NC}"
        
        # 检查版本是否符合要求 (需要 >= 18)
        NODE_MAJOR=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_MAJOR" -lt 18 ]; then
            echo -e "${YELLOW}Node.js 版本过低，建议升级到 18+${NC}"
        fi
    else
        echo -e "${YELLOW}正在安装 Node.js...${NC}"
        
        if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
            curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
            sudo apt-get install -y nodejs
        elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ]; then
            curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
            sudo yum install -y nodejs
        else
            echo -e "${RED}不支持的操作系统: $OS${NC}"
            exit 1
        fi
        
        echo -e "${GREEN}Node.js 安装完成: $(node -v)${NC}"
    fi
    
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}npm 未正确安装${NC}"
        exit 1
    fi
    echo -e "${GREEN}npm 版本: $(npm -v)${NC}"
}

# 安装 PM2 (进程管理器)
install_pm2() {
    if command -v pm2 &> /dev/null; then
        echo -e "${GREEN}PM2 已安装: $(pm2 -v)${NC}"
    else
        echo -e "${YELLOW}正在安装 PM2...${NC}"
        sudo npm install -g pm2
        echo -e "${GREEN}PM2 安装完成${NC}"
    fi
}

# 安装 Git (如果未安装)
install_git() {
    if command -v git &> /dev/null; then
        echo -e "${GREEN}Git 已安装: $(git --version)${NC}"
    else
        echo -e "${YELLOW}正在安装 Git...${NC}"
        if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
            sudo apt-get update
            sudo apt-get install -y git
        elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ]; then
            sudo yum install -y git
        fi
    fi
}

# 克隆或更新项目
setup_project() {
    PROJECT_DIR="15fenzhong"
    GIT_REPO="https://github.com/119969788/15fenzhong.git"
    
    if [ -d "$PROJECT_DIR" ]; then
        echo -e "${YELLOW}项目目录已存在，正在更新...${NC}"
        cd "$PROJECT_DIR"
        git pull || echo -e "${YELLOW}Git 更新失败，继续使用现有代码${NC}"
    else
        echo -e "${YELLOW}正在克隆项目...${NC}"
        git clone "$GIT_REPO" "$PROJECT_DIR"
        cd "$PROJECT_DIR"
    fi
}

# 安装项目依赖
install_dependencies() {
    echo -e "${YELLOW}正在安装项目依赖...${NC}"
    npm install
    echo -e "${GREEN}依赖安装完成${NC}"
}

# 配置环境变量
setup_env() {
    if [ ! -f .env ]; then
        echo -e "${YELLOW}正在创建 .env 文件...${NC}"
        if [ -f .env.example ]; then
            cp .env.example .env
            echo -e "${GREEN}.env 文件已创建${NC}"
            echo -e "${RED}⚠️  重要: 请编辑 .env 文件，填入你的私钥和配置！${NC}"
            echo ""
            read -p "是否现在编辑 .env 文件? (y/n) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                ${EDITOR:-nano} .env
            fi
        else
            echo -e "${RED}错误: 找不到 .env.example 文件${NC}"
            exit 1
        fi
    else
        echo -e "${GREEN}.env 文件已存在${NC}"
        read -p "是否重新配置 .env 文件? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            if [ -f .env.example ]; then
                cp .env.example .env
            fi
            ${EDITOR:-nano} .env
        fi
    fi
}

# 配置 PM2 启动
setup_pm2() {
    echo -e "${YELLOW}正在配置 PM2...${NC}"
    
    # 创建 PM2 生态系统文件
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
    
    echo -e "${GREEN}PM2 配置完成${NC}"
}

# 启动服务
start_service() {
    echo ""
    echo -e "${YELLOW}是否现在启动服务?${NC}"
    read -p "启动服务? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # 停止可能存在的旧进程
        pm2 delete 15fenzhong 2>/dev/null || true
        
        # 启动服务
        pm2 start ecosystem.config.cjs
        
        # 保存 PM2 配置
        pm2 save
        
        # 设置 PM2 开机自启
        echo -e "${YELLOW}正在设置 PM2 开机自启...${NC}"
        sudo pm2 startup systemd -u $USER --hp $HOME
        echo -e "${GREEN}开机自启已配置${NC}"
        
        echo ""
        echo -e "${GREEN}=========================================${NC}"
        echo -e "${GREEN}  安装完成！服务已启动${NC}"
        echo -e "${GREEN}=========================================${NC}"
        echo ""
        echo "常用命令:"
        echo "  查看状态:  pm2 status"
        echo "  查看日志:  pm2 logs 15fenzhong"
        echo "  重启服务:  pm2 restart 15fenzhong"
        echo "  停止服务:  pm2 stop 15fenzhong"
        echo "  删除服务:  pm2 delete 15fenzhong"
        echo ""
    else
        echo -e "${YELLOW}稍后可以使用以下命令启动:${NC}"
        echo "  cd $(pwd)"
        echo "  pm2 start ecosystem.config.cjs"
        echo "  pm2 save"
        echo "  sudo pm2 startup systemd -u $USER --hp $HOME"
    fi
}

# 主函数
main() {
    detect_os
    install_git
    install_nodejs
    install_pm2
    setup_project
    install_dependencies
    setup_env
    setup_pm2
    start_service
}

# 运行主函数
main
