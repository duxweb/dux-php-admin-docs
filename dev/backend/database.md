# 模型与数据库

DuxLite 基于 Eloquent ORM 提供强大的数据库操作功能。本文档重点介绍模型定义、数据库迁移和高级查询技巧。

> 💡 **提示**: 基础的 CRUD 操作请参考 [API 开发](api.md) 文档中的 Resource 控制器部分。

## 🚀 模型定义

### 自动迁移模型

基于 `app/System/Models/SystemUser.php` 的实际代码：

```php
<?php

namespace App\YourModule\Models;

use Core\Database\Eloquent\Model;
use Core\Database\Attribute\AutoMigrate;
use Illuminate\Database\Schema\Blueprint;

#[AutoMigrate]
class User extends Model
{
    public $table = "users";

    // 数据库迁移定义
    public function migration(Blueprint $table)
    {
        $table->id();
        $table->string('username')->unique()->comment('用户名');
        $table->string('nickname')->comment('昵称');
        $table->string('password')->comment('密码');
        $table->string('avatar')->nullable()->comment('头像');
        $table->string('tel')->nullable()->comment('电话');
        $table->string('email')->nullable()->comment('邮箱');
        $table->boolean('status')->default(true)->comment('状态');
        $table->timestamps();
    }

    // 可批量赋值字段
    protected $fillable = [
        'username',
        'nickname',
        'password',
        'avatar',
        'tel',
        'email',
        'status'
    ];

    // 隐藏字段
    protected $hidden = [
        'password'
    ];

    // 类型转换
    protected $casts = [
        'status' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];
}

## 📋 模型定义

### 基础模型

```php
<?php

namespace App\YourModule\Models;

use Core\Database\Eloquent\Model;

class Article extends Model
{
    // 表名（可选，默认为类名的复数形式）
    protected $table = 'articles';

    // 主键（可选，默认为 'id'）
    protected $primaryKey = 'id';

    // 可批量赋值的字段
    protected $fillable = [
        'title',
        'content',
        'status',
        'user_id',
        'category_id'
    ];

    // 隐藏字段（不会出现在数组或 JSON 中）
    protected $hidden = [
        'deleted_at'
    ];

    // 字段类型转换
    protected $casts = [
        'published_at' => 'datetime',
        'is_featured' => 'boolean',
        'meta' => 'array'
    ];

    // 时间戳字段（可选）
    public $timestamps = true;

    // 软删除（可选）
    use SoftDeletes;
}
```

### 模型关联

```php
<?php

namespace App\YourModule\Models;

use Core\Database\Eloquent\Model;

class Article extends Model
{
    /**
     * 文章属于用户（一对一）
     */
    public function user()
    {
        return $this->belongsTo(SystemUser::class, 'user_id');
    }

    /**
     * 文章属于分类（一对一）
     */
    public function category()
    {
        return $this->belongsTo(Category::class, 'category_id');
    }

    /**
     * 文章有多个评论（一对多）
     */
    public function comments()
    {
        return $this->hasMany(Comment::class, 'article_id');
    }

    /**
     * 文章有多个标签（多对多）
     */
    public function tags()
    {
        return $this->belongsToMany(Tag::class, 'article_tags', 'article_id', 'tag_id');
    }
}

class User extends Model
{
    /**
     * 用户有多篇文章（一对多）
     */
    public function articles()
    {
        return $this->hasMany(Article::class, 'user_id');
    }

    /**
     * 用户资料（一对一）
     */
    public function profile()
    {
        return $this->hasOne(UserProfile::class, 'user_id');
    }
}
```

## 🔧 高级查询

### 复杂条件查询

```php
// 多条件查询
$articles = Article::where('status', 1)
    ->where('published_at', '<=', now())
    ->whereIn('category_id', [1, 2, 3])
    ->orderBy('created_at', 'desc')
    ->limit(10)
    ->get();

// 或条件查询
$articles = Article::where('status', 1)
    ->orWhere('is_featured', true)
    ->get();

// 子查询
$popularArticles = Article::whereIn('id', function ($query) {
    $query->select('article_id')
        ->from('article_views')
        ->where('views', '>', 1000);
})->get();

// 原生 SQL 查询
$results = DB::select('SELECT * FROM articles WHERE status = ?', [1]);
```

### 关联查询

```php
// 预加载关联数据（避免 N+1 问题）
$articles = Article::with(['user', 'category', 'tags'])->get();

// 条件预加载
$articles = Article::with(['comments' => function ($query) {
    $query->where('status', 1)->orderBy('created_at', 'desc');
}])->get();

// 关联条件查询
$articles = Article::whereHas('user', function ($query) {
    $query->where('status', 1);
})->get();

// 统计关联数据
$users = User::withCount('articles')->get();
```

### 聚合查询

```php
// 基础聚合
$totalArticles = Article::count();
$avgViews = Article::avg('views');
$maxViews = Article::max('views');
$minViews = Article::min('views');
$sumViews = Article::sum('views');

// 分组聚合
$categoryStats = Article::select('category_id')
    ->selectRaw('COUNT(*) as article_count')
    ->selectRaw('AVG(views) as avg_views')
    ->groupBy('category_id')
    ->get();
```

## 🎯 实际应用示例

### 用户管理服务

```php
<?php

namespace App\System\Service;

use App\System\Models\SystemUser;
use Core\Database\DB;

class UserService
{
    /**
     * 获取用户列表
     */
    public static function getUsers(array $filters = [], int $page = 1, int $limit = 10): array
    {
        $query = SystemUser::query();

        // 应用过滤条件
        if (!empty($filters['keyword'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('username', 'like', '%' . $filters['keyword'] . '%')
                  ->orWhere('email', 'like', '%' . $filters['keyword'] . '%');
            });
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['role_id'])) {
            $query->whereHas('roles', function ($q) use ($filters) {
                $q->where('id', $filters['role_id']);
            });
        }

        // 分页查询
        $total = $query->count();
        $users = $query->with(['roles', 'department'])
            ->orderBy('created_at', 'desc')
            ->offset(($page - 1) * $limit)
            ->limit($limit)
            ->get();

        return [
            'data' => $users,
            'total' => $total,
            'page' => $page,
            'limit' => $limit
        ];
    }

    /**
     * 创建用户
     */
    public static function createUser(array $data): SystemUser
    {
        return DB::transaction(function () use ($data) {
            // 创建用户
            $user = SystemUser::create([
                'username' => $data['username'],
                'email' => $data['email'],
                'password' => password_hash($data['password'], PASSWORD_DEFAULT),
                'status' => $data['status'] ?? 1,
                'department_id' => $data['department_id'] ?? null
            ]);

            // 分配角色
            if (!empty($data['role_ids'])) {
                $user->roles()->attach($data['role_ids']);
            }

            return $user;
        });
    }

    /**
     * 更新用户
     */
    public static function updateUser(int $id, array $data): bool
    {
        return DB::transaction(function () use ($id, $data) {
            $user = SystemUser::findOrFail($id);

            // 更新基本信息
            $updateData = array_filter([
                'username' => $data['username'] ?? null,
                'email' => $data['email'] ?? null,
                'status' => $data['status'] ?? null,
                'department_id' => $data['department_id'] ?? null
            ]);

            if (!empty($data['password'])) {
                $updateData['password'] = password_hash($data['password'], PASSWORD_DEFAULT);
            }

            $user->update($updateData);

            // 更新角色
            if (isset($data['role_ids'])) {
                $user->roles()->sync($data['role_ids']);
            }

            return true;
        });
    }

    /**
     * 删除用户
     */
    public static function deleteUser(int $id): bool
    {
        return DB::transaction(function () use ($id) {
            $user = SystemUser::findOrFail($id);
            
            // 删除关联数据
            $user->roles()->detach();
            
            // 删除用户
            return $user->delete();
        });
    }

    /**
     * 获取用户统计
     */
    public static function getUserStats(): array
    {
        return [
            'total_users' => SystemUser::count(),
            'active_users' => SystemUser::where('status', 1)->count(),
            'inactive_users' => SystemUser::where('status', 0)->count(),
            'new_users_today' => SystemUser::whereDate('created_at', today())->count(),
            'new_users_this_month' => SystemUser::whereMonth('created_at', now()->month)->count()
        ];
    }
}
```

### 文章管理服务

```php
<?php

namespace App\Content\Service;

use App\Content\Models\Article;
use Core\Database\DB;

class ArticleService
{
    /**
     * 获取文章列表
     */
    public static function getArticles(array $filters = []): array
    {
        $query = Article::with(['user', 'category']);

        // 状态过滤
        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        // 分类过滤
        if (!empty($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }

        // 关键词搜索
        if (!empty($filters['keyword'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('title', 'like', '%' . $filters['keyword'] . '%')
                  ->orWhere('content', 'like', '%' . $filters['keyword'] . '%');
            });
        }

        // 时间范围
        if (!empty($filters['start_date'])) {
            $query->where('created_at', '>=', $filters['start_date']);
        }
        if (!empty($filters['end_date'])) {
            $query->where('created_at', '<=', $filters['end_date']);
        }

        return $query->orderBy('created_at', 'desc')->paginate(10);
    }

    /**
     * 发布文章
     */
    public static function publishArticle(array $data): Article
    {
        return DB::transaction(function () use ($data) {
            $article = Article::create([
                'title' => $data['title'],
                'content' => $data['content'],
                'excerpt' => $data['excerpt'] ?? '',
                'status' => 1,
                'user_id' => $data['user_id'],
                'category_id' => $data['category_id'],
                'published_at' => now()
            ]);

            // 关联标签
            if (!empty($data['tag_ids'])) {
                $article->tags()->attach($data['tag_ids']);
            }

            return $article;
        });
    }

    /**
     * 获取热门文章
     */
    public static function getPopularArticles(int $limit = 10): array
    {
        return Article::with(['user', 'category'])
            ->where('status', 1)
            ->orderBy('views', 'desc')
            ->limit($limit)
            ->get()
            ->toArray();
    }
}
```

## 💡 最佳实践

### 1. 使用事务

```php
use Core\Database\DB;

// 数据库事务
DB::transaction(function () {
    // 多个数据库操作
    User::create($userData);
    Profile::create($profileData);
    Log::create($logData);
});

// 手动事务控制
DB::beginTransaction();
try {
    // 数据库操作
    DB::commit();
} catch (\Exception $e) {
    DB::rollback();
    throw $e;
}
```

### 2. 避免 N+1 查询

```php
// ❌ 会产生 N+1 查询
$articles = Article::all();
foreach ($articles as $article) {
    echo $article->user->name; // 每次都会查询数据库
}

// ✅ 使用预加载
$articles = Article::with('user')->get();
foreach ($articles as $article) {
    echo $article->user->name; // 不会产生额外查询
}
```

### 3. 合理使用索引

```php
// 在经常查询的字段上建立索引
Schema::table('articles', function (Blueprint $table) {
    $table->index('status');
    $table->index('category_id');
    $table->index(['status', 'published_at']);
});
```

### 4. 数据验证

```php
public static function createUser(array $data): SystemUser
{
    // 验证数据
    $validator = validator($data, [
        'username' => 'required|unique:system_users',
        'email' => 'required|email|unique:system_users',
        'password' => 'required|min:6'
    ]);

    if ($validator->fails()) {
        throw new ValidationException($validator->errors());
    }

    return SystemUser::create($data);
}
```

## 🎉 总结

DuxLite 数据库操作的特点：

- **🚀 简单易用**：基于 Eloquent ORM，语法简洁
- **🔧 功能强大**：支持复杂查询、关联、事务等
- **⚡ 高性能**：查询优化、预加载、索引支持
- **🛡️ 安全可靠**：SQL 注入防护、事务支持
- **📊 灵活扩展**：支持原生 SQL、自定义查询

合理使用数据库操作可以让你的应用更加高效和稳定！
