# keyupan.cn 长期运维手册（ECS + Docker + Caddy）

> 更新时间：2026-03-27（Asia/Shanghai）  
> 适用范围：`keyupan.cn` / `www.keyupan.cn` / `erp.keyupan.cn`

## 1. 当前线上架构（已落地）

请求链路：

`浏览器 -> 阿里云DNS -> ECS(39.108.216.72:80/443) -> Caddy容器 -> keyupan-coze容器(18080) -> Vite中间层 -> Coze API + 本地聊天存储`

`浏览器 -> 阿里云DNS -> ECS(39.108.216.72:80/443) -> Caddy容器 -> keyupan-erp容器(18081) -> Feishu-ERP-Bridge 前后端`

当前运行容器：

- `keyupan-caddy`：处理 `80/443`、HTTPS 证书自动签发与续期、反向代理
- `keyupan-coze`：业务前端服务（容器内监听 `18080`，仅内网给 Caddy 转发）
- `keyupan-erp`：飞书-金蝶同步服务（容器内监听 `18081`，仅内网给 Caddy 转发）

当前关键文件路径（服务器）：

- 应用目录：`/opt/keyupan-coze`
- 聊天本地数据：`/opt/keyupan-coze/.local/local-chat-db.json`
- ERP 项目目录：`/opt/feishu-erp-bridge`
- ERP 数据目录：`/opt/feishu-erp-bridge/server/data`
- Caddy 配置：`/opt/keyupan-caddy/Caddyfile`
- Caddy 证书数据：`/opt/keyupan-caddy/data`

当前 Caddy 配置：

```caddyfile
keyupan.cn, www.keyupan.cn {
  encode zstd gzip
  reverse_proxy keyupan-coze:18080
}

erp.keyupan.cn {
  encode zstd gzip
  reverse_proxy keyupan-erp:18081
}
```

## 2. 域名与 DNS（阿里云）

建议至少保留以下记录：

- `@` -> `A` -> `39.108.216.72`
- `www` -> `CNAME` -> `keyupan.cn`

说明：

- TTL 选你控制台可设置的最大值（你当前是 `59分钟`，可用）
- 如果改了 DNS，通常几分钟到 30 分钟生效

验证命令（本机 PowerShell）：

```powershell
Resolve-DnsName keyupan.cn
Resolve-DnsName www.keyupan.cn
```

## 3. 如何连接服务器（长期使用）

## 3.0 登录凭据（仅本地留存，勿外传）

| 项目 | 值 |
|------|-----|
| 服务器 IP | `39.108.216.72` |
| 用户名 | `root` |
| 密码 | `17779827035Pky!` |

> ⚠️ 当前为密码登录，建议后续改为 SSH 密钥登录（见 3.2）并轮换密码。

## 3.1 PowerShell（推荐）

```powershell
ssh root@39.108.216.72
```

首次会提示确认主机指纹，输入 `yes`。

## 3.2 建议改为 SSH 密钥登录（强烈推荐）

当前你是密码登录。长期建议：

1. 本机生成密钥  
2. 把公钥放到服务器 `~/.ssh/authorized_keys`  
3. 验证密钥登录成功后，关闭密码登录（`sshd_config`）

这样安全性和稳定性都更高。

## 4. 线上状态巡检（每天/每次更新后）

登录服务器后执行：

```bash
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Ports}}\t{{.Status}}"
ss -lntup
```

期望结果：

- 公网只需要 `22/80/443`
- `keyupan-caddy`、`keyupan-coze`、`keyupan-erp` 都是 `Up`

外网验证（本机）：

```powershell
curl.exe -I https://keyupan.cn
curl.exe -I https://www.keyupan.cn
curl.exe https://keyupan.cn/api/local-db/health
curl.exe https://erp.keyupan.cn/api/public/task-trigger/invalidtoken
```

## 5. 发布新版本（标准流程）

以下为你当前项目的标准发布方式。

## 5.1 本地打包（Windows）

在项目目录 `D:\签约进阶版\签约进阶版\coze-chat-react` 下：

```powershell
npm run lint
npm run build
tar -czf .deploy-package.tar.gz --exclude=.git --exclude=node_modules --exclude=dist --exclude=.local .
```

## 5.2 上传并替换（服务器）

思路：上传压缩包 -> 覆盖 `/opt/keyupan-coze` -> 重启业务容器。

示例（你可用 scp/sftp 任一方式）：

```powershell
scp .deploy-package.tar.gz root@39.108.216.72:/tmp/keyupan-deploy.tar.gz
```

服务器执行：

```bash
rm -rf /opt/keyupan-coze/*
tar -xzf /tmp/keyupan-deploy.tar.gz -C /opt/keyupan-coze
docker restart keyupan-coze
```

发布后验证：

```bash
docker logs --tail 80 keyupan-coze
curl -I https://keyupan.cn
curl -I https://www.keyupan.cn
curl https://keyupan.cn/api/local-db/health
```

## 5.3 ERP 项目无损发布（不覆盖业务数据）

适用目录：`/opt/feishu-erp-bridge`  
核心原则：仅覆盖代码文件，不删除 `server/data`。

推荐步骤：

```bash
# 1) 先做线上代码备份（仅代码，便于回滚）
mkdir -p /opt/feishu-erp-bridge/.deploy-backup/$(date +%Y%m%d-%H%M%S)

# 2) 上传仅包含代码文件的发布包到 /tmp
# 3) 解压覆盖到项目目录（不要执行 rm -rf /opt/feishu-erp-bridge/server/data）
tar -xzf /tmp/your-erp-deploy.tar.gz -C /opt/feishu-erp-bridge

# 4) 重启 ERP 容器
docker restart keyupan-erp
```

发布后验证：

```bash
docker ps --filter name=keyupan-erp
curl -sS https://erp.keyupan.cn/api/public/task-trigger/invalidtoken
```

## 5.4 当前可回滚备份点（已确认）

- 备份路径：`/opt/feishu-erp-bridge/.deploy-backup/20260327-165257`
- 说明：该目录为本次 ERP 上线前保留的代码快照，可用于快速回滚。

快速回滚示例：

```bash
# 按需恢复对应文件（示例）
cp -a /opt/feishu-erp-bridge/.deploy-backup/20260327-165257/server/server.js /opt/feishu-erp-bridge/server/server.js
cp -a /opt/feishu-erp-bridge/.deploy-backup/20260327-165257/src/App.tsx /opt/feishu-erp-bridge/src/App.tsx

# 重启 ERP 服务
docker restart keyupan-erp
```

## 6. 日常运维命令

查看容器：

```bash
docker ps
```

查看应用日志：

```bash
docker logs -f keyupan-coze
docker logs -f keyupan-erp
```

查看网关/证书日志：

```bash
docker logs -f keyupan-caddy
```

重启服务：

```bash
docker restart keyupan-coze keyupan-caddy
docker restart keyupan-erp
```

仅重启应用：

```bash
docker restart keyupan-coze
docker restart keyupan-erp
```

## 7. 数据位置、备份与清理

聊天数据文件：

`/opt/keyupan-coze/.local/local-chat-db.json`

## 7.1 备份

```bash
mkdir -p /opt/keyupan-backup
cp /opt/keyupan-coze/.local/local-chat-db.json /opt/keyupan-backup/local-chat-db-$(date +%F-%H%M%S).json
```

## 7.2 恢复

```bash
cp /opt/keyupan-backup/你的备份文件.json /opt/keyupan-coze/.local/local-chat-db.json
docker restart keyupan-coze
```

## 7.3 全量清空聊天记录（谨慎）

```bash
rm -f /opt/keyupan-coze/.local/local-chat-db.json
docker restart keyupan-coze
```

## 7.4 ERP 数据保护说明（务必遵守）

- ERP 业务数据目录：`/opt/feishu-erp-bridge/server/data`
- 发布代码时禁止删除该目录。
- 如需迁移或备份，请先执行：

```bash
mkdir -p /opt/keyupan-backup
cp -a /opt/feishu-erp-bridge/server/data /opt/keyupan-backup/erp-data-$(date +%F-%H%M%S)
```

## 8. 证书与 HTTPS 说明

当前使用 Caddy 自动管理证书：

- 自动申请 Let’s Encrypt
- 自动续期
- 自动 HTTP -> HTTPS 跳转

如果新加子域名（例如 `api.keyupan.cn`）：

1. 先在阿里云 DNS 加记录  
2. 再把新域名写入 `/opt/keyupan-caddy/Caddyfile`  
3. `docker restart keyupan-caddy`  
4. 看 `docker logs -f keyupan-caddy` 是否签发成功

## 9. 故障排查速查

## 9.1 域名打不开

先查 DNS：

```powershell
Resolve-DnsName keyupan.cn
Resolve-DnsName www.keyupan.cn
```

再查服务器：

```bash
docker ps
ss -lntup
```

## 9.2 HTTPS 异常

```bash
docker logs --tail 200 keyupan-caddy
```

重点看是否有：

- ACME challenge 失败
- 443 被占用
- 域名未解析到当前 ECS

## 9.3 前端可打开但接口异常

```bash
curl -sS https://keyupan.cn/api/local-db/health
docker logs --tail 120 keyupan-coze
curl -sS https://erp.keyupan.cn/api/public/task-trigger/invalidtoken
docker logs --tail 120 keyupan-erp
```

## 10. 安全建议（务必执行）

1. 立刻把当前 root 密码做一次轮换  
2. 改为 SSH 密钥登录，禁用密码登录  
3. 保持仅开放 `22/80/443`  
4. 定期备份 `/opt/keyupan-coze/.local/local-chat-db.json`、`/opt/feishu-erp-bridge/server/data` 与 `/opt/keyupan-caddy/data`

---

## 附录：当前“只保留本项目运行”的目标状态

`docker ps` 只应看到：

- `keyupan-caddy`
- `keyupan-coze`
- `keyupan-erp`

端口目标：

- 开：`22`, `80`, `443`
- 关：其他业务端口（如 `8000`, `18080`, `3000`, `8080` 等公网暴露端口）

## 9. 2026-03-28 ERP OCR 上云补充留痕

本次 ERP 同步到阿里云时，除了前后端代码更新，还补齐了云端 OCR 运行链路：

- 新增 OCR 独立容器：`keyupan-erp-ocr`
- `keyupan-erp` 通过 `OCR_BASE_URL=http://keyupan-erp-ocr:5000` 访问 OCR 服务
- `keyupan-erp` 通过 `OCR_MANAGE_MODE=docker` 与 `OCR_CONTAINER_NAME=keyupan-erp-ocr` 管理 OCR 启停
- `keyupan-erp` 需要额外挂载：`/var/run/docker.sock:/var/run/docker.sock`
- OCR 识别接口继续保持：`/api/extract`、`/api/extract-batch`
- OCR 管理接口继续保持：`/api/ocr/service/status`、`/api/ocr/service/start`、`/api/ocr/service/stop`

本次同步的保护原则：

- 只覆盖 `/opt/feishu-erp-bridge` 下的代码文件
- 不删除、不覆盖 `/opt/feishu-erp-bridge/server/data`
- 发布后同时检查 `keyupan-erp` 与 `keyupan-erp-ocr` 的运行状态
- 若需回滚，优先使用 `/opt/feishu-erp-bridge/.deploy-backup/` 下的代码快照
## 9.1 2026-03-29 ERP OCR 公网切换完成记录

本次实际完成项：

- 已在阿里云 ECS 构建并上线独立 OCR 容器：`keyupan-erp-ocr`
- 已重建主容器 `keyupan-erp`，新增：
  - `OCR_BASE_URL=http://keyupan-erp-ocr:5000`
  - `OCR_MANAGE_MODE=docker`
  - `OCR_CONTAINER_NAME=keyupan-erp-ocr`
  - `/var/run/docker.sock:/var/run/docker.sock`
- 前端 OCR 页面已随主项目一起同步到公网域名 `https://erp.keyupan.cn`
- `POST /api/extract` 与 `POST /api/extract-batch` 已通过主域名对外可用
- OCR 启停接口已验证可正常控制容器，停机时保持低功耗，不影响主系统性能

部署过程中额外修复：

- 使用阿里云 apt / pip 镜像源，解决 OCR 镜像在 ECS 上依赖下载过慢的问题
- 为 OpenCV 增补 `libgl1`，修复 `libGL.so.1` 缺失导致的 OCR 运行失败
- 修复 OCR 子进程 JSON 管道被 Paddle 下载进度条污染的问题
- 修复 `/api/ocr/service/start` 与 `/api/ocr/service/stop` 返回体中的地址，统一改为公网域名

验收结果：

- 图片样本 `img_v3_02ts_e14ebc9a-7df6-458b-b88d-4d0f7261d84g.jpg` 返回 `无发票号码`
- PDF 样本 `深圳市萍湘餐饮有限公司_发票金额1322.50元.pdf` 返回发票号码 `26952000000276075601`
- 非图片/PDF 上传返回 `文件格式不对，仅支持 PDF 和图片`

数据保护确认：

- 未删除、未覆盖 `/opt/feishu-erp-bridge/server/data`
- 账户信息与业务数据目录未动，仅更新代码、镜像与容器运行配置
