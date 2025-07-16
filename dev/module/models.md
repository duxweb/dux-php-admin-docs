# 模型与数据库

数据模型是应用的核心组件，负责定义数据结构、处理数据逻辑和数据库交互。本指南将详细介绍如何在 Dux PHP Admin 中开发数据模型。

## 模型基础

### 模型概念

在 Dux PHP Admin 中，模型遵循 Active Record 模式，每个模型类对应数据库中的一张表：

- **数据表示** - 模型代表数据库表的一行记录
- **业务逻辑** - 封装与数据相关的业务规则
- **数据验证** - 验证数据的完整性和正确性
- **关系映射** - 定义表之间的关联关系

### 基础模型结构

```php
<?php

namespace App\YourModule\Models;

use Dux\Database\Model;
use Dux\Database\Attribute\AutoMigration;
use Illuminate\Database\Eloquent\SoftDeletes;

#[AutoMigration]
class YourModel extends Model
{
    use SoftDeletes;

    /**
     * 数据表名
     */
    protected $table = 'your_table';

    /**
     * 主键字段
     */
    protected $primaryKey = 'id';

    /**
     * 主键类型
     */
    protected $keyType = 'int';

    /**
     * 是否自动递增
     */
    public $incrementing = true;

    /**
     * 是否启用时间戳
     */
    public $timestamps = true;

    /**
     * 可批量赋值字段
     */
    protected $fillable = [
        'title',
        'content',
        'status',
        'category_id',
        'user_id',
        'sort',
        'views'
    ];

    /**
     * 不可批量赋值字段
     */
    protected $guarded = [
        'id',
        'created_at',
        'updated_at'
    ];

    /**
     * 隐藏字段（序列化时不包含）
     */
    protected $hidden = [
        'deleted_at',
        'password'
    ];

    /**
     * 数据类型转换
     */
    protected $casts = [
        'status' => 'boolean',
        'sort' => 'integer',
        'views' => 'integer',
        'config' => 'array',
        'tags' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'published_at' => 'datetime'
    ];

    /**
     * 默认值
     */
    protected $attributes = [
        'status' => true,
        'sort' => 0,
        'views' => 0
    ];
}
```

## 自动迁移

### 迁移定义

使用 `#[AutoMigration]` 属性和 `migration()` 方法定义表结构：

```php
#[AutoMigration]
class Article extends Model
{
    /**
     * 定义数据库表结构
     */
    public function migration(): array
    {
        return [
            // 主键
            'id' => ['type' => 'id'],
            
            // 字符串字段
            'title' => [
                'type' => 'string',
                'length' => 255,
                'nullable' => false,
                'comment' => '文章标题'
            ],
            'slug' => [
                'type' => 'string',
                'length' => 255,
                'unique' => true,
                'comment' => 'URL别名'
            ],
            
            // 文本字段
            'content' => [
                'type' => 'text',
                'nullable' => true,
                'comment' => '文章内容'
            ],
            'excerpt' => [
                'type' => 'text',
                'nullable' => true,
                'comment' => '文章摘要'
            ],
            
            // 数值字段
            'views' => [
                'type' => 'integer',
                'default' => 0,
                'unsigned' => true,
                'comment' => '浏览次数'
            ],
            'sort' => [
                'type' => 'integer',
                'default' => 0,
                'comment' => '排序值'
            ],
            'price' => [
                'type' => 'decimal',
                'precision' => 10,
                'scale' => 2,
                'default' => 0.00,
                'comment' => '价格'
            ],
            
            // 布尔字段
            'status' => [
                'type' => 'boolean',
                'default' => true,
                'comment' => '状态'
            ],
            'featured' => [
                'type' => 'boolean',
                'default' => false,
                'comment' => '是否推荐'
            ],
            
            // JSON字段
            'config' => [
                'type' => 'json',
                'nullable' => true,
                'comment' => '配置信息'
            ],
            'tags' => [
                'type' => 'json',
                'nullable' => true,
                'comment' => '标签列表'
            ],
            
            // 日期时间字段
            'published_at' => [
                'type' => 'timestamp',
                'nullable' => true,
                'comment' => '发布时间'
            ],
            
            // 外键字段
            'user_id' => [
                'type' => 'integer',
                'unsigned' => true,
                'nullable' => true,
                'foreign' => 'users.id',
                'comment' => '用户ID'
            ],
            'category_id' => [
                'type' => 'integer',
                'unsigned' => true,
                'nullable' => true,
                'foreign' => 'categories.id',
                'comment' => '分类ID'
            ],
            
            // 时间戳
            'created_at' => ['type' => 'timestamp', 'nullable' => true],
            'updated_at' => ['type' => 'timestamp', 'nullable' => true],
            'deleted_at' => ['type' => 'timestamp', 'nullable' => true],
            
            // 索引定义
            'indexes' => [
                'idx_status' => ['columns' => ['status']],
                'idx_category_status' => ['columns' => ['category_id', 'status']],
                'idx_published' => ['columns' => ['published_at']],
                'fulltext_search' => ['columns' => ['title', 'content'], 'type' => 'fulltext']
            ]
        ];
    }
}
```

### 字段类型

支持的字段类型及其选项：

```php
// 基础类型
'id' => ['type' => 'id'], // 自增主键
'string' => ['type' => 'string', 'length' => 255],
'text' => ['type' => 'text'],
'longtext' => ['type' => 'longtext'],
'integer' => ['type' => 'integer', 'unsigned' => true],
'bigint' => ['type' => 'bigint'],
'decimal' => ['type' => 'decimal', 'precision' => 10, 'scale' => 2],
'float' => ['type' => 'float'],
'double' => ['type' => 'double'],
'boolean' => ['type' => 'boolean'],
'date' => ['type' => 'date'],
'datetime' => ['type' => 'datetime'],
'timestamp' => ['type' => 'timestamp'],
'time' => ['type' => 'time'],
'json' => ['type' => 'json'],
'binary' => ['type' => 'binary'],

// 特殊类型
'enum' => ['type' => 'enum', 'values' => ['active', 'inactive', 'pending']],
'set' => ['type' => 'set', 'values' => ['read', 'write', 'delete']],

// 字段选项
'nullable' => true,        // 允许为空
'default' => 'value',      // 默认值
'unique' => true,          // 唯一约束
'index' => true,           // 添加索引
'foreign' => 'table.field', // 外键约束
'comment' => '字段描述',    // 字段注释
'unsigned' => true,        // 无符号（数值类型）
'auto_increment' => true,  // 自动递增
'charset' => 'utf8mb4',    // 字符集
'collation' => 'utf8mb4_unicode_ci' // 排序规则
```

## 模型关联

### 一对一关联

```php
class User extends Model
{
    /**
     * 用户资料（一对一）
     */
    public function profile()
    {
        return $this->hasOne(UserProfile::class, 'user_id', 'id');
    }
}

class UserProfile extends Model
{
    /**
     * 所属用户（反向一对一）
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }
}
```

### 一对多关联

```php
class Category extends Model
{
    /**
     * 分类下的文章（一对多）
     */
    public function articles()
    {
        return $this->hasMany(Article::class, 'category_id', 'id');
    }
    
    /**
     * 已发布的文章
     */
    public function publishedArticles()
    {
        return $this->hasMany(Article::class, 'category_id', 'id')
                    ->where('status', true)
                    ->whereNotNull('published_at');
    }
}

class Article extends Model
{
    /**
     * 文章分类（反向一对多）
     */
    public function category()
    {
        return $this->belongsTo(Category::class, 'category_id', 'id');
    }
}
```

### 多对多关联

```php
class Article extends Model
{
    /**
     * 文章标签（多对多）
     */
    public function tags()
    {
        return $this->belongsToMany(
            Tag::class,           // 关联模型
            'article_tags',       // 中间表名
            'article_id',         // 当前模型在中间表的外键
            'tag_id',             // 关联模型在中间表的外键
            'id',                 // 当前模型的主键
            'id'                  // 关联模型的主键
        )->withTimestamps();     // 包含中间表时间戳
    }
    
    /**
     * 带中间表数据的关联
     */
    public function roles()
    {
        return $this->belongsToMany(Role::class, 'user_roles')
                    ->withPivot(['status', 'expires_at'])
                    ->withTimestamps();
    }
}

class Tag extends Model
{
    /**
     * 标签文章（反向多对多）
     */
    public function articles()
    {
        return $this->belongsToMany(Article::class, 'article_tags');
    }
}
```

### 多态关联

```php
class Comment extends Model
{
    /**
     * 可评论的模型（多态关联）
     */
    public function commentable()
    {
        return $this->morphTo();
    }
}

class Article extends Model
{
    /**
     * 文章评论（多态一对多）
     */
    public function comments()
    {
        return $this->morphMany(Comment::class, 'commentable');
    }
}

class Video extends Model
{
    /**
     * 视频评论（多态一对多）
     */
    public function comments()
    {
        return $this->morphMany(Comment::class, 'commentable');
    }
}
```

### 远程一对多

```php
class Country extends Model
{
    /**
     * 国家的文章（通过用户）
     */
    public function articles()
    {
        return $this->hasManyThrough(
            Article::class,  // 最终关联的模型
            User::class,     // 中间模型
            'country_id',    // 中间模型的外键
            'user_id',       // 最终模型的外键
            'id',            // 当前模型的主键
            'id'             // 中间模型的主键
        );
    }
}
```

## 查询构造器

### 基础查询

```php
// 查找单个记录
$article = Article::find(1);
$article = Article::where('slug', 'hello-world')->first();
$article = Article::findOrFail(1); // 找不到抛异常

// 查找多个记录
$articles = Article::all();
$articles = Article::where('status', true)->get();
$articles = Article::whereIn('id', [1, 2, 3])->get();

// 条件查询
$articles = Article::where('views', '>', 100)
                  ->where('status', true)
                  ->orderBy('created_at', 'desc')
                  ->limit(10)
                  ->get();

// 分页查询
$articles = Article::where('status', true)
                  ->paginate(20);

// 统计查询
$count = Article::where('status', true)->count();
$sum = Article::sum('views');
$avg = Article::avg('views');
$max = Article::max('views');
```

### 高级查询

```php
// 子查询
$popularArticles = Article::whereIn('id', function ($query) {
    $query->select('article_id')
          ->from('article_views')
          ->where('views', '>', 1000);
})->get();

// 关联查询
$articles = Article::with(['category', 'user', 'tags'])
                  ->where('status', true)
                  ->get();

// 预加载指定字段
$articles = Article::with([
    'user:id,name,avatar',
    'category:id,name,color'
])->get();

// 条件预加载
$articles = Article::with([
    'comments' => function ($query) {
        $query->where('status', 'approved')
              ->orderBy('created_at', 'desc');
    }
])->get();

// 聚合查询
$categories = Category::withCount(['articles', 'publishedArticles'])
                     ->having('articles_count', '>', 0)
                     ->get();

// 原生查询
$articles = Article::selectRaw('*, (views / DATEDIFF(NOW(), created_at)) as daily_views')
                  ->orderByRaw('daily_views DESC')
                  ->get();
```

## 查询作用域

### 本地作用域

```php
class Article extends Model
{
    /**
     * 已发布的文章
     */
    public function scopePublished($query)
    {
        return $query->where('status', true)
                    ->whereNotNull('published_at')
                    ->where('published_at', '<=', now());
    }

    /**
     * 按分类筛选
     */
    public function scopeByCategory($query, $categoryId)
    {
        return $query->where('category_id', $categoryId);
    }

    /**
     * 搜索文章
     */
    public function scopeSearch($query, $keyword)
    {
        return $query->where(function ($q) use ($keyword) {
            $q->where('title', 'like', "%{$keyword}%")
              ->orWhere('content', 'like', "%{$keyword}%");
        });
    }

    /**
     * 热门文章
     */
    public function scopePopular($query, $days = 30)
    {
        return $query->where('created_at', '>=', now()->subDays($days))
                    ->orderBy('views', 'desc');
    }

    /**
     * 按时间范围
     */
    public function scopeDateRange($query, $start, $end)
    {
        return $query->whereBetween('created_at', [$start, $end]);
    }
}

// 使用作用域
$articles = Article::published()
                  ->byCategory(1)
                  ->search('Laravel')
                  ->popular(7)
                  ->get();
```

### 全局作用域

```php
<?php

namespace App\YourModule\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class PublishedScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        $builder->where('status', true)
               ->whereNotNull('published_at')
               ->where('published_at', '<=', now());
    }
}

// 在模型中应用全局作用域
class Article extends Model
{
    protected static function booted(): void
    {
        static::addGlobalScope(new PublishedScope);
        
        // 或使用闭包
        static::addGlobalScope('published', function (Builder $builder) {
            $builder->where('status', true);
        });
    }
    
    /**
     * 移除全局作用域
     */
    public function newQueryWithoutScope($scope = null)
    {
        return parent::newQuery()->withoutGlobalScope($scope);
    }
}

// 查询时移除全局作用域
$allArticles = Article::withoutGlobalScope(PublishedScope::class)->get();
$allArticles = Article::withoutGlobalScopes()->get();
```

## 访问器和修改器

### 访问器（Accessors）

```php
class User extends Model
{
    /**
     * 获取用户全名
     */
    public function getFullNameAttribute(): string
    {
        return $this->first_name . ' ' . $this->last_name;
    }

    /**
     * 获取头像URL
     */
    public function getAvatarUrlAttribute(): string
    {
        return $this->avatar ? asset('uploads/' . $this->avatar) : asset('images/default-avatar.png');
    }

    /**
     * 获取格式化的创建时间
     */
    public function getCreatedAtFormatAttribute(): string
    {
        return $this->created_at?->format('Y-m-d H:i:s') ?? '';
    }

    /**
     * 获取状态文本
     */
    public function getStatusTextAttribute(): string
    {
        return match($this->status) {
            1 => '正常',
            0 => '禁用',
            -1 => '删除',
            default => '未知'
        };
    }
}

// 使用访问器
$user = User::find(1);
echo $user->full_name;       // 自动调用 getFullNameAttribute
echo $user->avatar_url;      // 自动调用 getAvatarUrlAttribute
echo $user->status_text;     // 自动调用 getStatusTextAttribute
```

### 修改器（Mutators）

```php
class User extends Model
{
    /**
     * 设置密码（自动加密）
     */
    public function setPasswordAttribute($value): void
    {
        $this->attributes['password'] = bcrypt($value);
    }

    /**
     * 设置邮箱（转小写）
     */
    public function setEmailAttribute($value): void
    {
        $this->attributes['email'] = strtolower($value);
    }

    /**
     * 设置姓名（去除空格）
     */
    public function setNameAttribute($value): void
    {
        $this->attributes['name'] = trim($value);
    }

    /**
     * 设置手机号（去除特殊字符）
     */
    public function setPhoneAttribute($value): void
    {
        $this->attributes['phone'] = preg_replace('/[^0-9]/', '', $value);
    }
}

// 使用修改器
$user = new User();
$user->password = 'secret123';  // 自动调用 setPasswordAttribute
$user->email = 'USER@EXAMPLE.COM';  // 自动调用 setEmailAttribute
$user->save();
```

### 属性转换

```php
class Article extends Model
{
    protected $casts = [
        // 基础类型转换
        'status' => 'boolean',
        'views' => 'integer',
        'price' => 'decimal:2',
        'published_at' => 'datetime',
        
        // 数组和对象转换
        'tags' => 'array',
        'config' => 'object',
        'meta' => 'collection',
        
        // 自定义转换
        'settings' => SettingsCast::class,
        
        // 加密转换
        'secret' => 'encrypted',
        'token' => 'encrypted:array'
    ];
}

// 自定义类型转换
<?php

namespace App\YourModule\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;

class SettingsCast implements CastsAttributes
{
    public function get($model, string $key, $value, array $attributes): array
    {
        return json_decode($value, true) ?? [];
    }

    public function set($model, string $key, $value, array $attributes): string
    {
        return json_encode($value);
    }
}
```

## 模型事件

### 事件监听

```php
class Article extends Model
{
    protected static function booted(): void
    {
        // 创建前
        static::creating(function ($article) {
            if (!$article->user_id) {
                $article->user_id = auth()->id();
            }
            
            if (!$article->slug) {
                $article->slug = \Str::slug($article->title);
            }
        });

        // 创建后
        static::created(function ($article) {
            // 发送通知
            event(new \App\YourModule\Events\ArticleCreated($article));
            
            // 更新统计
            Cache::forget('articles_count');
        });

        // 更新前
        static::updating(function ($article) {
            if ($article->isDirty('title')) {
                $article->slug = \Str::slug($article->title);
            }
        });

        // 更新后
        static::updated(function ($article) {
            // 清除缓存
            Cache::forget("article_{$article->id}");
            
            // 触发事件
            event(new \App\YourModule\Events\ArticleUpdated($article));
        });

        // 删除前
        static::deleting(function ($article) {
            // 删除关联数据
            $article->comments()->delete();
            $article->tags()->detach();
        });

        // 删除后
        static::deleted(function ($article) {
            // 清理缓存
            Cache::forget("article_{$article->id}");
            
            // 记录日志
            \Log::info('文章已删除', ['id' => $article->id, 'title' => $article->title]);
        });

        // 保存前（创建和更新前都会触发）
        static::saving(function ($article) {
            // 数据验证
            if (!$article->title) {
                throw new \InvalidArgumentException('标题不能为空');
            }
        });

        // 保存后（创建和更新后都会触发）
        static::saved(function ($article) {
            // 更新搜索索引
            dispatch(new \App\Jobs\UpdateSearchIndex($article));
        });
    }
}
```

### 事件观察者

```php
<?php

namespace App\YourModule\Observers;

use App\YourModule\Models\Article;

class ArticleObserver
{
    public function creating(Article $article): void
    {
        $article->user_id = $article->user_id ?: auth()->id();
        $article->slug = $article->slug ?: \Str::slug($article->title);
    }

    public function created(Article $article): void
    {
        // 发送创建通知
        \Notification::send(
            $article->user,
            new \App\Notifications\ArticleCreated($article)
        );
    }

    public function updating(Article $article): void
    {
        if ($article->isDirty('status') && $article->status) {
            $article->published_at = now();
        }
    }

    public function updated(Article $article): void
    {
        // 清除相关缓存
        \Cache::tags(['articles', "article_{$article->id}"])->flush();
    }

    public function deleting(Article $article): void
    {
        // 软删除时保留数据，硬删除时清理关联
        if ($article->isForceDeleting()) {
            $article->comments()->forceDelete();
            $article->tags()->detach();
        }
    }

    public function deleted(Article $article): void
    {
        \Log::info('文章删除', [
            'id' => $article->id,
            'title' => $article->title,
            'deleted_by' => auth()->id()
        ]);
    }

    public function restored(Article $article): void
    {
        \Log::info('文章恢复', [
            'id' => $article->id,
            'restored_by' => auth()->id()
        ]);
    }
}

// 注册观察者
class AppServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Article::observe(ArticleObserver::class);
    }
}
```

## 模型序列化

### 自定义序列化

```php
class Article extends Model
{
    /**
     * 隐藏字段
     */
    protected $hidden = [
        'deleted_at',
        'user_id'
    ];

    /**
     * 追加字段
     */
    protected $appends = [
        'status_text',
        'url',
        'excerpt'
    ];

    /**
     * 可见字段（在特定情况下）
     */
    protected $visible = [
        'id',
        'title',
        'content'
    ];

    /**
     * 获取状态文本
     */
    public function getStatusTextAttribute(): string
    {
        return $this->status ? '已发布' : '草稿';
    }

    /**
     * 获取文章URL
     */
    public function getUrlAttribute(): string
    {
        return route('articles.show', $this->slug);
    }

    /**
     * 获取摘要
     */
    public function getExcerptAttribute(): string
    {
        return \Str::limit(strip_tags($this->content), 200);
    }

    /**
     * 自定义JSON序列化
     */
    public function toArray(): array
    {
        $array = parent::toArray();
        
        // 添加计算字段
        $array['reading_time'] = ceil(str_word_count($this->content) / 200);
        
        // 格式化日期
        if ($this->published_at) {
            $array['published_at_human'] = $this->published_at->diffForHumans();
        }
        
        return $array;
    }
}

// 临时修改序列化属性
$article = Article::find(1);
$article->makeVisible(['user_id']);
$article->makeHidden(['content']);
$article->append(['custom_field']);
```

### API 资源转换

```php
<?php

namespace App\YourModule\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ArticleResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'excerpt' => $this->excerpt,
            'content' => $this->when($request->routeIs('articles.show'), $this->content),
            'status' => $this->status,
            'status_text' => $this->status_text,
            'views' => $this->views,
            'reading_time' => ceil(str_word_count($this->content) / 200),
            
            // 关联资源
            'category' => new CategoryResource($this->whenLoaded('category')),
            'author' => new UserResource($this->whenLoaded('user')),
            'tags' => TagResource::collection($this->whenLoaded('tags')),
            
            // 条件字段
            'edit_url' => $this->when($request->user()?->can('update', $this), route('articles.edit', $this)),
            
            // 时间字段
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
            'published_at' => $this->published_at?->toISOString(),
            
            // 人性化时间
            'created_at_human' => $this->created_at->diffForHumans(),
            'published_at_human' => $this->published_at?->diffForHumans(),
        ];
    }

    public function with($request): array
    {
        return [
            'meta' => [
                'version' => '1.0',
                'generated_at' => now()->toISOString()
            ]
        ];
    }
}
```

## 性能优化

### 查询优化

```php
// 避免 N+1 查询
$articles = Article::with(['category', 'user', 'tags'])->get();

// 只加载需要的字段
$articles = Article::select('id', 'title', 'slug', 'published_at')
                  ->with([
                      'category:id,name',
                      'user:id,name,avatar'
                  ])->get();

// 预加载计数
$categories = Category::withCount('articles')->get();

// 分块处理大量数据
Article::chunk(1000, function ($articles) {
    foreach ($articles as $article) {
        // 处理文章
    }
});

// 使用游标分页（大数据集）
$articles = Article::orderBy('id')->cursorPaginate(100);
```

### 缓存优化

```php
class Article extends Model
{
    /**
     * 缓存热门文章
     */
    public static function getPopular(int $limit = 10): Collection
    {
        return Cache::remember('articles:popular', 3600, function () use ($limit) {
            return static::where('status', true)
                         ->orderBy('views', 'desc')
                         ->limit($limit)
                         ->get();
        });
    }

    /**
     * 缓存文章详情
     */
    public static function getCached(int $id): ?self
    {
        return Cache::remember("article:{$id}", 3600, function () use ($id) {
            return static::with(['category', 'user', 'tags'])->find($id);
        });
    }

    /**
     * 清除相关缓存
     */
    protected static function booted(): void
    {
        static::saved(function ($article) {
            Cache::forget("article:{$article->id}");
            Cache::forget('articles:popular');
            Cache::tags(['articles'])->flush();
        });
    }
}
```

## 最佳实践

### 1. 模型组织

```php
// 按功能分组模型
Models/
├── User/
│   ├── User.php
│   ├── UserProfile.php
│   └── UserSetting.php
├── Content/
│   ├── Article.php
│   ├── Category.php
│   └── Tag.php
└── System/
    ├── Setting.php
    ├── Log.php
    └── Permission.php
```

### 2. 关联优化

```php
// 使用预加载避免 N+1 查询
$articles = Article::with([
    'category:id,name',
    'user:id,name,avatar',
    'tags:id,name,color'
])->get();

// 条件预加载
$articles = Article::with([
    'comments' => function ($query) {
        $query->where('status', 'approved')
              ->latest()
              ->limit(5);
    }
])->get();
```

### 3. 数据验证

```php
class Article extends Model
{
    /**
     * 验证规则
     */
    public static function validationRules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'content' => 'required|string|min:10',
            'category_id' => 'required|integer|exists:categories,id',
            'tags' => 'nullable|array|max:10',
            'tags.*' => 'string|max:50'
        ];
    }

    /**
     * 保存前验证
     */
    protected static function booted(): void
    {
        static::saving(function ($article) {
            $validator = validator($article->toArray(), static::validationRules());
            
            if ($validator->fails()) {
                throw new \Illuminate\Validation\ValidationException($validator);
            }
        });
    }
}
```

## 总结

模型开发的关键要点：

1. **自动迁移** - 使用注解定义表结构，自动同步
2. **关联关系** - 正确定义模型间的关联关系
3. **查询优化** - 使用预加载、作用域等优化查询
4. **事件处理** - 利用模型事件处理业务逻辑
5. **数据转换** - 使用访问器、修改器和类型转换
6. **性能优化** - 合理使用缓存和查询优化技巧
7. **代码组织** - 保持模型简洁，复杂逻辑移至服务层

遵循这些实践，将帮助你构建高效、可维护的数据模型。