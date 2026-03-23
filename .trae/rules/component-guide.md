# 组件规范

---

## H5 表格适配

### 使用 useIsMobile Hook

```typescript
import { useIsMobile } from '@hooks'

const isMobile = useIsMobile() // 默认断点 768px
```

### 使用 MobileTable 组件

```typescript
import { MobileTable } from '@components/MobileTable'

if (isMobile) {
  return (
    <MobileTable
      data={items}
      title="数据列表"
      renderItem={(item) => (
        <MobileTable.Card>
          <MobileTable.CardHeader>
            <MobileTable.CardTitle>{item.name}</MobileTable.CardTitle>
          </MobileTable.CardHeader>
          <MobileTable.CardFooter
            actions={<MobileTable.CardActions onEdit={...} onDelete={...} />}
          />
        </MobileTable.Card>
      )}
    />
  )
}
```

---

## 字典管理

### 获取字典数据

```typescript
import { useDictionaryStore } from '@stores/dictionaryStore'

const { getDictionariesByType } = useDictionaryStore()
const categories = getDictionariesByType('wardrobe_category')
```

### 字典类型

| 类型 | 用途 |
|------|------|
| `account_income_category` | 记账本收入分类 |
| `account_expense_category` | 记账本支出分类 |
| `wardrobe_category` | 电子衣橱分类 |
| `todo_tag` | 待办标签 |

### 新增字典类型

1. 在 `shared/types/dictionary.ts` 的 `DictionaryType` 中添加类型
2. 在 `Categories.tsx` 的 `DICTIONARY_TYPE_CONFIGS` 中添加配置
3. 在 `DEFAULT_DICTIONARIES` 中添加默认数据

---

## PageTitle 组件

统一页面标题样式：

```typescript
import PageTitle from '@components/PageTitle'

<PageTitle title="数据概览" emoji="📊" />
```

---

## 图片上传 Hook

```typescript
import { useImageUpload } from '@hooks/useImageUpload'

const { 
  imageUrl, 
  localPreview, 
  selectFile, 
  uploadPendingFile 
} = useImageUpload()

// 选择文件（只预览）
selectFile(file)

// 保存时上传
const url = await uploadPendingFile()
```
