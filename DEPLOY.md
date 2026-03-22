# Zeabur 部署指南

## 前置准备

1. 注册 [Zeabur](https://zeabur.com) 账号（推荐使用 GitHub 登录）
2. 确保项目已推送到 GitHub

## 部署步骤

### 1. 推送代码到 GitHub

```bash
# 在项目根目录执行
git init
git add .
git commit -m "准备部署"
git branch -M main
git remote add origin https://github.com/你的用户名/todoList.git
git push -u origin main
```

### 2. 在 Zeabur 创建项目

1. 登录 [Zeabur Dashboard](https://dash.zeabur.com)
2. 点击 **Create Project** 创建新项目
3. 选择一个区域（推荐选择离你最近的区域）

### 3. 部署后端服务

1. 在项目中点击 **Add Service** → **Git**
2. 选择你的 GitHub 仓库
3. Zeabur 会自动检测到 `server` 目录的 Dockerfile
4. 选择 `server` 目录进行部署

#### 配置环境变量

在服务设置中添加以下环境变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `NODE_ENV` | `production` | 生产环境 |
| `JWT_SECRET` | 随机字符串 | JWT 密钥，建议使用 32 位以上随机字符串 |
| `JWT_EXPIRES_IN` | `7d` | Token 有效期 |

#### 添加持久化存储

**重要：** SQLite 数据库和上传的文件需要持久化存储，否则重启后数据会丢失。

1. 进入后端服务详情页
2. 点击 **Volumes** 标签
3. 添加两个存储卷：
   - `/app/data` - 存储数据库文件
   - `/app/uploads` - 存储上传的文件

### 4. 部署前端服务

1. 点击 **Add Service** → **Git**
2. 选择同一个仓库
3. 选择 `client` 目录进行部署

#### 配置环境变量

| 变量名 | 值 |
|--------|-----|
| `VITE_API_URL` | `https://你的后端域名.zeabur.app/api` |

或者使用 Zeabur 的变量引用：
```
${todo-server.URL}/api
```

### 5. 配置域名（可选）

1. 在服务详情页点击 **Domains**
2. 可以使用 Zeabur 提供的免费域名，或绑定自定义域名

## 项目结构

```
todoList/
├── client/                 # 前端
│   ├── Dockerfile         # 前端容器配置
│   ├── nginx.conf         # Nginx 配置
│   └── .dockerignore
├── server/                 # 后端
│   ├── Dockerfile         # 后端容器配置
│   └── .dockerignore
└── zeabur.yaml            # Zeabur 部署配置
```

## 环境变量说明

### 后端

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `PORT` | `3001` | 服务端口 |
| `NODE_ENV` | `development` | 环境 |
| `JWT_SECRET` | - | JWT 密钥（**必须修改**） |
| `JWT_EXPIRES_IN` | `7d` | Token 有效期 |
| `DATA_DIR` | `./data` | 数据库存储目录 |
| `UPLOAD_DIR` | `uploads` | 文件上传目录 |
| `MAX_FILE_SIZE` | `10485760` | 最大文件大小（10MB） |

### 前端

| 变量名 | 说明 |
|--------|------|
| `VITE_API_URL` | 后端 API 地址 |

## 常见问题

### Q: 数据会丢失吗？

A: 只要正确配置了持久化存储（Volumes），数据不会丢失。请确保：
- `/app/data` 目录已挂载存储卷
- `/app/uploads` 目录已挂载存储卷

### Q: 如何查看日志？

A: 在 Zeabur 服务详情页点击 **Logs** 标签即可查看实时日志。

### Q: 如何更新部署？

A: 推送新的代码到 GitHub 后，Zeabur 会自动重新部署。

### Q: 部署失败怎么办？

A: 
1. 查看构建日志定位错误
2. 确认 `pnpm-lock.yaml` 文件存在
3. 检查环境变量是否正确配置

## 本地测试 Docker 构建

```bash
# 构建后端镜像
cd server
docker build -t todo-server .

# 运行后端容器
docker run -p 3001:3001 \
  -e NODE_ENV=production \
  -e JWT_SECRET=your-secret-key \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/uploads:/app/uploads \
  todo-server

# 构建前端镜像
cd ../client
docker build --build-arg VITE_API_URL=http://localhost:3001/api -t todo-client .

# 运行前端容器
docker run -p 80:80 todo-client
```
