# 权限管理

DuxLite 的权限系统完全自动化，通过 Resource 控制器的 `name` 属性自动生成权限名称，权限中间件自动处理权限检查，无需手动定义权限。

## 🚀 快速开始

### 自动权限整合

基于实际的 dux-lite 代码，权限系统完全自动化：

```php
<?php

namespace App\System\Admin;

use Core\Resources\Action\Resources;
use Core\Resources\Attribute\Resource;

#[Resource(app: "admin", route: "/system/user", name: "system.user")]
class User extends Resources
{
    protected string $model = \App\System\Models\SystemUser::class;

    // ✨ 框架自动完成：
    // 1. 自动添加 AuthMiddleware('admin') 认证中间件
    // 2. 自动添加 PermissionMiddleware('system.user', SystemUser::class) 权限中间件
    // 3. 自动生成权限：admin.system.user.list, admin.system.user.create 等
    // 4. 自动注册路由和权限到系统

    // 无需定义 permission() 方法，一切都是自动的！
}
```

### 自动生成的权限名称

权限名称由 `app.name.method` 组成，完全自动生成：

- `admin.system.user.list` - 用户列表权限
- `admin.system.user.store` - 用户添加权限
- `admin.system.user.show` - 用户详情权限
- `admin.system.user.edit` - 用户编辑权限
- `admin.system.user.delete` - 用户删除权限

### 自动权限检查

权限中间件会根据路由名称自动检查对应权限，完全无需手动配置。

## 📋 权限中间件配置

### 权限中间件参数

基于 `app/System/App.php` 的实际配置：

```php
<?php

namespace App\System;

use Core\Permission\PermissionMiddleware;
use Core\Resources\Resource;
use Core\App as CoreApp;

class App extends AppExtend
{
    public function init(Bootstrap $app): void
    {
        // 配置权限中间件
        CoreApp::resource()->set(
            "admin",
            (new Resource('admin', '/admin'))
                ->addAuthMiddleware(
                    new OperateMiddleware(SystemUser::class),
                    new PermissionMiddleware("admin", SystemUser::class), // 权限中间件配置
                    new AuthMiddleware("admin")
                )
        );
    }
}
```

### PermissionMiddleware 构造函数参数

```php
new PermissionMiddleware(
    name: "admin",                    // 权限名称前缀
    model: SystemUser::class          // 用户模型类名
)
```

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `name` | `string` | ✅ | 权限名称前缀，通常是应用名称 |
| `model` | `string` | ✅ | 用户模型类名，用于获取用户权限列表 |

### 标准 CRUD 权限

```php
<?php

namespace App\Content\Admin;

use Core\Resources\Action\Resources;
use Core\Resources\Attribute\Resource;

#[Resource(app: "admin", route: "/content/article", name: "content.article")]
class Article extends Resources
{
    protected string $model = \App\Content\Models\Article::class;

    // ✨ 自动生成的标准权限：
    // - admin.content.article.list
    // - admin.content.article.show
    // - admin.content.article.create
    // - admin.content.article.edit
    // - admin.content.article.store
    // - admin.content.article.delete

    // 权限中间件会自动检查这些权限！
}
```

### 自定义 Action 权限

```php
<?php

namespace App\Content\Admin;

use Core\Resources\Action\Resources;
use Core\Resources\Attribute\Resource;
use Core\Resources\Attribute\Action;

#[Resource(app: "admin", route: "/content/article", name: "content.article")]
class Article extends Resources
{
    protected string $model = \App\Content\Models\Article::class;

    // 自定义操作会自动生成权限
    #[Action(['POST'], '/publish', name: 'publish')]
    public function publish(int $id): array
    {
        // 权限中间件会自动检查 admin.content.article.publish 权限
        // 业务逻辑...
        return success('发布成功');
    }

    #[Action(['POST'], '/audit', name: 'audit')]
    public function audit(int $id): array
    {
        // 权限中间件会自动检查 admin.content.article.audit 权限
        // 业务逻辑...
        return success('审核完成');
    }
}
```

### 跳过权限检查

```php
#[Action(['GET'], '/public', name: 'public', can: false)]
public function getPublicInfo(): array
{
    // 跳过权限检查的公开接口
    return success('公开信息');
}
```

### 获取当前用户认证信息

```php
public function update(int $id): array
{
    // 获取当前用户认证信息
    $auth = request()->getAttribute('auth');
    $userId = $auth['id'];

    // 业务逻辑...
    return $this->saveData($id);
}
```

## 🔧 权限中间件工作原理

### 权限中间件源码解析

基于 `src/Permission/PermissionMiddleware.php` 的实际代码：

```php
<?php

namespace Core\Permission;

class PermissionMiddleware
{
    public function __construct(
        public string $name,    // 权限名称前缀，如 "admin"
        public string $model    // 用户模型类名，如 SystemUser::class
    ) {}

    public function __invoke(Request $request, RequestHandler $handler): Response
    {
        // 1. 检查认证状态
        $auth = Attribute::getRequestParams($request, "auth");
        if ($auth !== null && !$auth) {
            return $handler->handle($request); // 跳过权限检查
        }

        // 2. 检查是否跳过权限检查
        $can = Attribute::getRequestParams($request, "can");
        if ($can !== null && !$can) {
            return $handler->handle($request); // 跳过权限检查
        }

        // 3. 获取路由名称
        $route = RouteContext::fromRequest($request)->getRoute();
        $routeName = $route->getName(); // 如：admin.system.user.list

        // 4. 执行权限检查
        Can::check($request, $this->model, $routeName);

        return $handler->handle($request);
    }
}
```

### 权限检查流程

1. **认证检查**：确保用户已通过认证
2. **跳过检查**：检查是否设置了 `can: false`
3. **路由解析**：获取当前路由名称
4. **权限获取**：从用户模型获取权限列表
5. **权限匹配**：检查路由名称是否在用户权限中
6. **访问控制**：允许或拒绝访问

### 多应用权限配置

```php
<?php

namespace App\System;

class App extends AppExtend
{
    public function init(Bootstrap $app): void
    {
        // 管理后台权限配置
        CoreApp::resource()->set(
            "admin",
            (new Resource('admin', '/admin'))
                ->addAuthMiddleware(
                    new PermissionMiddleware("admin", SystemUser::class)
                )
        );

        // API 权限配置
        CoreApp::resource()->set(
            "api",
            (new Resource('api', '/api'))
                ->addAuthMiddleware(
                    new PermissionMiddleware("api", ApiUser::class)
                )
        );

        // 前台用户权限配置
        CoreApp::resource()->set(
            "web",
            (new Resource('web', '/web'))
                ->addAuthMiddleware(
                    new PermissionMiddleware("web", WebUser::class)
                )
        );
    }
}
```

### 手动配置权限中间件

如果需要在特定路由上手动配置权限中间件：

```php
<?php

use Core\Route\Route;
use Core\Permission\PermissionMiddleware;
use Core\Auth\AuthMiddleware;

// 创建带权限中间件的路由
$route = new Route('/admin', 'admin',
    new AuthMiddleware('admin'),
    new PermissionMiddleware('admin', SystemUser::class)
);

App::route()->set('admin', $route);
```

### 路由组权限配置

```php
<?php

use Slim\Routing\RouteCollectorProxy;

// 路由组配置权限中间件
$app->group('/api/admin', function (RouteCollectorProxy $group) {
    $group->get('/users', UserController::class . ':list');
    $group->post('/users', UserController::class . ':create');
})
->add(new PermissionMiddleware('admin.user', SystemUser::class))
->add(new AuthMiddleware('admin'));
```

### 单个路由权限配置

```php
<?php

// 单个路由配置权限中间件
$app->get('/api/profile', ProfileController::class . ':show')
   ->add(new PermissionMiddleware('user.profile', User::class))
   ->add(new AuthMiddleware('user'));
```

### 条件权限检查

```php
<?php

namespace App\Content\Admin;

use Core\Resources\Action\Resources;
use Core\Resources\Attribute\Resource;

#[Resource(app: "admin", route: "/content/article", name: "content.article")]
class Article extends Resources
{
    // 重写方法添加额外业务权限检查
    public function edit(int $id): array
    {
        // 基础权限已由中间件检查 (admin.content.article.edit)

        // 获取当前用户认证信息
        $auth = request()->getAttribute('auth');
        $userId = $auth['id'];

        // 获取文章信息
        $article = $this->model::find($id);

        // 检查是否为文章作者（业务权限）
        if ($article->user_id !== $userId) {
            return error('只能编辑自己的文章');
        }

        return $this->saveData($id);
    }
}
```

### 多个自定义 Action

```php
<?php

namespace App\Workflow\Admin;

use Core\Resources\Action\Resources;
use Core\Resources\Attribute\Resource;
use Core\Resources\Attribute\Action;

#[Resource(app: "admin", route: "/workflow/process", name: "workflow.process")]
class Process extends Resources
{
    // 每个 Action 都会自动生成对应权限
    #[Action(['POST'], '/draft', name: 'setDraft')]
    public function setDraft(int $id): array
    {
        // 自动检查 admin.workflow.process.setDraft 权限
        return $this->updateStatus($id, 'draft');
    }

    #[Action(['POST'], '/active', name: 'setActive')]
    public function setActive(int $id): array
    {
        // 自动检查 admin.workflow.process.setActive 权限
        return $this->updateStatus($id, 'active');
    }

    #[Action(['POST'], '/suspend', name: 'setSuspend')]
    public function setSuspend(int $id): array
    {
        // 自动检查 admin.workflow.process.setSuspend 权限
        return $this->updateStatus($id, 'suspended');
    }

    private function updateStatus(int $id, string $status): array
    {
        // 业务逻辑...
        return success('状态更新成功');
    }
}
```

## 🎯 实际应用示例

### 用户管理权限

基于 `app/System/Admin/User.php` 的实际实现：

```php
<?php

namespace App\System\Admin;

use Core\Resources\Action\Resources;
use Core\Resources\Attribute\Resource;
use Core\Resources\Attribute\Action;

#[Resource(app: "admin", route: "/system/user", name: "system.user")]
class User extends Resources
{
    protected string $model = \App\System\Models\SystemUser::class;

    // ✨ 自动生成的标准权限：
    // - admin.system.user.list
    // - admin.system.user.show
    // - admin.system.user.create
    // - admin.system.user.edit
    // - admin.system.user.store
    // - admin.system.user.delete

    // 自定义操作会自动生成权限
    #[Action(['POST'], '/reset-password', name: 'resetPassword')]
    public function resetPassword(int $id): array
    {
        // 权限中间件自动检查 admin.system.user.resetPassword 权限
        $newPassword = $this->generateRandomPassword();

        $this->model::where('id', $id)->update([
            'password' => password_hash($newPassword, PASSWORD_DEFAULT)
        ]);

        return success('密码重置成功', ['new_password' => $newPassword]);
    }

    #[Action(['POST'], '/change-status', name: 'changeStatus')]
    public function changeStatus(int $id): array
    {
        // 权限中间件自动检查 admin.system.user.changeStatus 权限
        $user = $this->model::find($id);
        $user->status = !$user->status;
        $user->save();

        return success('状态修改成功');
    }

    private function generateRandomPassword(): string
    {
        return substr(str_shuffle('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'), 0, 8);
    }
}
```

## 💡 最佳实践

### 1. 权限中间件配置规范

```php
// ✅ 推荐的权限中间件配置
class App extends AppExtend
{
    public function init(Bootstrap $app): void
    {
        // 按应用分组配置权限中间件
        CoreApp::resource()->set(
            "admin",
            (new Resource('admin', '/admin'))
                ->addAuthMiddleware(
                    new OperateMiddleware(SystemUser::class),    // 操作日志中间件
                    new PermissionMiddleware("admin", SystemUser::class), // 权限中间件
                    new AuthMiddleware("admin")                  // 认证中间件
                )
        );
    }
}
```

### 2. 权限命名规范

```php
// ✅ 好的 Resource 命名
#[Resource(app: "admin", route: "/system/user", name: "system.user")]     // 系统模块
#[Resource(app: "admin", route: "/content/article", name: "content.article")] // 内容模块
#[Resource(app: "admin", route: "/finance/order", name: "finance.order")]     // 财务模块

// ✅ 好的 Action 命名
#[Action(['POST'], '/export', name: 'export')]           // 清晰的功能
#[Action(['POST'], '/import', name: 'import')]           // 标准的操作
#[Action(['POST'], '/reset-password', name: 'resetPassword')] // 具体的业务
```

### 3. 权限层次结构

```php
// 自动生成的权限层次结构
// admin.system.user.list      - 系统用户列表
// admin.system.user.create    - 系统用户创建
// admin.system.user.export    - 系统用户导出
// admin.content.article.list  - 内容文章列表
// admin.content.article.audit - 内容文章审核
```

### 4. 权限中间件参数最佳实践

```php
// ✅ 正确的参数配置
new PermissionMiddleware("admin", SystemUser::class)     // 管理后台
new PermissionMiddleware("api", ApiUser::class)          // API 接口
new PermissionMiddleware("web", WebUser::class)          // 前台用户

// ❌ 避免的配置
new PermissionMiddleware("admin.user", SystemUser::class) // 过于具体
new PermissionMiddleware("", SystemUser::class)           // 空名称
```

### 5. 跳过权限的场景

```php
// 公开接口跳过权限检查
#[Action(['GET'], '/public-stats', name: 'publicStats', can: false)]
public function getPublicStats(): array
{
    return success('公开统计数据');
}

// 内部接口跳过权限检查
#[Action(['POST'], '/internal-sync', name: 'internalSync', can: false)]
public function internalSync(): array
{
    // 内部系统调用，跳过权限检查
    return success('同步完成');
}
```

### 6. 权限中间件调试

```php
// 调试权限检查
public function debugPermission(): array
{
    $auth = request()->getAttribute('auth');
    $route = RouteContext::fromRequest(request())->getRoute();
    $routeName = $route->getName();

    return success('权限调试信息', [
        'user_id' => $auth['id'],
        'route_name' => $routeName,
        'required_permission' => $routeName,
        'user_permissions' => $auth['permissions'] ?? []
    ]);
}
```

## 🎉 总结

DuxLite 权限系统的特点：

- **🚀 完全自动化**：无需手动定义权限，一切都是自动的
- **🔗 深度整合**：与 Resource 控制器无缝集成
- **📝 零配置**：通过注解自动生成权限名称
- **🎯 路由级控制**：基于路由名称的精确权限控制
- **🔧 灵活扩展**：支持自定义 Action 和权限跳过
- **⚙️ 中间件驱动**：通过 PermissionMiddleware 自动处理权限检查

### 权限中间件核心要点

1. **构造参数**：`new PermissionMiddleware($name, $model)`
   - `$name`：权限名称前缀（如 "admin"）
   - `$model`：用户模型类名（如 SystemUser::class）

2. **自动检查**：基于路由名称自动检查对应权限
3. **跳过机制**：支持 `can: false` 跳过权限检查
4. **多应用支持**：不同应用可配置不同的权限中间件

通过 Resource 的 `name` 属性和 PermissionMiddleware 的配置，你可以零配置构建完整的权限体系！
