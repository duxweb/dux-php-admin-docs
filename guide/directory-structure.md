# 目录结构

了解 Dux PHP Admin 的目录结构有助于快速定位文件和理解项目架构。

## 根目录结构

```
dux-php-admin/
├── app/                    # 应用模块目录
│   ├── System/            # 系统核心模块
│   ├── Data/              # 数据管理模块
│   └── Web/               # Web模块
├── config/                # 配置文件目录
│   ├── app.toml           # 应用配置
│   ├── database.toml      # 数据库配置
│   ├── use.toml           # 主配置文件
│   └── use.dev.toml       # 开发环境配置
├── data/                  # 数据存储目录
│   ├── cache/            # 缓存文件
│   ├── logs/             # 日志文件
│   ├── docs/             # API文档
│   └── tpl/              # 模板缓存
├── public/                # 公共资源目录
│   ├── index.php         # 应用入口文件
│   ├── upload/           # 上传文件目录
│   └── static/           # 静态资源
├── web/                   # 前端入口
│   ├── App.vue           # 主应用组件
│   ├── config.ts         # 前端配置
│   ├── main.ts           # 入口文件
│   ├── index.html        # HTML模板
│   └── vite.config.ts    # Vite配置
├── vendor/               # Composer 依赖包
├── composer.json         # Composer 配置
├── composer.lock         # 依赖锁定文件
├── dux                   # CLI 工具脚本
├── docker-compose.yml    # Docker配置
├── package.json          # 前端依赖配置
└── README.md             # 项目说明文档
```

## 应用模块结构

每个应用模块遵循统一的目录结构：

```
app/ModuleName/
├── Admin/                 # 后台管理控制器
│   ├── Controller.php    # 控制器文件
│   ├── table.vue         # 列表页面组件
│   └── form.vue          # 表单页面组件
├── Api/                   # API 接口控制器
│   └── ApiController.php
├── Models/                # 数据模型
│   └── ModelName.php
├── Service/               # 业务服务类
│   └── ServiceName.php
├── Event/                 # 事件定义
│   └── EventName.php
├── Listener/              # 事件监听器
│   └── ListenerName.php
├── Middleware/            # 中间件
│   └── MiddlewareName.php
├── App.php               # 模块入口文件
├── app.json              # 模块配置文件
└── CHANGELOG.md          # 变更日志
```

## 系统核心模块 (System)

系统模块是框架的核心，包含用户管理、权限控制等基础功能：

```
app/System/
├── Admin/                 # 后台管理
│   ├── User.php          # 用户管理
│   ├── Role.php          # 角色管理
│   ├── Menu.php          # 菜单管理
│   ├── Dept.php          # 部门管理
│   ├── Config.php        # 系统配置
│   ├── Auth.php          # 认证管理
│   ├── Home.php          # 首页
│   ├── Login.php         # 登录管理
│   ├── Profile.php       # 个人资料
│   ├── Upload.php        # 文件上传
│   ├── Setting.php       # 系统设置
│   ├── Storage.php       # 存储配置
│   ├── Dictionary.php    # 数据字典
│   ├── Locale.php        # 本地化
│   ├── Area.php          # 地区管理
│   ├── Api.php           # API管理
│   ├── Docs.php          # API文档
│   ├── Message.php       # 消息中心
│   └── Operate.php       # 操作日志
├── Api/                   # 系统 API
│   ├── Area.php          # 地区接口
│   └── Setting.php       # 设置接口
├── Models/                # 核心模型
│   ├── SystemUser.php    # 用户模型
│   ├── SystemRole.php    # 角色模型
│   ├── SystemMenu.php    # 菜单模型
│   ├── SystemDept.php    # 部门模型
│   ├── Config.php        # 配置模型
│   ├── SystemArea.php    # 地区模型
│   ├── SystemFile.php    # 文件模型
│   ├── SystemApi.php     # API模型
│   ├── LogLogin.php      # 登录日志
│   ├── LogOperate.php    # 操作日志
│   └── LogVisit.php      # 访问日志
├── Service/               # 系统服务
│   ├── Config.php        # 配置服务
│   ├── Menu.php          # 菜单服务
│   ├── Stats.php         # 统计服务
│   ├── Storage.php       # 存储服务
│   ├── Upload.php        # 上传服务
│   └── Visitor.php       # 访客服务
├── Middleware/            # 系统中间件
│   ├── ApiStatsMiddleware.php     # API统计中间件
│   ├── OperateMiddleware.php      # 操作记录中间件
│   └── VisitorMiddleware.php      # 访客统计中间件
├── Handler/               # 处理器
│   ├── ManageHandler.php  # 管理处理器
│   ├── MenuHandler.php    # 菜单处理器
│   └── MessageHandler.php # 消息处理器
├── Command/               # 命令
│   └── MenuCommand.php    # 菜单命令
├── Web/                   # Web控制器
│   └── Manage.php         # 管理页面
├── Views/                 # 视图模板
│   └── manage.latte       # 管理页面模板
├── App.php               # 模块入口
├── app.json              # 模块配置
└── CHANGELOG.md          # 变更日志
```

## 数据管理模块 (Data)

```
app/Data/
├── Admin/                 # 后台管理
│   ├── Data.php          # 数据管理
│   └── Config.php        # 配置管理
├── Api/                   # 数据 API
│   ├── Data.php          # 数据接口
│   └── DataApi.php       # 数据API
├── Models/                # 数据模型
│   ├── Data.php          # 数据模型
│   └── DataConfig.php    # 配置模型
├── Service/               # 数据服务
│   └── Config.php        # 配置服务
├── App.php               # 模块入口
├── app.json              # 模块配置
└── CHANGELOG.md          # 变更日志
```

## 配置文件详解

### 主配置文件 (config/use.toml)

```toml
[app]
# 应用名称
name = "Dux PHP Admin"
# 调试模式
debug = false
# 时区设置
timezone = "Asia/Shanghai"
# 应用密钥
secret = "your-secret-key"
# 应用域名
domain = "https://yourdomain.com"
# 语言设置
locale = "zh-CN"
```

### 数据库配置 (config/database.toml)

```toml
[default]
driver = "mysql"
host = "localhost"
port = 3306
database = "dux_admin"
username = "root"
password = ""
charset = "utf8mb4"
collation = "utf8mb4_unicode_ci"
prefix = ""
```

### 应用配置 (config/app.toml)

```toml
[cache]
# 缓存驱动
driver = "file"
# 缓存路径
path = "data/cache"

[upload]
# 上传驱动
driver = "local"
# 上传路径
path = "public/upload"
```

## 数据存储目录

### data/ 目录详解

```
data/
├── cache/                # 缓存文件存储
│   └── attributes.cache  # 属性缓存
├── logs/                 # 日志文件存储
│   └── app-*.log        # 应用日志
├── docs/                 # API文档
│   └── openapi.json     # OpenAPI规范文件
└── tpl/                  # 模板编译缓存
    ├── app/             # 应用模板缓存
    └── web/             # Web模板缓存
```

### public/ 目录详解

```
public/
├── index.php            # 应用入口文件
├── upload/              # 用户上传文件
│   └── 2025/           # 按年份分类
│       └── 06/         # 按月份分类
│           └── 25/     # 按日期分类
└── static/              # 静态资源
    └── web/            # Web静态资源
        └── assets/     # 编译后的资源文件
```

## 前端结构

### web/ 目录详解

前端采用 **DVHA-Pro 基座模式**，用于编译和更新前端文件：

```
web/
├── App.vue              # 主应用组件
├── config.ts            # 前端配置
├── main.ts              # 入口文件
├── index.html           # HTML模板
├── vite.config.ts       # Vite配置
├── typings.d.ts         # TypeScript声明
└── vite-env.d.ts        # Vite环境声明
```

### DVHA-Pro 基座模式说明

- **免编译机制**：DVHA-Pro 的核心特性是免编译，Vue 组件直接在浏览器中运行
- **运行时基座**：web/ 目录作为运行时基座，在浏览器中实时解析和执行 Vue 组件
- **实时加载**：模块中的 .vue 文件被直接加载到浏览器中运行，无需构建步骤
- **开发效率**：修改 Vue 文件后刷新页面即可看到效果，真正的零编译开发体验

### 前端文件分布

```
# 模块内的前端文件示例
app/System/Admin/User/
├── table.vue            # 列表页面组件（运行时加载）
├── form.vue             # 表单页面组件（运行时加载）
└── view.vue             # 详情页面组件（运行时加载）

app/System/Admin/Docs/
├── index.vue            # API文档主页面
├── panel.vue            # 文档面板组件
├── components/          # 子组件目录
│   ├── CodeBlock.vue    # 代码块组件
│   └── SchemaTree.vue   # 结构树组件
└── store/               # 状态管理
    └── request.js       # 请求状态
```

### 运行时机制

1. **组件发现**：系统自动扫描各模块的 Vue 组件文件路径
2. **运行时加载**：浏览器直接请求和解析 .vue 文件
3. **实时渲染**：Vue 组件在浏览器中实时编译和渲染
4. **热刷新**：修改文件后刷新页面即可看到最新效果，无需任何构建过程

## 文件命名规范

### PHP 文件命名
- **类文件** - 使用 PascalCase：`UserController.php`
- **配置文件** - 使用小写 + 点分隔：`database.toml`

### Vue 文件命名
- **组件文件** - 使用 PascalCase：`UserForm.vue`
- **页面文件** - 使用小写：`table.vue`, `form.vue`

### 数据库命名
- **表名** - 使用小写 + 下划线：`system_users`
- **字段名** - 使用小写 + 下划线：`created_at`

## CLI 工具

DuxPHP Admin 提供了强大的 CLI 工具 `dux`：

```bash
# 查看所有命令
php dux

# 数据库相关
php dux db:sync          # 同步数据库结构
php dux db:backup        # 备份数据库
php dux db:restore       # 恢复数据库

# 路由相关
php dux route:list       # 查看路由列表

# 菜单相关
php dux menu:sync        # 同步菜单
```

## 最佳实践

### 模块开发
1. **遵循目录结构** - 按照统一的目录结构组织代码
2. **模块独立性** - 每个模块应该相对独立
3. **配置管理** - 使用 app.json 管理模块配置

### 文件管理
1. **版本控制** - 重要文件纳入版本控制
2. **权限设置** - 设置合适的文件权限
3. **备份策略** - 定期备份重要数据

### 安全考虑
1. **敏感文件** - 配置文件不对外暴露
2. **上传安全** - 限制上传文件类型
3. **权限控制** - 严格的文件访问权限