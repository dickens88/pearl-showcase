---
description: 自动部署到 GCP VM (Commit -> Push -> SSH -> Pull -> Docker Build)
---

## 🚀 自动化部署工作流

此工作流将自动执行：本地提交 -> 推送代码 -> SSH 登录服务器 -> 拉取最新代码 -> 重新构建并启动 Docker 容器。

### 📋 前置要求
1. **Git 配置**: 确保本地代码已关联远程仓库（当前为 `origin main`）。
2. **SSH 免密登录**: 确保已将本地公钥添加到 GCP VM 的 `~/.ssh/authorized_keys`。
3. **环境变量**: 为了方便使用，您可以将以下变量替换为实际值，或在运行脚本时手动修改。

---

### 第一步：提交本地更改并推送至仓库
// turbo
```powershell
git add .
git commit -m "Auto-deploy: update code"
git push origin main
```

### 第二步：远程服务器执行更新任务
// turbo
```powershell
# 自动部署到指定的 GCP 虚拟机
ssh -o StrictHostKeyChecking=no chenye8879@34.42.237.4 "cd /opt/pearl-showcase/ && git pull origin main && docker compose up -d --build"
```

---

### 💡 维护说明
- 如果 Docker 镜像构建缓慢，可以考虑在远程执行 `docker system prune -f` 清理缓存。
- 若部署失败，请检查远程服务器的 Git 是否有权限访问您的仓库（推荐使用 SSH Key 在服务器上访问 GitHub）。
- 如果您的 GCP VM 使用了非默认端口，请在 `ssh` 命令后添加 `-p <端口号>`。