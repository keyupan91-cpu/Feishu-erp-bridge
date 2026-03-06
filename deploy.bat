@echo off
chcp 65001 >nul

echo ╔══════════════════════════════════════════════════════════╗
echo ║     金蝶数据传输平台 - 一键部署脚本 (Windows)             ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

REM 检查 Node.js
echo 📦 检查 Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js 未安装
    echo    请先安装 Node.js: https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✅ Node.js 版本：%NODE_VERSION%

REM 检查 npm
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm 未安装
    echo    请安装 npm
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
echo ✅ npm 版本：%NPM_VERSION%

REM 安装依赖
echo.
echo 📦 安装依赖...
call npm install

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║                    部署完成！                            ║
echo ╠══════════════════════════════════════════════════════════╣
echo ║  启动命令：                                              ║
echo ║    npm run dev         - 开发模式（前后端）              ║
echo ║    npm run start:all   - 生产模式（前后端 + Tunnel）     ║
echo ╚══════════════════════════════════════════════════════════╝
echo.
pause
