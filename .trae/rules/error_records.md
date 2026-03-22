# 项目错误记录

本文档记录项目开发过程中发现的错误和解决方案，避免重复犯错。

---

## 1. SQLite 参数绑定错误

### 错误信息
```
Wrong API use: tried to bind a value of an unknown type (undefined)
```

### 错误原因
JavaScript 中的 `undefined` 值直接传递给 SQLite 参数绑定时会报错，SQLite 只接受 `null` 或具体值。

### 错误示例
```typescript
// 错误写法
db.run(
  `INSERT INTO accounts (id, type, description) VALUES (?, ?, ?)`,
  [id, type, description]  // description 可能是 undefined
);
```

### 解决方案
在数据库操作层统一处理，将 `undefined` 转换为 `null`：

```typescript
// database.ts
const normalizeParams = (params: unknown[]): unknown[] => {
  return params.map(p => (p === undefined ? null : p));
};

export default {
  run: (sql: string, params: unknown[] = []): void => {
    db.run(sql, normalizeParams(params));
  },
  // ...
};
```

### 涉及文件
- `server/src/database.ts` - 根本解决方案
- `server/src/controllers/accountController.ts`
- `server/src/controllers/categoryController.ts`
- `server/src/controllers/todoController.ts`
- `server/src/routes/upload.ts`

---

## 2. Fastify Multipart 插件未注册

### 错误现象
文件上传接口无法工作，`request.file()` 方法不可用。

### 错误原因
虽然 `package.json` 中安装了 `@fastify/multipart`，但没有在 Fastify 实例中注册插件。

### 解决方案
```typescript
// server/src/index.ts
import multipart from "@fastify/multipart";

await fastify.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024,  // 10MB
    files: 1,
  },
});
```

### 涉及文件
- `server/src/index.ts`

---

## 3. Multipart 请求中无法直接获取表单字段

### 错误现象
上传文件时，`request.body?.todoId` 返回 `undefined`。

### 错误原因
在 multipart/form-data 请求中，表单字段不能通过 `request.body` 直接访问，需要通过 `request.parts()` 遍历获取。

### 错误示例
```typescript
// 错误写法
const data = await request.file();
const todoId = request.body?.todoId;  // undefined
```

### 解决方案
```typescript
// 正确写法
const parts = request.parts();
let fileData = null;
let todoId: string | undefined;

for await (const part of parts) {
  if (part.type === "field" && part.fieldname === "todoId") {
    todoId = part.value as string;
  } else if (part.type === "file") {
    fileData = {
      filename: part.filename,
      mimetype: part.mimetype,
      buffer: await part.toBuffer(),
    };
  }
}
```

### 涉及文件
- `server/src/routes/upload.ts`

---

## 4. 数据库字段 NOT NULL 约束

### 错误信息
```
NOT NULL constraint failed: attachments.todo_id
```

### 错误原因
数据库表定义中 `todo_id` 字段设置为 `NOT NULL`，但头像上传等场景不需要关联 todo。

### 解决方案
修改表结构，允许字段为空：

```typescript
// database.ts
db.run(`
  CREATE TABLE IF NOT EXISTS attachments (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    todo_id TEXT,  -- 移除 NOT NULL
    -- ...
  )
`);
```

### 涉及文件
- `server/src/database.ts`

---

## 5. 中间件验证失败后未终止执行

### 错误现象
JWT 验证失败后，后续代码仍然执行，导致 `request.userId` 为 `undefined`。

### 错误原因
`catch` 块中发送了 401 响应，但没有 `return` 终止函数执行。

### 错误示例
```typescript
// 错误写法
try {
  const decoded = jwt.verify(token, secret);
  request.userId = decoded.userId;
} catch {
  reply.code(401).send({ message: "Token无效" });
  // 缺少 return，函数继续执行
}
```

### 解决方案
```typescript
// 正确写法
try {
  const decoded = jwt.verify(token, secret);
  request.userId = decoded.userId;
} catch {
  reply.code(401).send({ message: "Token无效" });
  return;  // 必须终止执行
}
```

### 涉及文件
- `server/src/middlewares/auth.ts`

---

## 6. Ant Design Upload 组件未实际执行上传

### 错误现象
点击上传按钮选择文件后，没有任何反应。

### 错误原因
`beforeUpload` 返回 `false` 只是阻止了默认上传行为，但没有执行自定义上传逻辑。

### 错误示例
```typescript
// 错误写法
const uploadProps = {
  beforeUpload: (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('只能上传图片');
    }
    return false;  // 阻止默认行为，但没有实际上传
  },
};
```

### 解决方案
```typescript
// 正确写法
const uploadProps = {
  beforeUpload: (file) => {
    handleAvatarUpload(file);  // 执行自定义上传
    return false;
  },
};

const handleAvatarUpload = async (file: File) => {
  setUploading(true);
  try {
    const response = await uploadApi.uploadFile(file);
    await updateProfile({ avatar: response.attachment.url });
    message.success('上传成功');
  } catch (error) {
    message.error('上传失败');
  } finally {
    setUploading(false);
  }
};
```

### 涉及文件
- `client/src/pages/Settings/Settings.tsx`

---

## 7. 新增页面未在 index.ts 导出

### 错误信息
```
Failed to resolve import "@pages/Wardrobe" from "src/App.tsx". Does the file exist?
```

### 错误现象
新增页面组件后，Vite 编译报错找不到模块，页面无法加载。

### 错误原因
项目使用 `@pages` 别名指向 `src/pages` 目录，该目录下有 `index.ts` 统一导出所有页面组件。新增页面时只创建了组件文件，忘记在 `index.ts` 中添加导出。

### 错误示例
```typescript
// App.tsx 中引入
import Wardrobe from '@pages/Wardrobe'  // 报错：找不到模块

// 但 src/pages/index.ts 中缺少导出
export { default as Login } from './Login'
export { default as Register } from './Register'
// ... 缺少 Wardrobe 导出
```

### 解决方案
新增页面组件后，必须在 `src/pages/index.ts` 中添加导出：

```typescript
// src/pages/index.ts
export { default as Login } from './Login'
export { default as Register } from './Register'
// ... 其他导出
export { default as Wardrobe } from './Wardrobe'  // 添加新页面导出
```

### 涉及文件
- `client/src/pages/index.ts`
- `client/src/App.tsx`

### 预防措施
新增页面时，按以下检查清单操作：
1. 创建页面组件文件 `src/pages/PageName/PageName.tsx`
2. 创建样式文件 `src/pages/PageName/PageName.module.less`
3. **在 `src/pages/index.ts` 中添加导出**
4. 在 `src/App.tsx` 中添加路由
5. 在菜单配置中添加菜单项

---

## 8. 新增组件未创建 index.ts 导出文件

### 错误信息
```
Failed to resolve import "@components/GlobalLoading" from "src/App.tsx". Does the file exist?
```

### 错误现象
新增组件后，使用别名（如 `@components/ComponentName`）导入时报错找不到模块。

### 错误原因
项目使用别名指向目录（如 `@components` → `src/components`），但 Vite 在解析别名时需要目录下有 `index.ts` 文件来导出模块。如果只创建了组件文件而没有创建 `index.ts` 导出文件，别名导入会失败。

### 错误示例
```typescript
// 目录结构
src/components/
  GlobalLoading/
    GlobalLoading.tsx
    GlobalLoading.module.less
  // 缺少 index.ts

// App.tsx 中引入
import GlobalLoading from '@components/GlobalLoading'  // 报错：找不到模块
```

### 解决方案
新增组件后，必须在组件目录下创建 `index.ts` 导出文件：

```typescript
// src/components/GlobalLoading/index.ts
export { default as GlobalLoading } from './GlobalLoading'
// 或者
export { default } from './GlobalLoading'
```

### 涉及文件
- `client/src/components/*/index.ts`
- `client/vite.config.ts` - 别名配置

### 预防措施
新增组件时，按以下检查清单操作：
1. 创建组件目录 `src/components/ComponentName/`
2. 创建组件文件 `ComponentName.tsx`
3. 创建样式文件 `ComponentName.module.less`
4. **创建 `index.ts` 导出文件**
5. 使用别名导入：`import ComponentName from '@components/ComponentName'`

### 相关问题
这与第 7 条"新增页面未在 index.ts 导出"是同一类问题，都是因为别名导入需要 `index.ts` 文件。

---

## 9. 图片上传资源浪费问题

### 错误现象
用户选择图片后立即上传到服务器，但如果用户更换图片或取消操作，之前上传的图片就成为无效资源，占用服务器存储空间。

### 错误原因
图片上传逻辑在 `beforeUpload` 中直接执行，没有延迟到用户确认保存时才上传。

### 错误示例
```typescript
// 错误写法：选择即上传
const handleImageUpload = async (file: File) => {
  const response = await uploadApi.uploadFile(file);  // 立即上传
  setImageUrl(response.attachment.url);
};

// 用户更换图片时，之前的图片已浪费存储空间
```

### 解决方案
使用延迟上传策略：选择图片时只创建本地预览，保存时才真正上传。

```typescript
// useImageUpload hook
const selectFile = (file: File) => {
  const preview = URL.createObjectURL(file);  // 本地预览
  setLocalPreview(preview);
  setPendingFile(file);
};

const uploadPendingFile = async () => {
  if (pendingFile) {
    const response = await uploadApi.uploadFile(pendingFile);  // 保存时才上传
    return response.attachment.url;
  }
  return imageUrl;
};

// 组件卸载时释放内存
useEffect(() => {
  return () => {
    if (localPreview) {
      URL.revokeObjectURL(localPreview);
    }
  };
}, []);
```

### 涉及文件
- `client/src/hooks/useImageUpload.ts` - 公共 hook
- `client/src/pages/Wardrobe/Wardrobe.tsx`
- `client/src/pages/Settings/Settings.tsx`

### 预防措施
1. 图片上传统一使用 `useImageUpload` hook
2. 选择图片时只创建本地预览（`URL.createObjectURL`）
3. 确认保存时才调用 `uploadPendingFile` 上传
4. 组件卸载或重置时调用 `URL.revokeObjectURL` 释放内存

---

## 10. 图片与记录关联管理

### 问题背景
用户上传图片后，如果删除关联的记录（如衣橱物品、用户头像），图片文件仍然保留在服务器上，造成存储资源浪费。

### 解决方案
实现图片与实体的关联管理，删除记录时自动清理关联图片。

#### 1. 数据库设计
在 `attachments` 表中添加 `entity_type` 和 `entity_id` 字段：

```typescript
// database.ts
db.run(`
  CREATE TABLE IF NOT EXISTS attachments (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    url TEXT NOT NULL,
    entity_type TEXT,  -- 关联实体类型：wardrobe, user, todo
    entity_id TEXT,    -- 关联实体ID
    todo_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.run(`
  CREATE INDEX IF NOT EXISTS idx_attachments_entity ON attachments(entity_type, entity_id)
`);
```

#### 2. 后端实现
```typescript
// routes/upload.ts
const deleteAttachmentsByEntity = (entityType: string, entityId: string) => {
  const attachments = db.all<{ filename: string }>(
    "SELECT filename FROM attachments WHERE entity_type = ? AND entity_id = ?",
    [entityType, entityId]
  );
  
  attachments.forEach((att) => {
    deleteAttachmentFile(att.filename);
  });
  
  db.run(
    "DELETE FROM attachments WHERE entity_type = ? AND entity_id = ?",
    [entityType, entityId]
  );
};

// controllers/wardrobeController.ts - 删除物品时清理图片
export const deleteWardrobeItem = async (request, reply) => {
  // ...
  deleteAttachmentsByEntity("wardrobe", id);
  db.run("DELETE FROM wardrobe WHERE id = ?", [id]);
  // ...
};

// controllers/authController.ts - 更新头像时清理旧图片
export const updateProfile = async (request, reply) => {
  // ...
  if (oldUser?.avatar && avatar && oldUser.avatar !== avatar) {
    // 删除旧头像文件
    const oldAttachment = db.get("SELECT id, filename FROM attachments WHERE url = ?", [oldUser.avatar]);
    if (oldAttachment) {
      deleteAttachmentFile(oldAttachment.filename);
      db.run("DELETE FROM attachments WHERE id = ?", [oldAttachment.id]);
    }
  }
  // 关联新头像
  if (avatar && avatar !== oldUser?.avatar) {
    db.run("UPDATE attachments SET entity_type = ?, entity_id = ? WHERE url = ?", ["user", request.userId, avatar]);
  }
  // ...
};
```

#### 3. 前端实现
```typescript
// services/upload.ts
interface UploadOptions {
  todoId?: string;
  entityType?: "wardrobe" | "user" | "todo";
  entityId?: string;
}

export const uploadApi = {
  uploadFile: async (file: File, options?: UploadOptions) => {
    const formData = new FormData();
    formData.append("file", file);
    if (options?.entityType) formData.append("entityType", options.entityType);
    if (options?.entityId) formData.append("entityId", options.entityId);
    return api.post("/upload", formData);
  },
  
  deleteByEntity: (entityType: string, entityId: string) => 
    api.delete(`/upload/entity/${entityType}/${entityId}`),
};
```

### 涉及文件
- `server/src/database.ts` - 表结构修改
- `server/src/routes/upload.ts` - 删除关联图片功能
- `server/src/controllers/wardrobeController.ts` - 衣橱物品删除/更新时处理图片
- `server/src/controllers/authController.ts` - 头像更新时处理图片
- `client/src/services/upload.ts` - 前端上传服务
- `client/src/hooks/useImageUpload.ts` - 图片上传 hook

### 最佳实践
1. **创建记录时**：保存记录后，更新附件表的 `entity_type` 和 `entity_id`
2. **更新记录时**：如果图片变化，删除旧图片并关联新图片
3. **删除记录时**：先删除关联的图片文件和数据库记录
4. **统一管理**：使用 `deleteAttachmentsByEntity` 函数统一处理

#### 数据库迁移注意事项
修改表结构后，必须添加迁移逻辑，确保已有数据库能自动升级：

```typescript
// database.ts - 在 CREATE TABLE 之后添加迁移逻辑
try {
  const tableInfo = db.exec("PRAGMA table_info(attachments)");
  if (tableInfo.length > 0) {
    const columns = tableInfo[0].values.map((col) => col[1] as string);
    
    if (!columns.includes("entity_type")) {
      db.run("ALTER TABLE attachments ADD COLUMN entity_type TEXT");
    }
    if (!columns.includes("entity_id")) {
      db.run("ALTER TABLE attachments ADD COLUMN entity_id TEXT");
    }
  }
} catch {
  console.log("Table migration skipped");
}
```

**重要**：每次修改表结构时，必须同步添加迁移逻辑，否则已存在的数据库会报错 "no such column"。

---

## 总结：最佳实践

1. **数据库参数处理**：永远不要将 `undefined` 直接传给数据库，在数据层统一转换为 `null`

2. **中间件设计**：所有错误分支必须确保终止执行（使用 `return` 或 `else`）

3. **文件上传**：
   - 确保注册 multipart 插件
   - 使用 `request.parts()` 遍历 multipart 数据
   - Upload 组件需要在 `beforeUpload` 中执行实际上传逻辑

4. **数据库设计**：
   - 可选字段不要设置 `NOT NULL` 约束
   - **修改表结构后必须添加迁移逻辑**

5. **错误处理**：在数据层添加日志，便于排查问题

6. **图片上传**：
   - 使用 `useImageUpload` hook 统一处理
   - 延迟上传：选择时只预览，保存时才上传
   - 及时释放内存：`URL.revokeObjectURL`

7. **图片关联管理**：
   - 创建记录时关联图片（更新 `entity_type` 和 `entity_id`）
   - 更新记录时，图片变化则删除旧图片
   - 删除记录时，自动清理关联图片
   - 使用 `deleteAttachmentsByEntity` 统一处理

8. **新增组件/页面**：
   - 使用别名导入时，必须在目录下创建 `index.ts` 导出文件
   - 页面组件：在 `src/pages/index.ts` 中添加导出
   - 通用组件：在组件目录下创建 `index.ts` 导出文件

9. **包管理器规范**：
   - 项目统一使用 **pnpm** 作为包管理器
   - 安装依赖：`pnpm add <package>`
   - 安装开发依赖：`pnpm add -D <package>`
   - 不要混用 npm、yarn 等其他包管理器
