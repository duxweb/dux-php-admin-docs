# 开发工具

基于 dux-php-admin 实际项目的开发工具和调试方法。

## 🚀 命令行工具

### DUX 命令

基于项目根目录的 `dux` 脚本：

```bash
# 查看所有可用命令
php dux

# 数据库相关
php dux db:sync          # 同步数据库结构
php dux db:backup        # 备份数据库
php dux db:restore       # 恢复数据库

# 队列处理
php dux queue:work       # 处理队列任务

# 路由管理
php dux route:list       # 查看所有路由

# 权限管理
php dux permission:sync  # 同步权限数据

# 计划任务
php dux schedule:run     # 运行计划任务

# 工作进程
php dux worker:start     # 启动工作进程

# API 文档
php dux docs:build       # 生成 API 文档
```

## 🔧 配置管理

### 环境配置

基于 `config/use.toml` 的配置：

```toml
[app]
name = "我的 DuxLite 应用"
debug = true
timezone = "Asia/Shanghai"
secret = "your-app-secret-key"
domain = "http://localhost:8000"

[vite]
dev = false
port = 5173

[cloud]
key = ""
```

### 数据库配置

基于 `config/database.toml` 的配置：

```toml
[db.drivers.default]
driver = "mysql"
host = "localhost"
database = "dux_admin"
username = "root"
password = "root"
port = 3306
prefix = "app_"
```

### 模块注册配置

基于 `config/app.toml` 的配置：

```toml
registers = [ "App\\Web\\App", "App\\System\\App", "App\\Data\\App" ]
```

## 🐛 调试工具

### 日志调试

```php
// 记录调试信息
app('log')->debug('用户登录', ['user_id' => $userId]);

// 记录错误信息
app('log')->error('数据库连接失败', ['error' => $e->getMessage()]);

// 记录 SQL 查询
app('log')->info('SQL 查询', ['sql' => $query->toSql()]);
```

### 异常处理

```php
try {
    $result = $this->someOperation();
} catch (\Exception $e) {
    // 开发环境显示详细错误
    if (config('app.debug')) {
        throw $e;
    }
    
    // 生产环境记录日志
    app('log')->error('操作失败', [
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
    
    return error($response, '操作失败，请稍后重试');
}
```

### 性能分析

```php
// 记录执行时间
$start = microtime(true);
$result = $this->heavyOperation();
$duration = microtime(true) - $start;

app('log')->info('性能分析', [
    'operation' => 'heavyOperation',
    'duration' => $duration,
    'memory' => memory_get_peak_usage(true)
]);
```

## 📦 包管理

### Composer

```bash
# 安装依赖
composer install

# 更新依赖
composer update

# 添加新包
composer require vendor/package

# 开发依赖
composer require --dev phpunit/phpunit

# 自动加载优化
composer dump-autoload -o
```

### NPM/PNPM

```bash
# 安装前端依赖
pnpm install

# 开发模式
pnpm dev

# 构建生产版本
pnpm build

# 添加依赖
pnpm add package-name

# 开发依赖
pnpm add -D package-name
```

## 🧪 测试工具

### PHPUnit 测试

```bash
# 运行所有测试
./vendor/bin/phpunit

# 运行特定测试
./vendor/bin/phpunit tests/Unit/UserServiceTest.php

# 生成覆盖率报告
./vendor/bin/phpunit --coverage-html coverage
```

### 测试示例

```php
<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;
use App\System\Service\UserService;

class UserServiceTest extends TestCase
{
    public function testCreateUser()
    {
        $userData = [
            'username' => 'testuser',
            'password' => '123456'
        ];
        
        $result = UserService::createUser($userData);
        
        $this->assertArrayHasKey('id', $result);
        $this->assertEquals('testuser', $result['username']);
    }
}
```

## 🔍 代码质量

### PHP CS Fixer

```bash
# 检查代码风格
./vendor/bin/php-cs-fixer fix --dry-run --diff

# 修复代码风格
./vendor/bin/php-cs-fixer fix
```

### PHPStan

```bash
# 静态分析
./vendor/bin/phpstan analyse app

# 指定级别
./vendor/bin/phpstan analyse app --level=5
```

## 🚀 前端开发

### Vite 配置

基于项目的 Vite 配置：

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8000'
    }
  }
})
```

### 开发流程

```bash
# 1. 启动后端服务
php dux worker:start

# 2. 启动前端开发服务器
pnpm dev

# 3. 访问应用
# http://localhost:8080 (后端)
# http://localhost:5173 (前端开发服务器)
```

## 🎉 总结

DuxLite 开发工具特点：

- **🔧 命令行工具**：`php dux` 命令系统
- **⚙️ 配置管理**：TOML 配置文件，分离式配置
- **🐛 调试支持**：完善的日志和异常处理
- **📦 包管理**：Composer 和 PNPM 支持
- **🧪 测试工具**：PHPUnit 单元测试
- **🔍 代码质量**：代码风格检查和静态分析

合理使用这些工具可以大大提高开发效率！
