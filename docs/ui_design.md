# 互动电影游戏辅助开发软件 - UI/UX 设计规范 (Figma Guide)

## 1. 设计理念 (Design Philosophy)
- **专业工具感 (Professional)**: 采用深色模式作为默认主题，减少长时间工作的视觉疲劳。
- **内容优先 (Content First)**: 弱化 UI 框架，突出画布中的视频节点和连接关系。
- **清晰直观 (Clarity)**: 复杂的逻辑连接（条件判断、数值变更）需要通过直观的图标和连线样式表达。
- **现代化 (Modern)**: 遵循 ShadcnUI / TailwindCSS 的设计语言，使用圆角、微阴影和清晰的排版。

---

## 2. 色彩系统 (Color System)
基于 TailwindCSS 的色板进行定制。

### 2.1 基础色 (Neutral/Slate)
用于背景、边框和文字。
- **Background (Main)**: `Slate-950` (#020617) - 应用主背景
- **Background (Panel)**: `Slate-900` (#0f172a) - 侧边栏/浮窗背景
- **Background (Card)**: `Slate-800` (#1e293b) - 节点卡片背景
- **Border**: `Slate-700` (#334155) - 分割线、边框
- **Text (Primary)**: `Slate-50` (#f8fafc) - 主要文字
- **Text (Secondary)**: `Slate-400` (#94a3b8) - 次要文字、标签

### 2.2 品牌色 (Primary/Indigo)
用于高亮、选中状态、主要按钮。
- **Primary**: `Indigo-500` (#6366f1)
- **Primary Hover**: `Indigo-400` (#818cf8)

### 2.3 功能色 (Functional)
- **Success**: `Emerald-500` (#10b981) - 验证通过、播放
- **Warning**: `Amber-500` (#f59e0b) - 缺少连接、数值未定义
- **Error**: `Rose-500` (#f43f5e) - 错误、删除
- **Node (Start)**: `Purple-500` (#a855f7) - 初始节点标识
- **Node (Standard)**: `Slate-800` (默认)

---

## 3. 字体排印 (Typography)
- **Font Family**: Inter, system-ui, sans-serif
- **Scale**:
  - **H1 (Page Title)**: 18px, Bold
  - **H2 (Panel Title)**: 16px, Semibold
  - **H3 (Node Title)**: 14px, Medium
  - **Body**: 13px, Regular
  - **Small/Label**: 12px, Regular
  - **Code/Value**: 12px, Mono (JetBrains Mono / Fira Code)

---

## 4. 界面布局 (Layout Specifications)

### 4.1 整体结构
采用经典的 IDE 布局：
- **Header (Top)**: 48px 高度，全宽。
- **Main Area**: 
  - **Canvas (Left/Center)**: 占据剩余空间。
  - **Sidebar (Right)**: 320px 固定宽度，可折叠。

### 4.2 顶部导航栏 (Header)
- **Left**: Logo (Icon + Text), 文件菜单 (File, Edit, View)。
- **Center**: 项目名称 (可编辑)。
- **Right**: 
  - **Play Button**: 绿色圆型播放图标 (Primary Action)。
  - **Export/Build**: 幽灵按钮 (Secondary Action)。
  - **Settings**: 图标按钮。

### 4.3 节点画布 (Canvas)
- **Background**: `Slate-950` + 点状网格 (Dot Grid, Opacity 20%)。
- **Controls**: 左下角悬浮缩放控制条 (Zoom In/Out, Fit View)。
- **MiniMap**: 右下角可选小地图。

### 4.4 右侧属性面板 (Properties Panel)
- **Tabs**: 顶部切换 "Node Properties" (选中节点时) 和 "Global Variables" (默认)。
- **Content**: 表单式布局，Label 在上，Input 在下。
- **Section**: 使用分割线区分不同模块（如：基础信息、视频设置、操作列表）。

---

## 5. 组件样式 (Component Styles)

### 5.1 节点卡片 (Story Node)
在 React Flow 画布中的核心元素。
- **尺寸**: 宽 240px，高度自适应。
- **容器**: `bg-slate-800`, `border-slate-700`, `rounded-lg`, `shadow-lg`。
- **Header**: 
  - 标题栏，包含节点名称和 ID。
  - 如果是初始节点，显示紫色徽章 (Badge)。
- **Body**:
  - **Thumbnail**: 16:9 视频预览图 (或占位符)，圆角 `rounded-md`。
  - **Info**: 显示视频时长等元数据。
- **Handles (端口)**:
  - **Input (Target)**: 左侧居中，小圆点。
  - **Outputs (Source)**: 右侧，对应每个 "Action" 生成一个端口。

### 5.2 交互操作项 (Action Item)
位于节点卡片内部或属性面板中。
- **样式**: 列表项风格。
- **内容**: 按钮文字预览、条件图标 (如有条件限制)。
- **连接点**: 右侧引出 Handle。

### 5.3 连接线 (Connection Edge)
- **Line**: 贝塞尔曲线 (Bezier)，宽度 2px，颜色 `Slate-500`。
- **Selected**: 颜色变更为 `Indigo-500`，宽度 3px，层级置顶。
- **Label**: 线条中间显示标签，用于展示“数值变更”逻辑 (e.g., "好感度 +5")。背景色 `Slate-900`，圆角，文字微小。

### 5.4 输入控件 (Form Inputs)
- **Input/Select**: 
  - Height: 32px (Small/Compact)。
  - Background: `Slate-900`。
  - Border: `Slate-700` (Focus: `Indigo-500`)。
  - Radius: `rounded-md`。

---

## 6. 试玩模式界面 (Preview Overlay)
- **全屏模式**。
- **Video**: 铺满背景。
- **Overlay UI**:
  - **Actions**: 视频上方覆盖的按钮层。根据配置的坐标或默认底部居中排列。
  - **Debug Panel** (开发模式可见): 半透明悬浮窗，实时显示当前变量数值、当前节点 ID。
  - **Controls**: 退出试玩按钮 (右上角 X)。

---

## 7. 图标系统 (Iconography)
建议使用 [Lucide React](https://lucide.dev/) 图标库。
- **Node**: `Square`, `Film`, `PlayCircle`
- **Action**: `MousePointerClick`, `GitBranch`
- **Variable**: `Database`, `Hash`, `Type`
- **General**: `Settings`, `Save`, `Plus`, `Trash2`, `MoreVertical`
