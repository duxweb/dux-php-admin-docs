# 安装指南

本指南将详细介绍如何安装和配置 Dux PHP Admin。

## 系统要求

在开始安装之前，请确保您的环境满足以下要求：

- **PHP**: 8.2 或更高版本
- **Composer**: 2.0 或更高版本  
- **Node.js**: 18 或更高版本（用于前端构建）
- **数据库**: MySQL 8.0 / PostgreSQL 13 / SQLite 3.35 或更高版本
- **Web 服务器**: Apache/Nginx（可选，开发时可用 PHP 内置服务器）

## 创建项目

### 使用 Composer 创建

```bash
# 使用 Composer 创建新项目
composer create-project duxweb/dux-php-admin my-admin-project

# 进入项目目录
cd my-admin-project
```

### 手动克隆

```bash
# 克隆项目
git clone https://github.com/duxweb/dux-php-admin.git my-admin-project
cd my-admin-project

# 安装 PHP 依赖
composer install
```

## 依赖安装

### 安装 PHP 依赖

```bash
# 开发环境安装
composer install

# 生产环境安装（推荐）
composer install --no-dev --optimize-autoloader
```

### 安装前端依赖

推荐使用现代化的包管理工具：

```bash
# 使用 pnpm (推荐)
pnpm install

# 使用 bun (极速)
bun install

# 使用 npm
npm install

# 使用 yarn
yarn install
```

::: tip 推荐
建议使用 `pnpm` 或 `bun` 等现代化工具，它们具有更快的安装速度和更好的磁盘空间利用率。
:::

## 配置文件

### 基础配置

编辑 `config/use.toml` 文件：

```toml
[app]
name = "我的管理系统"
debug = true
timezone = "Asia/Shanghai"
secret = "your-app-secret-key-here"
domain = "http://localhost:8000"

[vite]
dev = false
port = 5173

[cloud]
key = ""
```

### 数据库配置

编辑 `config/database.toml` 文件：

```toml
# MySQL 配置
[db.drivers.default]
driver = "mysql"
host = "localhost"
database = "dux_admin"
username = "root"
password = "root"
port = 3306
prefix = "app_"
charset = "utf8mb4"
collation = "utf8mb4_unicode_ci"

# PostgreSQL 配置（可选）
[db.drivers.pgsql]
driver = "pgsql"
host = "localhost"
database = "dux_admin"
username = "postgres"
password = "postgres"
port = 5432
prefix = "app_"

# SQLite 配置（可选）
[db.drivers.sqlite]
driver = "sqlite"
database = "storage/database.sqlite"
prefix = "app_"
```


## 数据库设置

### 创建数据库

**MySQL:**
```sql
CREATE DATABASE dux_admin DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**PostgreSQL:**
```sql
CREATE DATABASE dux_admin;
```

**SQLite:**
```bash
# SQLite 会自动创建文件
touch storage/database.sqlite
```

### 同步数据库结构

使用 DuxLite 的数据库同步功能：

```bash
# 同步数据库表结构
php dux db:sync

# 查看可用的 CLI 命令
php dux --help
```

## 初始化应用

### 同步系统菜单

```bash
# 同步菜单配置到数据库
php dux menu:sync
```

### 创建管理员账户

手动在数据库中创建管理员账户，或通过系统界面注册第一个用户。

## 前端构建

### 开发模式

```bash
# 使用 pnpm (推荐)
pnpm dev

# 使用 bun
bun dev

# 使用 npm
npm run dev

# 使用 yarn
yarn dev
```

这将启动前端开发服务器在 `http://localhost:5173`。

**注意**: Dux PHP Admin 支持运行时编译，开发时无需启动前端服务器，可以直接修改 Vue 文件后刷新页面。

### 生产构建

```bash
# 使用 pnpm (推荐)
pnpm build

# 使用 bun
bun run build

# 使用 npm
npm run build

# 使用 yarn
yarn build
```

构建的文件将输出到 `public/static/web/` 目录。

::: tip 提示
DuxLite 支持运行时编译，开发时可以不构建前端资源。
:::

## 启动应用

### 开发环境

使用 PHP 内置服务器：

```bash
# 使用 Composer 脚本
composer serve

# 或直接使用 PHP
php -S localhost:8000 -t public

# 自定义端口
php -S localhost:8080 -t public
```

应用将在 `http://localhost:8000` 启动。

::: tip 后台入口
管理后台的访问地址为：`http://localhost:8000/manage`
:::

### 生产环境

#### Apache 配置

创建虚拟主机配置：

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /path/to/dux-php-admin/public
    
    <Directory /path/to/dux-php-admin/public>
        AllowOverride All
        Require all granted
        
        # 重写规则支持前端路由
        RewriteEngine On
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule ^(.*)$ index.php [QSA,L]
    </Directory>
    
    ErrorLog ${APACHE_LOG_DIR}/dux-admin-error.log
    CustomLog ${APACHE_LOG_DIR}/dux-admin-access.log combined
</VirtualHost>
```

#### Nginx 配置

创建 Nginx 站点配置：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dux-php-admin/public;
    
    index index.php index.html;
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    
    # 前端路由支持
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }
    
    # PHP 处理
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # 隐藏敏感文件
    location ~ /\. {
        deny all;
    }
    
    location ~ /(config|storage|vendor) {
        deny all;
    }
}
```

### 文件权限设置

设置正确的文件权限：

```bash
# 设置所有者
sudo chown -R www-data:www-data /path/to/dux-php-admin

# 设置基础权限
sudo chmod -R 755 /path/to/dux-php-admin

# 设置可写目录权限
sudo chmod -R 775 /path/to/dux-php-admin/data
sudo chmod -R 775 /path/to/dux-php-admin/public/static
sudo chmod -R 775 /path/to/dux-php-admin/public/upload
```

## 验证安装

### 访问应用

打开浏览器访问：

- **管理后台**: `http://your-domain.com/manage`

### 首次登录

1. 访问管理后台 `/manage`
2. 使用创建的管理员账户登录
3. 查看系统仪表板确认安装成功

## CLI 工具使用

DuxLite 提供了丰富的 CLI 工具：

```bash
# 查看所有可用命令
php dux --help

# 数据库操作
php dux db:sync          # 同步数据库结构
php dux db:backup        # 备份数据库
php dux db:restore       # 恢复数据库
php dux db:list          # 查看自动迁移模型列表

# 菜单管理
php dux menu:sync        # 同步菜单配置

# 路由管理
php dux route:list       # 查看路由列表

# 权限管理
php dux permission:list  # 查看权限列表

# 文档生成
php dux docs:build       # 生成 OpenAPI 文档

# 云端服务
php dux add [package]    # 添加云端包
php dux app:add [app]    # 添加云端应用
php dux app:update       # 更新应用
php dux app:del [app]    # 删除应用

# 队列服务
php dux queue:start      # 启动队列服务

# Worker 模式
php dux worker:start     # 启动 FrankenPHP Worker 模式

# 计划任务
php dux scheduler        # 启动计划任务服务
```

## 性能优化

### 生产环境优化

```bash
# 优化 Composer 自动加载
composer install --no-dev --optimize-autoloader

# 构建前端资源
npm run build

# 设置生产配置
# 编辑 config/use.toml
[app]
debug = false
```

### 缓存配置

框架内置文件缓存，生产环境可配置 Redis 缓存以获得更好的性能。缓存配置位于各个模块的 `App.php` 文件中。

## 常见问题

### 数据库连接失败

1. 检查数据库配置 `config/database.toml`
2. 确认数据库服务正在运行
3. 验证用户名和密码是否正确

### 权限错误

```bash
# 重新设置权限
sudo chown -R www-data:www-data data public/static public/upload
sudo chmod -R 775 data public/static public/upload
```

### 前端资源加载失败

```bash
# 重新安装依赖
pnpm install  # 或 bun install / npm install

# 重新构建前端
pnpm build   # 或 bun run build / npm run build
```

### CLI 命令无法执行

```bash
# 确保 CLI 文件有执行权限
chmod +x dux

# 检查 PHP 路径
which php
```

## 下一步

安装完成后，建议：

1. 阅读 [目录结构](./directory-structure.md) 了解项目组织
2. 查看 [第一个模块](./first-module.md) 学习开发流程  
3. 参考 [系统架构](../core/architecture.md) 深入了解框架

恭喜！您已经成功安装了 Dux PHP Admin。