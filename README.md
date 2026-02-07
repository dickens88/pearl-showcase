# 安澜・拾光 - 珍珠饰品展示网站 (Pearl Elegance Showcase)

一个优雅、高端的珍珠饰品品牌展示型网站。采用现代 Web 开发技术，致力于提供极致的视觉美感与流畅的内容管理体验。网站已支持中英双语切换，并集成了访客统计与 GDPR 合规功能。

## 🎨 核心特点

- **艺术感视觉设计**：采用极简留白风格，配色灵感源自珍珠白与香槟金，专为珠宝展示定制。
- **🌍 国际化 (i18n)**：全站支持中英双语切换，适配全球化展示需求。
- **📊 实时访问分析**：内置数据埋点，后台可直观查看每日 PV/UV、热门页面排行及 7 天访问趋势图。
- **�️ GDPR 合规**：集成优雅的 Cookie 同意横幅，在尊重用户隐私的前提下收集统计数据。
- **📱 全平台适配**：针对手机、平板、桌面端进行深度优化，确保在任何屏幕上都表现完美。
- **� 全面内容管理**：后台可配置饰品详情、多图素材、页面静态方案以及联系方式（邮箱/电话/地址）。

## 🛠️ 技术栈

### 前端 (Frontend)
- **核心框架**: React 18 + Vite 5
- **路由管理**: React Router 6
- **多语言**: i18next + react-i18next
- **样式方案**: Vanilla CSS (原生变量系统 + 弹性布局)
- **API 通信**: Fetch API + 统一拦截封装

### 后端 (Backend)
- **Web 框架**: Python Flask
- **数据库**: SQLite + SQLAlchemy ORM
- **身份认证**: JWT (JSON Web Tokens)
- **图片处理**: Pillow

## 🚀 快速开始

### 环境要求
- Node.js 18+
- Python 3.9+

### 安装与运行

1. **克隆项目并安装依赖**
   ```bash
   # 安装前端依赖
   npm install

   # 安装后端依赖
   cd server
   pip install -r requirements.txt
   ```

2. **启动开发环境**
   > 如果在powershell 里执行，要先切到CMD，输入`cmd`
   - **后端 (Terminal 1)**: `cd server && python app.py` (运行在 http://localhost:5000)
   - **前端 (Terminal 2)**: `cd src && npm run dev` (默认运行在 http://localhost:5173)

### 管理后台
- **登录地址**: `http://localhost:5173/admin/login`
- **默认账号**: `admin`
- **默认密码**: `pearl2024`

## 📁 项目结构

```text
pearl-jewelry-showcase/
├── src/                    # 前端源代码
│   ├── components/         # 悬浮横幅 (CookieConsent), 导航页脚等
│   ├── pages/              # 业务页面 (首页, 画廊, 品牌故事, 关于等)
│   ├── admin/              # 管理后台 (仪表板, 内容编辑, 饰品管理)
│   ├── locales/            # i18n 翻译文件 (zh/en)
│   ├── styles/             # 设计系统与样式
│   └── utils/              # API 封装与工具类
├── server/                 # 后端源码
│   ├── routes/             # 拆分的 API 路由 (饰品, 统计, 页面, 图片)
│   ├── models.py           # 数据库模型
│   └── uploads/            # 图片及附件存储
├── package.json            # 前端依赖配置
└── vite.config.js          # Vite 配置文件
```

## 🔒 后台功能概览

1. **仪表板 (Data Dashboard)**：
   - 基础统计：饰品总数、展示中数量、图片总数。
   - 流量统计：今日/周/月/累计 PV/UV。
   - 数据图表：最近 7 天访问趋势。
   - 页面排行：Top 5 热门浏览页面。
2. **饰品管理**：完整的 CRUD 流程，支持排序、分类、置顶。
3. **内容管理**：动态编辑首页 Banner、关于我们、品牌历程及实时同步的联系信息。
4. **图片系统**：支持珠宝多图上传、预览及关联管理。

