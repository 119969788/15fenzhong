# ETH 15分钟自动交易机器人 - Windows 一键安装脚本
# 适用于 Windows Server / Windows 10/11

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  ETH 15分钟自动交易机器人 - 安装脚本" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"

# 检查 PowerShell 版本
if ($PSVersionTable.PSVersion.Major -lt 5) {
    Write-Host "错误: 需要 PowerShell 5.0 或更高版本" -ForegroundColor Red
    exit 1
}

# 安装 Node.js (如果未安装)
function Install-NodeJS {
    if (Get-Command node -ErrorAction SilentlyContinue) {
        $nodeVersion = node -v
        Write-Host "Node.js 已安装: $nodeVersion" -ForegroundColor Green
        
        $nodeMajor = [int](node -v).Substring(1).Split('.')[0]
        if ($nodeMajor -lt 18) {
            Write-Host "警告: Node.js 版本过低，建议升级到 18+" -ForegroundColor Yellow
        }
    } else {
        Write-Host "Node.js 未安装，正在打开下载页面..." -ForegroundColor Yellow
        Write-Host "请访问: https://nodejs.org/" -ForegroundColor Yellow
        Write-Host "下载并安装 Node.js 18 LTS 或更高版本" -ForegroundColor Yellow
        
        $response = Read-Host "安装完成后按 Enter 继续"
        
        if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
            Write-Host "错误: Node.js 仍未安装" -ForegroundColor Red
            exit 1
        }
    }
    
    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
        Write-Host "错误: npm 未正确安装" -ForegroundColor Red
        exit 1
    }
    Write-Host "npm 版本: $(npm -v)" -ForegroundColor Green
}

# 安装 PM2 (进程管理器)
function Install-PM2 {
    if (Get-Command pm2 -ErrorAction SilentlyContinue) {
        Write-Host "PM2 已安装: $(pm2 -v)" -ForegroundColor Green
    } else {
        Write-Host "正在安装 PM2..." -ForegroundColor Yellow
        npm install -g pm2
        Write-Host "PM2 安装完成" -ForegroundColor Green
    }
}

# 安装 Git (如果未安装)
function Install-Git {
    if (Get-Command git -ErrorAction SilentlyContinue) {
        Write-Host "Git 已安装: $(git --version)" -ForegroundColor Green
    } else {
        Write-Host "Git 未安装，请访问: https://git-scm.com/download/win" -ForegroundColor Yellow
        Write-Host "下载并安装 Git for Windows" -ForegroundColor Yellow
        
        $response = Read-Host "安装完成后按 Enter 继续"
        
        if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
            Write-Host "错误: Git 仍未安装" -ForegroundColor Red
            exit 1
        }
    }
}

# 克隆或更新项目
function Setup-Project {
    $projectDir = "15fenzhong"
    $gitRepo = "https://github.com/119969788/15fenzhong.git"
    
    if (Test-Path $projectDir) {
        Write-Host "项目目录已存在，正在更新..." -ForegroundColor Yellow
        Set-Location $projectDir
        git pull
        if ($LASTEXITCODE -ne 0) {
            Write-Host "警告: Git 更新失败，继续使用现有代码" -ForegroundColor Yellow
        }
    } else {
        Write-Host "正在克隆项目..." -ForegroundColor Yellow
        git clone $gitRepo $projectDir
        Set-Location $projectDir
    }
}

# 安装项目依赖
function Install-Dependencies {
    Write-Host "正在安装项目依赖..." -ForegroundColor Yellow
    npm install
    Write-Host "依赖安装完成" -ForegroundColor Green
}

# 配置环境变量
function Setup-Env {
    if (-not (Test-Path .env)) {
        Write-Host "正在创建 .env 文件..." -ForegroundColor Yellow
        if (Test-Path .env.example) {
            Copy-Item .env.example .env
            Write-Host ".env 文件已创建" -ForegroundColor Green
            Write-Host "⚠️  重要: 请编辑 .env 文件，填入你的私钥和配置！" -ForegroundColor Red
            Write-Host ""
            
            $response = Read-Host "是否现在编辑 .env 文件? (y/n)"
            if ($response -eq 'y' -or $response -eq 'Y') {
                notepad .env
            }
        } else {
            Write-Host "错误: 找不到 .env.example 文件" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host ".env 文件已存在" -ForegroundColor Green
        $response = Read-Host "是否重新配置 .env 文件? (y/n)"
        if ($response -eq 'y' -or $response -eq 'Y') {
            if (Test-Path .env.example) {
                Copy-Item .env.example .env -Force
            }
            notepad .env
        }
    }
}

# 配置 PM2 启动
function Setup-PM2 {
    Write-Host "正在配置 PM2..." -ForegroundColor Yellow
    
    # 创建 PM2 生态系统文件
    $ecosystemConfig = @"
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
"@
    
    $ecosystemConfig | Out-File -FilePath "ecosystem.config.cjs" -Encoding UTF8
    
    # 创建日志目录
    if (-not (Test-Path logs)) {
        New-Item -ItemType Directory -Path logs | Out-Null
    }
    
    Write-Host "PM2 配置完成" -ForegroundColor Green
}

# 启动服务
function Start-Service {
    Write-Host ""
    Write-Host "是否现在启动服务?" -ForegroundColor Yellow
    $response = Read-Host "启动服务? (y/n)"
    
    if ($response -eq 'y' -or $response -eq 'Y') {
        # 停止可能存在的旧进程
        pm2 delete 15fenzhong 2>$null
        
        # 启动服务
        pm2 start ecosystem.config.cjs
        
        # 保存 PM2 配置
        pm2 save
        
        Write-Host ""
        Write-Host "=========================================" -ForegroundColor Green
        Write-Host "  安装完成！服务已启动" -ForegroundColor Green
        Write-Host "=========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "常用命令:" -ForegroundColor Cyan
        Write-Host "  查看状态:  pm2 status"
        Write-Host "  查看日志:  pm2 logs 15fenzhong"
        Write-Host "  重启服务:  pm2 restart 15fenzhong"
        Write-Host "  停止服务:  pm2 stop 15fenzhong"
        Write-Host "  删除服务:  pm2 delete 15fenzhong"
        Write-Host ""
        Write-Host "注意: Windows 上 PM2 不会自动开机启动" -ForegroundColor Yellow
        Write-Host "可以使用任务计划程序设置开机启动: pm2 startup" -ForegroundColor Yellow
    } else {
        Write-Host "稍后可以使用以下命令启动:" -ForegroundColor Yellow
        Write-Host "  cd $(Get-Location)"
        Write-Host "  pm2 start ecosystem.config.js"
        Write-Host "  pm2 save"
    }
}

# 主函数
function Main {
    Install-Git
    Install-NodeJS
    Install-PM2
    Setup-Project
    Install-Dependencies
    Setup-Env
    Setup-PM2
    Start-Service
}

# 运行主函数
try {
    Main
} catch {
    Write-Host "错误: $_" -ForegroundColor Red
    exit 1
}
