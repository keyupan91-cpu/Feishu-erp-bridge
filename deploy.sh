#!/bin/bash

# 金蝶数据传输平台 - 一键部署脚本
# 适用于 macOS / Linux

echo "╔══════════════════════════════════════════════════════════╗"
echo "║     金蝶数据传输平台 - 一键部署脚本                       ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# 检查 Node.js
echo "📦 检查 Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装"
    echo "   请先安装 Node.js: https://nodejs.org/"
    exit 1
fi
echo "✅ Node.js 版本：$(node -v)"

# 检查 npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装"
    echo "   请安装 npm"
    exit 1
fi
echo "✅ npm 版本：$(npm -v)"

# 安装依赖
echo ""
echo "📦 安装依赖..."
npm install

# 检查 cloudflared
echo ""
echo "🌐 检查 Cloudflare Tunnel..."
if [ ! -f "cloudflared-linux-amd64" ] && [ ! -f "cloudflared" ]; then
    echo "⚠️  cloudflared 不存在"
    echo "   如需公网访问，请下载 cloudflared:"
    echo "   https://developers.cloudflare.com/cloudflare-one/connections/connect-non-http/private-net/"
fi

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                    部署完成！                            ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║  启动命令：                                              ║"
echo "║    npm run dev         - 开发模式（前后端）              ║"
echo "║    npm run start:all   - 生产模式（前后端 + Tunnel）     ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
