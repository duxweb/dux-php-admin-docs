# 日志系统

DuxLite 提供了强大的日志系统，帮助你记录和监控应用运行状态。

## 🚀 快速开始

### 基础使用

```php
use Core\App;

// 记录不同级别的日志
App::log()->info('用户登录成功', ['user_id' => 123]);
App::log()->warning('缓存连接失败，使用备用方案');
App::log()->error('数据库连接异常', ['error' => $exception->getMessage()]);
App::log()->debug('调试信息', ['data' => $debugData]);

// 记录异常
try {
    // 业务逻辑
} catch (Exception $e) {
    App::log()->error('操作失败', [
        'exception' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'trace' => $e->getTraceAsString()
    ]);
}
```

### 日志级别

DuxLite 支持标准的日志级别：

- **emergency**: 系统不可用
- **alert**: 必须立即采取行动
- **critical**: 严重错误
- **error**: 运行时错误
- **warning**: 警告信息
- **notice**: 正常但重要的信息
- **info**: 一般信息
- **debug**: 调试信息

## 📋 日志配置

### 配置文件

在 `config/use.toml` 中配置日志：

```toml
[log]
# 日志级别：debug, info, notice, warning, error, critical, alert, emergency
level = "info"

# 日志驱动：file, database, syslog
driver = "file"

# 日志格式：json, line
format = "json"

# 文件日志配置
[log.file]
path = "storage/logs"
filename = "app.log"
max_files = 30
max_size = "10MB"

# 数据库日志配置
[log.database]
table = "logs"
connection = "default"

# 系统日志配置
[log.syslog]
facility = "local0"
```

## 🔧 高级用法

### 上下文信息

```php
// 添加上下文信息
App::log()->info('用户操作', [
    'user_id' => $userId,
    'action' => 'create_post',
    'ip' => request()->getClientIp(),
    'user_agent' => request()->getHeader('User-Agent'),
    'timestamp' => time()
]);

// 使用数组记录复杂数据
App::log()->debug('API 请求详情', [
    'method' => 'POST',
    'url' => '/api/users',
    'headers' => $request->getHeaders(),
    'body' => $request->getBody(),
    'response_time' => $responseTime
]);
```

### 条件日志

```php
// 只在开发环境记录调试日志
if (App::env('APP_DEBUG')) {
    App::log()->debug('SQL 查询', [
        'query' => $sql,
        'bindings' => $bindings,
        'time' => $queryTime
    ]);
}

// 只在生产环境记录性能日志
if (App::env('APP_ENV') === 'production') {
    App::log()->info('性能监控', [
        'memory_usage' => memory_get_usage(true),
        'execution_time' => microtime(true) - $_SERVER['REQUEST_TIME_FLOAT']
    ]);
}
```

## 🎯 实际应用示例

### 用户操作日志

```php
<?php

namespace App\System\Service;

use Core\App;

class UserLogService
{
    /**
     * 记录用户登录日志
     */
    public static function logLogin(int $userId, string $ip, bool $success = true): void
    {
        $level = $success ? 'info' : 'warning';
        $message = $success ? '用户登录成功' : '用户登录失败';
        
        App::log()->$level($message, [
            'user_id' => $userId,
            'ip' => $ip,
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    }

    /**
     * 记录用户操作日志
     */
    public static function logAction(int $userId, string $action, array $data = []): void
    {
        App::log()->info('用户操作', [
            'user_id' => $userId,
            'action' => $action,
            'data' => $data,
            'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    }

    /**
     * 记录权限检查日志
     */
    public static function logPermissionCheck(int $userId, string $permission, bool $granted): void
    {
        $level = $granted ? 'info' : 'warning';
        $message = $granted ? '权限检查通过' : '权限检查失败';
        
        App::log()->$level($message, [
            'user_id' => $userId,
            'permission' => $permission,
            'granted' => $granted,
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    }
}
```

### API 请求日志

```php
<?php

namespace App\System\Middleware;

use Core\App;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;

class ApiLogMiddleware implements MiddlewareInterface
{
    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $startTime = microtime(true);
        
        // 记录请求开始
        App::log()->info('API 请求开始', [
            'method' => $request->getMethod(),
            'uri' => (string) $request->getUri(),
            'headers' => $request->getHeaders(),
            'query' => $request->getQueryParams(),
            'ip' => $this->getClientIp($request)
        ]);

        try {
            $response = $handler->handle($request);
            
            // 记录请求成功
            $this->logResponse($request, $response, $startTime);
            
            return $response;
        } catch (\Throwable $e) {
            // 记录请求异常
            App::log()->error('API 请求异常', [
                'method' => $request->getMethod(),
                'uri' => (string) $request->getUri(),
                'exception' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'execution_time' => round((microtime(true) - $startTime) * 1000, 2) . 'ms'
            ]);
            
            throw $e;
        }
    }

    private function logResponse(ServerRequestInterface $request, ResponseInterface $response, float $startTime): void
    {
        $executionTime = round((microtime(true) - $startTime) * 1000, 2);
        
        $level = $response->getStatusCode() >= 400 ? 'warning' : 'info';
        
        App::log()->$level('API 请求完成', [
            'method' => $request->getMethod(),
            'uri' => (string) $request->getUri(),
            'status_code' => $response->getStatusCode(),
            'execution_time' => $executionTime . 'ms',
            'memory_usage' => round(memory_get_usage(true) / 1024 / 1024, 2) . 'MB'
        ]);
    }

    private function getClientIp(ServerRequestInterface $request): string
    {
        $serverParams = $request->getServerParams();
        
        return $serverParams['HTTP_X_FORWARDED_FOR'] 
            ?? $serverParams['HTTP_X_REAL_IP'] 
            ?? $serverParams['REMOTE_ADDR'] 
            ?? 'unknown';
    }
}
```

### 数据库操作日志

```php
<?php

namespace App\System\Service;

use Core\App;

class DatabaseLogService
{
    /**
     * 记录 SQL 查询日志
     */
    public static function logQuery(string $sql, array $bindings = [], float $time = 0): void
    {
        // 只在调试模式下记录 SQL 日志
        if (!App::env('APP_DEBUG')) {
            return;
        }

        App::log()->debug('SQL 查询', [
            'sql' => $sql,
            'bindings' => $bindings,
            'time' => round($time * 1000, 2) . 'ms'
        ]);
    }

    /**
     * 记录慢查询日志
     */
    public static function logSlowQuery(string $sql, array $bindings = [], float $time = 0): void
    {
        App::log()->warning('慢查询检测', [
            'sql' => $sql,
            'bindings' => $bindings,
            'time' => round($time * 1000, 2) . 'ms',
            'threshold' => '1000ms'
        ]);
    }

    /**
     * 记录数据库连接错误
     */
    public static function logConnectionError(\Throwable $e): void
    {
        App::log()->error('数据库连接失败', [
            'error' => $e->getMessage(),
            'code' => $e->getCode(),
            'file' => $e->getFile(),
            'line' => $e->getLine()
        ]);
    }
}
```

## 💡 最佳实践

### 1. 结构化日志

```php
// ✅ 好的做法 - 结构化日志
App::log()->info('订单创建', [
    'order_id' => $orderId,
    'user_id' => $userId,
    'amount' => $amount,
    'status' => 'pending',
    'created_at' => date('Y-m-d H:i:s')
]);

// ❌ 避免 - 非结构化日志
App::log()->info("用户 {$userId} 创建了订单 {$orderId}，金额 {$amount}");
```

### 2. 敏感信息处理

```php
// 过滤敏感信息
$userData = [
    'username' => $user->username,
    'email' => $user->email,
    'password' => '[FILTERED]',
    'credit_card' => '[FILTERED]'
];

App::log()->info('用户注册', $userData);
```

### 3. 日志分类

```php
// 按功能模块分类记录日志
class OrderLogService
{
    public static function logOrderCreated(int $orderId, array $data): void
    {
        App::log()->info('[ORDER] 订单创建', [
            'module' => 'order',
            'action' => 'create',
            'order_id' => $orderId,
            'data' => $data
        ]);
    }

    public static function logPaymentProcessed(int $orderId, string $paymentId): void
    {
        App::log()->info('[PAYMENT] 支付处理', [
            'module' => 'payment',
            'action' => 'process',
            'order_id' => $orderId,
            'payment_id' => $paymentId
        ]);
    }
}
```

### 4. 性能监控

```php
class PerformanceLogger
{
    private static array $timers = [];

    public static function start(string $name): void
    {
        self::$timers[$name] = microtime(true);
    }

    public static function end(string $name, array $context = []): void
    {
        if (!isset(self::$timers[$name])) {
            return;
        }

        $duration = microtime(true) - self::$timers[$name];
        unset(self::$timers[$name]);

        App::log()->info('性能监控', array_merge([
            'operation' => $name,
            'duration' => round($duration * 1000, 2) . 'ms',
            'memory_usage' => round(memory_get_usage(true) / 1024 / 1024, 2) . 'MB'
        ], $context));
    }
}

// 使用示例
PerformanceLogger::start('user_query');
$users = User::all();
PerformanceLogger::end('user_query', ['count' => $users->count()]);
```

## 🎉 总结

DuxLite 日志系统的特点：

- **🚀 简单易用**：统一的日志接口，易于使用
- **🔧 多驱动支持**：支持文件、数据库等多种存储方式
- **⚡ 高性能**：异步写入，不影响应用性能
- **🛡️ 结构化**：支持结构化日志，便于分析
- **📊 监控友好**：便于集成监控和告警系统

合理使用日志系统可以帮助你更好地监控和调试应用！
