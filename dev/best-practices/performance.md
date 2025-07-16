# 性能优化

性能优化是构建高效 Dux PHP Admin 应用的关键。本指南介绍从数据库到前端的全方位性能优化策略。

## 数据库优化

### 查询优化

#### 使用索引
```php
// 在模型中定义索引
class User extends Model
{
    protected $table = 'users';
    
    // 在数据库迁移中创建索引
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->index(['status', 'created_at']);
            $table->index('email');
            $table->index('username');
        });
    }
}
```

#### 避免 N+1 查询
```php
// 错误示例：会产生 N+1 查询
$users = User::all();
foreach ($users as $user) {
    echo $user->role->name; // 每次都查询数据库
}

// 正确示例：使用预加载
$users = User::with('role')->get();
foreach ($users as $user) {
    echo $user->role->name; // 不会产生额外查询
}
```

#### 查询优化示例
```php
public function queryMany(Builder $query, ServerRequestInterface $request, array $args): void
{
    // 只查询需要的字段
    $query->select(['id', 'username', 'email', 'status', 'created_at']);
    
    // 使用预加载
    $query->with(['role:id,name', 'department:id,name']);
    
    // 使用索引字段进行筛选
    $params = $request->getQueryParams();
    if (isset($params['status'])) {
        $query->where('status', $params['status']);
    }
    
    // 使用 LIMIT 限制结果数量
    $query->limit(100);
}
```

### 数据库连接优化

#### 连接池配置
```toml
[database]
host = "localhost"
port = 3306
username = "root"
password = "password"
database = "dux_admin"
charset = "utf8mb4"
collation = "utf8mb4_unicode_ci"

# 连接池设置
max_connections = 100
min_connections = 10
max_idle_time = 60
```

#### 读写分离
```php
// 配置读写分离
$writeConfig = [
    'host' => 'master.db.example.com',
    'username' => 'writer',
    'password' => 'write_password'
];

$readConfig = [
    'host' => 'slave.db.example.com',
    'username' => 'reader',
    'password' => 'read_password'
];
```

## 缓存策略

### Redis 缓存
```php
class UserService
{
    private $redis;
    
    public function getUserById(int $id): ?User
    {
        $cacheKey = "user:{$id}";
        
        // 从缓存获取
        $cached = $this->redis->get($cacheKey);
        if ($cached) {
            return json_decode($cached, true);
        }
        
        // 从数据库获取
        $user = User::find($id);
        if ($user) {
            // 存入缓存，过期时间1小时
            $this->redis->setex($cacheKey, 3600, json_encode($user->toArray()));
        }
        
        return $user;
    }
    
    public function updateUser(int $id, array $data): User
    {
        $user = User::find($id);
        $user->update($data);
        
        // 更新后清除缓存
        $this->redis->del("user:{$id}");
        
        return $user;
    }
}
```

### 查询结果缓存
```php
public function queryMany(Builder $query, ServerRequestInterface $request, array $args): void
{
    $params = $request->getQueryParams();
    $cacheKey = 'users:' . md5(serialize($params));
    
    // 尝试从缓存获取
    $cached = $this->redis->get($cacheKey);
    if ($cached) {
        return json_decode($cached, true);
    }
    
    // 执行查询
    $result = $query->get();
    
    // 缓存结果，过期时间10分钟
    $this->redis->setex($cacheKey, 600, json_encode($result));
    
    return $result;
}
```

### 分布式缓存
```php
class CacheService
{
    private $redis;
    
    public function remember(string $key, int $ttl, callable $callback)
    {
        $value = $this->redis->get($key);
        
        if ($value === null) {
            $value = $callback();
            $this->redis->setex($key, $ttl, serialize($value));
        } else {
            $value = unserialize($value);
        }
        
        return $value;
    }
    
    public function tags(array $tags): self
    {
        $this->tags = $tags;
        return $this;
    }
    
    public function flush(): void
    {
        foreach ($this->tags as $tag) {
            $keys = $this->redis->keys("tag:{$tag}:*");
            if ($keys) {
                $this->redis->del($keys);
            }
        }
    }
}
```

## 前端优化

### 代码分割
```javascript
// 路由级代码分割
const router = createRouter({
  routes: [
    {
      path: '/users',
      component: () => import('./views/Users.vue')
    },
    {
      path: '/roles',
      component: () => import('./views/Roles.vue')
    }
  ]
})
```

### 组件懒加载
```vue
<template>
  <div>
    <Suspense>
      <template #default>
        <LazyComponent />
      </template>
      <template #fallback>
        <div>Loading...</div>
      </template>
    </Suspense>
  </div>
</template>

<script setup>
import { defineAsyncComponent } from 'vue'

const LazyComponent = defineAsyncComponent(() => import('./HeavyComponent.vue'))
</script>
```

### 虚拟滚动
```vue
<template>
  <div class="virtual-list" ref="container">
    <div
      v-for="item in visibleItems"
      :key="item.id"
      class="list-item"
      :style="{ height: itemHeight + 'px' }"
    >
      {{ item.content }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  items: Array,
  itemHeight: { type: Number, default: 50 }
})

const container = ref(null)
const scrollTop = ref(0)
const containerHeight = ref(0)

const visibleItems = computed(() => {
  const start = Math.floor(scrollTop.value / props.itemHeight)
  const end = Math.min(start + Math.ceil(containerHeight.value / props.itemHeight), props.items.length)
  return props.items.slice(start, end)
})

const handleScroll = () => {
  scrollTop.value = container.value.scrollTop
}

onMounted(() => {
  container.value.addEventListener('scroll', handleScroll)
  containerHeight.value = container.value.clientHeight
})

onUnmounted(() => {
  container.value?.removeEventListener('scroll', handleScroll)
})
</script>
```

## 资源优化

### 图片优化
```php
class ImageService
{
    public function optimizeImage(string $imagePath): string
    {
        $image = imagecreatefromstring(file_get_contents($imagePath));
        
        // 压缩图片
        $quality = 85;
        $outputPath = $this->generateOptimizedPath($imagePath);
        
        imagejpeg($image, $outputPath, $quality);
        imagedestroy($image);
        
        return $outputPath;
    }
    
    public function generateThumbnail(string $imagePath, int $width, int $height): string
    {
        $image = imagecreatefromstring(file_get_contents($imagePath));
        
        $originalWidth = imagesx($image);
        $originalHeight = imagesy($image);
        
        // 计算缩放比例
        $ratio = min($width / $originalWidth, $height / $originalHeight);
        $newWidth = $originalWidth * $ratio;
        $newHeight = $originalHeight * $ratio;
        
        $thumbnail = imagecreatetruecolor($newWidth, $newHeight);
        imagecopyresampled($thumbnail, $image, 0, 0, 0, 0, $newWidth, $newHeight, $originalWidth, $originalHeight);
        
        $thumbnailPath = $this->generateThumbnailPath($imagePath, $width, $height);
        imagejpeg($thumbnail, $thumbnailPath, 85);
        
        imagedestroy($image);
        imagedestroy($thumbnail);
        
        return $thumbnailPath;
    }
}
```

### 静态资源优化
```javascript
// webpack.config.js
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all'
        }
      }
    }
  },
  module: {
    rules: [
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[hash].[ext]',
              outputPath: 'images/'
            }
          },
          {
            loader: 'image-webpack-loader',
            options: {
              mozjpeg: {
                progressive: true,
                quality: 85
              },
              optipng: {
                enabled: false
              },
              pngquant: {
                quality: [0.65, 0.90],
                speed: 4
              }
            }
          }
        ]
      }
    ]
  }
}
```

## 内存优化

### 内存使用监控
```php
class MemoryMonitor
{
    private $startMemory;
    
    public function start(): void
    {
        $this->startMemory = memory_get_usage(true);
    }
    
    public function check(string $checkpoint): void
    {
        $current = memory_get_usage(true);
        $peak = memory_get_peak_usage(true);
        $used = $current - $this->startMemory;
        
        Log::info("内存使用情况", [
            'checkpoint' => $checkpoint,
            'current' => $this->formatBytes($current),
            'peak' => $this->formatBytes($peak),
            'used' => $this->formatBytes($used)
        ]);
    }
    
    private function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $unitIndex = 0;
        
        while ($bytes >= 1024 && $unitIndex < count($units) - 1) {
            $bytes /= 1024;
            $unitIndex++;
        }
        
        return round($bytes, 2) . ' ' . $units[$unitIndex];
    }
}
```

### 大数据处理
```php
class DataProcessor
{
    public function processLargeDataset(string $filePath): void
    {
        $handle = fopen($filePath, 'r');
        
        if ($handle) {
            $batchSize = 1000;
            $batch = [];
            
            while (($line = fgets($handle)) !== false) {
                $batch[] = $this->parseLine($line);
                
                if (count($batch) >= $batchSize) {
                    $this->processBatch($batch);
                    $batch = []; // 清空数组释放内存
                }
            }
            
            // 处理剩余数据
            if (!empty($batch)) {
                $this->processBatch($batch);
            }
            
            fclose($handle);
        }
    }
    
    private function processBatch(array $batch): void
    {
        // 批量处理数据
        DB::transaction(function () use ($batch) {
            foreach ($batch as $item) {
                // 处理单个项目
                $this->processItem($item);
            }
        });
    }
}
```

## 并发优化

### 队列处理
```php
class QueueWorker
{
    public function processJobs(): void
    {
        while (true) {
            $job = $this->getNextJob();
            
            if ($job) {
                try {
                    $this->processJob($job);
                    $this->markJobCompleted($job);
                } catch (Exception $e) {
                    $this->markJobFailed($job, $e);
                }
            } else {
                sleep(1); // 没有任务时休眠
            }
        }
    }
    
    private function processJob(Job $job): void
    {
        switch ($job->type) {
            case 'send_email':
                $this->sendEmail($job->data);
                break;
            case 'generate_report':
                $this->generateReport($job->data);
                break;
            case 'process_image':
                $this->processImage($job->data);
                break;
        }
    }
}
```

### 异步处理
```php
class AsyncProcessor
{
    public function processAsync(callable $task, array $data): void
    {
        $pid = pcntl_fork();
        
        if ($pid == -1) {
            throw new RuntimeException('无法创建子进程');
        } elseif ($pid) {
            // 父进程
            pcntl_wait($status);
        } else {
            // 子进程
            try {
                $task($data);
                exit(0);
            } catch (Exception $e) {
                Log::error('异步任务失败', ['error' => $e->getMessage()]);
                exit(1);
            }
        }
    }
}
```

## 监控与分析

### 性能监控
```php
class PerformanceMonitor
{
    private $startTime;
    private $checkpoints = [];
    
    public function start(): void
    {
        $this->startTime = microtime(true);
    }
    
    public function checkpoint(string $name): void
    {
        $this->checkpoints[$name] = microtime(true) - $this->startTime;
    }
    
    public function end(): array
    {
        $totalTime = microtime(true) - $this->startTime;
        
        $report = [
            'total_time' => $totalTime,
            'checkpoints' => $this->checkpoints,
            'memory_usage' => memory_get_usage(true),
            'memory_peak' => memory_get_peak_usage(true)
        ];
        
        Log::info('性能报告', $report);
        
        return $report;
    }
}
```

### 慢查询分析
```php
class SlowQueryAnalyzer
{
    private $threshold = 1.0; // 1秒阈值
    
    public function analyze(string $sql, float $executionTime): void
    {
        if ($executionTime > $this->threshold) {
            Log::warning('慢查询检测', [
                'sql' => $sql,
                'execution_time' => $executionTime,
                'threshold' => $this->threshold
            ]);
            
            // 分析查询计划
            $this->analyzeQueryPlan($sql);
        }
    }
    
    private function analyzeQueryPlan(string $sql): void
    {
        $explainSql = "EXPLAIN " . $sql;
        $result = DB::select($explainSql);
        
        Log::info('查询计划分析', [
            'sql' => $sql,
            'plan' => $result
        ]);
    }
}
```

## 部署优化

### 生产环境配置
```toml
[app]
debug = false
environment = "production"

[cache]
driver = "redis"
prefix = "dux_admin"
ttl = 3600

[session]
driver = "redis"
lifetime = 7200

[database]
host = "db.example.com"
port = 3306
max_connections = 100
```

### 服务器优化
```bash
# Nginx 配置
server {
    listen 80;
    server_name example.com;
    
    # 启用 gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1000;
    gzip_types text/plain application/json text/css application/javascript;
    
    # 静态文件缓存
    location ~* \.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # PHP 处理
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

通过实施这些性能优化策略，可以显著提高 Dux PHP Admin 应用的响应速度和并发处理能力。