# Web 发布指南

Choice Editor 支持构建为纯网页应用 (Web App)，你可以将其部署到任何静态网站托管服务上（如 GitHub Pages, Vercel, Netlify）。

## 1. 构建 Web 版本
我们在 `package.json` 中添加了专门的构建脚本：

```bash
npm run build:web
```

运行此命令后，会在 `dist` 目录下生成构建好的静态文件（`index.html`, `assets/` 等）。

## 2. 部署方式

### GitHub Pages (推荐)
1. 将你的代码推送到 GitHub 仓库。
2. 确保 `vite.config.ts` 中的 `base` 配置正确（如果是部署在 `username.github.io/repo-name`，base 应该是 `./` 或 `/repo-name/`）。我们已默认为 `./`。
3. 进入仓库 Settings -> Pages。
4. 选择 Source 为 `GitHub Actions` 或直接部署 `gh-pages` 分支。

### Vercel / Netlify
1. 导入你的 GitHub 仓库。
2. Build Command 设置为: `npm run build:web`
3. Output Directory 设置为: `dist`
4. 点击 Deploy 即可。

## 3. Web 版的注意事项

与 Electron 桌面版相比，Web 版有以下限制：

### 3.1 视频资源
*   **本地文件不可用**：浏览器出于安全限制，无法直接读取用户电脑上的绝对路径文件（如 `C:\Videos\demo.mp4`）。
*   **解决方案**：
    1.  **使用网络 URL**：将视频上传到云存储（AWS S3, OSS, 或视频托管平台），然后在编辑器中输入 `https://...` 链接。
    2.  **放入 public 目录**：如果你是在开发自己的项目，可以将视频放入项目的 `public/videos/` 文件夹，然后使用相对路径 `/videos/demo.mp4`。构建时这些视频会被打包。

### 3.2 项目存取
*   **Save Project**：Web 版会触发浏览器下载，保存为 `story.json` 文件。
*   **Load Project**：点击加载按钮后，会弹出浏览器的文件选择框，选择之前的 `.json` 文件即可。

### 3.3 跨域问题 (CORS)
如果你引用的视频 URL 来自第三方服务器，必须确保该服务器允许跨域访问 (CORS enabled)，否则视频可能无法播放或无法截取缩略图。
