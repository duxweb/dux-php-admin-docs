# 部署指南

基于 dux-php-admin 实际项目的部署方法和最佳实践。

## 🚀 快速部署

### 环境要求

- **PHP**: 8.1+
- **数据库**: MySQL 5.7+ / PostgreSQL 12+
- **Web服务器**: Nginx / Apache
- **Node.js**: 16+ (用于前端构建)

### 基础部署

```bash
# 1. 克隆项目
git clone https://github.com/your-repo/dux-php-admin.git
cd dux-php-admin

# 2. 安装依赖
composer install --no-dev --optimize-autoloader
pnpm install

# 3. 配置环境
# 编辑 config/use.toml 和 config/database.toml

# 4. 数据库迁移
php dux db:sync

# 6. 构建前端
pnpm build

# 7. 设置权限
chmod -R 755 storage
chmod -R 755 public
```

## 🐳 Docker 部署

### Dockerfile

基于项目实际的 Dockerfile：

```dockerfile
FROM dunglas/frankenphp:1.7-builder-php8.2

RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

WORKDIR /app
COPY . .

# 安装编译扩展所需依赖
RUN apt-get update && apt-get install -y \
    git unzip curl wget gnupg lsb-release \
    libzip-dev zip libssl-dev

# 编译并启用 PHP 扩展
RUN docker-php-ext-install sockets zip bcmath
RUN docker-php-ext-install pdo pdo_mysql

# 安装 Composer 并优化依赖
RUN curl -sS https://getcomposer.org/installer | php && \
    php composer.phar update --no-dev --optimize-autoloader

# 设置文档根目录
ENV DOCUMENT_ROOT=/app/public

EXPOSE 8080

CMD ["./dux", "worker:start"]
```

### docker-compose.yml

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "8080:8080"
    volumes:
      - .:/app
    environment:
      DOCUMENT_ROOT: /app/public
    command: ./dux worker:start
    tty: true
    stdin_open: true
```

### 部署命令

```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f app

# 进入容器
docker-compose exec app sh

# 停止服务
docker-compose down
```

## ⚙️ Nginx 配置

### 基础配置

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/html/public;
    index index.php;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # PHP 处理
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    # 前端路由
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # 隐藏敏感文件
    location ~ /\. {
        deny all;
    }
}
```

### HTTPS 配置

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # SSL 优化
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    
    # 其他配置同上...
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

## 🔧 生产环境配置

### 配置文件

生产环境 `config/use.toml`：

```toml
[app]
name = "DuxLite 管理系统"
debug = false
timezone = "Asia/Shanghai"
secret = "your-production-secret-key"
domain = "https://your-domain.com"

[vite]
dev = false

[cloud]
key = "your-cloud-key"
```

生产环境 `config/database.toml`：

```toml
[db.drivers.default]
driver = "mysql"
host = "localhost"
database = "dux_production"
username = "dux_user"
password = "secure_password"
port = 3306
prefix = "app_"
```

### 性能优化

```bash
# 1. Composer 优化
composer install --no-dev --optimize-autoloader

# 2. 数据库优化
php dux db:sync

# 3. 权限同步
php dux permission:sync

# 4. OPcache 配置
# 在 php.ini 中启用
opcache.enable=1
opcache.memory_consumption=256
opcache.max_accelerated_files=20000
```



## 🔄 CI/CD 部署

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup PHP
      uses: shivammathur/setup-php@v2
      with:
        php-version: '8.1'
        
    - name: Install dependencies
      run: composer install --no-dev --optimize-autoloader
      
    - name: Build frontend
      run: |
        npm install
        npm run build
        
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.KEY }}
        script: |
          cd /var/www/html
          git pull origin main
          composer install --no-dev --optimize-autoloader
          npm run build
          php dux db:sync
          php dux permission:sync
```

## 🛡️ 安全配置

### 基础安全

```bash
# 1. 设置正确的文件权限
find . -type f -exec chmod 644 {} \;
find . -type d -exec chmod 755 {} \;
chmod -R 777 storage

# 2. 隐藏敏感文件
# 在 .htaccess 中添加
<Files "*.toml">
    Order allow,deny
    Deny from all
</Files>

# 3. 定期更新依赖
composer update
npm update
```

### 数据库安全

```sql
-- 创建专用数据库用户
CREATE USER 'dux_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON dux_production.* TO 'dux_user'@'localhost';
FLUSH PRIVILEGES;
```

## 🎉 总结

DuxLite 部署要点：

- **🐳 容器化**：使用 FrankenPHP 和 Docker 部署
- **⚙️ Web服务器**：Nginx 配置优化
- **🔧 生产优化**：数据库同步和权限管理
- **🔄 自动化**：CI/CD 自动部署
- **🛡️ 安全防护**：文件权限和数据库安全
- **📁 配置分离**：use.toml 和 database.toml 分离配置

合理的部署配置可以确保应用稳定高效运行！
