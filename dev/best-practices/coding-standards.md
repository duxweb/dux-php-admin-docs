# 代码规范

基于 dux-php-admin 实际项目的代码规范和开发实践。

## 🚀 核心规范

### 属性驱动开发

使用 PHP 8+ 属性定义路由和资源：

```php
<?php

namespace App\System\Admin;

use App\System\Models\SystemUser;
use Core\Resources\Action\Resources;
use Core\Resources\Attribute\Resource;

#[Resource(app: 'admin', route: '/system/user', name: 'system.user')]
class User extends Resources
{
    protected string $model = SystemUser::class;

    public function transform(object $item): array
    {
        return [
            'id' => $item->id,
            'username' => $item->username,
            'status' => (bool)$item->status,
            'created_at' => $item->created_at?->format('Y-m-d H:i:s'),
        ];
    }
}
```

### 模型定义

使用 AutoMigrate 属性自动创建数据表：

```php
<?php

namespace App\System\Models;

use Core\Database\Eloquent\Model;
use Core\Database\Attribute\AutoMigrate;
use Illuminate\Database\Schema\Blueprint;

#[AutoMigrate]
class SystemUser extends Model
{
    public $table = "system_user";

    public function migration(Blueprint $table)
    {
        $table->id();
        $table->string('username')->unique()->comment('用户名');
        $table->string('password')->comment('密码');
        $table->boolean('status')->default(true)->comment('状态');
        $table->timestamps();
    }

    protected $fillable = ['username', 'password', 'status'];
    protected $hidden = ['password'];
    protected $casts = ['status' => 'boolean'];
}
```

### 服务类

静态方法处理业务逻辑：

```php
<?php

namespace App\System\Service;

class UserService
{
    /**
     * 创建用户
     */
    public static function createUser(array $data): array
    {
        // 验证数据
        if (empty($data['username'])) {
            throw new \Exception('用户名不能为空');
        }

        // 创建用户
        $user = SystemUser::create([
            'username' => $data['username'],
            'password' => password_hash($data['password'], PASSWORD_DEFAULT),
            'status' => true
        ]);

        return ['id' => $user->id, 'username' => $user->username];
    }
}
```

## 📋 命名规范

### 文件和类名
- **控制器**: `User.php` (不用 Controller 后缀)
- **模型**: `SystemUser.php` (表名前缀 + 单数)
- **服务**: `UserService.php`
- **中间件**: `AuthMiddleware.php`

### 方法名
- **查询**: `queryMany()`, `queryOne()`
- **操作**: `store()`, `delete()`
- **转换**: `transform()`
- **验证**: `validate()`

### 数据库字段
- **表名**: `system_user` (模块_功能)
- **字段**: `created_at`, `updated_at` (下划线)
- **外键**: `user_id`, `role_id`

## 🛡️ 安全实践

### 数据验证

```php
public function store(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
{
    $data = $request->getParsedBody();

    // 验证必填字段
    if (empty($data['username'])) {
        return error($response, '用户名不能为空');
    }

    // 创建数据
    $user = $this->model::create($data);

    return success($response, '创建成功', $this->transform($user));
}
```

### 权限检查

```php
use App\System\Service\Auth;

public function delete(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
{
    // 检查权限
    if (!Auth::check($request, 'system.user.delete')) {
        return error($response, '无权限操作', null, 403);
    }

    $id = (int)$args['id'];
    $this->model::destroy($id);

    return success($response, '删除成功');
}
```

## ⚡ 性能优化

### 查询优化

```php
// ✅ 使用预加载避免 N+1 问题
$users = SystemUser::with(['roles'])->get();

// ✅ 只查询需要的字段
$users = SystemUser::select(['id', 'username', 'status'])->get();

// ✅ 使用分页
public function queryMany(Builder $query, ServerRequestInterface $request, array $args): void
{
    $query->select(['id', 'username', 'status', 'created_at']);
}
```

### 缓存使用

```php
use Core\Cache\Cache;

// 缓存配置数据
$config = Cache::remember('system_config', 3600, function() {
    return Config::getJsonValue('system', []);
});
```

## 🔧 配置管理

### TOML 配置

基于 `config/use.toml` 的实际配置：

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

### 环境配置

- **开发环境**: `config/use.dev.toml`
- **生产环境**: `config/use.toml`
- **数据库配置**: `config/database.toml`

## 🧪 测试规范

### 单元测试

```php
<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;
use App\System\Service\UserService;

class UserServiceTest extends TestCase
{
    public function testCreateUser()
    {
        $userData = [
            'username' => 'testuser',
            'password' => '123456'
        ];

        $result = UserService::createUser($userData);

        $this->assertArrayHasKey('id', $result);
        $this->assertEquals('testuser', $result['username']);
    }
}
```

## 🎉 总结

DuxLite 代码规范要点：

- **属性驱动**: 使用 PHP 8+ 属性定义路由和模型
- **自动迁移**: 模型中定义数据表结构
- **静态服务**: 业务逻辑使用静态方法
- **安全优先**: 数据验证和权限检查
- **性能优化**: 查询优化和缓存使用

遵循这些规范可以写出简洁、安全、高效的代码！