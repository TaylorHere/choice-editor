# 互动电影游戏辅助开发软件架构设计文档

## 1. 技术选型
考虑到软件需要跨平台运行、操作本地文件以及提供丰富的可视化交互，采用以下技术栈：

- **核心框架**: [Electron](https://www.electronjs.org/) (构建跨平台桌面应用)
- **前端框架**: [React](https://react.dev/) (组件化开发) + [TypeScript](https://www.typescriptlang.org/) (类型安全)
- **构建工具**: [Vite](https://vitejs.dev/) (高性能构建)
- **状态管理**: [Zustand](https://github.com/pmndrs/zustand) (轻量级全局状态管理)
- **UI 组件库**: [TailwindCSS](https://tailwindcss.com/) (原子化 CSS) + [ShadcnUI](https://ui.shadcn.com/) (高质量组件)
- **可视化引擎**: [React Flow](https://reactflow.dev/) (专门处理节点流程图的库，非常适合本项目)
- **视频播放**: HTML5 `<video>` 标签

---

## 2. 项目目录结构
```
choice/
├── .github/                # CI/CD 配置
├── electron/               # Electron 主进程代码
│   ├── main.ts             # 入口文件
│   └── preload.ts          # 预加载脚本（IPC通信）
├── src/                    # 渲染进程代码 (React)
│   ├── assets/             # 静态资源
│   ├── components/         # 通用 UI 组件 (Button, Input, Modal 等)
│   ├── features/           # 核心业务模块
│   │   ├── editor/         # 画布编辑器模块
│   │   │   ├── Canvas.tsx          # 画布容器
│   │   │   ├── StoryNode.tsx       # 自定义节点组件 (含视频预览)
│   │   │   └── CustomEdge.tsx      # 自定义连线组件
│   │   ├── properties/     # 属性面板模块
│   │   │   ├── NodePanel.tsx       # 节点属性编辑 (Start节点/Action配置)
│   │   │   ├── ConnectionPanel.tsx # 连接属性编辑 (删除/条件/变更)
│   │   │   └── RightPanel.tsx      # 右侧面板容器
│   │   ├── player/         # 试玩播放器模块
│   │   │   ├── PlayerWindow.tsx    # 播放器弹窗 (状态容器)
│   │   │   ├── VideoPlayer.tsx     # 视频播放器 (UI)
│   │   │   └── Overlay.tsx         # 交互层 (Action渲染/自动跳转)
│   │   └── variables/      # 数值管理模块
│   │       └── VariablePanel.tsx   # 变量管理面板
│   ├── hooks/              # 自定义 React Hooks
│   ├── lib/                # 工具库 (utils)
│   │   ├── script-parser.ts # 脚本解析器
│   │   └── webUtils.ts      # Web 辅助工具
│   ├── store/              # 全局状态管理 (Zustand)
│   │   ├── useProjectStore.ts # 项目数据状态 (编辑时)
│   │   └── useRuntimeStore.ts # 运行时引擎状态 (试玩时)
│   ├── types/              # TypeScript 类型定义
│   │   └── index.ts        # 核心数据模型定义
│   ├── App.tsx             # 根组件
│   └── main.tsx            # 入口文件
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 3. 核心模块详细设计

### 3.1 数据模型 (Type Definitions)
对应 `src/types/index.ts`：

```typescript
// 变量类型
export interface Variable {
  id: string;
  name: string;
  type: 'boolean' | 'number' | 'string';
  defaultValue: any;
  isPersistent: boolean; // 是否长期存储
}

// 节点数据 (React Flow Node.data)
export interface StoryNodeData {
  label: string;
  videoSrc?: string; // 视频文件绝对路径
  isStartNode?: boolean; // 全局唯一 Start 节点
  actions?: StoryAction[];
}

// 操作类型
export interface StoryAction {
  id: string;
  label: string; // 按钮文字或标识
  type?: 'default' | 'auto'; // 交互类型：按钮或自动跳转
  timeMode?: 'onEnd' | 'custom'; // 显示时机
  startTime?: number; // 自定义开始时间 (ms)
  endTime?: number; // 自定义结束时间 (ms)
  position?: { x: number; y: number }; // 屏幕百分比坐标
  style?: {
    color: string;
    textColor: string;
  };
  showCondition?: Condition; // 显示条件
}

// 连接关系 (React Flow Edge.data)
export interface StoryEdgeData {
  conditions?: Condition[]; // 触发条件判断
  mutations?: Mutation[]; // 数据变更
}

// 条件与变更
export interface Condition {
  variableId: string;
  operator: '==' | '>' | '<' | '>=' | '<=' | '!=';
  value: any;
}

export interface Mutation {
  variableId: string;
  operation: 'set' | 'add' | 'subtract';
  value: any;
}
```

### 3.2 脚本解析模块 (Script Parser)
该模块负责将 Markdown 格式脚本转换为上述的数据结构。
- **输入**: Markdown 文本。
- **处理**:
    1.  正则匹配场景头 `## Scene Name` (生成 Node)。
    2.  解析视频源 `[Video: path]`。
    3.  解析选项列表 `- Option -> Target` (生成 Action 和 Connection)。
    4.  自动计算节点坐标 (Auto Layout 算法)。
- **输出**: `nodes` 和 `edges` 数组，可直接注入 React Flow。

### 3.3 播放器状态机 (Player Engine)
试玩模式下的核心逻辑，状态管理提升至 `PlayerWindow`：
- **State (PlayerWindow)**:
    - `currentTime`: 当前播放时间 (ms)
    - `isEnded`: 视频是否播放结束
- **Store (useRuntimeStore)**:
    - `currentNode`: 当前播放节点
    - `variables`: 当前运行时变量值
- **Overlay Logic**:
    - **Auto Action**: 监听 `isEnded`。若为 true 且存在 Auto Action 且满足条件，触发跳转。
    - **Default Action**:
        - `onEnd`: `isEnded` 为 true 时显示。
        - `custom`: `currentTime` 在范围内时显示。
    - **跳转**: 执行 Edge 上的 Mutations -> 更新 `currentNode` -> 重置 `PlayerWindow` 状态。

### 3.4 文件存储
项目文件保存为 `.json` 格式，包含所有节点、连接、变量配置。
- **本地路径**: Electron 环境下使用绝对路径 (`file://` 协议) 访问视频资源。
- **Web兼容**: 在 Web 环境下可能受限于浏览器安全策略。

---

## 4. 开发计划分解

### Phase 1: 基础框架搭建 (Completed)
- 初始化 Electron + Vite + React 项目。
- 配置 TailwindCSS 和基础组件库。
- 搭建 React Flow 画布环境。

### Phase 2: 核心编辑器功能 (Completed)
- 实现节点的增删改查。
- 实现节点属性面板（视频路径选择）。
- 实现 Action 的添加与编辑。
- 实现节点间的连线逻辑。

### Phase 3: 数值系统与逻辑 (Completed)
- 变量管理面板。
- 连接线上的条件判断与数值变更逻辑配置。

### Phase 4: 脚本导入功能 (Completed)
- 定义脚本格式规范。
- 编写解析器。
- 实现自动布局算法。

### Phase 5: 试玩播放器 (Completed)
- 实现视频播放控制。
- 实现交互层 (Overlay)。
- 集成运行时逻辑引擎。

### Phase 6: Action 属性升级 (Completed)
- 支持更丰富的 Action 属性编辑（时间、条件）。
- Action 时间支持“结束时显示”和“过程中显示（自定义时间段）”。
- 修复本地视频播放问题。

### Phase 7: 功能增强 (Completed)
- Electron 单实例限制。
- 节点视频预览与竖屏适配。
- 变量编辑与模板保存。

### Phase 8: 自动跳转与重构 (Completed)
- Auto Action 类型支持。
- 播放器状态重构 (PlayerWindow)。
- Overlay 样式自定义。

### Phase 9: 交互细节优化 (Completed)
- 连接线删除功能。
- Start 节点全局唯一性约束。
- 节点 Handle 样式与约束优化。
