# 项目开发规范

本文档记录项目开发过程中的关键规范和常见问题解决方案。

---

## 核心规范

### 1. 包管理器

- 项目统一使用 **pnpm**
- 安装依赖：`pnpm add <package>`
- 安装开发依赖：`pnpm add -D <package>`

### 2. 新增组件/页面

使用别名导入时，必须在目录下创建 `index.ts` 导出文件：

```typescript
// src/components/ComponentName/index.ts
export { default } from "./ComponentName";
```

### 3. 数据库操作

- 永远不要将 `undefined` 直接传给数据库，统一转换为 `null`
- 可选字段不要设置 `NOT NULL` 约束
- **修改表结构后必须添加迁移逻辑**

### 4. 中间件设计

所有错误分支必须确保终止执行（使用 `return` 或 `else`）

### 5. API 服务层

服务层直接返回 api 调用，不要再访问 `.data`：

```typescript
// ✅ 正确
export const userApi = {
  getUsers: (): Promise<User[]> => api.get("/users"),
};
```

### 6. 图片上传

- 使用 `useImageUpload` hook 统一处理
- 延迟上传：选择时只预览，保存时才上传
- 及时释放内存：`URL.revokeObjectURL`

### 7. Modal 编辑回显

使用 `afterOpenChange` 回调设置表单值：

```typescript
<Modal
  destroyOnClose
  afterOpenChange={(open) => {
    if (open && editingItem) {
      form.setFieldsValue({ ...editingItem });
    }
  }}
>
```

### 8. Store 请求去重

使用 `dedupeRequest` 工具函数防止重复请求：

```typescript
fetchTodos: async (params) => {
  const key = createDedupeKey('todos', params.page, params.status);
  return dedupeRequest(key, async () => { /* ... */ });
},
```

---

## 常见错误速查

| 错误 | 原因 | 解决方案 |
|------|------|----------|
| `undefined` 参数绑定错误 | SQLite 不接受 undefined | 数据层统一转换为 null |
| 文件上传无反应 | `beforeUpload` 未执行上传 | 在 `beforeUpload` 中执行自定义上传 |
| 模块找不到 | 缺少 index.ts 导出 | 创建 index.ts 导出文件 |
| Modal 表单不回显 | `destroyOnClose` 销毁组件 | 使用 `afterOpenChange` 回调 |
| 401 错误页面刷新 | 拦截器重定向 | 登录页面跳过重定向 |

---

## 详细规范文档

- [样式规范](./style-guide.md) - 深色模式、CSS 变量、Emoji 规范
- [组件规范](./component-guide.md) - MobileTable、字典管理
