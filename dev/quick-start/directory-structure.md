# 目录结构

了解 Dux PHP Admin 的目录结构是开发的第一步。本指南将详细介绍每个目录的作用和组织方式。

## 项目根目录

```
dux-php-admin/
├── app/                    # 应用模块目录
├── config/                 # 配置文件目录
├── data/                   # 数据存储目录
├── public/                 # 公共资源目录
├── vendor/                 # Composer 依赖包
├── web/                    # 前端源码目录
├── composer.json           # Composer 配置
├── composer.lock           # Composer 锁定文件
├── dux                     # 命令行工具
├── docker-compose.yml      # Docker 编排文件
├── Dockerfile              # Docker 镜像文件
├── package.json            # Node.js 依赖配置
├── tsconfig.json           # TypeScript 配置
└── README.md               # 项目说明文档
```

## 核心目录详解

### app/ - 应用模块目录

这是项目的核心目录，包含所有的业务模块：

```
app/
├── System/                 # 系统模块
│   ├── Admin/             # 后台管理控制器
│   │   ├── User.php       # 用户管理控制器
│   │   ├── Role.php       # 角色管理控制器
│   │   ├── Menu.php       # 菜单管理控制器
│   │   └── ...
│   ├── Api/               # API 控制器
│   │   ├── User.php       # 用户 API
│   │   └── ...
│   ├── Models/            # 数据模型
│   │   ├── SystemUser.php # 系统用户模型
│   │   ├── SystemRole.php # 系统角色模型
│   │   └── ...
│   ├── Service/           # 业务服务
│   │   ├── UserService.php
│   │   └── ...
│   ├── Middleware/        # 中间件
│   ├── Handler/           # 处理器
│   ├── Command/           # 命令行工具
│   └── app.json           # 模块配置文件
├── Data/                  # 数据模块
│   ├── Admin/             # 数据管理后台
│   ├── Models/            # 数据模型
│   └── ...
└── YourModule/            # 自定义模块
    ├── Admin/             # 后台控制器
    ├── Api/               # API 控制器
    ├── Models/            # 数据模型
    ├── Service/           # 业务服务
    └── app.json           # 模块配置
```

### config/ - 配置文件目录

```
config/
├── app.toml               # 应用基础配置
├── database.toml          # 数据库配置
├── use.toml               # 环境配置（实际使用）
├── use.example.toml       # 环境配置模板
└── use.dev.toml           # 开发环境配置
```

#### 配置文件说明

**app.toml** - 应用基础配置：
```toml
# 模块注册
registers = [ "App\\Web\\App", "App\\System\\App", "App\\Data\\App" ]
```

**database.toml** - 数据库配置：
```toml
[db.drivers.default]
driver = "mysql"
host = "localhost"
port = 3306
prefix = "app_"
charset = "utf8mb4"
collation = "utf8mb4_unicode_ci"
```

**use.toml** - 环境配置：
```toml
[app]
name = "我的 DuxLite 应用"
debug = true
timezone = "Asia/Shanghai"
secret = "your-app-secret-key"
domain = "http://localhost:8000"

[vite]
dev = false
port = 5173

[cloud]
key = ""
```

### data/ - 数据存储目录

```
data/
├── cache/                 # 缓存文件
│   ├── @/                # 系统缓存
│   └── app/              # 应用缓存
├── logs/                  # 日志文件
│   ├── app-2024-01-01.log
│   └── error.log
├── tpl/                   # 模板缓存
│   ├── app/              # 应用模板缓存
│   └── web/              # Web 模板缓存
└── docs/                  # 文档文件
    └── openapi.json       # API 文档
```

### public/ - 公共资源目录

```
public/
├── index.php              # 应用入口文件
├── static/                # 静态资源
│   └── web/              # 前端构建产物
│       ├── assets/       # CSS/JS 资源
│       └── index.html    # 前端入口
└── upload/                # 上传文件
    └── 2024/             # 按年份组织
        └── 01/           # 按月份组织
            └── 01/       # 按日期组织
```

### web/ - 前端源码目录

```
web/
├── App.vue                # 主应用组件
├── main.ts                # 应用入口
├── config.ts              # 前端配置
├── index.html             # HTML 模板
├── vite.config.ts         # Vite 配置
├── tsconfig.json          # TypeScript 配置
├── package.json           # 依赖配置
├── typings.d.ts           # 类型声明
└── vite-env.d.ts          # Vite 环境类型
```

## 模块目录结构

每个模块都遵循统一的目录结构：

```
YourModule/
├── Admin/                 # 后台管理
│   ├── IndexController.php    # 主控制器
│   ├── SettingController.php  # 设置控制器
│   ├── indexTable.vue    # 列表页面组件
│   ├── indexForm.vue     # 表单页面组件
│   └── settingForm.vue   # 设置页面组件
├── Api/                   # API 接口
│   ├── IndexController.php
│   └── UserController.php
├── Models/                # 数据模型
│   ├── YourModel.php
│   └── YourRelationModel.php
├── Service/               # 业务服务
│   ├── YourService.php
│   └── DataService.php
├── Middleware/            # 中间件
│   └── YourMiddleware.php
├── Handler/               # 处理器
│   └── YourHandler.php
├── Command/               # 命令行工具
│   └── YourCommand.php
├── Event/                 # 事件定义
│   └── YourEvent.php
├── Listener/              # 事件监听器
│   └── YourListener.php
├── Resources/             # 资源文件
│   ├── lang/             # 语言包
│   │   ├── zh-CN.toml
│   │   └── en-US.toml
│   └── assets/           # 静态资源
├── Tests/                 # 测试文件
│   ├── Unit/             # 单元测试
│   └── Feature/          # 功能测试
├── app.json               # 模块配置文件
└── CHANGELOG.md           # 更新日志
```

## 配置文件

### 模块配置文件 (app.json)

```json
{
  "name": "duxweb/system",
  "description": "System Application",
  "version": "0.0.7",
  "phpDependencies": {
    "duxweb/dux-lite": "^2.0.13",
    "duxweb/dux-lite-cloud": "dev-main"
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
    }
  ]
}
```

### 前端配置文件 (web/config.ts)

```typescript
import type { IConfig } from '@duxweb/dvha-core'

export default {
  title: 'Dux PHP Admin',
  apiUrl: '/api',
  uploadUrl: '/api/upload',
  
  theme: {
    primaryColor: '#1890ff',
    borderRadius: 6
  },
  
  layout: {
    header: { height: 64 },
    sidebar: { width: 240 },
    footer: { height: 48 }
  }
} as IConfig
```

## 文件命名规范

### PHP 文件命名

- **控制器**：使用 PascalCase，如 `UserController.php`
- **模型**：使用 PascalCase，如 `SystemUser.php`
- **服务**：使用 PascalCase + Service 后缀，如 `UserService.php`
- **中间件**：使用 PascalCase + Middleware 后缀，如 `AuthMiddleware.php`

### Vue 文件命名

- **页面组件**：使用 camelCase，如 `userList.vue`
- **通用组件**：使用 PascalCase，如 `UserTable.vue`
- **表单组件**：使用 `indexForm.vue`
- **表格组件**：使用 `indexTable.vue`

### 其他文件命名

- **配置文件**：使用 snake_case，如 `database.toml`
- **语言包**：使用 locale 格式，如 `zh-CN.toml`

## 开发工作流

### 1. 创建新模块

```bash
# 创建模块目录
mkdir -p app/YourModule/{Admin,Api,Models,Service}

# 创建模块配置
touch app/YourModule/app.json
```

### 2. 开发顺序建议

1. **定义模型** - 创建数据模型和数据库迁移
2. **编写服务** - 实现业务逻辑
3. **创建控制器** - 实现 API 和管理界面
4. **开发前端** - 创建 Vue 组件
5. **编写测试** - 添加单元测试和功能测试

### 3. 文件组织最佳实践

- 按功能模块组织代码
- 保持目录结构的一致性
- 使用命名空间避免冲突
- 合理使用子目录分类文件

## 自动化工具

### 使用 dux 命令行工具

DuxLite 框架提供了丰富的 CLI 工具，但没有代码生成器。开发者需要手动创建模块和组件：

```bash
# 查看所有可用命令
php dux --help

# 数据库相关命令
php dux db:sync          # 同步数据库结构
php dux db:backup        # 备份数据库
php dux db:restore       # 恢复数据库

# 菜单管理
php dux menu:sync        # 同步菜单配置

# 文档生成
php dux docs:build       # 生成 OpenAPI 文档
```

## 下一步

了解目录结构后，您可以：

1. [创建第一个模块](/dev/quick-start/first-module)
2. [学习核心概念](/dev/core/architecture)
3. [探索模块开发](/dev/module/structure)

通过合理的目录结构组织，可以让您的项目更加清晰、易于维护和扩展。