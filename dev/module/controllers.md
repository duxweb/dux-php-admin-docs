# 控制器开发

DuxLite 使用 Resource 控制器模式，提供统一的 CRUD 操作和自动路由生成。本指南将通过实际示例介绍如何开发控制器。

## 什么是 Resource 控制器

Resource 控制器是 DuxLite 的核心特性，它：
- **自动生成路由**：基于注解自动注册 RESTful 路由
- **统一 CRUD 操作**：提供标准的增删改查方法
- **数据转换**：自动处理数据验证、格式化和转换
- **前后端一体**：与 Vue 组件无缝集成

## 控制器类型

DuxLite 中主要有两种控制器：

1. **Resource 控制器** - 标准的 CRUD 操作（推荐）
2. **普通控制器** - 自定义业务逻辑

## Resource 控制器开发

### 1. 创建基础 Resource 控制器

以用户管理为例，创建 `app/System/Admin/User.php`：

```php
<?php

namespace App\System\Admin;

use App\System\Models\SystemUser;
use Core\Resources\Action\Resources;
use Core\Resources\Attribute\Resource;
use Core\Validator\Data;
use Illuminate\Database\Eloquent\Builder;
use Psr\Http\Message\ServerRequestInterface;

#[Resource(app: 'admin', route: '/system/user', name: 'system.user')]
class User extends Resources
{
    protected string $model = SystemUser::class;

    // 查询处理 - 列表页面的筛选逻辑
    public function queryMany(Builder $query, ServerRequestInterface $request, array $args): void
    {
        $params = $request->getQueryParams();

        // 关键词搜索
        if ($params['keyword']) {
            $query->where('nickname', 'like', '%' . $params['keyword'] . '%');
        }

        // 状态筛选
        if (isset($params['status'])) {
            $query->where('status', $params['status']);
        }
    }

    // 数据转换 - 列表和详情页面的数据格式
    public function transform(object $item): array
    {
        return [
            "id" => $item->id,
            "username" => $item->username,
            "nickname" => $item->nickname,
            "status" => (bool)$item->status,
            "created_at" => $item->created_at?->format('Y-m-d H:i:s'),
        ];
    }

    // 数据验证 - 创建和更新时的验证规则
    public function validator(array $data, ServerRequestInterface $request, array $args): array
    {
        return [
            "nickname" => ["required", '昵称不能为空'],
            "username" => ["required", '用户名不能为空'],
            "password" => ["requiredWithout", "id", '密码不能为空'],
        ];
    }

    // 数据格式化 - 保存到数据库前的数据处理
    public function format(Data $data, ServerRequestInterface $request, array $args): array
    {
        $formatData = [
            "nickname" => $data->nickname,
            "username" => $data->username,
            "status" => $data->status ?? true,
        ];

        // 密码加密
        if ($data->password) {
            $formatData['password'] = password_hash($data->password, PASSWORD_BCRYPT);
        }

        return $formatData;
    }
}
```

**核心方法说明：**
- `queryMany()`：处理列表查询的筛选条件
- `transform()`：转换数据格式，用于前端显示
- `validator()`：验证提交的数据
- `format()`：格式化数据，用于保存到数据库

### 2. Resource 注解配置

`#[Resource]` 注解用于配置控制器的基本信息：

```php
#[Resource(
    app: 'admin',                    // 应用类型：admin（管理后台）
    route: '/system/user',           // 路由前缀
    name: 'system.user'              // 路由名称前缀
)]
```

**自动生成的路由：**
- `GET /admin/system/user` → `index()` 获取列表
- `GET /admin/system/user/{id}` → `show()` 获取详情
- `POST /admin/system/user` → `store()` 创建数据
- `PUT /admin/system/user/{id}` → `update()` 更新数据
- `DELETE /admin/system/user/{id}` → `destroy()` 删除数据

### 3. 自定义查询逻辑

```php
public function queryMany(Builder $query, ServerRequestInterface $request, array $args): void
{
    $params = $request->getQueryParams();

    // 关键词搜索（多字段）
    if ($params['keyword']) {
        $query->where(function($q) use ($params) {
            $q->where('nickname', 'like', '%' . $params['keyword'] . '%')
              ->orWhere('username', 'like', '%' . $params['keyword'] . '%');
        });
    }

    // 状态筛选
    if (isset($params['status'])) {
        $query->where('status', $params['status']);
    }

    // 日期范围筛选
    if ($params['start_date']) {
        $query->where('created_at', '>=', $params['start_date']);
    }
    if ($params['end_date']) {
        $query->where('created_at', '<=', $params['end_date']);
    }

    // 关联查询
    $query->with(['role', 'dept']);
}
```

### 4. 数据验证

```php
public function validator(array $data, ServerRequestInterface $request, array $args): array
{
    return [
        // 基础验证
        "title" => ["required", "标题不能为空"],
        "content" => ["required", "内容不能为空"],

        // 长度验证
        "nickname" => ["required", "max:50", "昵称不能为空", "昵称不能超过50个字符"],

        // 唯一性验证（更新时排除当前记录）
        "username" => ["required", "unique:system_users,username," . ($args['id'] ?? 'NULL'), "用户名不能为空", "用户名已存在"],

        // 条件验证
        "password" => ["requiredWithout", "id", "密码不能为空"],

        // 数值验证
        "age" => ["integer", "min:1", "max:120", "年龄必须是数字", "年龄不能小于1", "年龄不能大于120"],

        // 枚举验证
        "status" => ["in:0,1", "状态值无效"],

        // 正则验证
        "phone" => ["regex:/^1[3-9]\d{9}$/", "手机号格式不正确"],
    ];
}
```

### 5. 数据格式化

```php
public function format(Data $data, ServerRequestInterface $request, array $args): array
{
    $formatData = [
        "nickname" => $data->nickname,
        "username" => $data->username,
        "status" => $data->status ?? true,
    ];

    // 使用服务层处理可复用的逻辑
    if ($data->password) {
        $formatData['password'] = UserService::hashPassword($data->password);
    }

    // 使用服务层处理文件上传
    if ($data->avatar) {
        $formatData['avatar'] = Storage::upload($data->avatar, 'avatars');
    }

    // 非公用的业务逻辑直接写在控制器中
    if ($data->birthday) {
        $formatData['birthday'] = date('Y-m-d', strtotime($data->birthday));
    }

    // 处理用户特定的设置
    if ($data->settings) {
        $settings = is_array($data->settings) ? $data->settings : json_decode($data->settings, true);

        // 验证设置项
        $allowedSettings = ['theme', 'language', 'notifications'];
        $validSettings = array_intersect_key($settings, array_flip($allowedSettings));

        $formatData['settings'] = json_encode($validSettings);
    }

    // 设置默认头像（如果没有上传）
    if (!isset($formatData['avatar'])) {
        $formatData['avatar'] = UserService::generateAvatar($data->nickname);
    }

    return $formatData;
}
```

### 6. 自定义业务方法

当需要处理特定的业务逻辑时，可以在控制器中添加自定义方法：

```php
<?php

namespace App\System\Admin;

use App\System\Models\SystemUser;
use Core\Resources\Action\Resources;
use Core\Resources\Attribute\Resource;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

#[Resource(app: 'admin', route: '/system/user', name: 'system.user')]
class User extends Resources
{
    protected string $model = SystemUser::class;

    /**
     * 重置用户密码
     */
    public function resetPassword(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $id = $args['id'];
        $user = SystemUser::find($id);

        if (!$user) {
            throw new \Exception('用户不存在');
        }

        // 生成随机密码
        $newPassword = $this->generateRandomPassword();

        // 更新密码
        $user->password = UserService::hashPassword($newPassword);
        $user->save();

        // 发送邮件通知（如果需要复用，可以提取到服务层）
        $this->sendPasswordResetEmail($user, $newPassword);

        return $this->json($response, [
            'message' => '密码重置成功',
            'new_password' => $newPassword
        ]);
    }

    /**
     * 生成随机密码
     */
    private function generateRandomPassword(): string
    {
        $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        return substr(str_shuffle($chars), 0, 8);
    }

    /**
     * 发送密码重置邮件
     */
    private function sendPasswordResetEmail(SystemUser $user, string $password): void
    {
        // 发送邮件的逻辑
        // 如果多个地方需要发送邮件，可以提取到 EmailService
        $subject = '密码重置通知';
        $content = "您的新密码是：{$password}";

        // 发送邮件...
    }
}
```

## 普通控制器开发

### 1. 自定义业务控制器

当 Resource 控制器无法满足需求时，可以创建普通控制器，使用 `RouteGroup` 注解：

```php
<?php

namespace App\System\Admin;

use App\System\Service\Config;
use App\System\Service\UserService;
use Core\Route\Attribute\Route;
use Core\Route\Attribute\RouteGroup;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

#[RouteGroup(app: 'admin', route: '/system/dashboard')]
class Dashboard
{
    /**
     * 仪表盘首页
     */
    #[Route(methods: 'GET', route: '')]
    public function index(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        // 使用静态方法获取统计数据
        $stats = UserService::getStats();

        // 获取系统配置
        $settings = [
            'site_name' => Config::get('site.name', 'DuxLite'),
            'maintenance' => Config::get('system.maintenance', false),
        ];

        $data = [
            'stats' => $stats,
            'settings' => $settings,
        ];

        return sendJson($response, $data);
    }

    /**
     * 系统信息
     */
    #[Route(methods: 'GET', route: '/info')]
    public function info(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $info = [
            'php_version' => PHP_VERSION,
            'framework_version' => '2.0.0',
            'server_time' => date('Y-m-d H:i:s'),
        ];

        return sendJson($response, $info);
    }

    /**
     * 清除缓存
     */
    #[Route(methods: 'POST', route: '/cache/clear')]
    public function clearCache(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        try {
            // 清除缓存逻辑
            $cacheCleared = true; // 实际的清除缓存操作

            return sendJson($response, ['message' => '缓存清除成功']);
        } catch (\Exception $e) {
            throw new \Exception('缓存清除失败：' . $e->getMessage());
        }
    }
}
```

### 2. Web 控制器

用于处理传统的 Web 页面请求：

```php
<?php

namespace App\System\Web;

use App\System\Service\Config;
use Core\Route\Attribute\Route;
use Core\Route\Attribute\RouteGroup;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

#[RouteGroup(app: 'web', route: '/')]
class Home
{
    /**
     * 首页
     */
    #[Route(methods: 'GET', route: '')]
    public function index(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $data = [
            'title' => '欢迎使用 DuxLite',
            'content' => '这是首页内容',
        ];

        // 渲染 HTML 页面
        return sendText($response, $this->renderPage($data));
    }

    /**
     * 关于页面
     */
    #[Route(methods: 'GET', route: '/about')]
    public function about(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $data = [
            'title' => '关于我们',
            'content' => Config::get('about.content', '这是关于页面的内容...'),
        ];

        return sendText($response, $this->renderPage($data));
    }

    /**
     * 简单的页面渲染
     */
    private function renderPage(array $data): string
    {
        return "
        <!DOCTYPE html>
        <html>
        <head>
            <title>{$data['title']}</title>
        </head>
        <body>
            <h1>{$data['title']}</h1>
            <p>{$data['content']}</p>
        </body>
        </html>
        ";
    }
}
```

## 前端组件配套

### 1. 表单组件

创建 `app/System/Admin/User/form.vue`：

```vue
<script setup>
import { DuxFormItem, DuxModalForm } from '@duxweb/dvha-pro'
import { NInput, NSwitch } from 'naive-ui'
import { ref } from 'vue'

const props = defineProps({
  id: {
    type: [String, Number],
    required: false,
  },
})

const model = ref({
  status: true,
})
</script>

<template>
  <DuxModalForm :id="props.id" path="system/user" :data="model">
    <DuxFormItem label="用户名">
      <NInput v-model:value="model.username" />
    </DuxFormItem>
    <DuxFormItem label="昵称">
      <NInput v-model:value="model.nickname" />
    </DuxFormItem>
    <DuxFormItem label="密码" description="不修改请留空">
      <NInput v-model:value="model.password" type="password" />
    </DuxFormItem>
    <DuxFormItem label="状态">
      <NSwitch v-model:value="model.status" />
    </DuxFormItem>
  </DuxModalForm>
</template>
```

### 2. 列表组件

创建 `app/System/Admin/User/table.vue`：

```vue
<script setup>
import { DuxTable } from '@duxweb/dvha-pro'
</script>

<template>
  <DuxTable path="system/user">
    <template #search>
      <!-- 搜索表单 -->
    </template>

    <template #action>
      <!-- 操作按钮 -->
    </template>
  </DuxTable>
</template>
```

## 开发流程

### 1. 创建控制器

```bash
# 创建控制器文件
touch app/Blog/Admin/Article.php
```

### 2. 编写控制器代码

```php
<?php

namespace App\Blog\Admin;

use App\Blog\Models\BlogArticle;
use Core\Resources\Action\Resources;
use Core\Resources\Attribute\Resource;

#[Resource(app: 'admin', route: '/blog/article', name: 'blog.article')]
class Article extends Resources
{
    protected string $model = BlogArticle::class;

    // 实现必要的方法...
}
```

### 3. 创建前端组件

```bash
# 创建组件目录和文件
mkdir -p app/Blog/Admin/Article
touch app/Blog/Admin/Article/form.vue
touch app/Blog/Admin/Article/table.vue
```

### 4. 创建 API 控制器

如果需要 API 接口，可以创建普通控制器：

```php
<?php

namespace App\Blog\Api;

use App\Blog\Models\BlogArticle;
use Core\Route\Attribute\Route;
use Core\Route\Attribute\RouteGroup;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

#[RouteGroup(app: 'api', route: '/api/articles')]
class Article
{
    /**
     * 获取文章列表
     */
    #[Route(methods: 'GET', route: '')]
    public function index(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $params = $request->getQueryParams();

        $articles = BlogArticle::where('status', 1)
            ->when($params['keyword'] ?? null, function($query, $keyword) {
                $query->where('title', 'like', "%{$keyword}%");
            })
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get();

        return sendJson($response, $articles);
    }

    /**
     * 获取文章详情
     */
    #[Route(methods: 'GET', route: '/{id}')]
    public function show(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $id = $args['id'];
        $article = BlogArticle::find($id);

        if (!$article) {
            throw new \Exception('文章不存在');
        }

        return sendJson($response, $article);
    }
}
```

### 5. 配置菜单

在 `app/Blog/app.json` 中添加菜单配置：

```json
{
    "adminMenu": [
        {
            "type": "menu",
            "label": "文章管理",
            "name": "blog.article.list",
            "path": "blog/article",
            "loader": "Blog/Article/table"
        }
    ]
}
```

## 最佳实践

### 1. 服务层调用

**✅ 推荐：使用静态方法调用服务**
```php
public function format(Data $data, ServerRequestInterface $request, array $args): array
{
    $formatData = [
        "nickname" => $data->nickname,
        "username" => $data->username,
    ];

    // 使用静态方法调用服务
    if ($data->password) {
        $formatData['password'] = UserService::hashPassword($data->password);
    }

    // 处理文件上传
    if ($data->avatar) {
        $formatData['avatar'] = StorageService::upload($data->avatar, 'avatars');
    }

    return $formatData;
}
```

**❌ 避免：使用依赖注入和对象实例**
```php
// 不推荐的方式
public function __construct(
    private UserService $userService,
    private StorageService $storageService
) {}

public function format(Data $data, ServerRequestInterface $request, array $args): array
{
    // 使用对象实例调用
    $result = $this->userService->create($data);
    return $result;
}
```

### 2. 错误处理

**✅ 推荐：直接抛出异常**
```php
public function format(Data $data, ServerRequestInterface $request, array $args): array
{
    // 验证用户名唯一性
    if (UserService::existsByUsername($data->username, $args['id'] ?? null)) {
        throw new \Exception('用户名已存在');
    }

    // 验证邮箱格式
    if (!filter_var($data->email, FILTER_VALIDATE_EMAIL)) {
        throw new \Exception('邮箱格式不正确');
    }

    return [
        "username" => $data->username,
        "email" => $data->email,
    ];
}
```

**❌ 避免：返回错误响应**
```php
// 不推荐的方式
public function format(Data $data, ServerRequestInterface $request, array $args): array
{
    if (UserService::existsByUsername($data->username)) {
        return ['error' => '用户名已存在']; // 错误的做法
    }

    return $data;
}
```

### 3. 数据验证

**保持验证规则简洁明了：**
```php
public function validator(array $data, ServerRequestInterface $request, array $args): array
{
    return [
        "title" => ["required", "标题不能为空"],
        "email" => ["required", "email", "邮箱不能为空", "邮箱格式不正确"],
        "status" => ["in:0,1", "状态值无效"],
    ];
}
```
```

## 常见问题

### 1. 路由不生效

**问题**：创建了控制器但访问 404

**解决**：
1. 检查 `#[Resource]` 注解配置是否正确
2. 确认模块已在 `config/app.php` 中注册
3. 运行 `php dux route:list` 查看路由是否注册成功

### 2. 数据验证失败

**问题**：提交数据时验证不通过

**解决**：
1. 检查 `validator()` 方法中的验证规则
2. 确认前端提交的字段名与验证规则匹配
3. 查看错误日志获取详细信息

### 3. 数据转换问题

**问题**：前端显示的数据格式不正确

**解决**：
1. 检查 `transform()` 方法的返回格式
2. 确认关联查询是否正确加载
3. 验证日期时间格式化是否正确

## 总结

DuxLite 控制器开发的核心要点：

### Resource 控制器特点
- **自动路由生成**：基于注解自动注册 RESTful 路由
- **统一 CRUD 操作**：提供标准的增删改查方法
- **数据处理流程**：查询 → 验证 → 格式化 → 转换
- **前后端一体**：与 Vue 组件无缝集成

### 开发流程
1. **创建控制器**：继承 `Resources` 类，添加 `#[Resource]` 注解
2. **定义模型**：设置 `$model` 属性指向对应的模型类
3. **实现方法**：根据需要实现 `queryMany`、`transform`、`validator`、`format` 方法
4. **创建组件**：在同级目录创建对应的 Vue 组件
5. **配置菜单**：在 `app.json` 中配置菜单项

### DuxLite 开发理念
- **静态方法优先**：服务层使用静态方法，避免依赖注入的复杂性
- **异常处理**：直接抛出异常，而不是返回错误响应
- **简洁明了**：保持代码简单直接，易于理解和维护
- **IDE 友好**：静态方法提供更好的代码提示和类型推断

### 最佳实践
- **服务调用**：使用 `UserService::method()` 而不是依赖注入
- **错误处理**：在 `format()` 和 `validator()` 中直接 `throw new \Exception()`
- **数据验证**：保持验证规则简洁明了
- **业务逻辑分层**：
  - **可复用的逻辑** → 提取到服务层
  - **特定的业务逻辑** → 直接写在控制器中

### 开发建议
- 优先使用 Resource 控制器，满足大部分 CRUD 需求
- 保持控制器方法简洁，专注于数据处理
- 充分利用注解简化配置
- 与前端组件保持同步开发
- 遵循 DuxLite 的简洁设计理念

掌握这些要点，你就能高效地开发出功能完整、易维护的控制器。接下来我们将学习模型与数据库的开发。

