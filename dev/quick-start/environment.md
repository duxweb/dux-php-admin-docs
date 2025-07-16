# 环境搭建

在开始使用 Dux PHP Admin 之前，您需要搭建一个合适的开发环境。我们提供了多种现代化的环境搭建方案。

## 系统要求

| 组件 | 最低版本 | 推荐版本 |
|------|----------|----------|
| PHP | 8.2 | 8.3+ |
| MySQL | 8.0+ | 8.0+ |
| Redis | 6.0+ | 7.0+ |
| Composer | 2.0+ | 2.7+ |

## 环境搭建方案

### 1. FrankenPHP（推荐）

FrankenPHP 是一个现代化的 PHP 应用服务器，内置了 HTTP/2、HTTP/3、实时功能等特性。

#### 使用官方二进制文件

```bash
# 下载 FrankenPHP
curl -L https://github.com/dunglas/frankenphp/releases/latest/download/frankenphp-linux-x86_64 -o frankenphp
chmod +x frankenphp

# 创建项目目录
mkdir dux-admin && cd dux-admin

# 下载项目
composer create-project duxweb/dux-php-admin .

# 启动 FrankenPHP
./frankenphp php-server --listen :8080
```

#### 使用 Docker

```bash
# 拉取 FrankenPHP 镜像
docker pull dunglas/frankenphp

# 创建项目
composer create-project duxweb/dux-php-admin dux-admin
cd dux-admin

# 启动容器
docker run -p 8080:8080 -v $(pwd):/app dunglas/frankenphp php-server --listen :8080
```

### 2. Docker 部署

使用 Docker 可以快速搭建一个完整的开发环境。

#### 创建 docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    image: dunglas/frankenphp
    ports:
      - "8080:8080"
    volumes:
      - .:/app
    depends_on:
      - mysql
      - redis
    environment:
      - DB_HOST=mysql
      - DB_DATABASE=dux_admin
      - DB_USERNAME=dux_admin
      - DB_PASSWORD=secret
      - REDIS_HOST=redis
      - REDIS_PASSWORD=secret
    command: php-server --listen :8080

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: secret
      MYSQL_DATABASE: dux_admin
      MYSQL_USER: dux_admin
      MYSQL_PASSWORD: secret
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --requirepass secret
    volumes:
      - redis_data:/data

  phpmyadmin:
    image: phpmyadmin/phpmyadmin
    ports:
      - "8081:80"
    environment:
      PMA_HOST: mysql
      PMA_USER: dux_admin
      PMA_PASSWORD: secret
    depends_on:
      - mysql

volumes:
  mysql_data:
  redis_data:
```

#### 启动环境

```bash
# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 访问应用
# 应用地址：http://localhost:8080
# phpMyAdmin：http://localhost:8081
```

### 3. Flyenv（桌面应用）

Flyenv 是一个桌面应用程序，为 Web 开发提供了可视化的环境管理界面。

#### 安装 Flyenv

1. **下载安装包**
   - 访问 [Flyenv 官网](https://flyenv.com/zh/)
   - 根据操作系统下载对应的安装包
   - Windows: `.exe` 安装程序
   - macOS: `.dmg` 镜像文件
   - Linux: `.AppImage` 或 `.deb` 包

2. **安装步骤**
   ```bash
   # macOS
   # 双击 .dmg 文件，将应用拖入 Applications 文件夹
   
   # Windows
   # 双击 .exe 文件，按照向导安装
   
   # Linux (Ubuntu/Debian)
   sudo dpkg -i flyenv_*.deb
   ```

#### 使用 Flyenv

1. **启动应用**
   - 打开 Flyenv 桌面应用
   - 选择工作目录

2. **配置环境**
   - 在界面中选择 PHP 8.3 版本
   - 启用 MySQL 8.0 服务
   - 启用 Redis 7.0 服务
   - 配置虚拟主机

3. **创建项目**
   - 在 Flyenv 中创建新站点
   - 设置域名：`dux-admin.local`
   - 选择项目目录
   - 配置 PHP 版本和扩展

4. **部署应用**
   ```bash
   # 在项目目录中
   composer create-project duxweb/dux-php-admin .
   ```

5. **访问应用**
   - 通过 Flyenv 启动服务
   - 访问 `http://dux-admin.local`

### 4. ServBay（macOS 专用）

ServBay 是 macOS 上的一个现代化 Web 开发环境，提供了图形界面管理。

#### 安装 ServBay

```bash
# 使用 Homebrew
brew install --cask servbay

# 或下载 DMG 文件
# https://www.servbay.com/download
```

#### 配置 ServBay

1. **启动 ServBay**
   - 打开 ServBay 应用
   - 选择 PHP 8.3 版本
   - 启动 MySQL 和 Redis 服务

2. **创建项目**
   ```bash
   # 进入 ServBay 项目目录
   cd ~/ServBay/www
   
   # 创建项目
   composer create-project duxweb/dux-php-admin dux-admin
   cd dux-admin
   ```

3. **配置虚拟主机**
   - 在 ServBay 中添加新站点
   - 域名：`dux-admin.local`
   - 路径：`~/ServBay/www/dux-admin/public`
   - PHP 版本：8.3

4. **访问应用**
   - 打开浏览器访问 `http://dux-admin.local`

## 数据库配置

### MySQL 配置

```sql
-- 创建数据库
CREATE DATABASE dux_admin DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户并授权
CREATE USER 'dux_admin'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON dux_admin.* TO 'dux_admin'@'localhost';
FLUSH PRIVILEGES;
```

### 应用配置

创建 `.env` 文件：

```bash
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=dux_admin
DB_USERNAME=dux_admin
DB_PASSWORD=your_password

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# 应用配置
APP_DEBUG=true
APP_ENV=development
APP_KEY=your-32-character-secret-key
```

## 环境验证

创建验证脚本 `check_environment.php`：

```php
<?php
echo "PHP Version: " . phpversion() . "\n";

// 检查必需扩展
$required_extensions = ['pdo_mysql', 'redis', 'json', 'mbstring', 'curl', 'zip', 'gd'];
foreach ($required_extensions as $ext) {
    echo "Extension $ext: " . (extension_loaded($ext) ? "✓" : "✗") . "\n";
}

// 检查 Composer
echo "Composer: " . (system('composer --version') ? "✓" : "✗") . "\n";

// 检查数据库连接
try {
    $pdo = new PDO('mysql:host=localhost;dbname=dux_admin', 'dux_admin', 'your_password');
    echo "MySQL Connection: ✓\n";
} catch (PDOException $e) {
    echo "MySQL Connection: ✗ " . $e->getMessage() . "\n";
}

// 检查 Redis 连接
try {
    $redis = new Redis();
    $redis->connect('localhost', 6379);
    echo "Redis Connection: ✓\n";
} catch (Exception $e) {
    echo "Redis Connection: ✗ " . $e->getMessage() . "\n";
}
?>
```

运行验证：

```bash
php check_environment.php
```

## 性能优化

### OPcache 配置

在 `php.ini` 中启用 OPcache：

```ini
; OPcache 配置
opcache.enable=1
opcache.enable_cli=1
opcache.memory_consumption=256
opcache.interned_strings_buffer=8
opcache.max_accelerated_files=4000
opcache.revalidate_freq=0
opcache.fast_shutdown=1
```

### Composer 优化

```bash
# 设置 Composer 国内镜像
composer config -g repo.packagist composer https://mirrors.aliyun.com/composer/

# 启用 Composer 并行下载
composer config -g repo.packagist composer https://packagist.org
composer global require hirak/prestissimo
```

## 开发工具推荐

### IDE 选择

**PhpStorm**（推荐）
- 完整的 PHP 开发支持
- 内置数据库工具
- Git 集成
- 代码智能提示和重构

**VS Code**
- 轻量级编辑器
- 丰富的扩展生态
- 良好的 Vue 支持

### VS Code 扩展

```json
{
  "recommendations": [
    "bmewburn.vscode-intelephense-client",
    "Vue.volar",
    "bradlc.vscode-tailwindcss",
    "formulahendry.auto-rename-tag",
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml"
  ]
}
```

## 常见问题

### Q: 如何选择合适的环境搭建方案？

A: 
- **FrankenPHP**: 适合对性能有要求的项目，支持现代 HTTP 特性
- **Docker**: 适合团队开发，环境一致性好
- **Flyenv**: 适合喜欢桌面应用的开发者，界面友好
- **ServBay**: 适合 macOS 用户，图形界面友好

### Q: 端口被占用怎么办？

A: 检查端口占用情况：
```bash
# 检查端口占用
lsof -i :8080
lsof -i :3306
lsof -i :6379

# 修改配置文件中的端口
```

### Q: 如何在生产环境部署？

A: 推荐使用 Docker 或 FrankenPHP 进行生产部署：

```bash
# 使用 FrankenPHP 生产模式
./frankenphp php-server --listen :80 --root public --env production
```

## 下一步

环境搭建完成后，您可以：

1. [项目安装](/dev/quick-start/installation) - 安装 Dux PHP Admin
2. [目录结构](/dev/quick-start/directory-structure) - 了解项目结构
3. [第一个模块](/dev/quick-start/first-module) - 创建您的第一个模块