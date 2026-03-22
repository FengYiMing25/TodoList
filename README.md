# TodoList 个人管理系统

一个功能丰富的个人管理应用，包含待办事项、记账、衣橱管理等功能。

## 功能模块

| 模块 | 功能描述 |
|------|----------|
| **待办清单** | 创建、管理待办事项，支持分类、标签、优先级 |
| **记账本** | 记录收支，支持分类统计和图表展示 |
| **衣橱管理** | 管理衣物，记录购买价格、状态，支持统计分析 |
| **数据字典** | 自定义分类和标签，灵活配置 |
| **用户系统** | 注册、登录、个人设置 |

## 技术栈

### 前端
- **框架**: React 18 + TypeScript
- **构建工具**: Vite 5
- **UI 组件**: Ant Design 5 + ProComponents
- **状态管理**: Zustand
- **路由**: React Router 6
- **图表**: ECharts 6
- **样式**: Less + CSS Modules

### 后端
- **框架**: Fastify 4
- **语言**: TypeScript
- **数据库**: SQLite (sql.js)
- **认证**: JWT
- **文件上传**: @fastify/multipart

## 项目结构

```
todoList/
├── client/                 # 前端项目
│   ├── src/
│   │   ├── components/    # 公共组件
│   │   ├── pages/         # 页面组件
│   │   ├── services/      # API 服务
│   │   ├── stores/        # 状态管理
│   │   └── styles/        # 全局样式
│   ├── Dockerfile         # 容器配置
│   └── nginx.conf         # Nginx 配置
├── server/                 # 后端项目
│   ├── src/
│   │   ├── controllers/   # 控制器
│   │   ├── routes/        # 路由
│   │   ├── middlewares/   # 中间件
│   │   └── database.ts    # 数据库配置
│   ├── Dockerfile         # 容器配置
│   └── .env.example       # 环境变量示例
├── shared/                 # 共享类型定义
│   └── types/
└── zeabur.yaml            # Zeabur 部署配置
```

## 本地开发

### 环境要求
- Node.js 18+
- pnpm

### 安装依赖

```bash
# 安装前端依赖
cd client
pnpm install

# 安装后端依赖
cd ../server
pnpm install
```

### 启动开发服务器

```bash
# 启动后端（端口 3001）
cd server
pnpm dev

# 启动前端（端口 8080）
cd client
pnpm dev
```

访问 http://localhost:8080

### 环境变量配置

后端需要创建 `.env` 文件：

```bash
cd server
cp .env.example .env
```

修改 `.env` 中的配置：
- `JWT_SECRET`: 设置一个安全的密钥
- `PORT`: 服务端口号（默认 3001）

## 部署

### 方式一：Zeabur 一键部署

1. 推送代码到 GitHub
2. 在 [Zeabur](https://zeabur.com) 创建项目
3. 添加 Git 服务，分别部署 `server` 和 `client` 目录
4. 配置环境变量和持久化存储

详细步骤见 [DEPLOY.md](./DEPLOY.md)

### 方式二：Docker 部署

```bash
# 构建后端镜像
cd server
docker build -t todo-server .

# 运行后端容器
docker run -p 3001:3001 \
  -e JWT_SECRET=your-secret-key \
  -v $(pwd)/data:/app/data \
  todo-server

# 构建前端镜像
cd ../client
docker build --build-arg VITE_API_URL=http://localhost:3001/api -t todo-client .

# 运行前端容器
docker run -p 80:80 todo-client
```

### 方式三：传统服务器部署

使用 PM2 + Nginx 部署，详细步骤见 [DEPLOY.md](./DEPLOY.md)

## 功能截图

*待添加*

## 开发计划

- [ ] 数据导入导出
- [ ] 多主题切换
- [ ] 移动端 App
- [ ] 数据同步备份

## 许可证

MIT License
