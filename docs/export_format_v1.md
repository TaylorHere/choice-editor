# Choice Editor 导出格式 v1

本规范定义 Choice Editor 生成移动端/PWA 运行包时的最小文件结构与字段，供编辑器导出与 runtime 加载统一使用。

## 1. 导出目录结构

```text
dist/
  index.html
  choice.manifest.json
  story.json
  manifest.webmanifest
  sw.js
  icons/
    icon-192.png
    icon-512.png
```

说明：
- `choice.manifest.json` 与 `story.json` 为项目内容导出文件。
- `manifest.webmanifest` 与 `sw.js` 为 PWA 运行壳文件。

## 2. choice.manifest.json

用途：描述导出包入口和运行外观参数。

```json
{
  "schemaVersion": "1.0.0",
  "entry": "story.json",
  "generatedAt": "2026-03-24T11:11:11.111Z",
  "app": {
    "name": "Choice Story",
    "shortName": "Choice",
    "themeColor": "#0f172a",
    "backgroundColor": "#000000",
    "display": "standalone",
    "orientation": "portrait"
  }
}
```

字段约束：
- `schemaVersion`: 字符串，导出格式版本号。
- `entry`: 字符串，剧情数据文件路径（相对 `index.html`）。
- `generatedAt`: ISO 时间字符串。
- `app`: PWA 展示信息（当前 runtime 主要读取 `entry`，其余用于后续扩展）。

## 3. story.json

用途：承载编辑器项目数据，供 runtime 直接执行。

```json
{
  "schemaVersion": "1.0.0",
  "project": {
    "nodes": [],
    "edges": [],
    "variables": []
  }
}
```

字段约束：
- `schemaVersion`: 字符串，推荐与 manifest 保持一致。
- `project.nodes`: 场景节点与条件节点数组（沿用编辑器内部 `StoryNode` 结构）。
- `project.edges`: 连接关系数组（沿用 `StoryEdge`）。
- `project.variables`: 全局变量数组（沿用 `Variable`）。

## 4. 兼容策略

runtime 与编辑器加载器应支持：
1. 新格式：`{ schemaVersion, project: { nodes, edges, variables } }`
2. 旧格式：`{ version, project: { ... } }`
3. 直接项目对象：`{ nodes, edges, variables }`

实现方式：统一通过解析层抽取 `nodes/edges/variables`，缺失字段按空数组兜底。
