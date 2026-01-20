#!/bin/bash

# PM2 配置文件修复脚本
# 用于修复 ecosystem.config.js 找不到的问题

echo "========================================="
echo "  PM2 配置文件修复脚本"
echo "========================================="
echo ""

# 检查是否在项目目录中
if [ ! -f "package.json" ]; then
    echo "错误: 请在项目根目录中运行此脚本"
    exit 1
fi

# 检查 ecosystem.config.cjs 是否存在
if [ -f "ecosystem.config.cjs" ]; then
    echo "✓ ecosystem.config.cjs 文件已存在"
else
    echo "正在创建 ecosystem.config.cjs 文件..."
    cat > ecosystem.config.cjs << 'EOF'
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
EOF
    echo "✓ ecosystem.config.cjs 文件已创建"
fi

# 删除旧的 ecosystem.config.js（如果存在）
if [ -f "ecosystem.config.js" ]; then
    echo "警告: 发现旧的 ecosystem.config.js 文件"
    read -p "是否删除旧文件? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm ecosystem.config.js
        echo "✓ 已删除 ecosystem.config.js"
    fi
fi

# 创建日志目录
if [ ! -d "logs" ]; then
    mkdir -p logs
    echo "✓ 日志目录已创建"
fi

# 检查 PM2 进程
echo ""
echo "检查 PM2 进程状态..."
pm2 list | grep -q "15fenzhong"
if [ $? -eq 0 ]; then
    echo "发现已存在的 15fenzhong 进程"
    read -p "是否删除并重新启动? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        pm2 delete 15fenzhong
        echo "✓ 已删除旧进程"
    fi
fi

# 启动服务
echo ""
echo "正在启动 PM2 服务..."
pm2 start ecosystem.config.cjs

# 保存配置
echo "正在保存 PM2 配置..."
pm2 save

echo ""
echo "========================================="
echo "  修复完成！"
echo "========================================="
echo ""
echo "当前状态:"
pm2 status

echo ""
echo "常用命令:"
echo "  查看状态:  pm2 status"
echo "  查看日志:  pm2 logs 15fenzhong"
echo "  重启服务:  pm2 restart 15fenzhong"
echo "  停止服务:  pm2 stop 15fenzhong"
echo ""
