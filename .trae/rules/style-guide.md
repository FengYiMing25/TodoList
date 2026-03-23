# 样式规范

---

## CSS 变量系统

在 `global.less` 中定义，支持深色模式：

```less
:root {
  --primary-color: #1890ff;
  --bg-primary: #ffffff;
  --bg-secondary: #f5f7fa;
  --bg-card: #ffffff;
  --text-primary: rgba(0, 0, 0, 0.88);
  --text-secondary: rgba(0, 0, 0, 0.65);
  --border-color: #e8e8e8;
  --font-size-base: 14px;
  --gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

[data-theme='dark'] {
  --bg-primary: #1a1a1a;
  --bg-secondary: #0d0d0d;
  --bg-card: #1a1a1a;
  --text-primary: rgba(255, 255, 255, 0.88);
  --text-secondary: rgba(255, 255, 255, 0.65);
  --border-color: #303030;
}
```

---

## 组件样式规范

**必须使用 CSS 变量**，禁止硬编码颜色：

```less
// ❌ 错误
.container {
  background-color: #ffffff;
  color: rgba(0, 0, 0, 0.88);
}

// ✅ 正确
.container {
  background-color: var(--bg-card);
  color: var(--text-primary);
}
```

---

## 页面标题 Emoji 规范

| 页面 | Emoji | 示例 |
|------|-------|------|
| Dashboard | 📊 | 📊 数据概览 |
| TodoList | ✅ | ✅ 待办事项 |
| AccountBook | 💰 | 💰 记账本 |
| Wardrobe | 👗 | 👗 电子衣橱 |
| Categories | 🏷️ | 🏷️ 分类管理 |
| Settings | ⚙️ | ⚙️ 系统设置 |

常用 Emoji：
- 统计：📊 📈 📉
- 金额：💰 💵 💳
- 时间：⏰ 📅 ⏳
- 状态：✅ ❌ 🚀 🔥 ⭐
- 衣物：👗 👔 👕 🧥

---

## 主题配置

用户可在设置页面配置：
1. **主题模式**：浅色 / 深色 / 跟随系统
2. **主题色**：预设颜色或自定义
3. **字体大小**：12px - 20px

---

## 注意事项

1. Ant Design 组件通过 `ThemeProvider` 自动适配深色模式
2. 自定义组件必须使用 CSS 变量
3. 第三方库（如 ECharts）需手动配置主题色
