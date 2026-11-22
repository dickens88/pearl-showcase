---
description: 部署到 Cloudflare Workers（测试 -> 构建 -> wrangler deploy -> 线上验证）
---

## 🚀 部署工作流（Cloudflare Workers）

网站运行在 Cloudflare Worker `pearl-showcase` 上（前端静态文件 + API + R2 图片），域名 `alsgvip.com` / `www.alsgvip.com`。
完整说明见 README「4. 部署」。旧的 GCP VM / Docker / SSH 部署已废弃，**不要再使用**。

### 前置检查
// turbo
```powershell
npx.cmd wrangler whoami
```
未登录时运行 `npx.cmd wrangler login`，让用户在浏览器里点 Allow（不能代替用户授权）。

### 第一步：接口回归测试
// turbo
```powershell
npm.cmd run test:worker
```
必须看到 `ALL PASSED`（Windows 上末尾的 libuv `Assertion failed` 可忽略）。

### 第二步：如有新的数据库迁移，先应用到线上 D1
```powershell
npm.cmd run db:migrate:remote
```

### 第三步：构建并部署
// turbo
```powershell
npm.cmd run deploy
```

### 第四步：线上验证
// turbo
```powershell
curl.exe -s https://alsgvip.com/api/health
curl.exe -s -o NUL -w "%{http_code}\n" https://alsgvip.com/
curl.exe -s -o NUL -w "%{http_code}\n" https://alsgvip.com/api/admin/stats
```
期望：health 返回 `{"status":"ok",...}`，首页 `200`，未鉴权的 stats 接口 `401`。

### 第五步：提交代码
```powershell
git add .
git commit -m "<描述本次改动>"
git push origin main
```

---

### 💡 维护说明
- Secret（`JWT_SECRET`、`ADMIN_PASSWORD`）不会被部署覆盖；查看：`npx.cmd wrangler secret list`（不会显示值）。
- 查看线上日志：`npx.cmd wrangler tail`，或 Cloudflare 后台 Workers → pearl-showcase → Observability。
- 回滚：`npx.cmd wrangler rollback`（回到上一个版本；数据库迁移不会回滚）。
- 若 `npm install` 失败（esbuild ENOENT），是 Windows 路径过长，把项目移到短路径再装。
