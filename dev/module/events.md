# 事件系统

DuxLite 提供了简洁的事件系统，用于实现模块间的松耦合通信。事件系统基于 Symfony EventDispatcher，支持事件触发和监听。

## 什么是事件系统

事件系统允许在应用的特定时刻触发事件，其他模块可以监听这些事件并执行相应的处理逻辑。

### 核心概念
- **事件触发**：在业务逻辑中触发事件
- **事件监听**：使用注解监听特定事件
- **解耦通信**：模块间通过事件进行松耦合通信

## 事件定义

### 1. 创建事件类

事件类需要继承 `Symfony\Contracts\EventDispatcher\Event`：

```php
<?php

namespace App\System\Events;

use App\System\Models\SystemUser;
use Symfony\Contracts\EventDispatcher\Event;

class UserRegistered extends Event
{
    public function __construct(
        public SystemUser $user,
        public array $metadata = []
    ) {}

    public function getUser(): SystemUser
    {
        return $this->user;
    }

    public function getMetadata(): array
    {
        return $this->metadata;
    }
}
```

### 2. 触发事件

#### 触发字符串事件（简单方式）

```php
use Core\App;

// 在服务中触发事件
class UserService
{
    public static function register(array $userData): User
    {
        $user = User::create($userData);

        // 触发字符串事件
        App::event()->dispatch('user.registered', $user);

        return $user;
    }
}
```

#### 触发事件对象（推荐方式）

```php
use Core\App;
use App\System\Events\UserRegistered;

class UserService
{
    public static function register(array $userData): User
    {
        $user = User::create($userData);

        // 创建事件对象
        $event = new UserRegistered($user, ['source' => 'web']);

        // 触发事件对象
        App::event()->dispatch($event, 'user.registered');

        return $user;
    }
}
```

## 事件监听

### 1. 创建监听器

使用 `#[Listener]` 注解创建事件监听器：

```php
<?php

namespace App\System\Listeners;

use App\System\Events\UserRegistered;
use Core\Event\Attribute\Listener;
use Core\App;

class UserListener
{
    // 监听字符串事件
    #[Listener('user.registered')]
    public function handleUserRegistered($user): void
    {
        // 发送欢迎邮件
        App::queue()->push(new SendWelcomeEmailJob($user->email));

        // 记录日志
        App::log()->info('新用户注册', ['user_id' => $user->id]);
    }

    // 监听事件对象
    #[Listener('user.registered')]
    public function handleUserRegisteredEvent(UserRegistered $event): void
    {
        $user = $event->getUser();
        $metadata = $event->getMetadata();

        // 根据来源处理不同逻辑
        if ($metadata['source'] === 'admin') {
            // 管理员创建的用户处理逻辑
        } else {
            // 用户自注册处理逻辑
        }
    }
}
```

### 2. 监听器优先级

可以设置监听器的执行优先级：

```php
class NotificationListener
{
    // 高优先级监听器（先执行）
    #[Listener('article.published', priority: 100)]
    public function sendUrgentNotification($article): void
    {
        // 发送紧急通知
    }

    // 普通优先级监听器（后执行）
    #[Listener('article.published')]
    public function updateCache($article): void
    {
        // 更新缓存
        App::cache()->forget("article.{$article->id}");
    }
}
```

## 实际应用示例

### 1. 用户管理模块

```php
// 定义用户注册事件
namespace App\System\Events;

use App\System\Models\SystemUser;
use Symfony\Contracts\EventDispatcher\Event;

class UserRegistered extends Event
{
    public function __construct(
        public SystemUser $user,
        public string $source = 'web'
    ) {}
}

// 用户服务
class UserService
{
    public static function createUser(array $data): User
    {
        $user = User::create($data);

        // 触发事件对象
        $event = new UserRegistered($user, 'admin');
        App::event()->dispatch($event, 'user.registered');

        return $user;
    }
}

// 邮件监听器
class EmailListener
{
    #[Listener('user.registered')]
    public function sendWelcomeEmail(UserRegistered $event): void
    {
        $user = $event->user;

        // 根据注册来源发送不同邮件
        if ($event->source === 'admin') {
            App::queue()->push(new SendAdminCreatedUserEmailJob($user));
        } else {
            App::queue()->push(new SendWelcomeEmailJob($user));
        }
    }
}
```

### 2. 文章发布系统

```php
// 定义文章发布事件
namespace App\Blog\Events;

use App\Blog\Models\BlogArticle;
use Symfony\Contracts\EventDispatcher\Event;

class ArticlePublished extends Event
{
    public function __construct(
        public BlogArticle $article,
        public array $changes = []
    ) {}
}

// 文章服务
class ArticleService
{
    public static function publish(int $articleId): void
    {
        $article = Article::find($articleId);
        $oldStatus = $article->status;

        $article->update(['status' => 'published', 'published_at' => now()]);

        // 触发事件对象
        $event = new ArticlePublished($article, [
            'old_status' => $oldStatus,
            'published_by' => auth()->id()
        ]);
        App::event()->dispatch($event, 'article.published');
    }
}

// 缓存监听器
class CacheListener
{
    #[Listener('article.published')]
    public function clearArticleCache(ArticlePublished $event): void
    {
        $article = $event->article;

        // 清除文章缓存
        App::cache()->forget("article.{$article->id}");
        App::cache()->forget('articles.list');
    }
}
```

## 最佳实践

### 1. 事件命名规范

使用清晰的事件命名：

```php
// ✅ 推荐的命名方式
App::event()->dispatch('user.registered', $user);
App::event()->dispatch('article.published', $article);
App::event()->dispatch('order.completed', $order);

// ❌ 避免的命名方式
App::event()->dispatch('userEvent', $user);
App::event()->dispatch('doSomething', $data);
```

### 2. 监听器职责单一

每个监听器只处理一个特定的任务：

```php
// ✅ 推荐：职责单一
class EmailNotificationListener
{
    #[Listener('user.registered')]
    public function sendWelcomeEmail($user): void
    {
        // 只负责发送邮件
    }
}

class UserStatisticsListener
{
    #[Listener('user.registered')]
    public function updateStats($user): void
    {
        // 只负责更新统计
    }
}
```

### 3. 异常处理

监听器中应该妥善处理异常：

```php
class EmailListener
{
    #[Listener('user.registered')]
    public function sendWelcomeEmail($user): void
    {
        try {
            // 发送邮件逻辑
            $this->mailService->send($user->email, 'welcome');
        } catch (\Exception $e) {
            // 记录错误但不影响其他监听器
            App::log()->error('邮件发送失败', [
                'user_id' => $user->id,
                'error' => $e->getMessage()
            ]);
        }
    }
}
```

## 总结

DuxLite 事件系统的核心要点：

### 核心特性
- **事件继承**：事件类继承 `Symfony\Contracts\EventDispatcher\Event`
- **注解驱动**：使用 `#[Listener]` 注解定义监听器
- **优先级控制**：支持监听器执行优先级设置
- **松耦合通信**：模块间通过事件进行解耦通信

### 使用场景
- **用户注册**：发送欢迎邮件、更新统计、分配角色
- **内容发布**：清除缓存、发送通知、更新索引
- **订单处理**：库存更新、支付处理、物流通知
- **系统监控**：日志记录、性能统计、异常报告

### 最佳实践
- **事件命名**：使用清晰的点号分隔命名（如 `user.registered`）
- **职责单一**：每个监听器只处理一个特定任务
- **异常处理**：监听器中妥善处理异常，不影响其他监听器
- **事件对象**：优先使用事件对象而不是字符串事件

### 开发建议
- 事件类继承 `Symfony\Contracts\EventDispatcher\Event`
- 监听器按业务模块组织，便于维护
- 合理使用优先级控制执行顺序
- 结合队列系统处理复杂业务逻辑

通过事件系统，你可以构建出高度解耦、易于扩展的应用架构。接下来我们将学习队列系统的使用。