#!/usr/bin/env node
/**
 * Cloudflare Tunnel 启动脚本
 *
 * 功能：
 * 1. 启动 cloudflared tunnel，暴露前端 5173 端口到公网
 * 2. 解析 stdout 获取公网 URL
 * 3. 在终端显示公网链接
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// cloudflared 可执行文件路径
const CLOUDFLARED_PATH = path.join(projectRoot, 'cloudflared-windows-amd64.exe');

// 前端服务端口
const FRONTEND_PORT = process.env.FRONTEND_PORT || 5173;

// 存储公网 URL
let publicUrl = null;
let isUrlFound = false;

// 解析 cloudflared 输出，提取公网 URL
function parseCloudflareOutput(line) {
  // Cloudflare Tunnel 输出格式：
  // https://xxx.trycloudflare.com -> xxx.trycloudflare.com

  // 匹配 trycloudflare.com 的 URL
  const urlRegex = /https:\/\/([a-zA-Z0-9-]+\.trycloudflare\.com)/g;
  const match = urlRegex.exec(line);

  if (match) {
    return `https://${match[1]}`;
  }

  return null;
}

// 启动 Cloudflare Tunnel
function startTunnel() {
  return new Promise((resolve, reject) => {
    console.log('🚀 启动 Cloudflare Tunnel...');
    console.log(`📍 前端端口：${FRONTEND_PORT}`);
    console.log(`📁 cloudflared 路径：${CLOUDFLARED_PATH}`);

    // 检查 cloudflared 是否存在
    try {
      const stats = readFileSync(CLOUDFLARED_PATH);
      console.log('✅ cloudflared 文件存在');
    } catch (error) {
      console.error('❌ cloudflared 文件不存在:', CLOUDFLARED_PATH);
      reject(new Error('cloudflared 文件不存在'));
      return;
    }

    // 启动 cloudflared 进程
    // 使用 tunnel 命令创建临时 tunnel
    const tunnelProcess = spawn(CLOUDFLARED_PATH, [
      'tunnel',
      '--url',
      `http://localhost:${FRONTEND_PORT}`,
    ], {
      cwd: projectRoot,
      env: { ...process.env },
    });

    // 监听 stdout
    tunnelProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[cloudflared] ${output.trim()}`);

      // 尝试解析公网 URL
      if (!isUrlFound) {
        const url = parseCloudflareOutput(output);
        if (url) {
          publicUrl = url;
          isUrlFound = true;
          console.log('\n✅ 公网 URL 已获取:', publicUrl);
        }
      }
    });

    // 监听 stderr
    tunnelProcess.stderr.on('data', (data) => {
      console.error(`[cloudflared error] ${data.toString().trim()}`);
    });

    // 监听进程结束
    tunnelProcess.on('close', (code) => {
      console.log(`\n[cloudflared] 进程结束，退出码：${code}`);
      resolve({ code, publicUrl });
    });

    // 监听错误
    tunnelProcess.on('error', (error) => {
      console.error('[cloudflared] 进程错误:', error);
      reject(error);
    });

    // 保存进程引用，用于后续停止
    global.tunnelProcess = tunnelProcess;

    console.log('\n⏳ 等待 Cloudflare Tunnel 启动并获取公网 URL...\n');
  });
}

// 优雅退出
function gracefulShutdown() {
  console.log('\n\n👋 正在关闭 Cloudflare Tunnel...');

  if (global.tunnelProcess) {
    global.tunnelProcess.kill('SIGINT');
  }

  process.exit(0);
}

// 监听退出信号
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
process.on('exit', () => {
  console.log('[cloudflared] Tunnel 已关闭');
});

// 主函数
async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║     金蝶数据传输平台 - Cloudflare Tunnel 启动脚本         ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  try {
    await startTunnel();
  } catch (error) {
    console.error('\n❌ 启动失败:', error.message);
    process.exit(1);
  }
}

// 运行
main();
