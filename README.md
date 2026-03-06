# 金蝶数据传输平台 (Feishu ERP Bridge)

> **让飞书与金蝶的数据同步，从 3 秒/条变成秒级批量处理**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0-brightgreen.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/docker-compose-%3E%3D2.0-blue.svg)](https://docs.docker.com/compose/)

---

## ⚠️ 为什么需要这个工具？

如果你正在使用**飞书集成工作流**同步数据到金蝶，是否遇到过这些问题：

| 痛点 | 飞书集成工作流 | 本平台 |
|------|---------------|--------|
| **执行速度** | 约 3 秒/条，百条数据需 5 分钟 | 秒级批量处理，效率提升 10 倍 + |
| **日志查看** | 日志分散，难以追溯 | 完整请求/响应日志，一目了然 |
| **功能覆盖** | 节点有限，缺少付款申请单等 | 支持金蝶全量 WebAPI |
| **开发效率** | 图形化编排复杂，调试困难 | JSON 模板配置，灵活高效 |
| **安全终止** | 可能在节点间停止，数据不一致 | 原子化执行，支持安全暂停 |
| **数据回传** | 配置复杂 | 一键开启，支持多选字段 |

---

## 🎯 产品亮点

### 性能与日志
- ⚡ **极速同步**：批量处理代替单条循环，百条数据分钟级完成
- 📋 **完整日志**：详细记录飞书数据、WebAPI 请求与响应，问题追溯零门槛

### 功能与易用
- 🔌 **全 API 支持**：覆盖金蝶云星空所有 WebAPI，包括付款申请单、客户、往来单位等
- 🎨 **灵活配置**：查询变量插入 WebAPI 请求，复制粘贴即可完成数据映射
- 📊 **双向同步**：支持数据回传，同步状态实时写入飞书

### 安全与效率
- 🔒 **账户隔离**：多账户独立存储，数据互不可见
- 🚦 **原子执行**：任务暂停不会在节点间停止，保证数据准确性
- 📱 **移动办公**：Cloudflare Tunnel 支持，随时随地查看任务状态

---

## 🏗️ 架构与流程

### 系统架构

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
                                                │
                        ┌───────────────────────┼───────────────────────┐
                        ▼                       ▼                       ▼
                ┌──────────────┐        ┌──────────────┐        ┌──────────────┐
                │  飞书多维表    │        │  金蝶云星空   │        │  本地文件存储 │
                └──────────────┘        └──────────────┘        └──────────────┘
```

### 任务执行流程

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  从飞书读取  │───▶│  数据格式化  │───▶│  发送到金蝶  │───▶│  状态回写   │
│  多维表数据  │    │  变量替换   │    │  API 调用    │    │  到飞书     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 19 + TypeScript + Ant Design 6 + Vite |
| 后端 | Node.js + Express + JWT + bcrypt |
| 数据存储 | 本地 JSON 文件（按账户隔离） |
| 公网访问 | Cloudflare Tunnel |

---

## ⚡ 快速开始

### 部署方式对比

| 方式 | 适用场景 | 难度 |
|------|---------|------|
| 一键部署脚本 | 本地开发/测试 | ⭐ |
| Docker 部署 | 生产环境 | ⭐⭐ |
| 手动部署 | 自定义配置 | ⭐⭐⭐ |

---

### 方式一：一键部署脚本（推荐新手）

**Windows 用户**：

1. 双击运行 `deploy.bat`
2. 等待依赖安装完成
3. 启动服务：`npm run start:all`

**macOS / Linux 用户**：

```bash
chmod +x deploy.sh
./deploy.sh
npm run start:all
```

---

### 方式二：Docker 部署（生产环境推荐）

```bash
# 1. 克隆仓库
git clone https://github.com/keyupan91-cpu/Feishu-erp-bridge.git
cd Feishu-erp-bridge

# 2. 构建并启动
docker-compose up -d --build

# 3. 查看状态
docker-compose ps

# 4. 访问应用
http://localhost:5173

# 5. 停止服务
docker-compose down
```

**数据持久化**：已配置 `./server/data` 和 `./logs` 两个数据卷。

---

### 方式三：手动部署

```bash
# 1. 克隆项目
git clone https://github.com/keyupan91-cpu/Feishu-erp-bridge.git
cd Feishu-erp-bridge

# 2. 安装依赖
npm install

# 3. 启动服务
npm run dev          # 开发模式
npm run start:all    # 生产模式（含 Cloudflare Tunnel）
```

启动成功后访问：`http://localhost:5173`

---

## 🔧 配置指南（5 分钟完成）

### 第一步：注册账户

访问应用页面，输入用户名（至少 6 位）和密码完成注册。

---

### 第二步：配置飞书（2 分钟）

1. **创建应用**：登录 [飞书开放平台](https://open.feishu.cn/) → 企业自建应用 → 创建应用
2. **获取凭证**：在应用详情页获取 App ID 和 App Secret
3. **配置权限**：添加「多维表读取」和「多维表写入」权限
4. **获取表信息**：从多维表 URL 获取 App Token 和 Table ID

```
https://xxx.feishu.cn/base/bascnXXXXXXXXXXXXX?table=tblXXXXXXXXXXXXX
                                    └─ App Token          └─ Table ID
```

---

### 第三步：配置金蝶（2 分钟）

| 参数 | 说明 | 示例 |
|------|------|------|
| 服务器地址 | 金蝶云星空 API 地址 | `http://xxx.xxx.com:8000` |
| 用户名 | 登录用户名 | `admin` |
| 密码 | 登录密码 | `******` |
| 账套 ID | 组织机构编号 | `100001` |

**获取帮助**：

- 在金蝶云星空管理员账户搜索 WebAPI 可查看文档和示例
- 使用数据回传功能可帮助找到对应参数名

**测试连接**：配置完成后点击「测试连接」按钮确认配置正确。

---

### 第四步：创建并测试任务（1 分钟）

1. 点击「新建任务」
2. 配置飞书字段映射和金蝶数据模板
3. 点击「测试」按钮验证完整流程

**数据模板示例**：

```json
{
  "Model": {
    "FDATE": "{{date}}",
    "FREMARK": "{{remark}}",
    "FPAYORGID": { "FNumber": "{{companyCode}}" }
  }
}
```

使用 `{{变量名}}` 格式引用飞书字段。

---

## 💡 最佳实践

### 筛选 + 回传配置技巧

**推荐配置**：开启「筛选字段 A 为空」+ 回传「字段 A」

**效果**：
- ✅ 避免重复同步：已同步的记录会被标记，下次执行自动跳过
- ✅ 安全暂停：任务暂停后不会重复获取已处理的数据
- ✅ 问题追溯：同步状态和错误信息清晰记录

**操作步骤**：

1. 在飞书多维表中添加「同步状态」字段（单选或文本）
2. 配置任务时开启「筛选」，选择「同步状态 为空」
3. 开启「回传数据」，选择「同步状态」字段
4. 执行任务，同步成功后状态自动写入

---

### 多任务并行建议

- 不同类型的单据（如付款申请单、采购订单）建议分任务配置
- 大数据量任务建议分批次执行，避免单次处理过多记录
- 可在「任务管理」页面启用/禁用任务，灵活控制执行计划

---

## 🌐 公网访问（可选）

使用 Cloudflare Tunnel 可将本地服务安全暴露到公网，支持移动端访问。

### 快速配置

**Windows 用户**：

```powershell
Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile "cloudflared-windows-amd64.exe"
```

**macOS 用户**：

```bash
brew install cloudflared
```

**Linux 用户**：

```bash
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -O cloudflared
chmod +x cloudflared
```

### 启动 Tunnel

```bash
npm run start:all
```

启动成功后会显示公网 URL：`https://xxx.trycloudflare.com`

**注意**：此为临时 Tunnel，关闭后 URL 失效。生产环境建议配置持久 Tunnel。

---

## ❓ 常见问题

### 飞书连接失败

| 错误码 | 原因 | 解决方案 |
|--------|------|---------|
| 99991014 | 应用权限不足 | 检查是否已添加多维表读取/写入权限 |
| 99991020 | 多维表不存在 | 检查 App Token 和 Table ID 是否正确 |

### 金蝶连接失败

- 检查服务器地址格式（必须包含端口号）
- 确认用户名、密码、账套 ID 正确
- 使用金蝶 WebAPI 调试工具测试登录

### 数据同步失败

| 错误 | 原因 | 解决方案 |
|------|------|---------|
| 往来单位不存在 | 金蝶中无该单位 | 在金蝶中先创建往来单位 |
| 单据类型错误 | 单据类型编号不正确 | 检查数据模板配置 |
| 字段格式不匹配 | 数据类型不符 | 检查字段参数配置 |

### Cloudflare Tunnel 启动失败

1. 检查 `cloudflared-windows-amd64.exe` 是否存在
2. 检查端口 5173 是否被占用
3. 检查网络连接是否正常

---

## 🔗 相关链接

- [GitHub 仓库](https://github.com/keyupan91-cpu/Feishu-erp-bridge)
- [飞书开放平台](https://open.feishu.cn/)
- [金蝶云星空开发文档](https://developer.kingdee.com/)
- [Cloudflare 官方文档](https://developers.cloudflare.com/cloudflare-one/)

---

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件
