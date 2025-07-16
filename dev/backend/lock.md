# 原子锁

DuxLite 提供了基于 Symfony Lock 组件的原子锁系统，支持多种存储后端，用于防止并发操作引起的数据竞争和重复执行问题。

## 🚀 快速开始

### 基础锁操作

```php
use Core\App;

class OrderService
{
    public function processOrder(int $orderId): array
    {
        // 获取锁工厂
        $lockFactory = App::lock();
        
        // 创建锁
        $lock = $lockFactory->createLock("order_process:{$orderId}", 300); // 5分钟超时

        if (!$lock->acquire()) {
            return error("订单 {$orderId} 正在处理中，请勿重复操作");
        }

        try {
            // 执行需要锁保护的业务逻辑
            $this->doProcessOrder($orderId);
            
            return success('订单处理成功');
            
        } finally {
            // 确保释放锁
            $lock->release();
        }
    }

    private function doProcessOrder(int $orderId): void
    {
        // 具体的订单处理逻辑
        // 库存扣减、支付处理、物流安排等
    }
}
```

### 带超时的锁获取

```php
// 创建带超时的锁（30秒自动过期）
$lock = $lockFactory->createLock('user_process', 30.0);

// 尝试获取锁，最多等待5秒
if ($lock->acquire(true, 5.0)) {
    try {
        // 处理用户相关操作
        $this->processUserData();
    } finally {
        $lock->release();
    }
} else {
    return error('获取锁超时，请稍后重试');
}
```

## 📋 锁配置

### 配置文件设置

在 `config/use.toml` 中配置锁类型：

```toml
[lock]
# 锁类型：semaphore（信号量）、flock（文件锁）、redis（Redis锁）
type = "redis"

# 锁的默认超时时间（秒）
default_timeout = 60
```

### 存储类型对比

| 锁类型 | 适用场景 | 优点 | 缺点 |
|--------|----------|------|------|
| **Semaphore** | 单机多进程 | 性能最佳，系统原生支持 | 仅限单机，需要 sysvsem 扩展 |
| **Flock** | 单机文件锁 | 无需扩展，简单可靠 | 仅限单机，依赖文件系统 |
| **Redis** | 多进程/多机环境 | 支持跨进程跨机器，功能丰富 | 依赖 Redis 服务 |

### Redis 锁配置

如果使用 Redis 锁，需要在 `config/database.toml` 中配置 Redis 连接：

```toml
[redis.drivers.default]
host = "localhost"
port = 6379
password = ""
database = 3                 # 使用专门的锁数据库
timeout = 2.5

# 专用锁 Redis
[redis.drivers.lock]
host = "localhost"
port = 6379
password = ""
database = 4
timeout = 2.5
optPrefix = "lock_"
```

## 🔧 锁操作模式

### 阻塞模式

```php
// 阻塞模式：等待获取锁，直到成功或超时
$lock = $lockFactory->createLock('resource', 30.0); // 30秒超时

if ($lock->acquire(true, 5.0)) { // 最多等待5秒
    try {
        // 执行业务逻辑
    } finally {
        $lock->release();
    }
} else {
    return error('获取锁超时');
}
```

### 非阻塞模式

```php
// 非阻塞模式：立即返回结果
$lock = $lockFactory->createLock('resource');

if ($lock->acquire(false)) { // 不等待，立即返回
    try {
        // 执行业务逻辑
    } finally {
        $lock->release();
    }
} else {
    // 锁被占用，可以选择排队或者跳过
    $this->scheduleForLater();
}
```

### 获取不同类型的锁

```php
// 获取默认锁工厂（从 use.toml 读取类型）
$lockFactory = App::lock();

// 获取指定类型的锁工厂
$redisLock = App::lock('redis');
$flockLock = App::lock('flock');
$semaphoreLock = App::lock('semaphore');
```

## 🎯 实际应用示例

### 1. 防止重复执行

```php
class OrderService
{
    public function processOrder(int $orderId): array
    {
        $lockFactory = App::lock('redis');
        $lock = $lockFactory->createLock("order_process:{$orderId}", 300); // 5分钟超时

        if (!$lock->acquire()) {
            return error("订单 {$orderId} 正在处理中，请勿重复操作");
        }

        try {
            // 检查订单状态
            $order = Order::find($orderId);
            if ($order->status !== 'pending') {
                return success('订单已处理'); // 订单已处理
            }

            // 处理订单业务逻辑
            $this->doProcessOrder($order);

            // 更新订单状态
            $order->update(['status' => 'processing']);
            
            return success('订单处理成功');

        } finally {
            $lock->release();
        }
    }

    private function doProcessOrder(Order $order): void
    {
        // 具体的订单处理逻辑
        // 库存扣减、支付处理、物流安排等
    }
}
```

### 2. 文件上传去重

```php
class FileUploadService
{
    public function uploadFile($file, string $userId): array
    {
        $fileHash = md5_file($file->getStream()->getMetadata('uri'));
        $lockFactory = App::lock('redis');
        $lock = $lockFactory->createLock("file_upload:{$fileHash}", 60);

        if (!$lock->acquire()) {
            return error('相同文件正在上传中，请稍后重试');
        }

        try {
            // 检查文件是否已存在
            $existingFile = File::where('hash', $fileHash)->first();
            if ($existingFile) {
                return success('文件已存在', ['file_id' => $existingFile->id]);
            }

            // 执行文件上传
            $uploadedFile = $this->doUploadFile($file, $userId, $fileHash);
            
            return success('文件上传成功', ['file_id' => $uploadedFile->id]);

        } finally {
            $lock->release();
        }
    }

    private function doUploadFile($file, string $userId, string $hash): File
    {
        // 实际的文件上传逻辑
        // 保存文件、生成缩略图、更新数据库等
    }
}
```

### 3. 定时任务防重复

```php
class DataSyncService
{
    public function syncExternalData(): void
    {
        $lockFactory = App::lock('redis');
        $lock = $lockFactory->createLock('data_sync_task', 300); // 5分钟超时

        if (!$lock->acquire()) {
            logger()->info('数据同步任务已在运行中，跳过本次执行');
            return;
        }

        try {
            logger()->info('开始数据同步任务');

            // 获取上次同步时间
            $lastSync = $this->getLastSyncTime();

            // 从外部API获取增量数据
            $data = $this->fetchIncrementalData($lastSync);

            // 批量处理数据
            $this->processSyncData($data);

            // 更新同步时间戳
            $this->updateLastSyncTime();

            logger()->info('数据同步任务完成', [
                'processed_records' => count($data)
            ]);

        } catch (\Exception $e) {
            logger()->error('数据同步任务失败', [
                'error' => $e->getMessage()
            ]);
            throw $e;

        } finally {
            $lock->release();
        }
    }

    private function getLastSyncTime(): string
    {
        // 获取上次同步时间
    }

    private function fetchIncrementalData(string $lastSync): array
    {
        // 从外部API获取数据
    }

    private function processSyncData(array $data): void
    {
        // 处理同步数据
    }

    private function updateLastSyncTime(): void
    {
        // 更新同步时间
    }
}
```

### 4. 用户操作防并发

```php
class UserService
{
    public function updateUserProfile(int $userId, array $data): array
    {
        $lockFactory = App::lock('redis');
        $lock = $lockFactory->createLock("user_update:{$userId}", 30);

        if (!$lock->acquire()) {
            return error('用户信息正在更新中，请稍后重试');
        }

        try {
            // 获取用户信息
            $user = User::find($userId);
            if (!$user) {
                return error('用户不存在');
            }

            // 验证数据
            $this->validateUserData($data);

            // 更新用户信息
            $user->update($data);

            // 清除相关缓存
            $this->clearUserCache($userId);

            return success('用户信息更新成功', $user->toArray());

        } finally {
            $lock->release();
        }
    }

    private function validateUserData(array $data): void
    {
        // 验证用户数据
    }

    private function clearUserCache(int $userId): void
    {
        // 清除用户相关缓存
    }
}
```

## 💡 最佳实践

### 1. 锁粒度控制

```php
// ❌ 锁粒度过大
$lock = $lockFactory->createLock('all_users'); // 影响所有用户操作

// ✅ 合适的锁粒度
$lock = $lockFactory->createLock("user:{$userId}"); // 只影响特定用户
```

### 2. 超时时间优化

```php
// ❌ 超时时间过长
$lock = $lockFactory->createLock('quick_task', 3600); // 1小时，过长

// ✅ 合理的超时时间
$lock = $lockFactory->createLock('quick_task', 30); // 30秒，合理
```

### 3. 非阻塞获取锁

```php
// 非阻塞方式获取锁，快速失败
if ($lock->acquire(false)) {
    try {
        // 执行任务
    } finally {
        $lock->release();
    }
} else {
    // 快速返回或排队处理
    $this->queueTask($taskData);
}
```

### 4. 锁的安全释放

```php
public function safeExecuteWithLock(string $resource, callable $callback): mixed
{
    $lockFactory = App::lock();
    $lock = $lockFactory->createLock($resource, 60);

    try {
        if (!$lock->acquire(true, 5.0)) {
            throw new \Exception("获取锁失败: {$resource}");
        }

        return $callback();

    } catch (\Exception $e) {
        logger()->error('锁保护的操作失败', [
            'resource' => $resource,
            'error' => $e->getMessage()
        ]);
        throw $e;

    } finally {
        try {
            $lock->release();
        } catch (\Exception $e) {
            logger()->warning('释放锁失败', [
                'resource' => $resource,
                'error' => $e->getMessage()
            ]);
        }
    }
}
```

## 🎉 总结

DuxLite 原子锁系统的特点：

- **🔒 多种存储**：支持 Semaphore、Flock、Redis 三种锁类型
- **⚡ 高性能**：基于 Symfony Lock 组件，性能优异
- **🛡️ 防并发**：有效防止数据竞争和重复执行
- **🔧 易配置**：简单的配置文件设置
- **📊 灵活控制**：支持阻塞和非阻塞模式

合理使用原子锁可以有效解决高并发场景下的数据一致性问题！
