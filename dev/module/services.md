# 服务层开发

服务层主要用于处理**可复用的业务方法**。如果业务逻辑只在一个控制器中使用，应该直接写在控制器里；只有多个地方需要复用的逻辑，才需要提取到服务层。

## 什么时候使用服务层

### ✅ 需要使用服务层的场景

- **多个控制器共用的业务逻辑**
- **复杂的数据处理和计算**
- **第三方 API 调用**
- **文件处理和上传**
- **缓存操作**
- **配置管理**

### ❌ 不需要使用服务层的场景

- **简单的 CRUD 操作**（直接在控制器中处理）
- **只在一个地方使用的业务逻辑**
- **简单的数据验证**（在控制器的 validator 方法中处理）

## 服务层设计原则

1. **静态方法优先** - 使用静态方法，避免依赖注入
2. **功能单一** - 每个服务类处理特定领域的业务
3. **简洁明了** - 保持方法简单直接
4. **异常处理** - 直接抛出异常，不返回错误

## 实际服务示例

### 1. 用户服务

处理用户相关的复用业务逻辑：

```php
<?php

namespace App\System\Service;

use App\System\Models\SystemUser;
use Core\App;

class UserService
{
    /**
     * 验证用户名是否存在
     */
    public static function existsByUsername(string $username, ?int $excludeId = null): bool
    {
        $query = SystemUser::where('username', $username);

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        return $query->exists();
    }

    /**
     * 密码加密
     */
    public static function hashPassword(string $password): string
    {
        return password_hash($password, PASSWORD_BCRYPT);
    }

    /**
     * 验证密码
     */
    public static function verifyPassword(string $password, string $hash): bool
    {
        return password_verify($password, $hash);
    }

    /**
     * 生成用户头像
     */
    public static function generateAvatar(string $name): string
    {
        // 生成默认头像逻辑
        $colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
        $color = $colors[crc32($name) % count($colors)];

        return "https://ui-avatars.com/api/?name=" . urlencode($name) . "&background=" . ltrim($color, '#');
    }

    /**
     * 获取用户统计信息
     */
    public static function getStats(): array
    {
        return [
            'total' => SystemUser::count(),
            'active' => SystemUser::where('status', 1)->count(),
            'today' => SystemUser::whereDate('created_at', today())->count(),
        ];
    }
}
```

### 2. 存储服务

处理文件上传和存储：

```php
<?php

namespace App\System\Service;

use Core\App;

class Storage
{
    /**
     * 上传文件
     */
    public static function upload($file, string $path = 'uploads'): string
    {
        if (!$file) {
            throw new \Exception('文件不能为空');
        }

        // 验证文件
        self::validateFile($file);

        // 生成文件名
        $filename = self::generateFilename($file);

        // 创建目录
        $uploadPath = public_path($path);
        if (!is_dir($uploadPath)) {
            mkdir($uploadPath, 0755, true);
        }

        // 移动文件
        $filePath = $uploadPath . '/' . $filename;
        if (!move_uploaded_file($file['tmp_name'], $filePath)) {
            throw new \Exception('文件上传失败');
        }

        return "/{$path}/{$filename}";
    }

    /**
     * 删除文件
     */
    public static function delete(string $filePath): bool
    {
        $fullPath = public_path($filePath);

        if (file_exists($fullPath)) {
            return unlink($fullPath);
        }

        return true;
    }

    /**
     * 验证文件
     */
    private static function validateFile($file): void
    {
        $maxSize = 10 * 1024 * 1024; // 10MB
        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];

        if ($file['size'] > $maxSize) {
            throw new \Exception('文件大小不能超过 10MB');
        }

        if (!in_array($file['type'], $allowedTypes)) {
            throw new \Exception('不支持的文件类型');
        }
    }

    /**
     * 生成文件名
     */
    private static function generateFilename($file): string
    {
        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        return date('YmdHis') . '_' . uniqid() . '.' . $extension;
    }
}
```

### 3. 配置服务

处理系统配置的读取和设置：

```php
<?php

namespace App\System\Service;

use App\System\Models\SystemConfig;
use Core\App;

class Config
{
    /**
     * 获取配置值
     */
    public static function get(string $key, $default = null)
    {
        $config = SystemConfig::where('key', $key)->first();

        if (!$config) {
            return $default;
        }

        return json_decode($config->value, true) ?? $config->value;
    }

    /**
     * 设置配置值
     */
    public static function set(string $key, $value): void
    {
        $jsonValue = is_array($value) ? json_encode($value) : $value;

        SystemConfig::updateOrCreate(
            ['key' => $key],
            ['value' => $jsonValue]
        );

        // 清除缓存
        App::cache()->forget("config:{$key}");
    }

    /**
     * 批量设置配置
     */
    public static function setMany(array $configs): void
    {
        foreach ($configs as $key => $value) {
            self::set($key, $value);
        }
    }

    /**
     * 删除配置
     */
    public static function delete(string $key): void
    {
        SystemConfig::where('key', $key)->delete();
        App::cache()->forget("config:{$key}");
    }
}
```

    /**
     * 删除文章
     */
    public function delete(int $id): bool
    {
        $article = $this->repository->findOrFail($id);

        return $this->transaction(function () use ($article) {
            // 软删除文章
            $result = $this->repository->delete($article->id);

            // 清除缓存
            $this->clearCache($article->id);

            // 触发事件
            $this->events->dispatch(new ArticleDeleted($article));

            // 记录日志
            $this->info('文章删除成功', [
                'article_id' => $article->id,
                'title' => $article->title,
                'user_id' => auth()->id()
            ]);

            return $result;
        });
    }

    /**
     * 批量操作
     */
    public function batchOperation(string $action, array $ids): array
    {
        $results = ['success' => [], 'failed' => []];

        foreach ($ids as $id) {
            try {
                switch ($action) {
                    case 'delete':
                        $this->delete($id);
                        break;
                    case 'publish':
                        $this->updateStatus($id, true);
                        break;
                    case 'unpublish':
                        $this->updateStatus($id, false);
                        break;
                    default:
                        throw new \InvalidArgumentException("不支持的操作: {$action}");
                }

                $results['success'][] = $id;

            } catch (\Exception $e) {
                $results['failed'][] = [
                    'id' => $id,
                    'error' => $e->getMessage()
                ];

                $this->error('批量操作失败', [
                    'action' => $action,
                    'id' => $id,
                    'error' => $e->getMessage()
                ]);
            }
        }

        return $results;
    }

    /**
     * 增加浏览量
     */
    public function incrementViews(int $id): void
    {
        // 使用队列异步处理，避免影响响应速度
        dispatch(function () use ($id) {
            $this->repository->incrementViews($id);
            $this->cache->forget("article:detail:{$id}");
        });
    }

    /**
     * 更新状态
     */
    public function updateStatus(int $id, bool $status): Article
    {
        $data = ['status' => $status];
        
        if ($status) {
            $data['published_at'] = now();
        }

        return $this->update($id, $data);
    }

    /**
     * 生成唯一的 slug
     */
    private function generateSlug(string $title): string
    {
        $baseSlug = \Str::slug($title);
        $slug = $baseSlug;
        $counter = 1;

        while ($this->repository->existsBySlug($slug)) {
            $slug = $baseSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }

    /**
     * 附加标签
     */
    private function attachTags(Article $article, array $tags): void
    {
        $tagIds = [];
        
        foreach ($tags as $tagName) {
            $tag = \App\YourModule\Models\Tag::firstOrCreate(['name' => $tagName]);
            $tagIds[] = $tag->id;
        }

        $article->tags()->attach($tagIds);
    }

    /**
     * 同步标签
     */
    private function syncTags(Article $article, array $tags): void
    {
        $tagIds = [];
        
        foreach ($tags as $tagName) {
            $tag = \App\YourModule\Models\Tag::firstOrCreate(['name' => $tagName]);
            $tagIds[] = $tag->id;
        }

        $article->tags()->sync($tagIds);
    }

    /**
     * 清除缓存
     */
    private function clearCache(?int $articleId = null): void
    {
        // 清除列表缓存
        $this->cache->tags(['articles'])->flush();

        // 清除特定文章缓存
        if ($articleId) {
            $this->cache->forget("article:detail:{$articleId}");
        }
    }
}
```

## 在控制器中使用服务

### Resource 控制器中使用

```php
<?php

namespace App\System\Admin;

use App\System\Models\SystemUser;
use App\System\Service\UserService;
use App\System\Service\Storage;
use Core\Resources\Action\Resources;
use Core\Resources\Attribute\Resource;
use Core\Validator\Data;

#[Resource(app: 'admin', route: '/system/user', name: 'system.user')]
class User extends Resources
{
    protected string $model = SystemUser::class;

    public function validator(array $data, ServerRequestInterface $request, array $args): array
    {
        // 在验证中使用服务层方法
        if (UserService::existsByUsername($data['username'], $args['id'] ?? null)) {
            throw new \Exception('用户名已存在');
        }

        return [
            "username" => ["required", "用户名不能为空"],
            "nickname" => ["required", "昵称不能为空"],
        ];
    }

    public function format(Data $data, ServerRequestInterface $request, array $args): array
    {
        $formatData = [
            "username" => $data->username,
            "nickname" => $data->nickname,
        ];

        // 使用服务层处理密码
        if ($data->password) {
            $formatData['password'] = UserService::hashPassword($data->password);
        }

        // 使用服务层处理文件上传
        if ($data->avatar) {
            $formatData['avatar'] = Storage::upload($data->avatar, 'avatars');
        }

        // 生成默认头像
        if (!isset($formatData['avatar'])) {
            $formatData['avatar'] = UserService::generateAvatar($data->nickname);
        }

        return $formatData;
    }
}
```

## 普通控制器中使用

```php
<?php

namespace App\System\Admin;

use App\System\Service\Config;
use App\System\Service\UserService;
use Core\Resources\Action\Action;
use Core\Resources\Attribute\Resource;

#[Resource(app: 'admin', route: '/system/dashboard', name: 'system.dashboard')]
class Dashboard extends Action
{
    public function index(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        // 使用服务层获取统计数据
        $stats = UserService::getStats();

        // 使用配置服务获取设置
        $settings = [
            'site_name' => Config::get('site.name', 'DuxLite'),
            'maintenance' => Config::get('system.maintenance', false),
        ];

        $data = [
            'stats' => $stats,
            'settings' => $settings,
        ];

        return $this->json($response, $data);
    }
}
```

## 最佳实践

### 1. 什么时候创建服务

**✅ 应该创建服务的情况：**
- 多个控制器需要相同的业务逻辑
- 复杂的数据处理和计算
- 第三方 API 调用
- 文件上传和处理
- 系统配置管理

**❌ 不需要创建服务的情况：**
- 简单的数据库查询（直接在控制器中处理）
- 只在一个地方使用的逻辑
- 简单的数据验证（在控制器的 validator 中处理）

### 2. 服务设计原则

- **静态方法优先**：避免依赖注入的复杂性
- **功能单一**：每个服务类处理特定领域
- **异常处理**：直接抛出异常，不返回错误
- **简洁明了**：保持方法简单直接

### 3. 命名规范

- 服务类名：`UserService`、`Storage`、`Config`
- 方法名：使用动词开头，如 `get`、`set`、`upload`、`delete`
- 文件位置：`app/模块名/Service/服务名.php`

## 总结

DuxLite 服务层开发要点：

### 核心理念
- **按需创建**：只有需要复用的业务逻辑才提取到服务层
- **静态方法**：使用静态方法，保持简洁
- **直接异常**：错误处理直接抛出异常

### 常见服务类型
- **用户服务**：用户相关的复用逻辑
- **存储服务**：文件上传和管理
- **配置服务**：系统配置的读写
- **工具服务**：通用的工具方法

### 开发建议
- 先在控制器中实现功能
- 发现需要复用时再提取到服务层
- 保持服务方法简单直接
- 充分利用静态方法的便利性

遵循这些原则，你可以构建出简洁、实用的服务层。接下来我们将学习模型与数据库的开发。

