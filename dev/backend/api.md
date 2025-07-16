# API 开发指南

DuxLite 采用 Resource 控制器模式，让你用最少的代码快速构建 RESTful API。

## 🚀 快速开始

### 5 分钟创建完整 API

**第一步：创建模型** (`app/Blog/Models/Article.php`)

基于 `app/System/Models/SystemUser.php` 的实际代码结构：

```php
<?php

namespace App\Blog\Models;

use Core\Database\Eloquent\Model;
use Core\Database\Attribute\AutoMigrate;
use Illuminate\Database\Schema\Blueprint;

#[AutoMigrate]
class Article extends Model
{
    public $table = "articles";

    // 数据库迁移定义
    public function migration(Blueprint $table)
    {
        $table->id();
        $table->string('title')->comment('标题');
        $table->text('content')->comment('内容');
        $table->tinyInteger('status')->default(1)->comment('状态');
        $table->bigInteger('user_id')->nullable()->comment('作者ID');
        $table->timestamps();
    }

    // 可批量赋值字段
    protected $fillable = [
        'title',
        'content',
        'status',
        'user_id'
    ];

    // 类型转换
    protected $casts = [
        'status' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];
}
```

**第二步：创建控制器** (`app/Blog/Admin/Article.php`)

```php
<?php

namespace App\Blog\Admin;

use App\Blog\Models\Article;
use Core\Resources\Action\Resources;
use Core\Resources\Attribute\Resource;

#[Resource(app: 'admin', route: '/blog/article', name: 'blog.article')]
class Article extends Resources
{
    protected string $model = Article::class;
}
```

**第三步：访问 API**

```bash
# 自动生成的 API 路由
GET    /admin/blog/article      # 获取文章列表
POST   /admin/blog/article      # 创建文章
GET    /admin/blog/article/1    # 获取文章详情
PUT    /admin/blog/article/1    # 更新文章
DELETE /admin/blog/article/1    # 删除文章
```

就这么简单！🎉

## 📋 Resource 控制器详解

### 自动路由映射

一个 Resource 控制器自动提供 5 个标准 API：

| HTTP 方法 | 路由 | 控制器方法 | 说明 |
|----------|------|-----------|------|
| GET | `/blog/article` | `queryMany()` | 获取列表（支持分页、筛选） |
| POST | `/blog/article` | `store()` | 创建记录 |
| GET | `/blog/article/{id}` | `queryOne()` | 获取单条记录 |
| PUT | `/blog/article/{id}` | `store()` | 更新记录 |
| DELETE | `/blog/article/{id}` | `delete()` | 删除记录 |

### 核心方法说明

#### 1. queryMany() - 列表查询

自定义筛选、搜索、排序逻辑：

```php
public function queryMany(Builder $query, ServerRequestInterface $request, array $args): void
{
    $params = $request->getQueryParams();

    // 关键词搜索
    if ($params['keyword']) {
        $query->where('title', 'like', '%' . $params['keyword'] . '%');
    }

    // 状态筛选
    if (isset($params['status'])) {
        $query->where('status', $params['status']);
    }

    // 时间范围筛选
    if ($params['date_start'] && $params['date_end']) {
        $query->whereBetween('created_at', [
            $params['date_start'] . ' 00:00:00',
            $params['date_end'] . ' 23:59:59'
        ]);
    }

    // 排序
    $query->orderBy($params['sort'] ?? 'id', $params['order'] ?? 'desc');
}
```

#### 2. transform() - 数据转换

定义返回给前端的数据格式：

```php
public function transform(object $item): array
{
    return [
        "id" => $item->id,
        "title" => $item->title,
        "content" => $item->content,
        "status" => (bool)$item->status,
        "status_text" => $item->status ? '已发布' : '草稿',
        "created_at" => $item->created_at?->format('Y-m-d H:i:s'),
        // 关联数据
        "author_name" => $item->author?->name,
        "category_name" => $item->category?->name,
    ];
}
```

#### 3. validator() - 数据验证

定义表单验证规则：

```php
public function validator(array $data, ServerRequestInterface $request, array $args): array
{
    return [
        // 必填验证
        "title" => ["required", '标题不能为空'],
        
        // 长度验证
        "title" => [
            ["required", '标题不能为空'],
            [function ($field, $value) {
                return mb_strlen($value) <= 100;
            }, '标题不能超过100个字符']
        ],
        
        // 条件验证（编辑时某些字段可选）
        "password" => ["requiredWithout", "id", '密码不能为空'],
        
        // 唯一性验证
        "slug" => [
            ["required", 'URL别名不能为空'],
            [function ($field, $value, $params, $fields) use ($args) {
                $query = Article::where('slug', $value);
                if ($args['id']) {
                    $query->where('id', '<>', $args['id']);
                }
                return !$query->exists();
            }, 'URL别名已存在']
        ],
    ];
}
```

#### 4. format() - 数据格式化

处理保存到数据库前的数据：

```php
public function format(Data $data, ServerRequestInterface $request, array $args): array
{
    $formatData = [
        "title" => $data->title,
        "content" => $data->content,
        "status" => $data->status,
    ];
    
    // 密码加密
    if ($data->password) {
        $formatData['password'] = function ($value) {
            return password_hash($value, PASSWORD_BCRYPT);
        };
    }
    
    // 自动生成 slug
    if (!$data->slug) {
        $formatData['slug'] = function () use ($data) {
            return \Str::slug($data->title);
        };
    }
    
    // JSON 数据处理
    if ($data->metadata) {
        $formatData['metadata'] = function ($value) {
            return is_array($value) ? json_encode($value) : $value;
        };
    }
    
    return $formatData;
}
```

## 🔧 自定义操作

### 添加自定义 API 方法

除了标准 CRUD，还可以添加自定义操作：

```php
use Core\Resources\Attribute\Action;
use Psr\Http\Message\ResponseInterface;

#[Action(methods: 'POST', route: '/publish')]
public function publish(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
{
    $id = $args['id'];
    $article = Article::findOrFail($id);
    
    $article->update([
        'status' => 1,
        'published_at' => now()
    ]);
    
    return send($response, '发布成功', $article);
}

#[Action(methods: 'GET', route: '/stats')]
public function stats(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
{
    $stats = [
        'total' => Article::count(),
        'published' => Article::where('status', 1)->count(),
        'draft' => Article::where('status', 0)->count(),
    ];
    
    return send($response, 'ok', $stats);
}
```

**访问路径**：
- `POST /admin/blog/article/1/publish` - 发布文章
- `GET /admin/blog/article/stats` - 获取统计信息

## 📊 API 响应格式

### 标准响应结构

所有 API 都遵循统一的响应格式：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    // 实际数据
  },
  "timestamp": 1234567890
}
```

### 列表响应（带分页）

```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": 1,
      "title": "文章标题",
      "status": true,
      "created_at": "2024-01-01 12:00:00"
    }
  ],
  "meta": {
    "total": 100,
    "per_page": 20,
    "current_page": 1,
    "last_page": 5
  }
}
```

### 错误响应

```json
{
  "code": 422,
  "message": "验证失败",
  "data": {
    "title": ["标题不能为空"],
    "email": ["邮箱格式不正确"]
  }
}
```

## 🎯 实际应用示例

### 用户管理 API

基于 `app/System/Admin/User.php` 的真实代码：

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

    public function queryMany(Builder $query, ServerRequestInterface $request, array $args): void
    {
        $params = $request->getQueryParams();

        // 关键词搜索
        if ($params['keyword']) {
            $query->where('nickname', 'like', '%' . $params['keyword'] . '%');
        }

        // 部门筛选
        if ($params['dept_id']) {
            $query->where('dept_id', $params['dept_id']);
        }

        // 预加载关联数据
        $query->with(['role', 'dept']);
    }

    public function transform(object $item): array
    {
        return [
            "id" => $item->id,
            "username" => $item->username,
            "nickname" => $item->nickname,
            "avatar" => $item->avatar,
            "status" => (bool)$item->status,
            "role_name" => $item->role?->name,
            "dept_name" => $item->dept?->name,
        ];
    }

    public function validator(array $data, ServerRequestInterface $request, array $args): array
    {
        return [
            "nickname" => ["required", '昵称不能为空'],
            "username" => [
                ["required", '用户名不能为空'],
                [function ($field, $value, $params, $fields) use ($args) {
                    $query = SystemUser::where('username', $value);
                    if ($args['id']) {
                        $query->where('id', '<>', $args['id']);
                    }
                    return !$query->exists();
                }, '用户名已存在']
            ],
            "password" => ["requiredWithout", "id", '密码不能为空'],
            "role_id" => ["required", '角色不能为空'],
        ];
    }

    public function format(Data $data, ServerRequestInterface $request, array $args): array
    {
        $formatData = [
            "nickname" => $data->nickname,
            "username" => $data->username,
            "avatar" => $data->avatar,
            "status" => $data->status,
            "dept_id" => $data->dept_id,
            "role_id" => $data->role_id,
        ];
        
        if ($data->password) {
            $formatData['password'] = function ($value) {
                return password_hash($value, PASSWORD_BCRYPT);
            };
        }
        
        return $formatData;
    }
}
```

## 💡 最佳实践

### 1. 保持方法职责单一
- `queryMany()` - 只处理查询逻辑
- `transform()` - 只处理数据转换
- `validator()` - 只处理数据验证
- `format()` - 只处理数据格式化

### 2. 使用预加载避免 N+1 查询
```php
public function queryMany(Builder $query, ServerRequestInterface $request, array $args): void
{
    // 预加载关联数据
    $query->with(['role', 'dept', 'permissions']);
}
```

### 3. 合理使用类型转换
```php
public function transform(object $item): array
{
    return [
        "id" => (int)$item->id,
        "title" => (string)$item->title,
        "status" => (bool)$item->status,
        "price" => (float)$item->price,
    ];
}
```

### 4. 复杂业务逻辑使用服务层
```php
// 避免在控制器中写复杂逻辑
public function format(Data $data, ServerRequestInterface $request, array $args): array
{
    // 使用服务层处理复杂业务
    return app(UserService::class)->formatUserData($data->toArray());
}
```

## 🎉 总结

DuxLite 的 Resource 控制器让 API 开发变得简单：

- **📝 声明式开发**：用注解定义路由，无需手动注册
- **🔄 标准化 CRUD**：自动提供完整的增删改查操作
- **🎯 灵活定制**：通过重写方法实现个性化需求
- **✅ 内置验证**：完整的数据验证和错误处理
- **🚀 开发效率**：最少的代码实现最多的功能

通过遵循这些模式，你可以快速构建出高质量、可维护的 RESTful API！
