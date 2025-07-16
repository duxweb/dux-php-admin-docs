# 队列系统

DuxLite 提供了基于 Enqueue 的强大队列系统，支持 Redis 和 AMQP 两种队列后端，用于处理异步任务和提升应用性能。

## 🚀 快速开始

### 什么是队列？

队列让你可以将耗时的任务（如发送邮件、图片处理、数据导出等）放到后台异步执行，而不阻塞用户请求。

### 基础使用

基于 `src/Queue/Queue.php` 的实际代码：

```php
use Core\App;

// 获取队列实例
$queue = App::queue();

// 添加任务到队列
$message = $queue->add(
    class: 'App\Jobs\EmailJob',
    method: 'send',
    params: ['user@example.com', '欢迎注册', '感谢您的注册...'],
    name: 'queue'  // 队列名称（可选，默认为 'queue'）
);

// 立即发送任务
$message->send();

// 延迟执行任务（5分钟后）
$message = $queue->add('App\Jobs\ProcessImageJob', 'process', ['/uploads/image.jpg']);
$message->delay(300)->send();
```

## 📋 队列配置

### 配置文件设置

队列配置分为两个文件：`queue.toml` 和 `database.toml`。

#### 1. 队列服务配置 (`config/queue.toml`)

```toml
# 队列服务类型：redis 或 amqp
type = "redis"

# 驱动器名称（对应 database.toml 中的配置）
driver = "default"
```

#### 2. 队列后端配置 (`config/database.toml`)

**Redis 队列配置：**

```toml
# Redis 队列后端
[redis.drivers.default]
host = "localhost"
port = 6379
auth = ""                    # Redis 密码
database = 0
persistent = false
optPrefix = "queue_"         # 队列前缀

# 专用队列 Redis
[redis.drivers.queue]
host = "localhost"
port = 6379
auth = ""
database = 2
persistent = false
optPrefix = "dux_queue_"
```

**AMQP 队列配置：**

```toml
# RabbitMQ / AMQP 配置
[amqp.drivers.default]
host = "localhost"
port = 5672
vhost = "/"
username = "guest"
password = "guest"
persisted = false
prefix = "dux_"
```

### 获取队列实例

```php
use Core\App;

// 获取默认队列（从 queue.toml 读取类型）
$queue = App::queue();

// 获取指定类型的队列
$redisQueue = App::queue('redis');
$amqpQueue = App::queue('amqp');
```
## 🔧 创建队列任务

### 任务类定义

基于 `docs/core/queues.md` 的实际代码，创建处理任务的类：

```php
<?php

namespace App\Jobs;

class EmailJob
{
    public function send(string $to, string $subject, string $body): void
    {
        // 邮件发送逻辑
        $this->sendEmail($to, $subject, $body);

        // 记录日志
        error_log("邮件已发送到: {$to}");
    }

    public function sendWelcome(int $userId): void
    {
        // 发送欢迎邮件
        $user = User::find($userId);
        if ($user) {
            $this->send(
                $user->email,
                '欢迎注册',
                "欢迎 {$user->name} 注册我们的网站！"
            );
        }
    }

    private function sendEmail(string $to, string $subject, string $body): void
    {
        // 实际的邮件发送实现
        // 可以使用 PHPMailer、SwiftMailer 等
        mail($to, $subject, $body);
    }
}
```

### 任务类特点

- **无需继承**：普通的 PHP 类即可，无需继承特定基类
- **方法调用**：通过类名和方法名调用具体任务
- **参数传递**：支持任意数量和类型的参数

### 图片处理任务示例

```php
<?php

namespace App\Jobs;

class ImageJob
{
    public function resize(string $imagePath, int $width, int $height): void
    {
        // 调整图片尺寸
        $image = imagecreatefromjpeg($imagePath);
        $resized = imagescale($image, $width, $height);

        $resizedPath = str_replace('.jpg', "_resized_{$width}x{$height}.jpg", $imagePath);
        imagejpeg($resized, $resizedPath);

        imagedestroy($image);
        imagedestroy($resized);

        error_log("图片已调整尺寸: {$resizedPath}");
    }

    public function addWatermark(string $imagePath, string $watermarkPath): void
    {
        // 添加水印
        $image = imagecreatefromjpeg($imagePath);
        $watermark = imagecreatefrompng($watermarkPath);

        // 水印位置计算
        $imageWidth = imagesx($image);
        $imageHeight = imagesy($image);
        $watermarkWidth = imagesx($watermark);
        $watermarkHeight = imagesy($watermark);

        // 右下角位置
        $x = $imageWidth - $watermarkWidth - 10;
        $y = $imageHeight - $watermarkHeight - 10;

        // 合并图片
        imagecopy($image, $watermark, $x, $y, 0, 0, $watermarkWidth, $watermarkHeight);

        // 保存结果
        $watermarkedPath = str_replace('.jpg', '_watermarked.jpg', $imagePath);
        imagejpeg($image, $watermarkedPath);

        imagedestroy($image);
        imagedestroy($watermark);

        error_log("水印已添加: {$watermarkedPath}");
    }

    public function compress(string $imagePath, int $quality = 80): void
    {
        // 压缩图片
        $image = imagecreatefromjpeg($imagePath);
        $compressedPath = str_replace('.jpg', '_compressed.jpg', $imagePath);

        imagejpeg($image, $compressedPath, $quality);
        imagedestroy($image);

        error_log("图片已压缩: {$compressedPath}");
    }
}
```

## 🎯 实际应用示例

### 在控制器中使用队列

```php
<?php

namespace App\System\Admin;

use Core\App;
use Core\Resources\Action\Resources;

class User extends Resources
{
    // 用户注册后发送欢迎邮件
    public function createAfter(Data $data, mixed $info): void
    {
        // 异步发送欢迎邮件
        App::queue()->add(
            'App\Jobs\EmailJob',
            'send',
            [$data->email, '欢迎注册', "欢迎 {$data->nickname} 注册我们的系统！"]
        )->send();
    }

    // 用户上传头像后处理图片
    public function uploadAvatar(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $uploadedFile = $request->getUploadedFiles()['avatar'];
        $imagePath = $this->saveUploadedFile($uploadedFile);

        // 异步处理图片
        $auth = $request->getAttribute('auth');
        App::queue()->add(
            'App\Jobs\ImageJob',
            'resize',
            [$imagePath, 200, 200]
        )->send();

        return send($response, '头像上传成功，正在处理中...');
    }
}
```

### 数据导出任务

```php
<?php

namespace App\Jobs;

use Core\App;
use App\System\Models\SystemUser;

class ExportJob
{
    public function exportUsers(array $filters, string $email): void
    {
        // 查询用户数据
        $query = SystemUser::query();

        if (!empty($filters['dept_id'])) {
            $query->where('dept_id', $filters['dept_id']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        $users = $query->get();

        // 生成 Excel 文件
        $filename = 'users_export_' . date('Y-m-d_H-i-s') . '.xlsx';
        $filepath = storage_path('exports/' . $filename);

        $this->generateExcel($users, $filepath);

        // 发送下载链接邮件
        App::queue()->add(
            'App\Jobs\EmailJob',
            'send',
            [$email, '用户数据导出完成', "您的用户数据导出已完成，下载链接：" . url('download/' . $filename)]
        )->send();

        error_log("用户数据导出完成: {$filename}");
    }

    private function generateExcel($users, $filepath): void
    {
        // Excel 生成逻辑
        // 使用 PhpSpreadsheet 或其他库
        $data = [];
        $data[] = ['ID', '用户名', '邮箱', '状态', '创建时间']; // 表头

        foreach ($users as $user) {
            $data[] = [
                $user->id,
                $user->username,
                $user->email,
                $user->status ? '启用' : '禁用',
                $user->created_at->format('Y-m-d H:i:s')
            ];
        }

        // 这里应该使用实际的 Excel 生成库
        file_put_contents($filepath, json_encode($data, JSON_UNESCAPED_UNICODE));
    }
}
```

## 🚀 队列工作进程

### 启动队列工作进程

```bash
# 启动队列工作进程
php artisan queue:work

# 指定队列名称
php artisan queue:work --queue=emails,images

# 设置超时时间
php artisan queue:work --timeout=60

# 设置内存限制
php artisan queue:work --memory=512

# 后台运行
nohup php artisan queue:work > /dev/null 2>&1 &
```

### 进程管理配置

使用 Supervisor 管理队列进程：

```ini
[program:dux-queue-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /path/to/project/artisan queue:work --sleep=3 --tries=3
autostart=true
autorestart=true
user=www-data
numprocs=4
redirect_stderr=true
stdout_logfile=/path/to/project/storage/logs/worker.log
```

## 💡 最佳实践

### 1. 任务设计原则

```php
// ✅ 好的做法 - 任务职责单一
class SendEmailJob extends Job
{
    public function handle(): void
    {
        // 只负责发送邮件
        $this->sendEmail();
    }
}

class ProcessImageJob extends Job
{
    public function handle(): void
    {
        // 只负责图片处理
        $this->processImage();
    }
}

// ❌ 避免 - 任务职责过多
class UserRegistrationJob extends Job
{
    public function handle(): void
    {
        $this->sendEmail();      // 发送邮件
        $this->processImage();   // 处理头像
        $this->updateStats();    // 更新统计
        $this->sendSms();        // 发送短信
    }
}
```

### 2. 错误处理和重试

```php
class SendEmailJob extends Job
{
    public int $tries = 3;      // 最大重试次数
    public int $timeout = 60;   // 超时时间（秒）

    public function handle(): void
    {
        try {
            $this->sendEmail();
        } catch (\Exception $e) {
            // 记录错误日志
            logger()->error('邮件发送失败', [
                'error' => $e->getMessage(),
                'data' => $this->data
            ]);

            // 重新抛出异常，触发重试
            throw $e;
        }
    }

    public function failed(\Throwable $exception): void
    {
        // 所有重试都失败后的处理
        logger()->critical('邮件发送彻底失败', [
            'error' => $exception->getMessage(),
            'data' => $this->data
        ]);

        // 可以发送告警通知
        $this->sendAlert($exception);
    }
}
```

### 3. 队列监控

```php
// 队列状态监控
class QueueMonitor
{
    public static function getStats(): array
    {
        return [
            'pending_jobs' => Queue::size(),
            'failed_jobs' => Queue::failedCount(),
            'processed_jobs' => Queue::processedCount(),
            'workers_count' => Queue::workersCount(),
        ];
    }

    public static function clearFailedJobs(): void
    {
        Queue::clearFailedJobs();
    }

    public static function retryFailedJobs(): void
    {
        Queue::retryFailedJobs();
    }
}
```

### 4. 队列优先级

```php
// 指定队列名称处理不同优先级任务
$highPriorityQueue = App::queue();
$highPriorityQueue->add('App\Jobs\SmsJob', 'send', [$data], 'high_priority')->send();

$normalQueue = App::queue();
$normalQueue->add('App\Jobs\EmailJob', 'send', [$data], 'normal')->send();

$lowPriorityQueue = App::queue();
$lowPriorityQueue->add('App\Jobs\ExportJob', 'export', [$data], 'low_priority')->send();
```

## 🔗 与计划任务集成

### 使用 Scheduler 注解

基于 `src/Scheduler/Attribute/Scheduler.php` 的实际代码，可以使用 `#[Scheduler]` 注解创建定时队列任务：

```php
<?php

namespace App\Tasks;

use Core\Scheduler\Attribute\Scheduler;
use Core\App;

class ScheduledQueueJobs
{
    #[Scheduler('0 2 * * *')] // 每天凌晨 2 点
    public function dailyCleanup(): void
    {
        // 清理过期数据
        App::queue()->add(
            'App\Jobs\CleanupJob',
            'cleanExpiredData',
            []
        )->send();

        // 生成日报
        App::queue()->add(
            'App\Jobs\ReportJob',
            'generateDailyReport',
            [date('Y-m-d')]
        )->send();
    }

    #[Scheduler('*/30 * * * *')] // 每30分钟
    public function healthCheck(): void
    {
        // 检查队列健康状态
        App::queue()->add(
            'App\Jobs\MonitorJob',
            'checkQueueHealth',
            []
        )->send();
    }

    #[Scheduler('0 0 * * 0')] // 每周日午夜
    public function weeklyReport(): void
    {
        // 生成周报
        App::queue()->add(
            'App\Jobs\ReportJob',
            'generateWeeklyReport',
            [date('Y-W')]
        )->send();
    }
}
```

### 启动计划任务服务

```bash
# 启动计划任务服务
php dux scheduler
```

### 与事件系统集成

```php
<?php

use Core\Event\Attribute\Listener;

class QueueEventListener
{
    #[Listener('user.registered')]
    public function handleUserRegistered($user): void
    {
        // 异步发送欢迎邮件
        App::queue()->add(
            'App\Jobs\EmailJob',
            'sendWelcome',
            [$user->id]
        )->send();

        // 异步生成用户报告（延迟5分钟）
        App::queue()->add(
            'App\Jobs\ReportJob',
            'generateUserReport',
            [$user->id]
        )->delay(300)->send();
    }

    #[Listener('order.completed')]
    public function handleOrderCompleted($order): void
    {
        // 异步发送订单确认邮件
        App::queue()->add(
            'App\Jobs\EmailJob',
            'sendOrderConfirmation',
            [$order->id]
        )->send();

        // 异步更新库存
        App::queue()->add(
            'App\Jobs\InventoryJob',
            'updateStock',
            [$order->items]
        )->send();
    }
}
```

## 🎉 总结

DuxLite 队列系统的特点：

- **🚀 基于 Enqueue**：使用成熟的 Enqueue 库，性能稳定
- **🔧 多种后端**：支持 Redis 和 AMQP 两种队列后端
- **📝 简单易用**：普通 PHP 类即可，无需继承特定基类
- **⏰ 延迟执行**：支持任务延迟执行
- **🔗 系统集成**：与计划任务、事件系统深度集成
- **📊 灵活配置**：支持多队列、优先级控制

通过合理使用队列系统，可以显著提升应用的响应性能和用户体验！

## 🎉 总结

DuxLite 队列系统的特点：

- **🚀 简单易用**：简洁的 API，快速上手
- **🔧 多驱动支持**：支持 Redis、数据库等多种驱动
- **⚡ 高性能**：异步处理，提升应用响应速度
- **🛡️ 可靠性**：失败重试机制，确保任务执行
- **📊 监控管理**：完整的队列监控和管理功能

合理使用队列系统可以显著提升应用性能和用户体验！