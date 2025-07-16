# 系统配置

Dux PHP Admin 基于 DuxLite 框架的 TOML 配置系统，提供灵活的配置管理。

## 配置文件结构

项目使用以下 TOML 配置文件：

```
config/
├── app.toml          # 模块注册配置
├── database.toml     # 数据库配置
├── use.toml          # 应用主配置
└── use.dev.toml      # 开发环境配置（可选）
```

## 主要配置文件

### 应用主配置 (`use.toml`)

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

**配置说明**：
- `app.name` - 应用名称，显示在系统界面中
- `app.debug` - 调试模式，生产环境必须设为 `false`
- `app.timezone` - 系统时区
- `app.secret` - 应用密钥，用于加密和签名
- `app.domain` - 应用访问域名
- `vite.dev` - 是否启用 Vite 开发模式
- `vite.port` - Vite 开发服务器端口
- `cloud.key` - 云服务配置密钥

### 数据库配置 (`database.toml`)

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

**其他数据库驱动**：

```toml
# PostgreSQL
[db.drivers.pgsql]
driver = "pgsql"
host = "localhost"
database = "dux_admin"
username = "postgres"
password = "your_password"
port = 5432
prefix = "app_"

# SQLite
[db.drivers.sqlite]
driver = "sqlite"
database = "data/database.sqlite"
prefix = "app_"
```

### 模块注册配置 (`app.toml`)

```toml
registers = [
    "App\\Web\\App",
    "App\\System\\App", 
    "App\\Data\\App"
]
```

## 高级配置

### 缓存配置

在 `use.toml` 中添加：

```toml
[cache]
type = "file"                     # 缓存类型：file 或 redis
prefix = "duxlite_"              # 缓存前缀
defaultLifetime = 3600           # 默认缓存时间（秒）
```

### Redis 配置

在 `database.toml` 中添加：

```toml
[redis.drivers.default]
host = "localhost"
port = 6379
password = ""
database = 0
timeout = 2.5
optPrefix = ""
```

### 队列配置

创建 `queue.toml`：

```toml
type = "redis"                   # 队列类型：redis 或 amqp
driver = "default"               # 驱动器名称
```

### 存储配置

创建 `storage.toml`：

```toml
type = "local"                   # 默认存储类型

# 本地存储
[drivers.local]
type = "local"
root = "data/uploads"
domain = "http://localhost:8000"
path = "uploads"

# S3 兼容存储
[drivers.s3]
type = "s3"
bucket = "my-bucket"
domain = "https://cdn.example.com"
endpoint = "s3.amazonaws.com"
region = "us-east-1"
ssl = true
version = "latest"
access_key = "your-access-key"
secret_key = "your-secret-key"
```

## 环境分离

### 开发环境配置

创建 `use.dev.toml`：

```toml
[app]
debug = true
domain = "http://localhost:8000"

[vite]
dev = true
port = 5173
```

### 生产环境配置

生产环境使用 `use.toml`：

```toml
[app]
debug = false
domain = "https://yourdomain.com"

[vite]
dev = false
```

## 配置读取

### 在代码中读取配置

```php
// 读取配置文件
$config = App::config('use');

// 获取配置值
$appName = $config->get('app.name');
$debug = $config->get('app.debug', false);
$dbHost = $config->get('db.drivers.default.host');
```

### 使用配置服务

```php
// 缓存服务
$cache = App::cache();
$cache = App::cache('redis');

// 存储服务
$storage = App::storage();
$storage = App::storage('s3');

// 队列服务
$queue = App::queue();

// Redis 连接
$redis = App::redis();
$redis = App::redis('cache');
```

## 配置优先级

配置加载的优先级顺序：

1. **`*.dev.toml`** - 开发环境配置（最高优先级）
2. **`*.toml`** - 生产环境配置
3. **默认值** - 如果文件不存在则使用默认值

## 配置管理最佳实践

### 1. 环境分离

```bash
# 开发环境
config/use.dev.toml    # 开发配置
config/database.dev.toml  # 开发数据库配置

# 生产环境
config/use.toml        # 生产配置
config/database.toml   # 生产数据库配置
```

### 2. 安全配置

```toml
# 生产环境必须设置
[app]
debug = false
secret = "your-secure-32-char-secret-key"
```

### 3. 配置文件权限

```bash
# 设置配置文件权限
chmod 600 config/*.toml

# 版本控制忽略
echo "config/use.dev.toml" >> .gitignore
echo "config/database.dev.toml" >> .gitignore
```

### 4. 配置验证

```bash
# 检查配置语法
php -r "print_r(parse_ini_file('config/use.toml', true));"

# 测试数据库连接
php dux db:list
```

## 常见问题

### 配置不生效

- 检查文件名是否正确（`.toml` 扩展名）
- 确认 TOML 语法是否正确
- 重启应用服务器

### 数据库连接失败

- 检查数据库服务是否启动
- 验证用户名和密码是否正确
- 确认数据库名称是否存在

### 缓存问题

```bash
# 清除缓存
rm -rf data/cache/*

# 重新生成缓存
php dux app:cache
```

## 注意事项

1. **TOML 格式**：配置文件使用 TOML 格式，注意语法规范
2. **重启生效**：修改配置后需要重启应用才能生效
3. **环境变量**：TOML 文件不支持环境变量插值，需要在代码中使用 `$_ENV` 或 `getenv()`
4. **文件权限**：确保配置文件有正确的读取权限