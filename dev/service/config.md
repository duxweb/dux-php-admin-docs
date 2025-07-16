# 配置服务

基于 `app/System/Service/Config.php` 的配置管理服务，提供 JSON 配置处理、点语法访问和缓存机制。

## 🚀 快速开始

### 基础使用

```php
use App\System\Service\Config;

// 获取 JSON 配置
$systemConfig = Config::getJsonValue('system', []);

// 获取普通配置值
$siteName = Config::getValue('site.name', 'DuxLite');

// 设置配置值
Config::setValue('system', $configData);
```

## 📋 主要功能

### 1. JSON 配置管理

```php
use App\System\Service\Config;

// 获取 JSON 格式的配置
$uploadConfig = Config::getJsonValue('upload', [
    'max_size' => 5,
    'allowed_types' => ['jpg', 'png', 'gif']
]);

// 设置 JSON 配置
$emailConfig = [
    'smtp_host' => 'smtp.example.com',
    'smtp_port' => 587,
    'smtp_user' => 'user@example.com',
    'smtp_pass' => 'password'
];
Config::setValue('email', $emailConfig);
```

### 2. 点语法访问

支持使用点语法访问嵌套配置：

```php
// 访问嵌套配置
$smtpHost = Config::getValue('email.smtp_host', 'localhost');
$uploadMaxSize = Config::getValue('upload.max_size', 5);

// 深层嵌套访问
$feature = Config::getValue('system.features.auto_backup', false);
```

### 3. 默认值支持

```php
// 提供默认值，当配置不存在时返回默认值
$siteName = Config::getValue('site.name', 'DuxLite');
$maintenance = Config::getValue('system.maintenance', false);
$maxRetries = Config::getValue('queue.max_retries', 3);
```

## 🔧 实际应用示例

### 1. 系统设置管理

```php
<?php

namespace App\System\Admin;

use App\System\Service\Config;
use Core\Resources\Action\Resources;

class Settings extends Resources
{
    /**
     * 获取系统配置
     */
    public function getSystemConfig(): array
    {
        return [
            'site' => Config::getJsonValue('site', [
                'name' => 'DuxLite',
                'description' => '',
                'keywords' => '',
                'logo' => '',
                'favicon' => ''
            ]),
            'upload' => Config::getJsonValue('upload', [
                'max_size' => 5,
                'allowed_types' => ['jpg', 'png', 'gif', 'pdf'],
                'storage_type' => 'local'
            ]),
            'email' => Config::getJsonValue('email', [
                'smtp_host' => '',
                'smtp_port' => 587,
                'smtp_user' => '',
                'smtp_pass' => '',
                'from_name' => '',
                'from_email' => ''
            ]),
            'sms' => Config::getJsonValue('sms', [
                'provider' => 'aliyun',
                'access_key' => '',
                'secret_key' => '',
                'sign_name' => ''
            ])
        ];
    }

    /**
     * 保存系统配置
     */
    public function saveSystemConfig(array $data): array
    {
        try {
            // 分别保存不同模块的配置
            if (isset($data['site'])) {
                Config::setValue('site', $data['site']);
            }

            if (isset($data['upload'])) {
                Config::setValue('upload', $data['upload']);
            }

            if (isset($data['email'])) {
                Config::setValue('email', $data['email']);
            }

            if (isset($data['sms'])) {
                Config::setValue('sms', $data['sms']);
            }

            return success('配置保存成功');

        } catch (\Exception $e) {
            return error('配置保存失败：' . $e->getMessage());
        }
    }

    /**
     * 获取单个配置模块
     */
    public function getConfigModule(string $module): array
    {
        $config = Config::getJsonValue($module, []);
        
        return [
            'module' => $module,
            'config' => $config
        ];
    }

    /**
     * 重置配置到默认值
     */
    public function resetConfig(string $module): array
    {
        $defaults = $this->getDefaultConfig($module);
        
        if ($defaults) {
            Config::setValue($module, $defaults);
            return success("配置模块 {$module} 已重置为默认值");
        }

        return error('未知的配置模块');
    }

    /**
     * 获取默认配置
     */
    private function getDefaultConfig(string $module): ?array
    {
        $defaults = [
            'site' => [
                'name' => 'DuxLite',
                'description' => 'DuxLite 管理系统',
                'keywords' => 'duxlite,admin,php',
                'logo' => '',
                'favicon' => ''
            ],
            'upload' => [
                'max_size' => 5,
                'allowed_types' => ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'txt'],
                'storage_type' => 'local'
            ],
            'email' => [
                'smtp_host' => '',
                'smtp_port' => 587,
                'smtp_user' => '',
                'smtp_pass' => '',
                'from_name' => 'DuxLite',
                'from_email' => ''
            ]
        ];

        return $defaults[$module] ?? null;
    }
}
```

### 2. 应用配置服务

```php
<?php

namespace App\System\Service;

use App\System\Service\Config as BaseConfig;

class AppConfigService
{
    /**
     * 获取应用配置
     */
    public static function getAppConfig(): array
    {
        return [
            'app_name' => BaseConfig::getValue('site.name', 'DuxLite'),
            'app_version' => BaseConfig::getValue('app.version', '1.0.0'),
            'debug_mode' => BaseConfig::getValue('app.debug', false),
            'timezone' => BaseConfig::getValue('app.timezone', 'Asia/Shanghai'),
            'locale' => BaseConfig::getValue('app.locale', 'zh-CN')
        ];
    }

    /**
     * 获取功能开关配置
     */
    public static function getFeatureFlags(): array
    {
        return BaseConfig::getJsonValue('features', [
            'user_registration' => true,
            'email_verification' => false,
            'sms_verification' => false,
            'social_login' => false,
            'auto_backup' => false,
            'maintenance_mode' => false
        ]);
    }

    /**
     * 检查功能是否启用
     */
    public static function isFeatureEnabled(string $feature): bool
    {
        $features = self::getFeatureFlags();
        return $features[$feature] ?? false;
    }

    /**
     * 启用/禁用功能
     */
    public static function toggleFeature(string $feature, bool $enabled): void
    {
        $features = self::getFeatureFlags();
        $features[$feature] = $enabled;
        BaseConfig::setValue('features', $features);
    }

    /**
     * 获取第三方服务配置
     */
    public static function getThirdPartyConfig(): array
    {
        return [
            'payment' => BaseConfig::getJsonValue('payment', [
                'alipay_enabled' => false,
                'wechat_enabled' => false,
                'stripe_enabled' => false
            ]),
            'storage' => BaseConfig::getJsonValue('storage', [
                'qiniu_enabled' => false,
                'oss_enabled' => false,
                'cos_enabled' => false
            ]),
            'analytics' => BaseConfig::getJsonValue('analytics', [
                'google_analytics' => '',
                'baidu_analytics' => '',
                'umeng_analytics' => ''
            ])
        ];
    }
}
```

### 3. 配置缓存服务

```php
<?php

namespace App\System\Service;

use App\System\Service\Config;

class ConfigCacheService
{
    private static array $cache = [];
    private static bool $cacheEnabled = true;

    /**
     * 获取缓存的配置值
     */
    public static function getCachedValue(string $key, $default = null)
    {
        if (!self::$cacheEnabled) {
            return Config::getValue($key, $default);
        }

        if (!isset(self::$cache[$key])) {
            self::$cache[$key] = Config::getValue($key, $default);
        }

        return self::$cache[$key];
    }

    /**
     * 获取缓存的 JSON 配置
     */
    public static function getCachedJsonValue(string $key, $default = null)
    {
        $cacheKey = "json_{$key}";
        
        if (!self::$cacheEnabled) {
            return Config::getJsonValue($key, $default);
        }

        if (!isset(self::$cache[$cacheKey])) {
            self::$cache[$cacheKey] = Config::getJsonValue($key, $default);
        }

        return self::$cache[$cacheKey];
    }

    /**
     * 设置配置值并清除缓存
     */
    public static function setValue(string $key, $value): void
    {
        Config::setValue($key, $value);
        
        // 清除相关缓存
        self::clearCache($key);
    }

    /**
     * 清除指定配置的缓存
     */
    public static function clearCache(string $key = null): void
    {
        if ($key === null) {
            self::$cache = [];
        } else {
            // 清除指定键的缓存
            unset(self::$cache[$key]);
            unset(self::$cache["json_{$key}"]);
            
            // 清除点语法相关的缓存
            foreach (array_keys(self::$cache) as $cacheKey) {
                if (str_starts_with($cacheKey, $key . '.')) {
                    unset(self::$cache[$cacheKey]);
                }
            }
        }
    }

    /**
     * 启用/禁用缓存
     */
    public static function setCacheEnabled(bool $enabled): void
    {
        self::$cacheEnabled = $enabled;
        
        if (!$enabled) {
            self::clearCache();
        }
    }

    /**
     * 获取缓存统计信息
     */
    public static function getCacheStats(): array
    {
        return [
            'enabled' => self::$cacheEnabled,
            'cached_keys' => count(self::$cache),
            'cache_keys' => array_keys(self::$cache)
        ];
    }
}
```

## 💡 最佳实践

### 1. 配置分组管理

```php
// ✅ 按功能模块分组配置
$siteConfig = Config::getJsonValue('site', []);      // 站点配置
$uploadConfig = Config::getJsonValue('upload', []);  // 上传配置
$emailConfig = Config::getJsonValue('email', []);    // 邮件配置

// ❌ 避免将所有配置放在一个键下
$allConfig = Config::getJsonValue('all_settings', []);
```

### 2. 默认值管理

```php
// ✅ 为所有配置提供合理的默认值
$maxSize = Config::getValue('upload.max_size', 5);
$timeout = Config::getValue('api.timeout', 30);

// ✅ 使用常量定义默认值
class ConfigDefaults
{
    public const UPLOAD_MAX_SIZE = 5;
    public const API_TIMEOUT = 30;
    public const CACHE_TTL = 3600;
}

$maxSize = Config::getValue('upload.max_size', ConfigDefaults::UPLOAD_MAX_SIZE);
```

### 3. 配置验证

```php
// ✅ 配置设置时进行验证
public function setUploadConfig(array $config): bool
{
    // 验证配置格式
    if (!isset($config['max_size']) || !is_numeric($config['max_size'])) {
        throw new \InvalidArgumentException('max_size 必须是数字');
    }

    if ($config['max_size'] <= 0 || $config['max_size'] > 100) {
        throw new \InvalidArgumentException('max_size 必须在 1-100 之间');
    }

    Config::setValue('upload', $config);
    return true;
}
```

### 4. 环境相关配置

```php
// ✅ 根据环境使用不同的默认配置
public function getEnvironmentConfig(): array
{
    $env = $_ENV['APP_ENV'] ?? 'production';
    
    $defaults = [
        'development' => [
            'debug' => true,
            'cache_enabled' => false,
            'log_level' => 'debug'
        ],
        'production' => [
            'debug' => false,
            'cache_enabled' => true,
            'log_level' => 'error'
        ]
    ];

    $envDefaults = $defaults[$env] ?? $defaults['production'];
    
    return [
        'debug' => Config::getValue('app.debug', $envDefaults['debug']),
        'cache_enabled' => Config::getValue('app.cache_enabled', $envDefaults['cache_enabled']),
        'log_level' => Config::getValue('app.log_level', $envDefaults['log_level'])
    ];
}
```

## 🎉 总结

配置服务的特点：

- **📊 JSON 支持**：自动处理 JSON 格式的配置数据
- **🔍 点语法访问**：支持嵌套配置的便捷访问
- **⚡ 缓存机制**：内置配置缓存，提高性能
- **🛡️ 默认值支持**：确保配置的可用性
- **🔧 易于使用**：简洁的 API 设计

通过合理使用配置服务，可以构建灵活可配置的应用系统！
