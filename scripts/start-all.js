#!/usr/bin/env node
/**
 * 金蝶数据传输平台 - 统一启动脚本
 *
 * 功能：
 * 1. 启动后端服务器 (3001 端口)
 * 2. 启动前端服务器 (5173 端口)
 * 3. 启动 Cloudflare Tunnel
 * 4. 获取公网链接并在终端显示
 *
 * 使用方式：
 * node scripts/start-all.js
 *
 * 环境变量：
 * FRONTEND_PORT       - 前端端口（默认 5173）
 * BACKEND_PORT        - 后端端口（默认 3001）
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// 配置
const CONFIG = {
  backendPort: process.env.BACKEND_PORT || 3001,
  frontendPort: process.env.FRONTEND_PORT || 5173,
  cloudflaredPath: path.join(projectRoot, 'cloudflared-windows-amd64.exe'),
};

// 进程引用
const processes = {
  backend: null,
  frontend: null,
  cloudflared: null,
};

// 公网 URL
let publicUrl = null;
let isUrlFound = false;
let isServerReady = false;
let isFrontendReady = false;

// PID 文件路径（用于后续停止服务）
const PID_FILE = path.join(projectRoot, '.start-all.pid.json');

// 保存进程 ID
function savePids() {
  const pids = {
    backend: processes.backend?.pid,
    frontend: processes.frontend?.pid,
    cloudflared: processes.cloudflared?.pid,
  };
  writeFileSync(PID_FILE, JSON.stringify(pids, null, 2));
  console.log(`\n📝 进程 ID 已保存到：${PID_FILE}`);
}

// 读取进程 ID
function loadPids() {
  if (existsSync(PID_FILE)) {
    return JSON.parse(readFileSync(PID_FILE, 'utf8'));
  }
  return null;
}

// 删除 PID 文件
function removePidFile() {
  try {
    if (existsSync(PID_FILE)) {
      unlinkSync(PID_FILE);
    }
  } catch (e) {
    // 忽略
  }
}

// 停止所有进程
function stopAllProcesses() {
  console.log('\n\n👋 正在停止所有服务...');

  if (processes.cloudflared) {
    console.log('  • 停止 Cloudflare Tunnel...');
    processes.cloudflared.kill('SIGINT');
  }

  if (processes.frontend) {
    console.log('  • 停止前端服务器...');
    processes.frontend.kill('SIGINT');
  }

  if (processes.backend) {
    console.log('  • 停止后端服务器...');
    processes.backend.kill('SIGINT');
  }

  removePidFile();
  console.log('✅ 所有服务已停止');
  process.exit(0);
}

// 启动后端服务器
function startBackend() {
  return new Promise((resolve, reject) => {
    console.log('🔧 启动后端服务器...');

    const backendProcess = spawn('node', ['server/server.js'], {
      cwd: projectRoot,
      env: { ...process.env },
      shell: true,
    });

    backendProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[后端] ${output.trim()}`);

      // 检测后端是否启动成功
      if (output.includes('服务器运行在') && !isServerReady) {
        isServerReady = true;
        console.log('✅ 后端服务器已启动\n');
        resolve(true);
      }
    });

    backendProcess.stderr.on('data', (data) => {
      console.error(`[后端错误] ${data.toString().trim()}`);
    });

    backendProcess.on('error', (error) => {
      console.error('[后端] 启动失败:', error);
      reject(error);
    });

    backendProcess.on('close', (code) => {
      if (code !== 0 && code !== null) {
        console.error(`[后端] 进程异常退出，退出码：${code}`);
      }
    });

    processes.backend = backendProcess;
  });
}

// 启动前端服务器
function startFrontend() {
  return new Promise((resolve, reject) => {
    console.log('🎨 启动前端服务器...');

    const frontendProcess = spawn('npx', ['vite'], {
      cwd: projectRoot,
      env: { ...process.env },
      shell: true,
    });

    frontendProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[前端] ${output.trim()}`);

      // 检测前端是否启动成功
      if (output.includes('ready in') && !isFrontendReady) {
        isFrontendReady = true;
        console.log('✅ 前端服务器已启动\n');
        resolve(true);
      }
    });

    frontendProcess.stderr.on('data', (data) => {
      console.error(`[前端错误] ${data.toString().trim()}`);
    });

    frontendProcess.on('error', (error) => {
      console.error('[前端] 启动失败:', error);
      reject(error);
    });

    frontendProcess.on('close', (code) => {
      if (code !== 0 && code !== null) {
        console.error(`[前端] 进程异常退出，退出码：${code}`);
      }
    });

    processes.frontend = frontendProcess;
  });
}

// 启动 Cloudflare Tunnel
function startCloudflareTunnel() {
  return new Promise((resolve, reject) => {
    console.log('🌐 启动 Cloudflare Tunnel...');
    console.log(`   前端端口：${CONFIG.frontendPort}`);

    const cloudflaredProcess = spawn(CONFIG.cloudflaredPath, [
      'tunnel',
      '--url',
      `http://localhost:${CONFIG.frontendPort}`,
    ], {
      cwd: projectRoot,
      env: { ...process.env },
    });

    // 处理输出（stdout 和 stderr 都需要解析）
    const handleOutput = (data) => {
      const output = data.toString();
      console.log(`[Cloudflare] ${output.trim()}`);

      // 解析公网 URL
      if (!isUrlFound) {
        const url = parseCloudflareUrl(output);
        if (url) {
          publicUrl = url;
          isUrlFound = true;
          console.log(`\n✅ 公网 URL 已获取：${publicUrl}\n`);
          printStartupInfo();
          savePids();
          resolve(true);
        }
      }
    };

    cloudflaredProcess.stdout.on('data', handleOutput);
    cloudflaredProcess.stderr.on('data', handleOutput);

    cloudflaredProcess.on('error', (error) => {
      console.error('[Cloudflare] 启动失败:', error);
      reject(error);
    });

    cloudflaredProcess.on('close', (code) => {
      if (code !== 0 && code !== null) {
        console.error(`[Cloudflare] 进程异常退出，退出码：${code}`);
      }
    });

    processes.cloudflared = cloudflaredProcess;

    console.log('⏳ 等待 Cloudflare Tunnel 启动并获取公网 URL...\n');
  });
}

// 解析 Cloudflare URL
function parseCloudflareUrl(output) {
  const urlRegex = /https:\/\/([a-zA-Z0-9-]+\.trycloudflare\.com)/g;
  const match = urlRegex.exec(output);
  if (match) {
    return `https://${match[1]}`;
  }
  return null;
}

// 打印启动信息
function printStartupInfo() {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║          金蝶数据传输平台 - 服务启动成功                          ║');
  console.log('╠══════════════════════════════════════════════════════════════════╣');
  console.log(`║  本地访问：                                                       ║`);
  console.log(`║    前端：http://localhost:${CONFIG.frontendPort}                      ║`.padEnd(69, ' ') + '║');
  console.log(`║    后端：http://localhost:${CONFIG.backendPort}                      ║`.padEnd(69, ' ') + '║');
  if (publicUrl) {
    const urlDisplay = publicUrl.length > 50 ? publicUrl.substring(0, 47) + '...' : publicUrl;
    console.log(`║  公网访问：${urlDisplay}                      ║`);
  }
  console.log('║                                                                  ║');
  console.log('║  按 Ctrl+C 停止所有服务                                           ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log('\n');
}

// 检查 cloudflared 是否存在
function checkCloudflared() {
  if (!existsSync(CONFIG.cloudflaredPath)) {
    throw new Error(`cloudflared 文件不存在：${CONFIG.cloudflaredPath}`);
  }
  console.log(`✅ cloudflared 文件存在\n`);
}

// 主函数
async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║     金蝶数据传输平台 - 统一启动脚本                       ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  try {
    // 1. 检查 cloudflared
    checkCloudflared();

    // 2. 启动后端
    await startBackend();

    // 3. 启动前端
    await startFrontend();

    // 4. 启动 Cloudflare Tunnel（等待获取公网 URL）
    await startCloudflareTunnel();

    // 5. 打印启动信息
    printStartupInfo();

    // 6. 保存进程 ID
    savePids();

  } catch (error) {
    console.error('\n❌ 启动失败:', error.message);
    stopAllProcesses();
    process.exit(1);
  }
}

// 监听退出信号
process.on('SIGINT', stopAllProcesses);
process.on('SIGTERM', stopAllProcesses);
process.on('exit', () => {
  console.log('[start-all] 服务已退出');
});

// 运行
main();
