# TodoList 个人管理系统

一个前后端分离的个人管理系统，围绕“待办 + 记账 + 电子衣橱 + 分类字典 + 用户设置”这几个核心能力展开，适合个人自用，也适合作为中小型全栈练手项目。

## 功能模块

| 模块 | 说明 |
| --- | --- |
| 待办清单 | 支持待办事项的增删改查、状态切换、优先级、分类、标签、截止日期 |
| 记账本 | 支持收入/支出记录、分类统计、趋势图展示 |
| 电子衣橱 | 支持物品录入、图片上传、出库、使用时长与价值统计 |
| 数据字典 | 支持统一维护待办分类、标签、记账分类、衣橱分类 |
| 用户系统 | 支持注册、登录、个人资料和头像设置 |
| 仪表盘 | 聚合展示待办、记账、衣橱的核心统计数据 |

## 技术栈

### 前端

- React 18
- TypeScript
- Vite 5
- Ant Design / ProComponents
- Zustand
- React Router 6
- ECharts 6
- Less + CSS Modules
- Vitest

### 后端

- Fastify 4
- TypeScript
- SQLite（通过 `sql.js` 使用）
- JWT 鉴权
- `@fastify/multipart` 文件上传
- Vitest

## 项目结构

```text
todo-list/
├─ client/                    # 前端项目
│  ├─ src/
│  │  ├─ components/          # 公共组件
│  │  ├─ hooks/               # 自定义 Hook
│  │  ├─ pages/               # 页面
│  │  ├─ services/            # API 请求层
│  │  ├─ stores/              # Zustand 状态管理
│  │  ├─ styles/              # 全局样式
│  │  └─ utils/               # 工具函数与测试
│  ├─ Dockerfile
│  └─ nginx.conf
├─ server/                    # 后端项目
│  ├─ src/
│  │  ├─ controllers/         # 控制器
│  │  ├─ middlewares/         # 中间件
│  │  ├─ routes/              # 路由
│  │  ├─ utils/               # 工具函数
│  │  └─ database.ts          # 数据库初始化与访问
│  ├─ Dockerfile
│  └─ .env.example
├─ shared/                    # 前后端共享类型
├─ scripts/                   # 部署与健康检查脚本
├─ docker-compose.prod.yml    # 生产环境编排
├─ DEPLOYMENT.md              # 部署说明
└─ .github/workflows/         # CI/CD 工作流
```

## 本地开发

### 环境要求

- Node.js 18+
- pnpm

### 安装依赖

```bash
cd client
pnpm install

cd ../server
pnpm install
```

### 启动开发环境

```bash
# 启动后端
cd server
pnpm dev

# 启动前端
cd ../client
pnpm dev
```

默认访问地址：

- 前端：`http://localhost:8080`
- 后端健康检查：`http://localhost:3001/api/health`

### 后端环境变量

复制示例文件：

```bash
cd server
cp .env.example .env
```

常用配置：

- `PORT`：后端端口，默认 `3001`
- `JWT_SECRET`：JWT 密钥，生产环境务必修改
- `UPLOAD_DIR`：上传目录
- `DATA_DIR`：数据库文件目录
- `MAX_FILE_SIZE`：最大上传大小

## 自动化测试

当前仓库已经接入基础自动化测试，可作为 CI 的发布门禁。

前端：

```bash
cd client
pnpm build
pnpm test:run
```

后端：

```bash
cd server
pnpm build
pnpm test:run
```

## CI/CD 与生产部署

项目已支持：

- GitHub Actions 自动检查
- 前后端测试通过后才允许部署
- 单台云服务器 Docker Compose 部署
- GitHub Actions 通过 SSH 远程发布
- 部署完成后自动执行健康检查

相关文件：

- 工作流：[.github/workflows/ci-cd.yml](d:/feng/demoProject/todo-list/.github/workflows/ci-cd.yml)
- 生产编排：[docker-compose.prod.yml](d:/feng/demoProject/todo-list/docker-compose.prod.yml)
- 部署文档：[DEPLOYMENT.md](d:/feng/demoProject/todo-list/DEPLOYMENT.md)
- 部署脚本：[scripts/deploy.sh](d:/feng/demoProject/todo-list/scripts/deploy.sh)
- 健康检查脚本：[scripts/healthcheck.sh](d:/feng/demoProject/todo-list/scripts/healthcheck.sh)

## 后续可扩展方向

- 数据导入导出
- 更多统计图表
- HTTPS / 域名 / 反向代理统一入口
- 数据备份与恢复
- 更完整的接口测试与 E2E 测试

## 许可证

MIT License
