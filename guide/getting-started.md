# 快速开始

本指南将帮助您快速搭建 Dux PHP Admin 开发环境，并了解基本使用方法。

## 环境要求

### 基础要求
- **PHP**: 8.2 或更高版本
- **Composer**: 2.0+
- **数据库**: MySQL 8.0+ 或 PostgreSQL 13+ 或 SQLite 3.0+
- **Web 服务器**: Apache 2.4+ 或 Nginx 1.20+

### PHP 扩展
```bash
# 必需扩展
php-pdo
php-pdo-mysql  # 或 php-pdo-pgsql, php-pdo-sqlite
php-mbstring
php-json
php-curl
php-zip
php-xml

# 推荐扩展
php-opcache
php-gd
```

## 安装步骤

### 1. 获取项目

#### 通过 Composer 创建项目（推荐）
```bash
# 使用 Composer 创建新项目
composer create-project duxweb/dux-php-admin my-admin

# 进入项目目录
cd my-admin
```

> 💡 **提示**: 项目已发布到 [Packagist](https://packagist.org/packages/duxweb/dux-php-admin)，可通过 Composer 快速安装。

#### 或者克隆仓库
```bash
# 克隆 GitHub 仓库
git clone https://github.com/duxweb/dux-php-admin.git my-admin
cd my-admin

# 安装 PHP 依赖
composer install
```

### 2. 配置环境

#### 编辑应用配置

编辑 `config/use.toml`：
```toml
[app]
name = "Dux PHP Admin"
debug = true
timezone = "Asia/Shanghai"
secret = "your-32-character-secret-key-here"
domain = "http://localhost:8000"

[vite]
dev = false
port = 5173
```

#### 配置数据库

编辑 `config/database.toml`：
```toml
[db.drivers.default]
driver = "mysql"
host = "localhost"
database = "dux_admin"
username = "root"
password = "your_password"
port = 3306
prefix = "app_"
```

### 3. 数据库初始化

#### 创建数据库（MySQL 示例）
```sql
CREATE DATABASE dux_admin DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### 运行数据库同步
```bash
# 同步数据库结构
php dux db:sync
```

### 4. 启动应用

#### 使用 PHP 内置服务器（开发环境）
```bash
php -S localhost:8000 -t public
```

#### 或使用 Docker（如果项目包含 Docker 配置）
```bash
docker-compose up -d
```

### 5. 访问系统

打开浏览器访问：
- **系统首页**: http://localhost:8000
- **管理后台**: http://localhost:8000/manage

## 项目结构说明

### 核心目录
```
dux-php-admin/
├── app/                    # 应用模块目录
│   ├── System/            # 系统核心模块
│   ├── Member/            # 会员模块
│   ├── Data/              # 数据管理模块
│   └── Web/               # Web模块
├── config/                # 配置文件目录
│   ├── use.toml           # 主配置文件
│   ├── database.toml      # 数据库配置
│   └── app.toml           # 模块注册配置
├── public/                # 公共资源目录
│   └── index.php          # 应用入口文件
├── web/                   # 前端源码目录
│   ├── App.vue            # 主应用组件
│   ├── config.ts          # 前端配置
│   └── main.ts            # 前端入口
└── vendor/                # Composer 依赖
```

## 基本功能使用

### 1. 系统管理

访问管理后台后，您可以看到以下核心功能：

#### 用户管理
- 用户增删改查
- 角色权限分配
- 部门管理

#### 系统设置
- 基础配置管理
- 菜单配置
- 权限控制

#### 数据管理
- 动态数据配置
- 表单设计器
- API 自动生成

### 2. 模块开发

#### 查看现有模块
```bash
# 查看所有可用命令
php dux

# 查看路由列表
php dux route:list

# 同步菜单
php dux menu:sync
```

#### 模块结构
每个模块遵循统一结构：
```
app/ModuleName/
├── Admin/                 # 后台管理控制器
├── Api/                   # API 接口控制器
├── Models/                # 数据模型
├── Service/               # 业务服务
├── App.php               # 模块入口
└── app.json              # 模块配置
```

## 基本功能使用

### 1. 系统管理

访问管理后台后，您可以看到以下核心功能：

#### 用户管理
- 用户增删改查
- 角色权限分配
- 部门管理

#### 系统设置
- 基础配置管理
- 菜单配置
- 权限控制

#### 数据管理
- 动态数据配置
- 表单设计器
- API 自动生成

### 2. 模块开发

#### 查看现有模块
```bash
# 查看所有可用命令
php dux

# 查看路由列表
php dux route:list

# 同步菜单
php dux menu:sync
```

#### 模块结构
每个模块遵循统一结构：
```
app/ModuleName/
├── Admin/                 # 后台管理控制器
├── Api/                   # API 接口控制器
├── Models/                # 数据模型
├── Service/               # 业务服务
├── App.php               # 模块入口
└── app.json              # 模块配置
```

## 开发最佳实践

### 1. 配置管理
- 开发环境使用 `config/use.dev.toml`
- 生产环境通过环境变量覆盖敏感配置
- 不要在版本控制中提交密钥信息

### 2. 模块开发
- 遵循现有模块的目录结构
- 使用统一的命名规范
- 合理使用服务层抽象业务逻辑

### 3. 数据库操作
- 使用 Eloquent ORM 进行数据库操作
- 定期运行 `php dux db:sync` 同步数据库结构
- 使用适当的表前缀避免命名冲突

### 4. 运行时编译
- 前端采用运行时编译技术，无需构建过程
- Vue 文件修改后刷新页面即可看到效果
- 前后端一体化开发，提高开发效率

## 常见问题

### 1. 权限问题
```bash
# 设置正确的文件权限
chmod -R 755 public/
chmod -R 755 data/
chmod 600 config/*.toml
```

### 2. 数据库连接失败
- 检查 `config/database.toml` 配置
- 确认数据库服务正在运行
- 验证用户名和密码是否正确

### 3. 系统访问问题
- 检查 Web 服务器配置是否正确
- 确认防火墙端口是否开放
- 查看服务器错误日志

### 4. CLI 命令不工作
```bash
# 确保有执行权限
chmod +x dux

# 检查 PHP 路径
which php

# 查看错误详情
php dux --verbose
```

## 下一步

- [系统配置](./configuration.md) - 详细配置说明
- [目录结构](./directory-structure.md) - 项目结构详解  
- [用户管理](./user-management.md) - 用户权限系统
- [数据配置](./data-config.md) - 动态数据管理
- [安装部署](./installation.md) - 生产环境部署指南