#!/usr/bin/env node
/**
 * 金蝶数据传输平台 - 统一启动脚本
 *
 * 功能：
 * 1. 启动后端服务器 (3001 端口)
 * 2. 启动前端服务器 (5173 端口)
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
import { writeFileSync, existsSync, unlinkSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// 配置
const CONFIG = {
  backendPort: process.env.BACKEND_PORT || 3001,
  frontendPort: process.env.FRONTEND_PORT || 5173,
};

// 进程引用
const processes = {
  backend: null,
  frontend: null,
};

let isServerReady = false;
let isFrontendReady = false;

// PID 文件路径（用于后续停止服务）
const PID_FILE = path.join(projectRoot, '.start-all.pid.json');

// 保存进程 ID
function savePids() {
  const pids = {
    backend: processes.backend?.pid,
    frontend: processes.frontend?.pid,
  };
  writeFileSync(PID_FILE, JSON.stringify(pids, null, 2));
  console.log(`\n📝 进程 ID 已保存到：${PID_FILE}`);
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

// 打印启动信息
function printStartupInfo() {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║          金蝶数据传输平台 - 服务启动成功                          ║');
  console.log('╠══════════════════════════════════════════════════════════════════╣');
  console.log(`║  本地访问：                                                       ║`);
  console.log(`║    前端：http://localhost:${CONFIG.frontendPort}                      ║`.padEnd(69, ' ') + '║');
  console.log(`║    后端：http://localhost:${CONFIG.backendPort}                      ║`.padEnd(69, ' ') + '║');
  console.log('║                                                                  ║');
  console.log('║  按 Ctrl+C 停止所有服务                                           ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log('\n');
}

// 主函数
async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║     金蝶数据传输平台 - 统一启动脚本                       ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  try {
    // 1. 启动后端
    await startBackend();

    // 2. 启动前端
    await startFrontend();

    // 3. 打印启动信息
    printStartupInfo();

    // 4. 保存进程 ID
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
