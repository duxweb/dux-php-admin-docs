# 统计服务

基于 `app/System/Service/Stats.php` 和 `app/System/Service/Visitor.php` 的统计服务，提供数据统计计算和访问统计功能。

## 🚀 快速开始

### 基础使用

```php
use App\System\Service\Stats;
use App\System\Service\Visitor;

// 计算环比增长率
$rate = Stats::calculateRate($currentValue, $previousValue);

// 记录访问统计
Visitor::increment($request, 'article', $articleId, 'web', '/article/123');
```

## 📋 主要功能

### 1. 增长率计算 (Stats)

```php
use App\System\Service\Stats;

// 计算环比增长率
$thisMonth = 1200;
$lastMonth = 1000;
$growthRate = Stats::calculateRate($thisMonth, $lastMonth); // 20.0

// 处理零值情况
$rate1 = Stats::calculateRate(100, 0);   // 100.0 (从0增长到100，增长率100%)
$rate2 = Stats::calculateRate(0, 100);   // -100.0 (从100降到0，下降率100%)
$rate3 = Stats::calculateRate(0, 0);     // 0.0 (都为0，无变化)
```

### 2. 访问统计 (Visitor)

```php
use App\System\Service\Visitor;

// 记录页面访问
Visitor::increment($request, 'page', null, 'web', '/home');

// 记录文章访问
Visitor::increment($request, 'article', 123, 'web', '/article/123');

// 记录产品访问
Visitor::increment($request, 'product', 456, 'api', '/api/product/456');

// 参数说明：
// $request: 请求对象（用于获取IP、User-Agent等）
// $type: 统计类型（如 'page', 'article', 'product'）
// $id: 关联ID（可选，用于关联具体内容）
// $driver: 驱动类型（如 'web', 'api', 'mobile'）
// $path: 访问路径（可选，记录具体访问路径）
```

## 🔧 实际应用示例

### 1. 数据分析服务

```php
<?php

namespace App\System\Service;

use App\System\Service\Stats;

class AnalyticsService
{
    /**
     * 获取业务增长分析
     */
    public static function getGrowthAnalysis(string $period = 'month'): array
    {
        // 获取当前周期和上个周期的数据
        $currentData = self::getCurrentPeriodData($period);
        $previousData = self::getPreviousPeriodData($period);

        $analysis = [];

        foreach ($currentData as $metric => $currentValue) {
            $previousValue = $previousData[$metric] ?? 0;
            
            $analysis[$metric] = [
                'current' => $currentValue,
                'previous' => $previousValue,
                'growth_rate' => Stats::calculateRate($currentValue, $previousValue),
                'growth_value' => $currentValue - $previousValue,
                'trend' => self::getTrend($currentValue, $previousValue)
            ];
        }

        return [
            'period' => $period,
            'analysis' => $analysis,
            'generated_at' => date('Y-m-d H:i:s')
        ];
    }

    /**
     * 生成统计报告
     */
    public static function generateReport(array $metrics, string $period = 'month'): array
    {
        $report = [
            'period' => $period,
            'metrics' => [],
            'summary' => [],
            'generated_at' => date('Y-m-d H:i:s')
        ];

        $totalGrowthRate = 0;
        $positiveMetrics = 0;

        foreach ($metrics as $metric => $data) {
            $currentValue = $data['current'];
            $previousValue = $data['previous'];
            $growthRate = Stats::calculateRate($currentValue, $previousValue);

            $report['metrics'][$metric] = [
                'name' => $data['name'] ?? $metric,
                'current' => $currentValue,
                'previous' => $previousValue,
                'growth_rate' => $growthRate,
                'growth_value' => $currentValue - $previousValue,
                'trend' => self::getTrend($currentValue, $previousValue),
                'status' => $growthRate >= 0 ? 'positive' : 'negative'
            ];

            $totalGrowthRate += $growthRate;
            if ($growthRate > 0) {
                $positiveMetrics++;
            }
        }

        // 生成摘要
        $report['summary'] = [
            'total_metrics' => count($metrics),
            'positive_metrics' => $positiveMetrics,
            'negative_metrics' => count($metrics) - $positiveMetrics,
            'average_growth_rate' => count($metrics) > 0 ? $totalGrowthRate / count($metrics) : 0,
            'overall_trend' => $totalGrowthRate >= 0 ? 'positive' : 'negative'
        ];

        return $report;
    }

    /**
     * 获取趋势描述
     */
    private static function getTrend(float $current, float $previous): string
    {
        if ($current > $previous) {
            return 'up';
        } elseif ($current < $previous) {
            return 'down';
        } else {
            return 'stable';
        }
    }

    /**
     * 获取当前周期数据
     */
    private static function getCurrentPeriodData(string $period): array
    {
        // 实际实现中从数据库获取数据
        switch ($period) {
            case 'day':
                return self::getDailyData();
            case 'week':
                return self::getWeeklyData();
            case 'month':
                return self::getMonthlyData();
            case 'year':
                return self::getYearlyData();
            default:
                return self::getMonthlyData();
        }
    }

    /**
     * 获取上个周期数据
     */
    private static function getPreviousPeriodData(string $period): array
    {
        // 实际实现中从数据库获取数据
        switch ($period) {
            case 'day':
                return self::getPreviousDailyData();
            case 'week':
                return self::getPreviousWeeklyData();
            case 'month':
                return self::getPreviousMonthlyData();
            case 'year':
                return self::getPreviousYearlyData();
            default:
                return self::getPreviousMonthlyData();
        }
    }

    // 示例数据获取方法
    private static function getMonthlyData(): array
    {
        return [
            'users' => 1200,
            'orders' => 450,
            'revenue' => 25000,
            'page_views' => 15000
        ];
    }

    private static function getPreviousMonthlyData(): array
    {
        return [
            'users' => 1000,
            'orders' => 380,
            'revenue' => 22000,
            'page_views' => 12000
        ];
    }
}
```

### 2. 访问统计服务

```php
<?php

namespace App\System\Service;

use App\System\Service\Visitor;

class VisitorStatsService
{
    /**
     * 记录内容访问
     */
    public static function recordContentView($request, string $contentType, int $contentId): void
    {
        $path = $request->getUri()->getPath();
        Visitor::increment($request, $contentType, $contentId, 'web', $path);
    }

    /**
     * 记录 API 访问
     */
    public static function recordApiAccess($request, string $endpoint): void
    {
        Visitor::increment($request, 'api', null, 'api', $endpoint);
    }

    /**
     * 获取访问统计
     */
    public static function getVisitorStats(string $type, int $id = null, string $period = 'month'): array
    {
        // 实际实现中需要查询 log_visit 相关表
        // 这里提供示例数据结构
        
        return [
            'type' => $type,
            'id' => $id,
            'period' => $period,
            'stats' => [
                'total_views' => 1250,
                'unique_visitors' => 890,
                'today_views' => 45,
                'today_unique' => 32,
                'avg_daily_views' => 42,
                'peak_day' => '2024-01-15',
                'peak_day_views' => 78
            ],
            'trend' => [
                'views_growth_rate' => 15.5,
                'visitors_growth_rate' => 12.3
            ]
        ];
    }

    /**
     * 获取热门内容
     */
    public static function getPopularContent(string $type, int $limit = 10, string $period = 'month'): array
    {
        // 实际实现中查询数据库
        return [
            'type' => $type,
            'period' => $period,
            'limit' => $limit,
            'items' => [
                [
                    'id' => 123,
                    'title' => '热门文章标题',
                    'views' => 1500,
                    'unique_visitors' => 1200,
                    'growth_rate' => 25.5
                ],
                // ... 更多项目
            ]
        ];
    }

    /**
     * 获取访问来源统计
     */
    public static function getTrafficSources(string $period = 'month'): array
    {
        return [
            'period' => $period,
            'sources' => [
                'direct' => [
                    'visits' => 5000,
                    'percentage' => 45.5,
                    'growth_rate' => 10.2
                ],
                'search' => [
                    'visits' => 3500,
                    'percentage' => 31.8,
                    'growth_rate' => 15.7
                ],
                'social' => [
                    'visits' => 1500,
                    'percentage' => 13.6,
                    'growth_rate' => -5.3
                ],
                'referral' => [
                    'visits' => 1000,
                    'percentage' => 9.1,
                    'growth_rate' => 8.9
                ]
            ]
        ];
    }
}
```

### 3. 实时统计服务

```php
<?php

namespace App\System\Service;

use App\System\Service\Stats;

class RealTimeStatsService
{
    /**
     * 获取实时统计数据
     */
    public static function getRealTimeStats(): array
    {
        return [
            'online_users' => self::getOnlineUsers(),
            'today_stats' => self::getTodayStats(),
            'recent_activities' => self::getRecentActivities(),
            'system_status' => self::getSystemStatus()
        ];
    }

    /**
     * 获取在线用户数
     */
    private static function getOnlineUsers(): array
    {
        // 实际实现中查询活跃会话
        $current = 156;
        $previous = 142;
        
        return [
            'count' => $current,
            'growth_rate' => Stats::calculateRate($current, $previous),
            'peak_today' => 189,
            'avg_today' => 145
        ];
    }

    /**
     * 获取今日统计
     */
    private static function getTodayStats(): array
    {
        $todayData = [
            'page_views' => 2450,
            'unique_visitors' => 1890,
            'new_users' => 45,
            'orders' => 23
        ];

        $yesterdayData = [
            'page_views' => 2200,
            'unique_visitors' => 1750,
            'new_users' => 38,
            'orders' => 19
        ];

        $stats = [];
        foreach ($todayData as $key => $value) {
            $previousValue = $yesterdayData[$key] ?? 0;
            $stats[$key] = [
                'value' => $value,
                'growth_rate' => Stats::calculateRate($value, $previousValue),
                'trend' => $value > $previousValue ? 'up' : ($value < $previousValue ? 'down' : 'stable')
            ];
        }

        return $stats;
    }

    /**
     * 获取最近活动
     */
    private static function getRecentActivities(): array
    {
        return [
            [
                'type' => 'user_register',
                'message' => '新用户注册',
                'count' => 3,
                'time' => '5分钟前'
            ],
            [
                'type' => 'order_created',
                'message' => '新订单创建',
                'count' => 2,
                'time' => '8分钟前'
            ],
            [
                'type' => 'article_published',
                'message' => '文章发布',
                'count' => 1,
                'time' => '15分钟前'
            ]
        ];
    }

    /**
     * 获取系统状态
     */
    private static function getSystemStatus(): array
    {
        return [
            'cpu_usage' => 45.2,
            'memory_usage' => 67.8,
            'disk_usage' => 34.5,
            'response_time' => 120, // 毫秒
            'error_rate' => 0.02,   // 2%
            'uptime' => '15天 8小时 32分钟'
        ];
    }
}
```

## 💡 最佳实践

### 1. 统计数据缓存

```php
// ✅ 缓存统计结果
class CachedStatsService
{
    private static array $cache = [];
    private static int $cacheTtl = 300; // 5分钟

    public static function getCachedStats(string $key, callable $calculator): array
    {
        $cacheKey = "stats_{$key}";
        
        if (isset(self::$cache[$cacheKey])) {
            $cached = self::$cache[$cacheKey];
            if (time() - $cached['time'] < self::$cacheTtl) {
                return $cached['data'];
            }
        }

        $data = $calculator();
        self::$cache[$cacheKey] = [
            'data' => $data,
            'time' => time()
        ];

        return $data;
    }
}
```

### 2. 异步统计处理

```php
// ✅ 异步处理大量统计数据
use Core\App;

class AsyncStatsService
{
    public static function processStatsAsync(array $data): void
    {
        // 将统计处理放入队列
        App::queue()->add(
            'App\Jobs\StatsProcessJob',
            'process',
            [$data]
        )->send();
    }
}
```

### 3. 统计数据验证

```php
// ✅ 验证统计数据的有效性
public function validateStatsData(array $data): bool
{
    foreach ($data as $key => $value) {
        if (!is_numeric($value) || $value < 0) {
            return false;
        }
    }
    return true;
}
```

### 4. 错误处理

```php
// ✅ 统计服务的错误处理
public function safeCalculateRate(float $current, float $previous): float
{
    try {
        return Stats::calculateRate($current, $previous);
    } catch (\Exception $e) {
        logger()->warning('统计计算失败', [
            'current' => $current,
            'previous' => $previous,
            'error' => $e->getMessage()
        ]);
        return 0.0;
    }
}
```

## 🎉 总结

统计服务的特点：

- **📊 功能完整**：涵盖增长率计算和访问统计
- **⚡ 高性能**：支持缓存和异步处理
- **🔍 数据准确**：完善的数据验证和错误处理
- **📈 实时统计**：支持实时数据监控
- **🛡️ 安全可靠**：完善的异常处理机制

通过合理使用统计服务，可以构建强大的数据分析和监控系统！
