---
name: "architecture-expert"
description: "Senior architecture expert for full-stack development. Invoke when designing system architecture, optimizing performance, or implementing best practices across frontend and backend."
---

# Architecture Expert

A comprehensive skill for designing elegant, high-performance, and maintainable system architectures.

## Core Principles

### Simplicity and Clarity
- Design architectures that are inherently simple to understand and maintain
- Eliminate unnecessary complexity while preserving essential functionality
- Establish clear separation of concerns with well-defined boundaries
- Create logical flows that can be understood at a glance
- Prefer straightforward solutions over clever but obscure implementations

### Performance Optimization
- Architect systems with performance as a first-class consideration
- Design for scalability from the ground up
- Optimize data flow and minimize unnecessary layers of abstraction
- Implement efficient caching strategies and resource management
- Consider both computational and memory efficiency

### Logical Coherence
- Ensure every component has a clear, single responsibility
- Establish consistent patterns and conventions across the entire stack
- Design interfaces that are intuitive and predictable
- Build systems where the logical flow is self-evident from the code structure

## Full-Stack Architecture Mastery

### Frontend Architecture Excellence
- Design component architectures that promote reusability and maintainability
- Implement state management patterns that are predictable and scalable
- Create routing and navigation structures that align with user mental models
- Optimize bundle sizes and loading strategies for superior user experience
- Establish clear boundaries between presentation, business logic, and data layers

### Backend Architecture Proficiency
- Architect RESTful and GraphQL APIs that follow industry best practices
- Design database schemas that balance normalization with query performance
- Implement microservices or monolithic architectures based on actual needs
- Create robust authentication, authorization, and security frameworks
- Design message queues, event-driven architectures, and distributed systems

### Integration and Communication Patterns
- Establish clear contracts between frontend and backend services
- Design API versioning strategies that maintain backward compatibility
- Implement efficient data synchronization and real-time communication patterns
- Create unified error handling and logging strategies across the stack

## Best Practices

### Shared Types Between Frontend and Backend
```
project/
├── shared/
│   └── types/
│       ├── index.ts      # Central export
│       ├── auth.ts       # User, LoginRequest, AuthResponse
│       ├── todo.ts       # Todo, CreateTodoRequest, UpdateTodoRequest
│       ├── category.ts   # Category, Tag
│       ├── account.ts    # Account, AccountStatistics
│       └── api.ts        # ApiResponse, PaginatedResponse
├── client/
│   └── src/types/index.ts → export * from "@shared/types"
└── server/
    └── src/types/index.ts → export * from "@shared/types"
```

**Benefits:**
1. Type consistency - Frontend and backend share the same type definitions
2. Easy maintenance - Modify in one place, sync everywhere
3. Code reuse - Reduce duplicate type definitions
4. Type safety - TypeScript automatically checks type matching

**Configuration:**

Client tsconfig.json:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@shared/types": ["../shared/types"],
      "@shared/types/*": ["../shared/types/*"]
    }
  },
  "include": ["src/**/*", "../shared/types/**/*"]
}
```

Server tsconfig.json:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@shared/types": ["../shared/types"],
      "@shared/types/*": ["../shared/types/*"]
    }
  },
  "include": ["src/**/*", "../shared/types/**/*"]
}
```

Vite config:
```typescript
resolve: {
  alias: {
    '@shared/types': path.resolve(__dirname, '../shared/types'),
  }
}
```

### Component-Based Development
- Break down UI into reusable, self-contained components
- Use composition over inheritance
- Implement proper prop typing with TypeScript
- Follow single responsibility principle for each component

### Performance Optimization Checklist
- [ ] Implement code splitting and lazy loading
- [ ] Use proper caching strategies (browser, CDN, application, database)
- [ ] Optimize database queries and indexing
- [ ] Implement compression and rate limiting
- [ ] Add security headers and CORS configuration
- [ ] Monitor and observe system performance

### Security Best Practices
- Implement defense-in-depth security strategies
- Design for fault tolerance and graceful failure handling
- Create comprehensive backup and disaster recovery strategies
- Implement proper input validation and sanitization
- Never expose or log secrets and keys

## Technology Selection Guidelines

### Frontend
- React + TypeScript for type-safe component development
- Ant Design Pro for enterprise-level UI components
- Zustand for simple and scalable state management
- Vite for fast development and optimized builds

### Backend
- Fastify for high-performance Node.js server
- SQLite/PostgreSQL for data persistence
- JWT for authentication
- bcrypt for password hashing

### Development Tools
- pnpm for faster package management
- TypeScript for type safety across the stack
- ESLint and Prettier for code quality

## Decision Framework

### Requirements Analysis
1. Understand business requirements before proposing solutions
2. Identify core vs. nice-to-have features
3. Consider team capabilities and timeline constraints
4. Evaluate trade-offs between different approaches
5. Document assumptions and constraints

### Quality Assurance
1. Establish architectural review processes
2. Create proof-of-concepts for critical decisions
3. Implement monitoring and observability
4. Design for testability with clear testing strategies
5. Build in resilience patterns and failure recovery

## Documentation Standards

### Architecture Documentation
- Create clear diagrams communicating system design
- Document key decisions, trade-offs, and future considerations
- Establish runbooks for common operational scenarios
- Create onboarding materials for new team members
- Maintain living documentation that evolves with the system

### Code Organization
- Establish consistent project structures
- Create clear naming conventions
- Design modular architectures for independent development
- Implement dependency management to prevent circular dependencies

## UI/UX Optimization Best Practices

### Table Action Column Design
When designing table action columns, follow these principles to ensure clean, usable interfaces:

#### Problem: Action Buttons Overflow
Traditional text buttons ("编辑", "删除") can overflow column width, causing layout issues.

#### Solution: Icon-Only Buttons with Tooltips
```tsx
import { Button, Space, Tooltip, Popconfirm } from 'antd'
import { EditOutlined, DeleteOutlined } from '@ant-design/icons'

{
  title: '操作',
  valueType: 'option',
  width: 100,
  fixed: 'right',
  render: (_, record) => (
    <Space size={0}>
      <Tooltip title="编辑">
        <Button
          type="text"
          size="small"
          icon={<EditOutlined />}
          onClick={() => handleEdit(record)}
        />
      </Tooltip>
      <Popconfirm title="确定删除?" onConfirm={() => handleDelete(record.id)}>
        <Tooltip title="删除">
          <Button type="text" size="small" danger icon={<DeleteOutlined />} />
        </Tooltip>
      </Popconfirm>
    </Space>
  ),
}
```

#### Key Principles:
1. **Use icon-only buttons** - Saves space, cleaner appearance
2. **Add tooltips** - Ensures accessibility and clarity
3. **Set fixed width** - Prevents column from expanding
4. **Use `fixed: 'right'`** - Keeps actions visible during horizontal scroll
5. **Add `scroll={{ x: totalWidth }}`** - Enables horizontal scrolling for narrow screens

### Theme System Architecture

#### Centralized Theme Provider
Create a single `ThemeProvider` component that:
1. Reads theme settings from global state (Zustand)
2. Applies Ant Design's `darkAlgorithm` or `defaultAlgorithm`
3. Sets CSS variables for custom styles
4. Syncs with system preference via `prefers-color-scheme`

```tsx
const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { themeMode, primaryColor } = useSettingsStore()
  const [systemDark, setSystemDark] = useState(
    window.matchMedia('(prefers-color-scheme: dark)').matches
  )

  const isDark = themeMode === 'dark' || (themeMode === 'system' && systemDark)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
  }, [isDark])

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: { colorPrimary: primaryColor },
      }}
    >
      {children}
    </ConfigProvider>
  )
}
```

#### CSS Variables for Theme Support
```less
:root {
  --primary-color: #1890ff;
  --bg-primary: #ffffff;
  --bg-secondary: #f5f7fa;
  --text-primary: rgba(0, 0, 0, 0.88);
}

[data-theme='dark'] {
  --bg-primary: #1a1a1a;
  --bg-secondary: #0d0d0d;
  --text-primary: rgba(255, 255, 255, 0.88);
}

body {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  transition: background-color 0.3s ease;
}
```

### Visual Comfort Guidelines

#### Color Palette
- **Light mode**: Use soft backgrounds (#f5f7fa) instead of pure white
- **Dark mode**: Use elevated surfaces (#1a1a1a) instead of pure black
- **Sidebar**: Use slate blue (#1e293b) for professional appearance
- **Borders**: Use subtle borders (#e8e8e8 light, #303030 dark)

#### Typography
- Base font size: 14px
- Line height: 1.6 for readability
- Font weights: 400 for body, 600 for headings

#### Spacing and Radius
- Border radius: 8px for inputs, 12px for cards/modals
- Card padding: 20-24px
- Consistent margins using 4px increments

#### Transitions
- Use 0.2s-0.3s for smooth interactions
- Apply to: colors, backgrounds, shadows, transforms
- Avoid transitioning layout properties (width, height)

### Responsive Table Design
1. Set minimum column widths based on content
2. Enable horizontal scroll with `scroll={{ x: totalWidth }}`
3. Fix action column to the right
4. Use ellipsis for long text columns
5. Consider collapsible search forms for mobile

## Ant Design Best Practices

### Message Component Usage

**CRITICAL: Never use static message methods directly!**

Static methods like `message.success()` cannot consume React context, including dynamic themes. This causes warnings and breaks theme functionality.

**Wrong:**
```tsx
import { message } from 'antd'

const handleSubmit = async () => {
  message.success('操作成功')  // ❌ Cannot consume context!
}
```

**Correct:**
```tsx
// 1. Create useMessage hook (src/hooks/useMessage.ts)
import { App } from 'antd'

export const useMessage = () => {
  const { message } = App.useApp()
  return message
}

// 2. Use the hook in components
import { useMessage } from '@hooks/useMessage'

const MyComponent = () => {
  const message = useMessage()  // ✅ Context-aware!
  
  const handleSubmit = async () => {
    message.success('操作成功')
  }
}
```

**Why this matters:**
- Static functions bypass React context
- Dynamic themes require context to apply correct styling
- The `App.useApp()` hook provides context-aware instances
- Same applies to `notification` and `modal` static methods

### Modal Component Props

**DEPRECATED: `destroyOnClose`**

The `destroyOnClose` prop is deprecated in Ant Design 5.x. Use `destroyOnHidden` instead.

**Wrong:**
```tsx
<Modal destroyOnClose>
  <Form>...</Form>
</Modal>
```

**Correct:**
```tsx
<Modal destroyOnHidden>
  <Form>...</Form>
</Modal>
```

**Additional Modal best practices:**
- Use `preserve={false}` on Form to reset fields when modal closes
- Set appropriate `width` for content
- Use `forceRender={true}` if you need form validation before opening

### findDOMNode Deprecation Warning

The `findDOMNode` warning comes from third-party libraries (like @ant-design/pro-components) that haven't migrated away from this deprecated React API.

**Current status:**
- This is a library-level issue, not application code
- Cannot be fixed at application level
- Wait for library updates
- Does not affect functionality

**Workaround for development:**
- The warning is informational only
- Monitor library changelogs for updates
- Consider contributing fixes upstream if critical

### Complete Modal Pattern

```tsx
const MyComponent = () => {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [form] = Form.useForm()
  const message = useMessage()

  const handleOpenDialog = (item?: Item) => {
    if (item) {
      setEditingItem(item)
      form.setFieldsValue(item)
    } else {
      setEditingItem(null)
      form.resetFields()
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingItem(null)
    form.resetFields()
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingItem) {
        await updateItem(editingItem.id, values)
        message.success('更新成功')
      } else {
        await createItem(values)
        message.success('创建成功')
      }
      handleCloseDialog()
    } catch (error) {
      message.error('操作失败')
    }
  }

  return (
    <>
      <Button onClick={() => handleOpenDialog()}>新建</Button>
      
      <Modal
        title={editingItem ? '编辑' : '新建'}
        open={dialogOpen}
        onCancel={handleCloseDialog}
        onOk={handleSubmit}
        destroyOnHidden  // ✅ Use this instead of destroyOnClose
        width={520}
      >
        <Form form={form} layout="vertical" preserve={false}>
          {/* Form fields */}
        </Form>
      </Modal>
    </>
  )
}
```
