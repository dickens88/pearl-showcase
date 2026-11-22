# 安澜・拾光 - 珍珠饰品展示网站 (Pearl Elegance Showcase)

一个优雅、高端的珍珠饰品品牌展示型网站（前台品牌名 Chronolume），支持中英双语、访客统计与 GDPR Cookie 同意。线上地址：**https://alsgvip.com**（`www.alsgvip.com` 同样可用）。

> **给后续开发者 / AI 的速览**
> - 整站运行在 **Cloudflare Workers 免费额度**上：一个 Worker 同时提供前端静态文件和 `/api/*`、`/uploads/*`。
> - 后端代码在 `worker/index.js`（Hono，纯 JS），数据库是 **D1**，图片在 **R2**。
> - `server/`（Flask）、`Dockerfile`、`docker-compose.yml`、`nginx.conf` 是**已废弃**的旧 VM 部署方式，仅作参考，不要再往里加功能。
> - 发布命令：`npm run deploy`。改了表结构要先加迁移文件再 `npm run db:migrate:remote`。
> - 本地在 Windows 上 `wrangler dev` 可能起不来，用 `npm run test:worker` 做接口回归测试（见下文）。

---

## 1. 线上架构

```
浏览器 ──► alsgvip.com / www.alsgvip.com（Workers 自定义域名，HTTPS 由 Cloudflare 提供）
              │
              ▼
        Worker: pearl-showcase  (worker/index.js)
          ├─ /api/*      → Hono 路由 → D1 (binding: DB)
          ├─ /uploads/*  → 从 R2 读取图片 (binding: BUCKET)
          └─ 其他路径     → 前端静态文件 dist/ (binding: ASSETS，SPA 回退到 index.html)
```

| 资源 | 名称 / 值 | 说明 |
|---|---|---|
| Worker | `pearl-showcase` | 配置见 `wrangler.jsonc`；`workers_dev` 已关闭，只通过自定义域名访问 |
| 自定义域名 | `alsgvip.com`、`www.alsgvip.com` | 在 `wrangler.jsonc` 的 `routes` 中声明（`custom_domain: true`），部署时自动创建 DNS 记录 |
| D1 数据库 | `pearl-showcase`（id 见 `wrangler.jsonc`） | 区域 EEUR（东欧），客户主要在欧洲 |
| R2 存储桶 | `pearl-showcase-uploads` | 位置提示 EEUR；对象键即文件名，如 `abc123.webp`、`thumb_abc123.webp` |
| Secret | `JWT_SECRET` | 签发后台登录 JWT 的密钥（随机长字符串） |
| Secret | `ADMIN_PASSWORD` | **仅在 `admins` 表为空时**用于创建 `admin` 账号；之后改密码请在后台操作 |
| DNS 托管 | Cloudflare（域名 `alsgvip.com` 所在 zone） | 另有一条遗留通配记录 `*.alsgvip.com → 34.63.163.247`（旧 VM，已不存在），不影响主站 |

免费额度（够展示站用）：Workers 每天 10 万次请求；D1 每天 500 万行读 / 10 万行写，5GB；R2 10GB 存储、每月 100 万次写操作 / 1000 万次读操作，出网流量免费。

### 历史背景
2026-11 之前网站部署在 Google Cloud VM（Docker + nginx + Flask + SQLite）。该 GCP 结算账号被关闭、VM 已被删除，**旧数据库与上传图片均已丢失**（它们被 `.gitignore` 排除，不在仓库里）。2026-11-22 迁移到 Cloudflare 后，内容需要在后台重新录入。

---

## 2. 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18 + Vite 5，React Router 6，i18next，原生 CSS 变量 |
| 后端 | Cloudflare Worker + [Hono](https://hono.dev) 4（`worker/index.js`） |
| 数据库 | Cloudflare D1（SQLite 方言），迁移在 `migrations/` |
| 文件存储 | Cloudflare R2 |
| 鉴权 | JWT（HS256，`hono/jwt`）：后台管理员 Token 12 小时；前台用户 Token（`/api/user/*`，带 `role=user`，有效期 30 天）不能访问任何后台接口；密码哈希 PBKDF2-SHA256（WebCrypto，20000 次迭代，格式 `pbkdf2_sha256$迭代次数$salt$hash`） |
| 图片处理 | **在浏览器端**完成（`src/utils/imageCompress.js`）：主图最长边 1200px、缩略图 400px，WebP（不支持时回退 JPEG） |
| 翻译 | Worker 调用 Google 翻译公开接口（`translate.googleapis.com`，中文 → 英文） |

---

## 3. 项目结构

```text
pearl-showcase/
├── worker/
│   └── index.js            # ★ 后端：全部 API、R2 图片读取、静态资源回退
├── migrations/
│   ├── 0001_init.sql       # ★ D1 表结构（与旧 Flask/SQLAlchemy 表完全一致）
│   └── 0002_users_favorites.sql # 前台用户 users 与收藏 favorites
├── scripts/
│   └── test-worker.mjs     # ★ 用 node:sqlite 模拟 D1/R2 的端到端接口测试
├── wrangler.jsonc          # ★ Cloudflare 配置（Worker、域名、D1、R2、静态资源）
├── src/                    # 前端
│   ├── pages/              # 前台页面：首页、画廊、品牌、知识、联系
│   ├── admin/              # 后台：登录、仪表板、饰品/图片/展廊/页面内容管理
│   ├── components/         # 导航、页脚、Cookie 横幅、语言切换
│   ├── locales/            # i18n 文案 (zh/en)
│   ├── styles/             # 样式
│   └── utils/
│       ├── api.js          # 前端 API 封装（统一 /api 前缀、401 自动跳登录）
│       └── imageCompress.js# 上传前的浏览器端压缩
├── public/                 # 静态资源（hero-bg.png、favicon）
├── vite.config.js          # 开发代理：/api 和 /uploads → http://localhost:8787 (wrangler dev)
├── package.json
├── server/  Dockerfile  docker-compose.yml  nginx.conf   # ⚠️ 已废弃的旧 VM 部署
└── .agent/workflows/deploy.md                          # AI 部署工作流（Cloudflare 版）
```

---

## 4. 部署

### 4.1 日常发布（已有环境）

```bash
npm install          # 首次或依赖变化时
npm run deploy       # = vite build && wrangler deploy
```

- 需要 wrangler 已登录项目所有者的 Cloudflare 账号（`npx wrangler whoami` 检查；未登录则 `npx wrangler login`，在浏览器里点 Allow）。
- 部署会同时上传前端 `dist/` 和 Worker 代码，并确保两个自定义域名指向该 Worker。Secret 不受部署影响。
- 发布后验证：
  ```bash
  curl https://alsgvip.com/api/health          # {"status":"ok",...}
  curl -I https://alsgvip.com/                 # 200 text/html
  curl https://alsgvip.com/api/admin/stats     # 401（未带 token，说明鉴权生效）
  ```

### 4.2 修改数据库结构

1. 在 `migrations/` 新增文件，如 `0002_add_xxx.sql`（**不要修改已应用过的迁移**）。
2. 同步更新 `worker/index.js` 中对应的 SQL 和 `xxxToDict` 函数。
3. `npm run test:worker` 通过后：
   ```bash
   npm run db:migrate:remote    # 应用到线上 D1
   npm run deploy
   ```
4. 直接查询线上数据：`npx wrangler d1 execute pearl-showcase --remote --command "SELECT COUNT(*) FROM jewelry"`

### 4.3 从零搭建（新账号 / 灾难恢复）

```bash
npm install
npx wrangler login
npx wrangler d1 create pearl-showcase --location eeur
#   → 把输出的 database_id 填进 wrangler.jsonc 的 d1_databases[0].database_id
#   R2 首次使用需先在 Cloudflare 后台「R2 对象存储」里开通订阅（$0，需账号有付款方式）
npx wrangler r2 bucket create pearl-showcase-uploads --location eeur
npm run db:migrate:remote
npx wrangler secret put JWT_SECRET         # 粘贴一串随机长字符串
npx wrangler secret put ADMIN_PASSWORD     # 后台初始密码（也可在后台 Worker → Settings → Variables and Secrets 添加）
npm run deploy
```

- 自定义域名由 `wrangler.jsonc` 的 `routes` 自动绑定；如果 DNS 里已有同名（`alsgvip.com` / `www`）的 A/AAAA/CNAME 记录会冲突，需先在 Cloudflare DNS 里删除。
- 首次在 `/admin/login` 用 `admin` + `ADMIN_PASSWORD` 登录时会自动创建管理员账号（任何一次登录请求都会触发，哪怕密码错误）。

### 4.4 Windows 上的已知坑（本项目开发机遇到过）

| 现象 | 原因 / 解决 |
|---|---|
| `npm install` 报 esbuild `install.js` 失败、`esbuild.exe ENOENT` | 项目路径太深，`node_modules\wrangler\node_modules\@esbuild\win32-x64\esbuild.exe` 超过 260 字符。把项目放到短路径（如 `C:\dev\pearl-showcase`）或开启 Windows 长路径支持 |
| `npx : 无法加载文件 ...npx.ps1，因为在此系统上禁止运行脚本` | PowerShell 执行策略限制。用 `npx.cmd ...` / `npm.cmd ...` 代替，或在 cmd 里运行 |
| `wrangler dev` / `d1 ... --local` 崩溃：`access violation` + `thread 'main' has overflowed its stack` | 本机 workerd 运行时不兼容（与代码无关，换 wrangler 版本无效）。改用 `npm run test:worker` 测接口，或直接部署到线上验证 |
| `wrangler login` 提示 `Failed to open` 浏览器 | 复制它输出的授权链接，到**同一台机器上**已登录 Cloudflare 的浏览器打开并点 Allow（回调地址是 `localhost:8976`，有超时，需尽快完成） |
| 不同终端里 wrangler 有的已登录有的没登录 | wrangler 的登录凭证存在 `%APPDATA%\xdg.config\.wrangler\config\default.toml`，不同进程环境可能读到不同位置。最稳妥是在同一个终端里 `login` 后再执行其他命令 |

---

## 5. 本地开发与测试

### 接口回归测试（推荐，任何系统都能跑）

```bash
npm run test:worker
```

`scripts/test-worker.mjs` 直接 `import` Worker，用 Node 内置的 `node:sqlite`（需 Node 22.5+）模拟 D1、内存 Map 模拟 R2，执行 `migrations/0001_init.sql` 后覆盖全部接口：登录/鉴权、饰品 CRUD 与分页、图片上传/读取/304/删除、展廊排序、页面内容、统计、修改密码等（约 45 项）。最后一项翻译会真实访问公网，只打印结果不计入失败。**修改 `worker/index.js` 后务必运行。**（Windows 上进程退出时可能多打印一行 libuv `Assertion failed`，可忽略，看 `ALL PASSED`。）

### 完整本地运行（workerd 可用的机器）

```bash
# 项目根目录创建 .dev.vars（已在 .gitignore 中）：
#   JWT_SECRET=local-dev-secret
#   ADMIN_PASSWORD=local-dev-password
npm run db:migrate:local
npm run worker:dev           # 构建前端并在 http://localhost:8787 运行完整站点
# 只改前端时可另开终端 npm run dev（5173 端口，/api 和 /uploads 代理到 8787）
```

---

## 6. API 一览

所有接口在 `worker/index.js`。🔒 = 需要 `Authorization: Bearer <token>`。

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/auth/login` | `{username, password}` → `{token, user}`；`admins` 表为空时先用 `ADMIN_PASSWORD` 建号 |
| POST 🔒 | `/api/auth/change-password` | `{oldPassword, newPassword}` |
| GET | `/api/jewelry` | 参数：`all=true`（含隐藏）、`featured`、`limit`、`page`（有 page 时返回 `{items,total,pages,page,per_page}`） |
| GET | `/api/jewelry/:id` | 含 `images` 数组 |
| POST / PUT / DELETE 🔒 | `/api/jewelry[/:id]` | 删除饰品时只解除图片关联，不删图片 |
| POST 🔒 | `/api/upload` | multipart：`images[]` 主图 + `thumbs[]` 对应缩略图（可为空 Blob），可选 `jewelry_id` |
| GET / PUT / DELETE 🔒 | `/api/images[/:id]` | 删除时同时删除 R2 中的主图和缩略图 |
| GET | `/api/gallery?visible=true` | 首页展廊（公开） |
| GET 🔒 | `/api/gallery/all` | |
| POST 🔒 | `/api/gallery/upload` | multipart：`image`、可选 `thumb`、`title`、`title_en`、`alt` |
| PUT / DELETE 🔒 | `/api/gallery/:id` | |
| POST 🔒 | `/api/gallery/reorder` | `{order: [{id, order_index}]}` |
| GET 🔒 | `/api/pages` | 所有页面原始记录 |
| GET | `/api/pages/:key` | 返回解析后的 JSON 内容（`home` / `about` / `contact` …） |
| PUT 🔒 | `/api/pages/:key` | `{content: "<JSON 字符串>"}`，不存在则创建 |
| GET 🔒 | `/api/admin/stats` | 饰品数、图片数、展示中数量 |
| POST | `/api/analytics/track` | `{path, visitor_id, referrer}`，记录 PV（IP 取 `CF-Connecting-IP`） |
| GET 🔒 | `/api/analytics/stats` | 今日/本周/本月/累计 PV、今日 UV、Top5 页面、近 7 天趋势（按 UTC 计算） |
| POST 🔒 | `/api/utils/translate` | `{text}` → `{translatedText}` |
| GET | `/api/health`、`/api/placeholder/:name` | 健康检查、SVG 占位图 |
| GET | `/uploads/<key>` | 从 R2 读取，支持 ETag / 304，长期缓存 |

### 数据表（`migrations/0001_init.sql`）
`admins`、`jewelry`、`images`（`jewelry_id` 可空）、`gallery_images`、`pages`（`page_key` 唯一，`content` 为 JSON 字符串）、`page_views`、`users`（前台用户，`email` 唯一）、`favorites`（`user_id`+`jewelry_id` 唯一；删除饰品时一并删除）。时间字段存 ISO 8601 UTC 字符串（如 `2026-11-22T09:51:59.667Z`）；布尔字段存 0/1，接口输出时转为 `true/false`。

---

## 7. 后台

- 地址：`https://alsgvip.com/admin/login`，用户名 `admin`。
- 密码由 `ADMIN_PASSWORD` 初始化，之后在后台「修改密码」里改（改 Secret 不会影响已存在的账号）。忘记密码时：`npx wrangler d1 execute pearl-showcase --remote --command "DELETE FROM admins"`，再用当前的 `ADMIN_PASSWORD` 登录即重新建号。
- 功能：仪表板（PV/UV、7 天趋势、热门页面）、饰品管理（排序/分类/推荐/显隐）、图片管理（多图上传、关联饰品、单图说明）、首页展廊、页面内容（首页 Banner、关于、联系方式等，中英双语，支持一键翻译）。

---

## 8. 待办 / 注意事项

- [ ] 线上内容为空，需在后台重新录入饰品、图片与页面文案（旧数据随 GCP VM 一起丢失）。
- [ ] `http://` 不会自动跳转 `https://`（旧 nginx 做过）。可在 Cloudflare → SSL/TLS → Edge Certificates 打开 “Always Use HTTPS”。
- [ ] DNS 里遗留的 `*.alsgvip.com → 34.63.163.247` 通配记录指向已删除的 VM，确认不用后可删除。
- [ ] 旧代码（`server/` 等）里曾硬编码默认密码和 JWT 密钥，已不再使用；如需彻底清理可删除这些旧文件。
- 不要把 `.dev.vars`、任何 Secret 值、Cloudflare API Token 提交到仓库（本仓库是公开的）。
