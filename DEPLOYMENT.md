# Docker + GitHub Actions + SSH 自动部署说明

本文档说明如何将当前项目部署到一台云服务器，并通过 GitHub Actions 在测试通过后自动发布。

## 方案概览

当前仓库已经具备以下能力：

- `pull_request` 和 `push` 自动执行检查
- 前端和后端分别执行构建与测试
- 只有 `master` 分支推送时才会触发正式部署
- GitHub Actions 通过 SSH 连接云服务器
- 服务器使用 Docker Compose 启动前后端容器
- 发布完成后自动执行健康检查

核心文件：

- 工作流：[.github/workflows/ci-cd.yml](d:/feng/demoProject/todo-list/.github/workflows/ci-cd.yml)
- 生产编排：[docker-compose.prod.yml](d:/feng/demoProject/todo-list/docker-compose.prod.yml)
- 部署脚本：[scripts/deploy.sh](d:/feng/demoProject/todo-list/scripts/deploy.sh)
- 健康检查脚本：[scripts/healthcheck.sh](d:/feng/demoProject/todo-list/scripts/healthcheck.sh)
- 生产环境变量模板：[.env.production.example](d:/feng/demoProject/todo-list/.env.production.example)

## 发布流程

完整流程如下：

1. 开发代码并提交到 GitHub。
2. 创建 Pull Request。
3. GitHub Actions 自动执行前后端构建与测试。
4. PR 合并到 `master`。
5. GitHub Actions 通过 SSH 登录服务器。
6. 远程写入 `.env.production`。
7. 服务器拉取最新代码并执行 Docker Compose 更新。
8. 发布后执行健康检查，确认首页和 `/api/health` 可访问。

## 服务器架构

当前采用单机部署：

- `client` 容器：Nginx 托管前端静态资源
- `server` 容器：Fastify API 服务
- 前端容器对外暴露 `80` 端口
- 后端容器只在 Docker 内部网络中暴露
- 前端 Nginx 将 `/api` 和 `/uploads` 反向代理到后端

这样做的好处是：

- 浏览器只访问一个入口
- 不需要单独暴露后端公网端口
- 部署结构简单，适合个人项目和单机环境

## 服务器初始化

下面以常见的 Ubuntu 服务器为例。

### 1. 安装基础工具

```bash
sudo apt update
sudo apt install -y git curl ca-certificates
```

### 2. 安装 Docker

如果服务器还没有 Docker，可以使用官方安装方式，例如：

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker
```

安装完成后确认：

```bash
docker --version
docker compose version
```

### 3. 克隆项目

```bash
git clone <你的仓库地址> /opt/todo-list
cd /opt/todo-list
```

如果仓库是私有仓库，服务器必须能拉取该仓库。常见做法是：

- 给服务器配置 deploy key
- 或者配置有读取权限的 SSH key

### 4. 创建生产环境变量

可以先复制模板：

```bash
cp .env.production.example .env.production
```

然后按实际情况修改：

```env
APP_PORT=80
SERVER_PORT=3001
JWT_SECRET=替换成足够长的随机字符串
MAX_FILE_SIZE=10485760
```

### 5. 赋予脚本执行权限

```bash
chmod +x scripts/deploy.sh
chmod +x scripts/healthcheck.sh
```

### 6. 首次手动部署

首次建议在服务器本机手动执行一次，确认运行正常：

```bash
APP_DIR=/opt/todo-list bash scripts/deploy.sh
APP_DIR=/opt/todo-list bash scripts/healthcheck.sh
```

## GitHub Secrets 配置

在 GitHub 仓库 `Settings -> Secrets and variables -> Actions` 中新增以下 secrets：

- `SSH_HOST`：服务器 IP 或域名
- `SSH_PORT`：SSH 端口，通常为 `22`
- `SSH_USER`：部署用户
- `SSH_PRIVATE_KEY`：GitHub Actions 用于 SSH 登录服务器的私钥
- `SSH_APP_DIR`：服务器上的项目绝对路径，例如 `/opt/todo-list`
- `PROD_ENV_FILE`：完整的 `.env.production` 文件内容

`PROD_ENV_FILE` 示例：

```env
APP_PORT=80
SERVER_PORT=3001
JWT_SECRET=replace-with-a-long-random-secret
MAX_FILE_SIZE=10485760
```

## GitHub Actions 做了什么

工作流分为三段：

### 1. 前端检查

在 `client` 目录执行：

- `pnpm install --frozen-lockfile`
- `pnpm build`
- `pnpm test:run`

### 2. 后端检查

在 `server` 目录执行：

- `pnpm install --frozen-lockfile`
- `pnpm build`
- `pnpm test:run`

### 3. 正式部署

仅在以下条件满足时触发：

- 事件是 `push`
- 分支是 `master`
- 前后端检查全部通过

执行内容：

- 配置 SSH
- 将 `PROD_ENV_FILE` 写入服务器 `.env.production`
- 服务器拉取最新代码
- 执行 `scripts/deploy.sh`
- 执行 `scripts/healthcheck.sh`

## 容器与数据说明

生产环境的 Compose 文件会创建两个持久卷：

- `todo_data`：数据库文件
- `todo_uploads`：用户上传文件

因此即使容器重新构建，只要卷不删除，数据仍会保留。

## 发布后验证

可以在服务器上执行：

```bash
cd /opt/todo-list
docker compose --env-file .env.production -f docker-compose.prod.yml ps
APP_DIR=/opt/todo-list bash scripts/healthcheck.sh
```

也可以直接从外部访问：

- 首页：`http://你的域名或IP/`
- 健康检查：`http://你的域名或IP/api/health`

## 回滚建议

当前流程已经有“部署后健康检查”这一层保护，但如果你想回滚到旧版本，推荐按下面方式手动处理：

### 查看提交记录

```bash
cd /opt/todo-list
git log --oneline -n 10
```

### 切换到指定提交并重新部署

```bash
git checkout <commit-id>
APP_DIR=/opt/todo-list bash scripts/deploy.sh
APP_DIR=/opt/todo-list bash scripts/healthcheck.sh
```

确认无误后，如果要回到主分支继续正常发布：

```bash
git checkout master
git pull --ff-only origin master
```

如果你后面希望把回滚也做成自动化脚本，我可以继续帮你补。

## HTTPS 建议

当前 Compose 方案默认暴露 `80` 端口。如果你要上线正式域名，建议再加一层 HTTPS 入口，例如：

- Caddy
- Nginx
- 云厂商负载均衡 / CDN / 网关

这样可以把 TLS 终止放在最外层，应用层继续保持当前结构不变。

## 常见问题

### 1. GitHub Actions 能 SSH 上服务器，但拉不到仓库

说明服务器本机还没有配置拉取仓库的权限。需要给服务器单独配置可读该仓库的 SSH key。

### 2. 部署成功但页面打不开

优先检查：

- 服务器安全组是否放行 `80`
- 本机防火墙是否开放对应端口
- `docker compose ps` 中两个服务是否正常
- `scripts/healthcheck.sh` 是否通过

### 3. 图片上传后访问不到

优先检查：

- `todo_uploads` 卷是否存在
- 前端 Nginx 是否正确代理 `/uploads`
- 服务是否正常启动

### 4. 想更严格一些

后续可以继续补：

- ESLint 检查
- 覆盖率门槛
- E2E 测试
- 自动备份数据库
- 自动回滚策略
