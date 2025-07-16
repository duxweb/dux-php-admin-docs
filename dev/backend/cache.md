# 缓存系统

DuxLite 提供了简单易用的缓存系统，帮助你提升应用性能。

## 🚀 快速开始

### 基础使用

```php
use Core\App;

// 设置缓存
App::cache()->set("user:1", $userData, 3600); // 缓存1小时

// 获取缓存
$userData = App::cache()->get("user:1");

// 检查缓存是否存在
if (App::cache()->has("user:1")) {
    // 缓存存在
}

// 删除缓存
App::cache()->delete("user:1");

// 清空所有缓存
App::cache()->clear();
```

## �� 缓存配置

### 配置文件

在 `config/use.toml` 中配置缓存：

```toml
[cache]
# 缓存驱动：file, redis, memory
driver = "redis"

# Redis 配置
[cache.redis]
host = "127.0.0.1"
port = 6379
database = 0
password = ""
prefix = "dux_cache:"

# 文件缓存配置
[cache.file]
path = "storage/cache"
```

## 🔧 实际应用示例

### 在服务层使用缓存

基于 `app/System/Service/Config.php` 的实际代码：

```php
<?php

namespace App\System\Service;

use Core\App;
use App\System\Models\Config as ConfigModel;

class Config
{
    private static ?array $config = null;

    public static function getValue(string $name, mixed $default = null): mixed
    {
        $config = self::getConfig();
        
        if (str_contains($name, ".")) {
            $parts = explode(".", $name, 2);
            $config = $config[$parts[0]];
            $name = $parts[1];
            if (is_string($config) && json_validate($config)) {
                $config = json_decode($config, true);
            }
        }
        
        return data_get($config, $name, $default);
    }

    private static function getConfig(): array
    {
        if (self::$config !== null) {
            return self::$config;
        }

        // 尝试从缓存获取
        $cacheKey = "system:config";
        $config = App::cache()->get($cacheKey);
        
        if ($config === null) {
            // 从数据库加载配置
            $configs = ConfigModel::all();
            $config = [];
            
            foreach ($configs as $item) {
                $config[$item->name] = $item->value;
            }
            
            // 缓存配置数据
            App::cache()->set($cacheKey, $config, 3600); // 缓存1小时
        }
        
        self::$config = $config;
        return $config;
    }
    
    public static function clearCache(): void
    {
        App::cache()->delete("system:config");
        self::$config = null;
    }
}
```

### 菜单缓存示例

基于 `app/System/Models/SystemMenu.php` 的实际代码：

```php
<?php

namespace App\System\Models;

use Core\App;

class SystemMenu extends Model
{
    public static function getMenu(string $app): array
    {
        $cacheKey = "system.menu." . $app;
        
        // 尝试从缓存获取
        $cache = App::cache()->get($cacheKey);
        if ($cache) {
            return $cache;
        }
        
        // 生成菜单数据
        $menu = self::formatMenu($app);
        
        // 缓存菜单数据
        App::cache()->set($cacheKey, $menu, 7200); // 缓存2小时
        
        return $menu;
    }

    public static function clearMenu(string $app): void
    {
        App::cache()->delete("system.menu." . $app);
    }

    private static function formatMenu(string $app): array
    {
        $menus = self::scoped(["app" => $app])
            ->with("parent")
            ->defaultOrder()
            ->get();
            
        // 格式化菜单数据...
        return $formattedMenus;
    }
}
```

## 🎯 缓存策略

### 1. 缓存键命名规范

```php
// 推荐的缓存键命名方式
$userKey = "user:{$userId}";                    // 用户信息
$userStatsKey = "user:stats";                   // 用户统计
$articleListKey = "articles:category:{$catId}"; // 分类文章列表
$configKey = "system:config";                   // 系统配置
$menuKey = "system.menu.{$app}";               // 菜单数据
```

### 2. 缓存时间设置

```php
// 不同类型数据的推荐缓存时间
App::cache()->set("user:profile", $data, 3600);     // 用户资料 - 1小时
App::cache()->set("system:config", $data, 3600);    // 系统配置 - 1小时
App::cache()->set("system.menu.admin", $data, 7200); // 菜单数据 - 2小时
App::cache()->set("article:list", $data, 1800);     // 文章列表 - 30分钟
App::cache()->set("stats:daily", $data, 300);       // 统计数据 - 5分钟
```

## 💡 最佳实践

### 1. 缓存粒度控制

```php
// ✅ 好的做法 - 细粒度缓存
App::cache()->set("user:{$id}", $user, 3600);
App::cache()->set("user:{$id}:permissions", $permissions, 1800);

// ❌ 避免 - 粗粒度缓存
App::cache()->set("all_users", $allUsers, 3600); // 数据量大，更新频繁
```

### 2. 缓存穿透防护

```php
public static function getUserById(int $id): ?SystemUser
{
    $cacheKey = "user:{$id}";
    
    // 检查缓存
    if (App::cache()->has($cacheKey)) {
        $user = App::cache()->get($cacheKey);
        // 即使是 null 也要缓存，防止缓存穿透
        return $user === "NULL" ? null : $user;
    }
    
    // 查询数据库
    $user = SystemUser::find($id);
    
    // 缓存结果（包括 null 结果）
    App::cache()->set($cacheKey, $user ?: "NULL", 300);
    
    return $user;
}
```

## 🎉 总结

DuxLite 缓存系统的特点：

- **🚀 简单易用**：统一的 API 接口，易于上手
- **🔧 多驱动支持**：支持 Redis、文件等多种缓存驱动
- **⚡ 高性能**：优化的缓存策略和过期机制
- **🛡️ 防护机制**：内置缓存穿透防护
- **📊 实际应用**：基于真实项目代码的最佳实践

合理使用缓存可以显著提升应用性能，记住要注意缓存一致性和及时更新！
