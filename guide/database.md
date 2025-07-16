# 数据库配置

Dux PHP Admin 基于 Laravel Eloquent ORM，提供强大的数据库操作能力和自动迁移系统。

## 支持的数据库

### MySQL（推荐）
- **版本要求**: MySQL 8.0+ 或 MariaDB 10.6+
- **字符集**: utf8mb4
- **存储引擎**: InnoDB

### SQLite
- **版本要求**: SQLite 3.25+
- **使用场景**: 开发环境、小型应用

> **注意**：当前版本主要支持 MySQL，SQLite 为有限支持。

## 基础配置

### 配置文件格式

编辑 `config/database.toml`：

```toml
[db.drivers.default]
driver = "mysql"                    # 数据库驱动
host = "localhost"                  # 数据库主机
port = 3306                        # 端口号
database = "dux_admin"             # 数据库名
username = "root"                  # 用户名
password = "your_password"         # 密码
charset = "utf8mb4"               # 字符集
collation = "utf8mb4_unicode_ci"  # 排序规则
prefix = "app_"                   # 表前缀
```

### SQLite 配置

```toml
[db.drivers.default]
driver = "sqlite"
database = "/path/to/database.sqlite"
prefix = "app_"
```

### 多数据库配置

支持配置多个数据库连接：

```toml
[db.drivers.default]
driver = "mysql"
host = "localhost"
database = "dux_admin"
username = "root"
password = "password"
prefix = "app_"

[db.drivers.statistics]
driver = "mysql"
host = "localhost"
database = "dux_stats"
username = "stats_user"
password = "stats_password"
prefix = "stats_"
```

## Laravel ORM 集成

### Model 基类特性

所有模型继承自增强的 Model 基类：

```php
<?php

namespace App\System\Models;

use Core\Database\Model;
use Core\Database\Attribute\AutoMigrate;

#[AutoMigrate]
class SystemUser extends Model
{
    public $table = "system_user";
    
    protected $fillable = [
        'username', 'nickname', 'email', 'password'
    ];
    
    // 自动迁移方法
    public function migration(Blueprint $table)
    {
        $table->id();
        $table->bigInteger('role_id')->nullable()->comment('角色ID');
        $table->string('username')->unique()->comment('用户名');
        $table->string('nickname')->comment('昵称');
        $table->string('email')->unique()->comment('邮箱');
        $table->string('password')->comment('密码');
        $table->boolean('status')->default(1)->comment('状态');
        $table->timestamps();
    }
    
    // 初始数据填充
    public function seed(Connection $db)
    {
        self::create([
            'username' => 'admin',
            'nickname' => '管理员',
            'email' => 'admin@example.com',
            'password' => password_hash('admin', PASSWORD_DEFAULT),
            'status' => 1
        ]);
    }
}
```

### 自动迁移系统

#### #[AutoMigrate] 注解

使用注解标记需要自动迁移的模型：

```php
#[AutoMigrate]
class YourModel extends Model
{
    // 定义表结构
    public function migration(Blueprint $table)
    {
        $table->id();
        $table->string('name');
        $table->timestamps();
    }
}
```

#### 运行数据库同步

```bash
# 同步所有模型的数据表结构
php dux db:sync

# 同步指定应用的模型
php dux db:sync System

# 查看可迁移的模型列表
php dux db:list
```

### 数据库操作示例

#### 基础 CRUD 操作

```php
// 创建记录
$user = SystemUser::create([
    'username' => 'john',
    'nickname' => 'John Doe',
    'email' => 'john@example.com'
]);

// 查询记录
$users = SystemUser::where('status', 1)->get();
$user = SystemUser::find(1);

// 更新记录
$user->update(['nickname' => 'Updated Name']);

// 删除记录
$user->delete();
```

#### 关系查询

```php
// 定义关系
class SystemUser extends Model
{
    public function role()
    {
        return $this->belongsTo(SystemRole::class, 'role_id');
    }
    
    public function logs()
    {
        return $this->hasMany(LogOperate::class, 'user_id');
    }
}

// 使用关系
$user = SystemUser::with('role')->find(1);
$userLogs = $user->logs()->latest()->get();
```

## 配置选项详解

### 连接配置

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `driver` | string | mysql | 数据库驱动 |
| `host` | string | localhost | 数据库主机 |
| `port` | integer | 3306 | 端口号 |
| `database` | string | - | 数据库名 |
| `username` | string | - | 用户名 |
| `password` | string | - | 密码 |
| `charset` | string | utf8mb4 | 字符集 |
| `collation` | string | utf8mb4_unicode_ci | 排序规则 |
| `prefix` | string | - | 表前缀 |

### 环境配置

支持开发环境特定配置：

```toml
# config/database.dev.toml (开发环境)
[db.drivers.default]
driver = "mysql"
host = "localhost"
database = "dux_admin_dev"
username = "root"
password = "dev_password"
prefix = "dev_"
```

**配置优先级**：
1. `config/database.dev.toml` (开发环境)
2. `config/database.toml` (生产环境)

## 数据库管理命令

### 可用命令

```bash
# 数据库结构同步
php dux db:sync [应用名]

# 查看迁移模型列表
php dux db:list

# 数据库备份
php dux db:backup

# 数据库恢复
php dux db:restore
```

### 命令详解

#### db:sync 同步数据库

自动创建和更新数据表结构：

```bash
# 同步所有应用的数据表
php dux db:sync

# 同步指定应用
php dux db:sync System
php dux db:sync Data
```

**功能特性**：
- 自动检测模型变更
- 安全的表结构更新
- 支持字段添加和修改
- 自动执行数据填充

#### db:backup 数据备份

```bash
# 备份数据库
php dux db:backup

# 备份到指定位置
php dux db:backup --path=/backup/db.sql
```

## 性能优化

### 数据库配置优化

#### MySQL 配置建议

```ini
# my.cnf
[mysqld]
# 缓冲池大小
innodb_buffer_pool_size = 1G

# 日志文件大小
innodb_log_file_size = 256M

# 连接配置
max_connections = 200
wait_timeout = 120

# 字符集
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci
```

### 应用层优化

#### 查询优化

```php
// 使用索引
SystemUser::where('email', $email)->first();

// 预加载关系
$users = SystemUser::with(['role', 'department'])->get();

// 分页查询
$users = SystemUser::paginate(15);

// 只查询需要的字段
$users = SystemUser::select(['id', 'username', 'email'])->get();
```

#### 批量操作

```php
// 批量插入
SystemUser::insert([
    ['username' => 'user1', 'email' => 'user1@example.com'],
    ['username' => 'user2', 'email' => 'user2@example.com'],
]);

// 批量更新
SystemUser::whereIn('id', [1, 2, 3])->update(['status' => 1]);
```

## 故障排除

### 常见问题

#### 1. 连接失败

```bash
# 检查数据库连接
php dux db:list

# 检查配置文件
cat config/database.toml
```

#### 2. 迁移失败

```bash
# 查看详细错误
php dux db:sync --verbose

# 检查数据库权限
SHOW GRANTS FOR CURRENT_USER;
```

#### 3. 字符编码问题

确保数据库、表、字段都使用 `utf8mb4` 字符集：

```sql
ALTER DATABASE dux_admin CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 调试技巧

#### 启用查询日志

在开发环境中启用 SQL 查询日志：

```php
// 在 App.php 中添加
use Illuminate\Database\Events\QueryExecuted;

App::db()->listen(function (QueryExecuted $query) {
    error_log($query->sql . ' [' . implode(', ', $query->bindings) . ']');
});
```

通过以上配置，您可以充分利用 Laravel Eloquent ORM 的强大功能，构建高效、可维护的数据库应用。