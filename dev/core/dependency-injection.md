# 依赖注入

DuxLite 内置了依赖注入（DI）容器，基于 [PHP-DI](https://php-di.org/) 实现，用于管理应用中的服务和依赖关系。

## 设计理念

**DuxLite 的依赖注入理念：依赖注入只在必要时使用，而不是过度依赖。**

DuxLite 的设计思想类似于 Go 语言的显式编程风格：

- **显式 > 隐式**：优先使用明确的静态方法调用，如 `App::db()`、`App::cache()`
- **IDE 友好**：显式调用能提供完整的代码提示和类型推断
- **可读性优先**：代码意图清晰，依赖关系一目了然
- **性能考虑**：避免不必要的容器解析开销

```php
// ✅ DuxLite 推荐：显式调用，IDE 完整提示
$users = App::db()->table('users')->get();
$cache = App::cache('redis');
$config = App::config('database');

// ❌ 过度依赖注入：增加复杂性，IDE 提示不完整
public function __construct(
    private DatabaseManager $db,
    private CacheManager $cache,
    private Config $config
) {}
```

**何时使用依赖注入：**
- 框架内部服务管理
- 需要模拟测试的复杂服务
- 多态实现的服务切换
- 第三方库集成

**何时使用静态方法：**
- 框架核心功能访问
- 日常业务逻辑开发
- 简单直接的服务调用

## 依赖注入概念

### 什么是依赖注入

依赖注入是一种设计模式，用于实现控制反转（IoC）。它将依赖关系的创建和管理从类内部转移到外部容器。

```php
// ❌ 传统方式：类直接创建依赖
class UserService
{
    private $repository;

    public function __construct()
    {
        $this->repository = new UserRepository(); // 硬编码依赖
    }
}

// ✅ 依赖注入：依赖由外部提供
class UserService
{
    public function __construct(
        private UserRepository $repository // 依赖注入
    ) {}
}
```

### 依赖注入的优势

1. **降低耦合度** - 类不直接创建依赖对象
2. **提高可测试性** - 可以轻松注入模拟对象
3. **增强灵活性** - 可以在运行时改变依赖实现
4. **便于扩展** - 新功能可以无侵入地添加

## DI 容器

### 容器概述

DuxLite 的 DI 容器是全局单例，通过 `App::di()` 访问：

```php
use Core\App;

// 获取容器实例
$container = App::di();

// 注册服务
$container->set('serviceName', $serviceInstance);

// 获取服务
$service = $container->get('serviceName');

// 检查服务是否存在
if ($container->has('serviceName')) {
    // 服务已注册
}
```

### 基本 API

DuxLite 的容器提供三个核心方法：

```php
// 1. set() - 注册服务
App::di()->set('service.name', $instance);
App::di()->set('service.name', function() {
    return new Service();
});

// 2. get() - 获取服务
$service = App::di()->get('service.name');

// 3. has() - 检查服务
if (App::di()->has('service.name')) {
    $service = App::di()->get('service.name');
}
```

### 服务注册方式

#### 1. 直接实例注册

```php
// 注册已创建的实例
$logger = new Logger('app');
App::di()->set('logger', $logger);

// 注册配置值
App::di()->set('app.version', '1.0.0');
App::di()->set('app.debug', true);
```

#### 2. 工厂函数注册

```php
// 使用闭包延迟创建
App::di()->set('database', function() {
    return new Database(App::config('database'));
});

// 带参数的工厂
App::di()->set('cache', function() {
    $config = App::config('cache');
    return new Cache($config->get('driver'));
});
```

## 框架内置服务

DuxLite 框架自动注册了许多内置服务，你可以直接使用：

### 1. 数据库服务

```php
// 推荐：使用静态方法
$db = App::db();

// 或者通过容器获取
$db = App::di()->get('db');

// 使用数据库
$users = $db->table('users')->get();
```

### 2. 缓存服务

```php
// 获取默认缓存
$cache = App::cache();

// 获取 Redis 缓存
$cache = App::cache('redis');

// 通过容器获取（带类型标识）
$cache = App::di()->get('cache.redis');
```

### 3. 配置服务

```php
// 获取应用配置
$config = App::config('use');

// 通过容器获取
$config = App::di()->get('config.use');
```

### 4. 事件服务

```php
// 获取事件调度器
$events = App::event();

// 通过容器获取
$events = App::di()->get('events');
```

## 服务命名约定

DuxLite 使用一套清晰的服务命名约定：

### 基础服务

```php
// 核心服务
'db'           // 数据库管理器
'events'       // 事件调度器
'attributes'   // 注解属性

// 配置服务
'config.use'       // 应用配置
'config.database'  // 数据库配置
'config.cache'     // 缓存配置
```

### 类型化服务

```php
// 缓存服务
'cache.file'    // 文件缓存
'cache.redis'   // Redis 缓存
'cache.memory'  // 内存缓存

// 队列服务
'queue.sync'    // 同步队列
'queue.redis'   // Redis 队列

// 视图服务
'view.admin'    // 管理后台视图
'view.web'      // 前台视图
```

### 模块服务

```php
// 按模块组织
'user.service'      // 用户服务
'user.repository'   // 用户仓库
'order.service'     // 订单服务
'payment.gateway'   // 支付网关
```

## 服务注册

### 在模块中注册服务

DuxLite 在模块的生命周期方法中注册服务：

```php
class SystemApp extends AppExtend
{
    // 初始化阶段：注册基础服务
    public function init(Bootstrap $app): void
    {
        App::di()->set('module.version', '1.0.0');
        App::di()->set('module.name', 'System');
    }

    // 注册阶段：注册复杂服务
    public function register(Bootstrap $app): void
    {
        App::di()->set('user.service', function() {
            return new UserService(App::db());
        });
    }

    // 启动阶段：配置服务
    public function boot(Bootstrap $app): void
    {
        if (App::di()->has('user.service')) {
            $service = App::di()->get('user.service');
            $service->configure();
        }
    }
}
```

### 服务注册最佳实践

```php
class UserModule extends AppExtend
{
    public function register(Bootstrap $app): void
    {
        // ✅ 推荐：使用工厂函数
        App::di()->set('user.service', function() {
            return new UserService(
                App::db(),
                App::cache(),
                App::event()
            );
        });

        // ✅ 推荐：接口绑定
        App::di()->set(UserRepositoryInterface::class, function() {
            return new DatabaseUserRepository(App::db());
        });

        // ✅ 推荐：配置服务
        App::di()->set('user.config', [
            'password_min_length' => 8,
            'session_timeout' => 3600
        ]);
    }
}
```

## 实际应用示例

### 1. 服务层依赖注入

```php
class UserService
{
    private $db;
    private $cache;
    private $events;

    public function __construct()
    {
        // DuxLite 推荐：显式获取依赖
        $this->db = App::db();
        $this->cache = App::cache();
        $this->events = App::event();
    }

    public function create(array $data): User
    {
        // 创建用户
        $user = $this->db->table('users')->insert($data);

        // 清除缓存
        $this->cache->forget('users:count');

        // 触发事件
        $this->events->dispatch('user.created', $user);

        return $user;
    }
}
```

### 2. 控制器中使用服务

```php
class UserController
{
    public function store(Request $request): Response
    {
        // 直接使用注册的服务
        $userService = App::di()->get('user.service');

        $user = $userService->create($request->all());

        return response()->json($user);
    }
}
```

### 3. 第三方库集成

```php
class PaymentModule extends AppExtend
{
    public function register(Bootstrap $app): void
    {
        // 注册支付网关
        App::di()->set('payment.stripe', function() {
            return new StripeGateway(
                App::config('payment')->get('stripe.key')
            );
        });

        App::di()->set('payment.alipay', function() {
            return new AlipayGateway(
                App::config('payment')->get('alipay.config')
            );
        });

        // 注册支付工厂
        App::di()->set('payment.factory', function() {
            return new PaymentFactory([
                'stripe' => App::di()->get('payment.stripe'),
                'alipay' => App::di()->get('payment.alipay')
            ]);
        });
    }
}
```

## 测试中的依赖注入

### 1. 服务替换

```php
class UserServiceTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // 替换数据库为内存数据库
        App::di()->set('db', $this->createInMemoryDatabase());

        // 替换缓存为数组缓存
        App::di()->set('cache', new ArrayCache());

        // 模拟事件调度器
        App::di()->set('events', $this->createMock(EventDispatcher::class));
    }

    public function testCreateUser(): void
    {
        $userService = App::di()->get('user.service');

        $user = $userService->create([
            'name' => 'Test User',
            'email' => 'test@example.com'
        ]);

        $this->assertEquals('Test User', $user->name);
    }
}
```

### 2. 模拟服务

```php
class PaymentTest extends TestCase
{
    public function testPaymentProcess(): void
    {
        // 注册模拟支付网关
        $mockGateway = $this->createMock(PaymentGateway::class);
        $mockGateway->method('charge')->willReturn(['status' => 'success']);

        App::di()->set('payment.gateway', $mockGateway);

        $paymentService = new PaymentService();
        $result = $paymentService->processPayment(100);

        $this->assertEquals('success', $result['status']);
    }
}
```

## 最佳实践

### 1. 优先使用静态方法

```php
// ✅ 推荐：直接使用框架提供的静态方法
class UserService
{
    public function create(array $data): User
    {
        $db = App::db();
        $cache = App::cache();
        $events = App::event();

        // 业务逻辑...
    }
}

// ❌ 避免：过度使用依赖注入
class UserService
{
    public function __construct(
        private DatabaseManager $db,
        private CacheManager $cache,
        private EventDispatcher $events
    ) {}
}
```

### 2. 合理的服务注册时机

```php
class ModuleApp extends AppExtend
{
    public function init(Bootstrap $app): void
    {
        // ✅ 注册简单配置和常量
        App::di()->set('module.version', '1.0');
    }

    public function register(Bootstrap $app): void
    {
        // ✅ 注册复杂服务和工厂
        App::di()->set('complex.service', function() {
            return new ComplexService(App::db());
        });
    }

    public function boot(Bootstrap $app): void
    {
        // ✅ 配置已注册的服务
        $service = App::di()->get('complex.service');
        $service->initialize();
    }
}
```

### 3. 清晰的服务命名

```php
// ✅ 推荐：使用清晰的命名约定
App::di()->set('user.service', $userService);
App::di()->set('payment.stripe.gateway', $stripeGateway);
App::di()->set('cache.redis.session', $sessionCache);

// ❌ 避免：模糊的命名
App::di()->set('service1', $userService);
App::di()->set('gateway', $stripeGateway);
App::di()->set('cache', $sessionCache);
```

### 4. 避免循环依赖

```php
// ❌ 避免：循环依赖
class UserService
{
    public function __construct(OrderService $orderService) {}
}

class OrderService
{
    public function __construct(UserService $userService) {} // 循环依赖
}

// ✅ 解决：使用事件解耦
class UserService
{
    public function create(array $data): User
    {
        $user = $this->createUser($data);
        App::event()->dispatch('user.created', $user);
        return $user;
    }
}

class OrderService
{
    #[Listener(event: 'user.created')]
    public function handleUserCreated(User $user): void
    {
        // 处理用户创建后的订单逻辑
    }
}
```

## 性能考虑

### 1. 延迟加载

```php
// ✅ 使用工厂函数实现延迟加载
App::di()->set('expensive.service', function() {
    return new ExpensiveService(); // 只在需要时创建
});

// ❌ 避免：立即创建重型对象
App::di()->set('expensive.service', new ExpensiveService()); // 立即创建
```

### 2. 单例模式

```php
// 对于无状态的服务，可以考虑单例
App::di()->set('stateless.service', function() {
    static $instance;
    if (!$instance) {
        $instance = new StatelessService();
    }
    return $instance;
});
```

## 调试和诊断

### 1. 检查服务状态

```php
// 检查服务是否已注册
if (App::di()->has('user.service')) {
    echo "用户服务已注册";
}

// 获取所有已注册的服务（调试用）
$services = App::di()->getKnownEntryNames();
foreach ($services as $service) {
    echo "已注册服务: {$service}\n";
}
```

### 2. 服务调试

```php
class ServiceDebugger
{
    public static function listServices(): array
    {
        $container = App::di();
        $services = [];

        // 获取已知的服务名称
        foreach ($container->getKnownEntryNames() as $name) {
            $services[$name] = [
                'registered' => $container->has($name),
                'type' => gettype($container->get($name))
            ];
        }

        return $services;
    }
}
```

## 总结

DuxLite 的依赖注入系统提供了：

### 核心特性
- **基于 PHP-DI**：成熟稳定的容器实现
- **简单 API**：`set()`、`get()`、`has()` 三个核心方法
- **显式优先**：推荐使用静态方法而非过度依赖注入
- **模块化注册**：在模块生命周期中注册服务

### 设计理念
- **实用主义**：只在必要时使用依赖注入
- **IDE 友好**：优先提供完整的代码提示
- **性能考虑**：避免不必要的容器解析开销
- **可读性优先**：代码意图清晰明确

### 最佳实践
1. **优先使用框架静态方法**：`App::db()`、`App::cache()` 等
2. **合理的注册时机**：在模块的正确生命周期阶段注册服务
3. **清晰的命名约定**：使用点分隔的服务名称
4. **避免循环依赖**：使用事件系统解耦
5. **测试友好**：支持服务替换和模拟

掌握 DuxLite 的依赖注入理念和用法，将帮助你编写更清晰、可维护的代码。