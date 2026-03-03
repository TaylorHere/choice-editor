# 阿里云部署指南

本指南将协助你将 Choice Editor 部署到阿里云服务器（ECS）或对象存储（OSS）上，并绑定你的域名。

## 1. 准备工作

首先，在本地生成 Web 版的构建产物：

```bash
# 在项目根目录运行
npm run build:web
```

运行成功后，你会得到一个 `dist` 文件夹，里面包含了 `index.html` 和所有静态资源。

---

## 方案 A：使用云服务器 (ECS) + Nginx (推荐)

如果你已经购买了 ECS 服务器，这是最灵活的方式。

### 第一步：安装 Nginx
登录到你的 ECS 服务器（假设是 CentOS/Ubuntu）：

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS
sudo yum install nginx
```

### 第二步：上传文件
在你的本地电脑上，使用 `scp` 命令将 `dist` 文件夹上传到服务器（例如 `/var/www/choice` 目录）：

```bash
# 替换 user@your-server-ip 为你的服务器登录信息
scp -r dist/* root@your-server-ip:/var/www/choice/
```
*提示：如果你的服务器是 Windows，可以使用 FileZilla 等 FTP 工具上传。*

### 第三步：配置 Nginx
编辑 Nginx 配置文件（通常在 `/etc/nginx/sites-available/default` 或 `/etc/nginx/nginx.conf`）：

```nginx
server {
    listen 80;
    server_name your-domain.com; # 替换为你的域名

    root /var/www/choice; # 指向你上传的目录
    index index.html;

    location / {
        try_files $uri $uri/ /index.html; # 支持 React 路由 (SPA)
    }

    # 可选：开启 Gzip 压缩，加快加载速度
    gzip on;
    gzip_types text/plain application/javascript text/css;
}
```

### 第四步：重启 Nginx
```bash
sudo nginx -t # 检查配置是否有误
sudo systemctl restart nginx
```

---

## 方案 B：使用对象存储 (OSS) 静态托管 (最省钱)

如果你不想维护服务器，可以直接用 OSS 托管静态网页。

1.  **创建 Bucket**：登录阿里云 OSS 控制台，创建一个新的 Bucket（读写权限设为 **公共读**）。
2.  **上传文件**：将 `dist` 文件夹内的**所有内容**上传到 Bucket 根目录。
3.  **开启静态页面**：
    *   进入 Bucket -> **基础设置** -> **静态页面**。
    *   默认首页填写 `index.html`。
    *   默认 404 页填写 `index.html` (这对 React SPA 很重要)。
4.  **绑定域名**：
    *   进入 Bucket -> **传输管理** -> **域名管理** -> **绑定域名**。
    *   输入你的域名。
    *   阿里云会提示你添加 CNAME 记录，按提示去域名解析处配置即可。

---

## 2. 域名解析 (DNS)

无论使用哪种方案，你都需要配置域名解析：

1.  登录阿里云 **云解析 DNS** 控制台。
2.  找到你的域名，点击 **解析设置**。
3.  添加记录：
    *   **ECS 方案**：添加 `A` 记录，记录值填你的 ECS 公网 IP。
    *   **OSS 方案**：添加 `CNAME` 记录，记录值填 OSS 提供的域名。

## 3. 注意事项

*   **视频资源跨域**：如果你的互动视频存放在另一个 OSS Bucket，记得在该 OSS 的 **权限管理** -> **跨域设置 (CORS)** 中允许你的域名访问。
*   **HTTPS**：强烈建议开启 HTTPS。
    *   **ECS**：可以使用 Certbot (Let's Encrypt) 免费申请证书。
    *   **OSS**：可以在域名管理中上传你的 SSL 证书（阿里云有免费证书申请服务）。
