# 金蝶数据传输平台 - 外网访问方案

## 已实施的功能

### 1. Cloudflare Tunnel 启动脚本

**文件**: `scripts/start-tunnel.js`

功能：
- 启动 cloudflared tunnel，暴露前端 5173 端口到公网
- 解析 stdout 获取公网 URL（`https://xxx.trycloudflare.com`）

使用方式：
```bash
npm run start:tunnel
```

环境变量：
- `FRONTEND_PORT` - 前端端口（默认 5173）

### 2. 统一启动脚本

**文件**: `scripts/start-all.js`

功能：
- 一键启动所有服务（后端、前端、Cloudflare Tunnel）
- 自动获取公网链接并在终端显示

使用方式：
```bash
npm run start:all
```

环境变量：
- `BACKEND_PORT` - 后端端口（默认 3001）
- `FRONTEND_PORT` - 前端端口（默认 5173）

### 4. 移动端适配

#### CSS 响应式样式

**文件**: `src/index.css`

添加了完整的响应式设计：
- 平板和手机通用样式（<= 768px）
- 手机端专用样式（<= 576px）
- 超小屏幕优化（<= 375px）
- 横屏模式适配
- iPhone 刘海屏和底部横条适配（safe-area-inset）
- 触摸优化（禁止双击缩放、加大触摸区域）

关键优化：
- 按钮和表单元素加大触摸区域（最小 44px）
- 字体大小自适应
- 表格在移动端改为卡片式展示
- 模态框和弹窗优化
- 底部 TabBar 导航样式

#### 移动端布局组件

**文件**: `src/components/MobileLayout.tsx`

提供的组件：
- `MobileLayout` - 底部 TabBar 导航布局
- `MobileTaskCard` - 移动端任务卡片
- `MobilePageHeader` - 移动端页面标题栏

使用示例：
```tsx
import MobileLayout from './components/MobileLayout';

function MyPage() {
  return (
    <MobileLayout activeTab="tasks" onTabChange={setTab}>
      {/* 页面内容 */}
    </MobileLayout>
  );
}
```

## 网络架构图

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  外网用户    │────▶│ Cloudflare   │────▶│  Vite 前端   │
│  (手机/电脑) │     │  Tunnel      │     │  (5173)     │
└─────────────┘     └──────────────┘     └──────┬──────┘
                                                │
                                                │ 代理 /api
                                                ▼
                                         ┌─────────────┐
                                         │  Node 后端   │
                                         │  (3001)     │
                                         └─────────────┘
```

**优势**:
- 前端静态资源通过 Cloudflare CDN 加速
- API 请求通过 Vite 代理直接访问本地后端
- 后端无需公网暴露，安全性高
- 最低延迟，最快速度

## 启动命令总结

| 命令 | 功能 |
|------|------|
| `npm run dev` | 同时启动前端和后端（开发模式） |
| `npm run dev:client` | 只启动前端 |
| `npm run dev:server` | 只启动后端 |
| `npm run start:tunnel` | 只启动 Cloudflare Tunnel |
| `npm run start:all` | 一键启动所有服务 |

## 使用流程

### 一键启动（推荐）

```bash
# 启动所有服务
npm run start:all
```

启动后会：
1. 启动后端服务器（3001 端口）
2. 启动前端服务器（5173 端口）
3. 启动 Cloudflare Tunnel
4. 获取公网链接并在终端显示

### 分步启动

```bash
# 终端 1：启动后端
npm run server

# 终端 2：启动前端
npm run dev:client

# 终端 3：启动 Cloudflare Tunnel
npm run start:tunnel
```

## 公网访问

启动成功后，终端会显示公网访问链接：
- 公网链接格式：`https://xxx.trycloudflare.com`
- 复制链接在浏览器或手机访问即可

## 响应式断点

| 屏幕宽度 | 适配策略 |
|----------|----------|
| > 768px | 桌面端布局 |
| 577px - 768px | 平板布局 |
| <= 576px | 手机端布局 |
| <= 375px | 超小屏幕优化 |

## 注意事项

1. **Cloudflare Tunnel 链接有效期**：公网链接仅在 cloudflared 运行期间有效，关闭后链接失效
2. **端口占用**：确保 3001 和 5173 端口未被占用
3. **防火墙**：确保本地防火墙允许 localhost 端口的访问

## 故障排查

### Cloudflare Tunnel 启动失败
- 检查 `cloudflared-windows-amd64.exe` 是否存在
- 检查端口 5173 是否被占用
- 检查网络连接是否正常

### 移动端显示异常
- 清除浏览器缓存
- 检查 CSS 是否正确加载
- 在不同设备上测试

## 后续优化建议

1. **PWA 支持**：添加 Service Worker，支持离线访问
2. **移动端原生应用**：使用 Capacitor 或 React Native 打包为原生应用
3. **WebSocket 实时通知**：实现实时任务执行状态推送
4. **生物识别登录**：支持指纹/面容 ID 登录
