# 缓存配置

Dux PHP Admin 基于 DuxLite 框架的缓存系统，采用 Symfony Cache 组件，支持文件和 Redis 两种缓存驱动，实现了 PSR-16 简单缓存接口标准。

## 支持的缓存驱动

### 文件缓存（默认）
- **存储位置**: `data/cache/` 目录
- **适用场景**: 开发环境、小型应用
- **特点**: 无需额外依赖，配置简单

### Redis 缓存
- **存储位置**: Redis 服务器
- **适用场景**: 生产环境、高并发应用
- **特点**: 高性能、支持分布式、丰富的数据结构

## 缓存配置

### 基础配置

在 `config/use.toml` 中配置缓存：

```toml
[cache]
# 缓存类型：file（文件缓存）或 redis（Redis缓存）
type = "file"

# 缓存前缀（避免命名冲突）
prefix = "duxlite_"

# 默认缓存生存时间（秒，0表示永不过期）
defaultLifetime = 3600
```

### 文件缓存配置

```toml
[cache]
type = "file"
prefix = "app_cache_"
defaultLifetime = 7200
```

**存储目录**: `data/cache/`
- 目录会自动创建
- 确保 Web 服务器有读写权限

### Redis 缓存配置

```toml
[cache]
type = "redis"
prefix = "cache:"
defaultLifetime = 3600
```

需要在 `config/database.toml` 中配置 Redis 连接：

```toml
[redis.drivers.default]
host = "localhost"
port = 6379
password = ""
database = 1
timeout = 2.5
optPrefix = "cache_"
```

## 缓存使用

### 获取缓存实例

```php
use Core\App;

// 获取默认缓存（从配置文件读取类型）
$cache = App::cache();

// 获取指定类型的缓存
$fileCache = App::cache('file');
$redisCache = App::cache('redis');
```

### 基本操作

#### 设置缓存

```php
$cache = App::cache();

// 设置缓存，默认生存时间
$cache->set('user:123', $userData);

// 设置缓存，指定生存时间（秒）
$cache->set('user:123', $userData, 3600); // 1小时

// 永久缓存
$cache->set('config:site', $siteConfig, 0);
```

#### 获取缓存

```php
// 获取缓存
$userData = $cache->get('user:123');

// 获取缓存，设置默认值
$userData = $cache->get('user:123', []);

// 检查缓存是否存在
if ($cache->has('user:123')) {
    $userData = $cache->get('user:123');
}
```

#### 删除缓存

```php
// 删除单个缓存
$cache->delete('user:123');

// 清空所有缓存
$cache->clear();
```

#### 批量操作

```php
// 批量获取
$keys = ['user:123', 'user:456', 'user:789'];
$users = $cache->getMultiple($keys);

// 批量设置
$values = [
    'user:123' => $userData1,
    'user:456' => $userData2
];
$cache->setMultiple($values, 3600);

// 批量删除
$cache->deleteMultiple(['user:123', 'user:456']);
```

## 缓存实践

### 应用缓存示例

#### 用户数据缓存

```php
<?php

namespace App\System\Service;

use Core\App;
use App\System\Models\SystemUser;

class UserCacheService
{
    private $cache;

    public function __construct()
    {
        $this->cache = App::cache();
    }

    public function getUserById(int $id): ?array
    {
        $key = "user:{$id}";
        
        // 尝试从缓存获取
        $user = $this->cache->get($key);
        
        if ($user === null) {
            // 缓存未命中，从数据库获取
            $userModel = SystemUser::find($id);
            
            if ($userModel) {
                $user = $userModel->toArray();
                // 缓存 2 小时
                $this->cache->set($key, $user, 7200);
            }
        }
        
        return $user;
    }

    public function updateUser(int $id, array $data): bool
    {
        // 更新数据库
        $result = SystemUser::where('id', $id)->update($data);
        
        if ($result) {
            // 删除缓存，下次访问时重新缓存
            $this->cache->delete("user:{$id}");
        }
        
        return $result;
    }
}
```

#### 配置数据缓存

```php
<?php

namespace App\System\Service;

use Core\App;
use App\System\Models\Config;

class ConfigCacheService
{
    private $cache;

    public function __construct()
    {
        $this->cache = App::cache();
    }

    public function getConfig(string $key, $default = null)
    {
        $cacheKey = "config:{$key}";
        
        $value = $this->cache->get($cacheKey);
        
        if ($value === null) {
            $config = Config::where('key', $key)->first();
            $value = $config ? $config->value : $default;
            
            // 配置缓存 24 小时
            $this->cache->set($cacheKey, $value, 86400);
        }
        
        return $value;
    }

    public function setConfig(string $key, $value): bool
    {
        // 更新数据库
        $result = Config::updateOrCreate(
            ['key' => $key],
            ['value' => $value]
        );
        
        if ($result) {
            // 更新缓存
            $this->cache->set("config:{$key}", $value, 86400);
        }
        
        return (bool)$result;
    }

    public function clearConfigCache(): void
    {
        // 这里需要实现清除所有配置缓存的逻辑
        // 简单方式是清除全部缓存
        $this->cache->clear();
    }
}
```

### 缓存键命名规范

建议使用统一的命名规范：

```php
class CacheKeys
{
    // 用户相关
    public const USER_INFO = 'user:%d';                    // user:123
    public const USER_PERMISSIONS = 'user:%d:permissions'; // user:123:permissions
    public const USER_MENU = 'user:%d:menu';              // user:123:menu
    
    // 角色相关
    public const ROLE_INFO = 'role:%d';                    // role:1
    public const ROLE_PERMISSIONS = 'role:%d:permissions'; // role:1:permissions
    
    // 配置相关
    public const CONFIG = 'config:%s';                     // config:site_name
    public const MENU_TREE = 'menu:tree';                  // 菜单树
    
    // 统计相关
    public const STATS_USERS = 'stats:users';              // 用户统计
    public const STATS_TODAY = 'stats:today';              // 今日统计

    public static function userInfo(int $id): string
    {
        return sprintf(self::USER_INFO, $id);
    }

    public static function userPermissions(int $id): string
    {
        return sprintf(self::USER_PERMISSIONS, $id);
    }

    public static function config(string $key): string
    {
        return sprintf(self::CONFIG, $key);
    }
}
```

### 缓存生存时间策略

```php
class CacheTTL
{
    // 时间常量（秒）
    public const MINUTE = 60;
    public const HOUR = 3600;
    public const DAY = 86400;
    public const WEEK = 604800;

    // 业务缓存时间
    public const USER_INFO = self::HOUR * 2;        // 用户信息：2小时
    public const USER_PERMISSIONS = self::HOUR * 6; // 用户权限：6小时
    public const CONFIG_DATA = self::DAY;            // 配置数据：1天
    public const MENU_DATA = self::DAY;              // 菜单数据：1天
    public const STATS_DATA = self::HOUR;            // 统计数据：1小时
    public const SESSION_DATA = self::MINUTE * 30;   // 会话数据：30分钟
}
```

## 缓存管理命令

虽然框架没有内置缓存管理命令，但可以通过 `app:cache` 命令清理应用缓存：

```bash
# 清理应用缓存
php dux app:cache
```

### 自定义缓存管理

可以在控制器中实现缓存管理功能：

```php
<?php

namespace App\System\Admin;

use Core\App;
use Core\Resources\Attribute\Resource;
use Core\Resources\Attribute\Action;

#[Resource(app: 'admin', route: '/cache', name: 'cache')]
class CacheController
{
    #[Action(methods: 'DELETE', route: '/clear')]
    public function clear(): array
    {
        $cache = App::cache();
        $cache->clear();
        
        return [
            'message' => '缓存已清理'
        ];
    }

    #[Action(methods: 'GET', route: '/info')]
    public function info(): array
    {
        $config = App::config('use');
        $cacheType = $config->get('cache.type', 'file');
        
        $info = [
            'type' => $cacheType,
            'prefix' => $config->get('cache.prefix', ''),
            'defaultLifetime' => $config->get('cache.defaultLifetime', 3600)
        ];
        
        if ($cacheType === 'file') {
            $cacheDir = base_path('data/cache');
            $info['directory'] = $cacheDir;
            $info['writable'] = is_writable($cacheDir);
        }
        
        return $info;
    }
}
```

## 性能优化

### 缓存预热

在系统启动或定期任务中预热重要缓存：

```php
class CacheWarmer
{
    private $cache;

    public function __construct()
    {
        $this->cache = App::cache();
    }

    public function warmUp(): void
    {
        // 预热系统配置
        $this->warmUpConfigs();
        
        // 预热菜单数据
        $this->warmUpMenus();
        
        // 预热活跃用户数据
        $this->warmUpActiveUsers();
    }

    private function warmUpConfigs(): void
    {
        $configs = Config::all();
        foreach ($configs as $config) {
            $key = CacheKeys::config($config->key);
            $this->cache->set($key, $config->value, CacheTTL::CONFIG_DATA);
        }
    }

    private function warmUpMenus(): void
    {
        $menus = Menu::with('children')->where('parent_id', 0)->get();
        $this->cache->set(CacheKeys::MENU_TREE, $menus->toArray(), CacheTTL::MENU_DATA);
    }

    private function warmUpActiveUsers(): void
    {
        $activeUsers = SystemUser::where('status', 1)
            ->where('last_login_at', '>=', now()->subDays(7))
            ->limit(100)
            ->get();

        foreach ($activeUsers as $user) {
            $key = CacheKeys::userInfo($user->id);
            $this->cache->set($key, $user->toArray(), CacheTTL::USER_INFO);
        }
    }
}
```

### 缓存穿透防护

```php
class CacheGuard
{
    private $cache;

    public function __construct()
    {
        $this->cache = App::cache();
    }

    public function remember(string $key, callable $callback, int $ttl = 3600)
    {
        $value = $this->cache->get($key);
        
        if ($value === null) {
            $value = $callback();
            
            if ($value !== null) {
                $this->cache->set($key, $value, $ttl);
            } else {
                // 缓存空值，防止缓存穿透
                $this->cache->set($key . ':null', true, 300); // 5分钟
            }
        }
        
        return $value;
    }

    public function has(string $key): bool
    {
        return $this->cache->has($key) || $this->cache->has($key . ':null');
    }
}
```

## 常见问题

### 1. 文件缓存权限问题

```bash
# 检查缓存目录权限
ls -la data/cache/

# 设置正确权限
chmod -R 755 data/cache/
chown -R www-data:www-data data/cache/
```

### 2. Redis 连接问题

```bash
# 检查 Redis 服务状态
redis-cli ping

# 检查配置文件
cat config/database.toml | grep -A 10 "\[redis"
```

### 3. 缓存不生效

```php
// 测试缓存功能
$cache = App::cache();
$cache->set('test_key', 'test_value', 60);
$value = $cache->get('test_key');
echo $value; // 应该输出 'test_value'
```

### 4. 内存使用过高

- 检查缓存键命名是否合理
- 避免缓存大对象
- 设置合适的过期时间
- 定期清理过期缓存

通过合理配置和使用缓存系统，可以显著提升应用性能和响应速度。