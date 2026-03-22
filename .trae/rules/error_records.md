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
  [id, type, description], // description 可能是 undefined
);
```

### 解决方案

在数据库操作层统一处理，将 `undefined` 转换为 `null`：

```typescript
// database.ts
const normalizeParams = (params: unknown[]): unknown[] => {
  return params.map((p) => (p === undefined ? null : p));
};

export default {
  run: (sql: string, params: unknown[] = []): void => {
    db.run(sql, normalizeParams(params));
  },
  // ...
};
```

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
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1,
  },
});
```

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
const todoId = request.body?.todoId; // undefined
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
  return; // 必须终止执行
}
```

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
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      message.error("只能上传图片");
    }
    return false; // 阻止默认行为，但没有实际上传
  },
};
```

### 解决方案

```typescript
// 正确写法
const uploadProps = {
  beforeUpload: (file) => {
    handleAvatarUpload(file); // 执行自定义上传
    return false;
  },
};

const handleAvatarUpload = async (file: File) => {
  setUploading(true);
  try {
    const response = await uploadApi.uploadFile(file);
    await updateProfile({ avatar: response.attachment.url });
    message.success("上传成功");
  } catch (error) {
    message.error("上传失败");
  } finally {
    setUploading(false);
  }
};
```

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
import Wardrobe from "@pages/Wardrobe"; // 报错：找不到模块

// 但 src/pages/index.ts 中缺少导出
export { default as Login } from "./Login";
export { default as Register } from "./Register";
// ... 缺少 Wardrobe 导出
```

### 解决方案

新增页面组件后，必须在 `src/pages/index.ts` 中添加导出：

```typescript
// src/pages/index.ts
export { default as Login } from "./Login";
export { default as Register } from "./Register";
// ... 其他导出
export { default as Wardrobe } from "./Wardrobe"; // 添加新页面导出
```

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
src / components / GlobalLoading / GlobalLoading.tsx;
GlobalLoading.module.less;
// 缺少 index.ts

// App.tsx 中引入
import GlobalLoading from "@components/GlobalLoading"; // 报错：找不到模块
```

### 解决方案

新增组件后，必须在组件目录下创建 `index.ts` 导出文件：

```typescript
// src/components/GlobalLoading/index.ts
export { default as GlobalLoading } from "./GlobalLoading";
// 或者
export { default } from "./GlobalLoading";
```

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
  const response = await uploadApi.uploadFile(file); // 立即上传
  setImageUrl(response.attachment.url);
};

// 用户更换图片时，之前的图片已浪费存储空间
```

### 解决方案

使用延迟上传策略：选择图片时只创建本地预览，保存时才真正上传。

```typescript
// useImageUpload hook
const selectFile = (file: File) => {
  const preview = URL.createObjectURL(file); // 本地预览
  setLocalPreview(preview);
  setPendingFile(file);
};

const uploadPendingFile = async () => {
  if (pendingFile) {
    const response = await uploadApi.uploadFile(pendingFile); // 保存时才上传
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
```

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
  const attachments = db.all<{ filename: string }>("SELECT filename FROM attachments WHERE entity_type = ? AND entity_id = ?", [entityType, entityId]);

  attachments.forEach((att) => {
    deleteAttachmentFile(att.filename);
  });

  db.run("DELETE FROM attachments WHERE entity_type = ? AND entity_id = ?", [entityType, entityId]);
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

  deleteByEntity: (entityType: string, entityId: string) => api.delete(`/upload/entity/${entityType}/${entityId}`),
};
```

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

10. **H5 表格适配**：
    - 所有表格页面都需要适配 H5
    - 使用 `useIsMobile` hook 判断是否为移动端
    - 移动端使用 `MobileTable` 组件替代 ProTable
    - 卡片布局优先展示关键信息
    - 筛选器简化，只保留必要条件

11. **字典管理**：
    - 所有分类必须通过字典管理，不允许硬编码
    - 使用 `useDictionaryStore` 获取字典数据
    - 新增分类类型时需在 `DictionaryType` 和 `DICTIONARY_TYPE_CONFIGS` 中添加配置
    - 字典项包含颜色属性，用于 Tag 等组件显示

---

## 11. H5 表格适配规范

### 问题背景

在移动端（H5）上，表格横向滚动体验不佳，需要提供卡片式布局替代方案。

### 解决方案

使用 `MobileTable` 组件和 `useIsMobile` hook 实现响应式布局。

#### 1. 使用 useIsMobile Hook

```typescript
// hooks/useIsMobile.ts
export const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < breakpoint;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);

  return isMobile;
};
```

#### 2. 使用 MobileTable 组件

```typescript
import { MobileTable } from '@components/MobileTable'
import { useIsMobile } from '@hooks'

const MyPage: React.FC = () => {
  const isMobile = useIsMobile()

  const renderMobileItem = (item: MyData) => (
    <MobileTable.Card>
      <MobileTable.CardHeader>
        <MobileTable.CardTitle>{item.name}</MobileTable.CardTitle>
        <Tag>{item.status}</Tag>
      </MobileTable.CardHeader>
      <MobileTable.CardMeta>
        <Tag>{item.category}</Tag>
      </MobileTable.CardMeta>
      <MobileTable.CardFooter
        left={<span>{item.date}</span>}
        actions={
          <MobileTable.CardActions
            onEdit={() => handleEdit(item)}
            onDelete={() => handleDelete(item.id)}
          />
        }
      />
    </MobileTable.Card>
  )

  if (isMobile) {
    return (
      <MobileTable
        data={items}
        loading={isLoading}
        total={total}
        title="数据列表"
        searchPlaceholder="搜索..."
        onSearch={handleSearch}
        filters={[
          {
            key: 'status',
            placeholder: '状态',
            options: [
              { label: '启用', value: 'active' },
              { label: '禁用', value: 'inactive' },
            ],
            value: filter.status,
            onChange: (v) => setFilter({ ...filter, status: v }),
          },
        ]}
        renderItem={renderMobileItem}
        onAdd={handleAdd}
      />
    )
  }

  return <ProTable columns={columns} dataSource={items} />
}
```

#### 3. MobileTable 组件 API

| 属性              | 说明             | 类型                    | 默认值 |
| ----------------- | ---------------- | ----------------------- | ------ |
| data              | 数据源           | T[]                     | -      |
| loading           | 加载状态         | boolean                 | false  |
| total             | 总数             | number                  | 0      |
| title             | 标题             | string                  | -      |
| searchPlaceholder | 搜索框占位符     | string                  | '搜索' |
| searchValue       | 搜索值           | string                  | ''     |
| onSearch          | 搜索回调         | (value: string) => void | -      |
| filters           | 筛选器配置       | MobileFilter[]          | []     |
| renderItem        | 渲染卡片项       | (item: T) => ReactNode  | -      |
| onAdd             | 新增按钮回调     | () => void              | -      |
| showAddButton     | 是否显示新增按钮 | boolean                 | true   |

#### 4. MobileTable 子组件

- **MobileTable.Card**: 卡片容器
- **MobileTable.CardHeader**: 卡片头部
- **MobileTable.CardTitle**: 卡片标题
- **MobileTable.CardMeta**: 卡片元信息
- **MobileTable.CardFooter**: 卡片底部
- **MobileTable.CardActions**: 操作按钮组

### 最佳实践

1. **所有表格页面都需要适配 H5**：待办事项、记账本、电子衣橱等
2. **使用 `useIsMobile` hook** 判断是否为移动端
3. **移动端使用 `MobileTable` 组件** 替代 ProTable
4. **卡片布局优先展示关键信息**：标题、状态、日期、操作按钮
5. **筛选器简化**：移动端只保留必要的筛选条件
6. **固定右下角添加按钮**：使用 FAB（Floating Action Button）样式

### 注意事项

1. **tsconfig.json 别名配置**：确保 `@hooks` 别名正确配置
   ```json
   {
     "paths": {
       "@hooks": ["src/hooks"],
       "@hooks/*": ["src/hooks/*"]
     }
   }
   ```
2. **类型安全**：筛选器的值类型需要与接口参数类型匹配
3. **响应式断点**：默认 768px，可根据需要调整

---

## 12. 字典管理规范

### 问题背景

项目中存在多种分类需求（记账本收入/支出分类、电子衣橱分类、待办标签等），原本分散管理，导致维护困难、数据不一致。

### 解决方案

使用统一的字典管理系统，所有分类数据集中管理。

#### 1. 字典类型定义

```typescript
// shared/types/dictionary.ts
export type DictionaryType =
  | "account_income_category" // 记账本收入分类
  | "account_expense_category" // 记账本支出分类
  | "wardrobe_category" // 电子衣橱分类
  | "todo_tag"; // 待办标签

export interface Dictionary {
  id: string;
  type: DictionaryType;
  name: string;
  color: string;
  icon?: string;
  sortOrder: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}
```

#### 2. 数据库表结构

```sql
CREATE TABLE IF NOT EXISTS dictionaries (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  user_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_dictionaries_type_user ON dictionaries(type, user_id);
```

#### 3. 使用字典 Store

```typescript
import { useDictionaryStore } from '@stores/dictionaryStore'

const MyComponent: React.FC = () => {
  const { fetchDictionaries, getDictionariesByType } = useDictionaryStore()

  useEffect(() => {
    fetchDictionaries()
  }, [fetchDictionaries])

  // 获取特定类型的字典项
  const incomeCategories = getDictionariesByType('account_income_category')
  const expenseCategories = getDictionariesByType('account_expense_category')
  const wardrobeCategories = getDictionariesByType('wardrobe_category')
  const todoTags = getDictionariesByType('todo_tag')

  // 转换为 Select 组件需要的格式
  const categoryOptions = incomeCategories.map(item => ({
    label: item.name,
    value: item.name,
    color: item.color,
  }))

  return (
    <Select options={categoryOptions} />
  )
}
```

#### 4. 字典管理页面

字典管理页面位于 `src/pages/Categories/Categories.tsx`，提供以下功能：

- 按类型分组展示字典项
- 新增、编辑、删除字典项
- 支持自定义颜色
- H5 移动端适配

### 最佳实践

1. **所有分类必须通过字典管理**：不允许在代码中硬编码分类列表
2. **新增分类类型时**：
   - 在 `shared/types/dictionary.ts` 的 `DictionaryType` 中添加新类型
   - 在 `DICTIONARY_TYPE_CONFIGS` 中添加配置（label、description）
   - 在 `TYPE_ICONS` 中添加对应图标
   - 在 `DEFAULT_DICTIONARIES` 中添加默认数据
   - 字典管理页面会自动显示新类型
3. **使用字典颜色**：字典项包含颜色属性，用于 Tag 等组件显示
4. **初始化数据**：
   - 每个分类下有"初始化"按钮，点击可批量创建默认数据
   - 左侧菜单标题旁有刷新按钮，可一键初始化所有空分类
   - 已有数据的分类不会重复初始化

### 如何添加新字典类型

1. **修改类型定义** (`shared/types/dictionary.ts`)：

```typescript
export type DictionaryType = "account_income_category" | "account_expense_category" | "wardrobe_category" | "todo_tag" | "new_category"; // 添加新类型
```

2. **修改页面配置** (`client/src/pages/Categories/Categories.tsx`)：

```typescript
// 添加配置
const DICTIONARY_TYPE_CONFIGS: DictionaryTypeConfig[] = [
  // ...现有配置
  {
    key: 'new_category',
    label: '新分类',
    description: '新分类描述',
  },
]

// 添加图标
const TYPE_ICONS: Record<DictionaryType, React.ReactNode> = {
  // ...现有图标
  new_category: <IconComponent />,
}

// 添加默认数据
const DEFAULT_DICTIONARIES: Record<DictionaryType, Array<{ name: string; color: string }>> = {
  // ...现有数据
  new_category: [
    { name: '选项1', color: '#1890ff' },
    { name: '选项2', color: '#52c41a' },
  ],
}
```

### 注意事项

1. **字典项删除**：删除字典项前，需检查是否有记录正在使用
2. **数据迁移**：从硬编码分类迁移到字典时，需确保数据一致性
3. **缓存策略**：字典数据变化较少，可考虑前端缓存优化
4. **布局优化**：PC端使用左侧菜单+右侧内容布局，移动端使用顶部按钮切换

---

## 12. API 响应数据解包规范

### 问题背景

前端服务层调用 API 后，数据返回 `undefined`，导致页面无法展示数据。

### 错误现象

```typescript
// 服务层调用
const response = await api.get<{ success: boolean; data: User[] }>("/users");
return response.data; // 返回 undefined
```

### 错误原因

`api.ts` 的响应拦截器已经自动解包了 `{ success, data }` 格式：

```typescript
// api.ts
api.interceptors.response.use(
  (response) => {
    const data = response.data;
    if (data && typeof data === "object" && "success" in data && "data" in data) {
      return data.data; // 已经返回了 data 部分
    }
    return response.data;
  },
  // ...
);
```

服务层又访问了 `.data`，导致 `undefined`：

- `response` 已经是 `User[]`
- `response.data` 变成 `undefined`

### 错误示例

```typescript
// ❌ 错误写法 - 重复解包
export const userApi = {
  getUsers: async () => {
    const response = await api.get<{ success: boolean; data: User[] }>("/users");
    return response.data; // response 已经是 User[]，再 .data 就是 undefined
  },
};
```

### 正确写法

```typescript
// ✅ 正确写法 - 直接返回 api 调用结果
export const userApi = {
  getUsers: (): Promise<User[]> => api.get("/users"),

  getUserById: (id: string): Promise<User> => api.get(`/users/${id}`),

  createUser: (data: CreateUserRequest): Promise<User> => api.post("/users", data),

  updateUser: (id: string, data: UpdateUserRequest): Promise<User> => api.put(`/users/${id}`, data),

  deleteUser: (id: string): Promise<void> => api.delete(`/users/${id}`),
};
```

### 数据流说明

```
后端返回                          api.ts 拦截器                     服务层返回
───────────────────────────────────────────────────────────────────────────────
{ success: true, data: User }   →  自动解包返回 data  →  Promise<User>
{ success: true, data: Todo[] } →  自动解包返回 data  →  Promise<Todo[]>
```

### 最佳实践

1. **服务层直接返回 api 调用**，不要再访问 `.data`
2. **添加返回类型注解**，便于类型检查
3. **统一使用箭头函数简写**，保持代码简洁

### 预防措施

新增服务文件时，参考现有正确实现：

- `client/src/services/auth.ts`
- `client/src/services/todo.ts`
- `client/src/services/account.ts`
- `client/src/services/wardrobe.ts`

---

## 13. 共享类型定义规范

### 问题背景

前端 `client/src/types/` 目录下存在与 `shared/types/` 重复的类型文件，导致类型定义不一致、维护困难。

### 解决方案

前端类型统一使用 `shared/types` 中的定义，前端 `types` 目录只保留一个重导出文件。

### 目录结构

```
shared/types/           ← 唯一类型定义源
├── account.ts
├── api.ts
├── attachment.ts
├── auth.ts
├── dictionary.ts
├── index.ts
├── todo.ts
└── wardrobe.ts

client/src/types/
└── index.ts           ← 仅重导出 @shared/types
```

### 正确写法

```typescript
// client/src/types/index.ts
export * from "@shared/types";
```

### 错误示例

```typescript
// ❌ 错误 - 在 client/src/types/ 下重复定义类型
// client/src/types/todo.ts
export interface Todo {
  id: string;
  // ...
}

// 这会导致：
// 1. 类型定义不一致
// 2. 修改时需要同步多处
// 3. 类型导入混乱
```

### 最佳实践

1. **所有类型定义放在 `shared/types/`**
2. **前端通过 `@types` 别名导入**：`import type { Todo } from '@types'`
3. **不要在 `client/src/types/` 下创建类型文件**
4. **后端通过 `@shared/types` 导入**

---

## 14. 字典类型管理规范

### 问题背景

项目中存在"系统预置类型"概念，导致类型管理复杂，用户无法自由管理所有字典类型。

### 解决方案

移除 `is_system` 字段，所有字典类型都存储在数据库中，用户可自由创建、编辑、删除。

### 数据库设计

```sql
CREATE TABLE dictionary_types (
  id TEXT PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  user_id TEXT,  -- 创建者
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 移除内容

1. **数据库**：移除 `is_system` 字段
2. **类型定义**：移除 `isSystem` 属性
3. **前端 UI**：移除编辑/删除按钮的禁用状态

### 最佳实践

1. **所有字典类型由用户创建**
2. **删除类型前检查是否有字典项在使用**
3. **类型 key 使用小写字母和下划线**：`todo_category`

---

## 15. Modal 编辑回显规范

### 问题背景

点击编辑按钮后，Modal 弹窗中的表单没有回显数据，所有字段都是空的。

### 错误现象

```typescript
// 点击编辑按钮
const handleOpenDialog = (item) => {
  setEditingItem(item);
  form.setFieldsValue({ ...item }); // 设置表单值
  setDialogOpen(true);
};

// Modal 关闭后再打开，表单是空的
```

### 错误原因

Modal 使用 `destroyOnHidden` 属性会在关闭时销毁内部的 Form 组件。当再次打开 Modal 时：

1. Form 被重新创建，所有状态重置
2. `handleOpenDialog` 中的 `form.setFieldsValue` 在 Form 销毁前执行
3. Modal 打开后 Form 是新创建的，之前设置的值丢失

### 错误示例

```typescript
// ❌ 错误写法
const handleOpenDialog = (item) => {
  setEditingItem(item)
  form.setFieldsValue({ ...item })  // 此时 Form 可能已被销毁
  setDialogOpen(true)
}

<Modal destroyOnHidden>
  <Form form={form}>...</Form>
</Modal>
```

### 正确写法

使用 `afterOpenChange` 回调，在 Modal 完全打开后再设置表单值：

```typescript
// ✅ 正确写法
const handleOpenDialog = (item) => {
  setEditingItem(item)  // 只设置编辑状态
  setDialogOpen(true)
}

<Modal
  destroyOnClose
  afterOpenChange={(open) => {
    if (open && editingItem) {
      form.setFieldsValue({
        name: editingItem.name,
        category: editingItem.category,
        // ... 其他字段
      })
    }
  }}
>
  <Form form={form}>...</Form>
</Modal>
```

### 属性说明

- `destroyOnClose`：关闭时销毁子元素（推荐使用）
- `destroyOnHidden`：隐藏时销毁子元素（Ant Design 5.x 新属性）
- `afterOpenChange`：动画结束后回调，`open` 参数表示当前显示状态

### 最佳实践

1. **编辑弹窗统一使用 `destroyOnClose`**
2. **表单回显放在 `afterOpenChange` 回调中**
3. **`handleOpenDialog` 只设置编辑状态，不设置表单值**
4. **新建时不需要 `afterOpenChange`，使用 `initialValue` 或默认值**

---

## 16. Store 请求去重规范

### 问题背景

React.StrictMode 在开发模式下会故意让组件渲染两次，导致 useEffect 中的接口调用执行多次，造成不必要的网络请求和性能浪费。

### 错误现象

```typescript
// Dashboard 组件
useEffect(() => {
  fetchTodos(); // 第一次渲染调用
  fetchDictionaries(); // 第一次渲染调用
}, []);

// StrictMode 下会渲染两次，接口被调用两次
```

### 解决方案

在 Store 层添加请求去重机制，使用 `dedupeRequest` 工具函数：

#### 1. 创建去重工具

```typescript
// utils/requestDedupe.ts
const pendingRequests = new Map<string, Promise<unknown>>();

export function dedupeRequest<T>(key: string, request: () => Promise<T>): Promise<T> {
  const pending = pendingRequests.get(key);
  if (pending) {
    return pending as Promise<T>;
  }

  const promise = request().finally(() => {
    pendingRequests.delete(key);
  });

  pendingRequests.set(key, promise);
  return promise;
}

export function createDedupeKey(prefix: string, ...args: (string | number | undefined)[]): string {
  return [prefix, ...args.filter(Boolean)].join(":");
}
```

#### 2. 在 Store 中使用

```typescript
// stores/dictionaryStore.ts
import { dedupeRequest, createDedupeKey } from '@utils/requestDedupe'

fetchDictionaries: async (type?: DictionaryType) => {
  const key = createDedupeKey('dict', type)
  return dedupeRequest(key, async () => {
    set({ isLoading: true })
    try {
      const data = await dictionaryApi.getDictionaries({ type })
      // ... 更新状态
    } catch (error) {
      throw error
    }
  })
},
```

#### 3. 带参数的请求去重

```typescript
// stores/todoStore.ts
fetchTodos: async (params?: TodoQueryParams) => {
  const queryParams = { ...get().queryParams, ...params };
  const key = createDedupeKey('todos', queryParams.page, queryParams.limit, queryParams.status)
  return dedupeRequest(key, async () => {
    // ... 执行请求
  })
},
```

### 工作原理

1. 每个请求生成唯一的 key（基于请求类型和参数）
2. 如果相同 key 的请求正在进行中，直接返回该 Promise
3. 请求完成后自动从 Map 中删除，允许后续新请求

### 最佳实践

1. **所有 fetch 类方法都应该使用去重**
2. **key 应包含所有影响结果的参数**
3. **create/update/delete 操作不需要去重**
4. **保留 React.StrictMode**，它在开发时帮助发现问题
