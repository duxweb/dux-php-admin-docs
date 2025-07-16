# 模块结构

模块是 DuxLite 框架的核心组织单位。本指南将通过实际的 System 模块示例，详细介绍如何正确组织和开发模块。

## 什么是模块

模块是一个功能完整的业务单元，包含：
- **后端逻辑**：控制器、模型、服务等
- **前端界面**：Vue 组件
- **配置信息**：菜单、权限、依赖等

## 实际模块结构

以 `app/System` 模块为例：

```
app/System/
├── Admin/                      # 后台管理控制器
│   ├── User.php               # 用户管理控制器
│   ├── User/                  # 用户管理前端组件
│   │   ├── form.vue           # 用户表单
│   │   └── table.vue          # 用户列表
│   ├── Role.php               # 角色管理控制器
│   ├── Config.php             # 系统配置控制器
│   └── Home.php               # 首页控制器
├── Models/                     # 数据模型
│   ├── SystemUser.php         # 用户模型
│   ├── SystemRole.php         # 角色模型
│   └── SystemDept.php         # 部门模型
├── Service/                    # 业务服务类
│   ├── Config.php             # 配置服务
│   ├── Storage.php            # 存储服务
│   └── Visitor.php            # 访问统计服务
├── Middleware/                 # 中间件
│   └── OperateMiddleware.php  # 操作日志中间件
├── App.php                     # 模块入口文件（必需）
└── app.json                    # 模块配置文件（必需）
```

## 核心文件说明

### 1. App.php - 模块入口

每个模块必须有一个 `App.php` 文件，继承 `AppExtend` 类：

```php
<?php

namespace App\System;

use Core\App\AppExtend;
use Core\Bootstrap;
use Core\Resources\Resource;
use Core\Route\Route;

class App extends AppExtend
{
    // 初始化阶段：配置资源和路由
    public function init(Bootstrap $app): void
    {
        // 配置管理后台资源
        CoreApp::resource()->set(
            "admin",
            (new Resource('admin', '/admin'))
                ->addAuthMiddleware(
                    new OperateMiddleware(SystemUser::class),
                    new PermissionMiddleware("admin", SystemUser::class),
                    new AuthMiddleware("admin")
                )
        );

        // 配置 Web 路由
        CoreApp::route()->set("web", new Route(""));

        // 配置 API 路由
        CoreApp::route()->set("api", new Route("/api"));
    }

    // 注册阶段：注册服务到容器
    public function register(Bootstrap $app): void
    {
        // 注册模块服务
    }

    // 启动阶段：执行启动逻辑
    public function boot(Bootstrap $app): void
    {
        // 模块启动后的逻辑
    }
}
```

### 2. app.json - 模块配置文件

模块的配置文件，定义模块信息和菜单结构：

```json
{
    "name": "duxweb/system",
    "description": "System Application",
    "version": "0.0.7",
    "phpDependencies": {
        "duxweb/dux-lite": "^2.0.13"
    },
    "adminMenu": [
        {
            "type": "menu",
            "label": "首页",
            "name": "system.index",
            "path": "system/index",
            "icon": "i-tabler:dashboard",
            "loader": "System/Home/index",
            "sort": 0
        },
        {
            "type": "directory",
            "label": "系统管理",
            "name": "system",
            "icon": "i-tabler:settings",
            "sort": 999,
            "children": [
                {
                    "type": "menu",
                    "label": "用户管理",
                    "name": "system.user.list",
                    "path": "system/user",
                    "loader": "System/User/table"
                }
            ]
        }
    ]
}
```

**配置说明：**
- `name`：模块包名
- `description`：模块描述
- `version`：模块版本
- `phpDependencies`：PHP 依赖包
- `adminMenu`：管理后台菜单配置

## 创建模块

### 1. 创建模块目录

```bash
# 在 app 目录下创建新模块
mkdir -p app/Blog/{Admin,Models}
```

### 2. 创建模块入口文件

创建 `app/Blog/App.php`：

```php
<?php

namespace App\Blog;

use Core\App\AppExtend;
use Core\Bootstrap;

class App extends AppExtend
{
    public function init(Bootstrap $app): void
    {
        // 模块初始化逻辑
    }

    public function register(Bootstrap $app): void
    {
        // 注册服务
    }

    public function boot(Bootstrap $app): void
    {
        // 启动逻辑
    }
}
```

### 3. 创建模块配置文件

创建 `app/Blog/app.json`：

```json
{
    "name": "your-company/blog",
    "description": "Blog Module",
    "version": "1.0.0",
    "adminMenu": [
        {
            "type": "directory",
            "label": "博客管理",
            "name": "blog",
            "icon": "i-tabler:article",
            "sort": 100,
            "children": [
                {
                    "type": "menu",
                    "label": "文章管理",
                    "name": "blog.article.list",
                    "path": "blog/article",
                    "loader": "Blog/Article/table"
                }
            ]
        }
    ]
}
```

### 4. 注册模块

在 `config/app.php` 中注册模块：

```php
<?php

return [
    'registers' => [
        \App\System\App::class,
        \App\Blog\App::class,  // 添加你的模块
    ],
];
```

### 5. 同步菜单

```bash
# 同步模块菜单到数据库
php dux menu:sync
```

## 模块开发流程

### 开发步骤

1. **创建模块结构** - 按照标准目录结构创建文件
2. **编写 App.php** - 定义模块的生命周期方法
3. **配置 app.json** - 设置模块信息和菜单
4. **注册模块** - 在 config/app.php 中注册
5. **同步菜单** - 运行 `php dux menu:sync`
6. **开发功能** - 创建控制器、模型、服务等

### 开发建议

**目录组织：**
- 按功能模块划分，而不是按技术层次
- 前后端代码放在同一目录下，便于维护
- 只创建必要的目录，避免过度设计

**命名规范：**
- 模块名使用 PascalCase：`Blog`、`UserCenter`
- 控制器名与功能对应：`Article`、`Category`
- 模型名加前缀：`BlogArticle`、`BlogCategory`

**配置管理：**
- 菜单配置写在 app.json 中
- 复杂配置可以单独创建配置文件
- 使用 CLI 工具同步配置到数据库

## 常用 CLI 命令

### 模块相关命令

```bash
# 同步模块菜单到数据库
php dux menu:sync

# 刷新菜单缓存
php dux menu:cache

# 同步数据库结构（模型注解）
php dux db:sync

# 查看路由列表
php dux route:list

# 查看所有可用命令
php dux --help
```

### 开发调试

```bash
# 清除缓存
php dux cache:clear

# 查看系统信息
php dux system:info

# 检查模块状态
php dux module:status
```

## 总结

DuxLite 模块化设计的核心特点：

### 设计理念
- **约定优于配置**：遵循标准目录结构和命名规范
- **前后端一体化**：Vue 组件与 PHP 控制器同目录存放
- **配置驱动**：通过 app.json 统一管理模块信息
- **生命周期管理**：通过 init → register → boot 三阶段管理模块

### 开发优势
1. **快速上手**：标准化的目录结构和开发流程
2. **易于维护**：相关代码集中管理，职责清晰
3. **扩展性强**：模块化设计，便于功能扩展
4. **工具支持**：丰富的 CLI 命令辅助开发

### 最佳实践
- 按业务功能划分模块，而不是技术层次
- 保持模块的独立性和低耦合
- 合理使用服务层处理复杂业务逻辑
- 充分利用注解简化配置

遵循这些设计原则，你可以快速构建出高质量、易维护的模块。接下来我们将详细介绍控制器开发。