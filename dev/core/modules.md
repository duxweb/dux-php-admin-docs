# 模块系统

DuxLite 框架采用模块化架构设计，每个功能都封装在独立的模块中。模块系统基于 `AppExtend` 类和注解系统，提供了标准化的开发方式，使得功能扩展和维护变得简单高效。

## 模块概念

### 什么是模块

模块是一个包含完整业务功能的代码包，位于 `app/` 目录下，包括：

- **App.php** - 模块入口类，继承 `AppExtend`
- **Admin/** - 后台管理控制器（Resource 控制器）
- **Models/** - 数据模型定义
- **Service/** - 业务逻辑封装
- **app.json** - 模块配置文件
- **前端组件** - Vue 组件与控制器同目录存放

### 模块优势

1. **功能隔离**: 每个模块独立维护自己的功能
2. **代码复用**: 模块可以在不同项目中重复使用
3. **团队协作**: 不同团队可以并行开发不同模块
4. **自动发现**: 框架自动扫描和加载模块
5. **注解驱动**: 使用注解自动注册路由和资源

## 模块结构

### 标准目录结构

DuxLite 模块采用简洁的目录结构，以 System 模块为例：

```
app/System/
├── App.php                # 模块入口类
├── Admin/                 # 后台管理控制器
│   ├── User.php          # 用户管理控制器
│   ├── User/             # 用户管理前端组件
│   │   ├── table.vue     # 列表页面
│   │   └── form.vue      # 表单页面
│   ├── Role.php          # 角色管理控制器
│   ├── Config.php        # 配置管理控制器
│   └── Dictionary.php    # 字典管理控制器
├── Models/               # 数据模型
│   ├── SystemUser.php    # 用户模型
│   ├── SystemRole.php    # 角色模型
│   └── SystemDictionary.php # 字典模型
├── Service/              # 业务服务
│   ├── Config.php        # 配置服务
│   └── Auth.php          # 认证服务
├── Middleware/           # 中间件
│   └── OperateMiddleware.php
├── Handler/              # 处理器
│   └── ManageHandler.php
└── app.json              # 模块配置文件
```

### 核心特性

1. **前后端一体化**: Vue 组件与 PHP 控制器同目录存放
2. **Resource 控制器**: 使用 `#[Resource]` 注解自动生成 RESTful API
3. **自动迁移**: 模型使用 `#[AutoMigrate]` 注解自动创建数据表
4. **注解驱动**: 路由、权限、事件监听器都通过注解配置

### 核心文件说明

#### app.json - 模块配置文件

模块配置文件主要用于定义默认菜单和云端分享配置：

```json
{
  "name": "duxweb/system",
  "description": "System Application",
  "version": "0.0.7",
  "phpDependencies": {
    "duxweb/dux-lite": "^2.0.13",
    "duxweb/dux-lite-cloud": "dev-main",
    "godruoyi/php-snowflake": "^3.2"
  },
  "adminMenu": [
    {
      "type": "menu",
      "label": "首页",
      "name": "system.index",
      "label_lang": "system.index",
      "path": "system/index",
      "icon": "i-tabler:dashboard",
      "loader": "System/Home/index",
      "hidden": false,
      "sort": 0
    },
    {
      "type": "directory",
      "label": "系统",
      "name": "system",
      "icon": "i-tabler:adjustments-cog",
      "sort": 9999,
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

#### App.php - 模块入口类

每个模块都有一个 `App.php` 文件，继承 `AppExtend` 类：

```php
<?php

namespace App\System;

use App\System\Middleware\OperateMiddleware;
use App\System\Models\SystemUser;
use Core\Api\ApiMiddleware;
use Core\App as CoreApp;
use Core\App\AppExtend;
use Core\Auth\AuthMiddleware;
use Core\Bootstrap;
use Core\Permission\PermissionMiddleware;
use Core\Resources\Resource;
use Core\Route\Route;

class App extends AppExtend
{
    public function init(Bootstrap $app): void
    {
        // 初始化资源配置
        CoreApp::resource()->set(
            "admin",
            (new Resource('admin', '/admin'))
                ->addAuthMiddleware(
                    new OperateMiddleware(SystemUser::class),
                    new PermissionMiddleware("admin", SystemUser::class),
                    new AuthMiddleware("admin")
                )
        );

        // 配置路由
        CoreApp::route()->set("web", new Route(""));
        CoreApp::route()->set("api", new Route("/api"));
    }

    public function register(Bootstrap $app): void
    {
        // 注册模块服务
        $app->set(SystemService::class, new SystemService());
    }

    public function boot(Bootstrap $app): void
    {
        // 启动时配置
    }
}
```

## 模块生命周期

### 1. 模块注册

模块通过 `config/app.toml` 文件注册：

```toml
# config/app.toml
registers = [
    "App\\Web\\App",
    "App\\System\\App",
    "App\\Data\\App"
]
```

### 2. 模块加载

DuxLite 框架的模块加载过程：

1. **读取注册配置** - 从 `config/app.toml` 读取模块列表
2. **模块初始化** - 调用每个模块的 `init()` 方法
3. **资源注册** - 注册 Resource 资源配置
4. **服务注册** - 调用每个模块的 `register()` 方法
5. **注解扫描** - 自动扫描和注册注解
6. **模块启动** - 调用每个模块的 `boot()` 方法

```php
// Bootstrap 类中的模块加载逻辑
public function loadApp(): void
{
    // 全局应用注册
    $appList = App::config("app")->get("registers", []);

    // 应用初始化触发
    foreach ($appList as $vo) {
        call_user_func([new $vo, "init"], $this);
    }

    // 应用注册触发
    foreach ($appList as $vo) {
        call_user_func([new $vo, "register"], $this);
    }

    // 注解资源注册
    App::resource()->registerAttribute();

    // 注解路由注册
    App::route()->registerAttribute();

    // 注册事件
    App::event()->registerAttribute();

    // 应用启动
    foreach ($appList as $vo) {
        call_user_func([new $vo, "boot"], $this);
    }
}
```

### 3. AppExtend 生命周期方法

每个模块的 `App.php` 类继承 `AppExtend`，提供三个生命周期方法：

```php
abstract class AppExtend
{
    /**
     * 模块初始化 - 配置资源和路由
     */
    public function init(Bootstrap $app): void
    {
        // 配置 Resource 资源
        // 配置路由应用
    }

    /**
     * 服务注册 - 注册模块服务到容器
     */
    public function register(Bootstrap $app): void
    {
        // 注册服务到依赖注入容器
        // 绑定接口实现
    }

    /**
     * 模块启动 - 执行启动逻辑
     */
    public function boot(Bootstrap $app): void
    {
        // 执行模块启动后的逻辑
        // 注册事件监听器等
    }
}
```

## 模块通信

### 1. 事件通信

模块间通过 DuxLite 事件系统进行松耦合通信：

```php
use Core\App;
use Core\Event\Attribute\Listener;

// 用户服务触发事件
class UserService
{
    public function register(array $userData): User
    {
        // 创建用户
        $user = User::create($userData);

        // 触发用户注册事件
        App::event()->dispatch('user.registered', $user);

        return $user;
    }
}

// 邮件模块监听事件
class EmailListener
{
    #[Listener('user.registered')]
    public function sendWelcomeEmail(User $user): void
    {
        // 发送欢迎邮件
        App::queue()->push(new SendWelcomeEmailJob($user->email));
    }
}

// 积分模块监听事件
class PointsListener
{
    #[Listener('user.registered')]
    public function giveWelcomePoints(User $user): void
    {
        // 赠送新用户积分
        $user->points()->create(['amount' => 100, 'reason' => '注册奖励']);
    }
}
```

### 2. 依赖注入

模块间通过依赖注入容器进行服务共享：

```php
// 在模块的 register() 方法中注册服务
public function register(Bootstrap $app): void
{
    $app->set(UserService::class, new UserService());
    $app->set(ConfigService::class, new ConfigService());
}

// 在其他模块中使用服务
class OrderController
{
    public function create(): ResponseInterface
    {
        $userService = App::di()->get(UserService::class);
        $user = $userService->getCurrentUser();

        // 处理订单逻辑
    }
}
```

### 3. Resource 资源系统

通过 Resource 系统实现模块间的资源共享：

```php
// 在模块初始化时配置资源
public function init(Bootstrap $app): void
{
    CoreApp::resource()->set(
        "admin",
        (new Resource('admin', '/admin'))
            ->addAuthMiddleware(
                new AuthMiddleware("admin"),
                new PermissionMiddleware("admin", SystemUser::class)
            )
    );
}

// 其他模块可以使用相同的资源配置
#[Resource(app: 'admin', route: '/article', name: 'article')]
class Article extends Resources
{
    protected string $model = ArticleModel::class;
}
```

## 模块开发

### 1. 创建新模块

创建一个新的模块目录结构：

```bash
# 创建模块目录
mkdir -p app/Article/{Admin,Models,Service}

# 创建模块入口文件
touch app/Article/App.php
touch app/Article/app.json
```

### 2. 模块入口类

创建 `app/Article/App.php`：

```php
<?php

namespace App\Article;

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
        // 注册模块服务
    }

    public function boot(Bootstrap $app): void
    {
        // 模块启动逻辑
    }
}
```

### 3. 注册模块

在 `config/app.toml` 中注册模块：

```toml
registers = [
    "App\\Web\\App",
    "App\\System\\App",
    "App\\Data\\App",
    "App\\Article\\App"  # 新增模块
]
```

### 4. 创建数据模型

创建 `app/Article/Models/Article.php`：

```php
<?php

namespace App\Article\Models;

use Core\Database\Model;
use Core\Database\Attribute\AutoMigrate;
use Illuminate\Database\Schema\Blueprint;

#[AutoMigrate]
class Article extends Model
{
    public $table = "article";

    public function migration(Blueprint $table)
    {
        $table->id();
        $table->string('title');
        $table->text('content');
        $table->string('status')->default('draft');
        $table->timestamps();
    }

    public function transform(): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'content' => $this->content,
            'status' => $this->status,
            'created_at' => $this->created_at->format('Y-m-d H:i:s'),
        ];
    }
}
```

### 5. 创建 Resource 控制器

创建 `app/Article/Admin/Article.php`：

```php
<?php

namespace App\Article\Admin;

use App\Article\Models\Article as ArticleModel;
use Core\Resources\Action\Resources;
use Core\Resources\Attribute\Resource;
use Illuminate\Database\Eloquent\Builder;

#[Resource(app: 'admin', route: '/article', name: 'article')]
class Article extends Resources
{
    protected string $model = ArticleModel::class;

    public function queryMany(Builder $query): void
    {
        $query->orderBy('created_at', 'desc');
    }

    public function transform(object $item): array
    {
        return $item->transform();
    }
}
```

### 6. 配置模块菜单

创建 `app/Article/app.json`：

```json
{
  "name": "duxweb/article",
  "description": "Article Management Module",
  "version": "1.0.0",
  "phpDependencies": {
    "duxweb/dux-lite": "^2.0.13"
  },
  "adminMenu": [
    {
      "type": "menu",
      "label": "文章管理",
      "name": "article.list",
      "path": "article",
      "icon": "i-tabler:article",
      "loader": "Article/Article/table",
      "sort": 200
    }
  ]
}
```

### 7. 创建前端组件

创建 `app/Article/Admin/Article/table.vue`：

```vue
<template>
  <div>
    <dux-table
      :columns="columns"
      :data="data"
      @create="handleCreate"
      @edit="handleEdit"
      @delete="handleDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const columns = ref([
  { key: 'id', title: 'ID', width: 80 },
  { key: 'title', title: '标题' },
  { key: 'status', title: '状态' },
  { key: 'created_at', title: '创建时间', width: 180 }
])

const data = ref([])

const handleCreate = () => {
  // 创建逻辑
}

const handleEdit = (row: any) => {
  // 编辑逻辑
}

const handleDelete = (row: any) => {
  // 删除逻辑
}
</script>
```

## 模块管理

### 1. 数据库同步

DuxLite 使用 `#[AutoMigrate]` 注解自动管理数据库：

```bash
# 同步所有模块的数据库结构
php dux db:sync

# 查看数据库迁移状态
php dux db:status
```

### 2. 路由管理

查看模块注册的路由：

```bash
# 查看所有路由
php dux route:list

# 查看特定模块的路由
php dux route:list --filter=article
```

### 3. 模块配置

通过 TOML 配置文件管理模块：

```toml
# config/use.toml
[app]
name = "我的应用"
debug = true

[article]
enabled = true
per_page = 20
cache_ttl = 3600
```

在代码中访问配置：

```php
// 获取模块配置
$enabled = App::config("use")->get("article.enabled", true);
$perPage = App::config("use")->get("article.per_page", 20);

// 在服务中使用配置
class ArticleService
{
    public function getList(): array
    {
        $perPage = App::config("use")->get("article.per_page", 20);
        return Article::paginate($perPage);
    }
}
```

## 最佳实践

### 1. 模块设计原则

- **单一职责**: 每个模块只负责一个特定功能领域
- **松耦合**: 模块间通过事件系统和依赖注入通信
- **高内聚**: 模块内部功能紧密相关
- **注解驱动**: 充分利用注解系统简化配置
- **前后端一体**: Vue 组件与控制器同目录存放

### 2. 命名规范

```php
// 命名空间遵循 PSR-4
namespace App\Article\Admin;

// 类名使用 PascalCase
class ArticleController

// 方法名使用 camelCase
public function queryMany()

// 常量使用 UPPER_CASE
const DEFAULT_STATUS = 'published';

// 数据库表名使用 snake_case
public $table = "article_category";
```

### 3. Resource 控制器最佳实践

```php
#[Resource(app: 'admin', route: '/article', name: 'article')]
class Article extends Resources
{
    protected string $model = ArticleModel::class;

    // 查询优化
    public function queryMany(Builder $query): void
    {
        $query->with(['category', 'author'])
              ->orderBy('created_at', 'desc');
    }

    // 数据转换
    public function transform(object $item): array
    {
        return $item->transform();
    }

    // 数据验证
    public function format(ValidatorData $data): array
    {
        return Validator::parser($data->toArray(), [
            'title' => [['required', '标题不能为空']],
            'content' => [['required', '内容不能为空']]
        ])->toArray();
    }
}
```

### 4. 事件系统使用

```php
// 在业务逻辑中触发事件
class ArticleService
{
    public function publish(Article $article): void
    {
        $article->update(['status' => 'published']);

        // 触发文章发布事件
        App::event()->dispatch('article.published', $article);
    }
}

// 使用监听器处理事件
class ArticleListener
{
    #[Listener('article.published')]
    public function handleArticlePublished(Article $article): void
    {
        // 清理缓存
        App::cache()->forget("article.{$article->id}");

        // 发送通知
        App::queue()->push(new ArticlePublishedNotification($article));
    }
}
```

## 总结

DuxLite 模块系统提供了：

1. **简洁的架构** - 基于 AppExtend 的三阶段生命周期
2. **注解驱动** - 自动注册路由、资源和事件监听器
3. **前后端一体** - Vue 组件与 PHP 控制器同目录存放
4. **松耦合通信** - 通过事件系统和依赖注入实现模块间通信
5. **自动化管理** - 数据库迁移、路由注册等自动化处理

掌握这些概念和最佳实践，将帮助您高效地开发可维护、可扩展的 DuxLite 应用。