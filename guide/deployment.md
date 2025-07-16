# 生产部署

本指南将帮助您将 Dux PHP Admin 部署到生产环境，包括服务器配置、性能优化和安全设置。

## 服务器要求

### 基础环境
- **操作系统**: Linux (Ubuntu 20.04+ / CentOS 8+ 推荐)
- **PHP**: 8.2 或更高版本
- **Web 服务器**: Nginx 1.20+ 或 Apache 2.4+
- **数据库**: MySQL 8.0+ 或 PostgreSQL 13+
- **内存**: 最少 2GB，推荐 4GB+
- **存储**: 最少 20GB SSD

### PHP 扩展要求
```bash
# 必需扩展
php-fpm
php-mysql (或 php-pgsql)
php-redis
php-curl
php-gd
php-mbstring
php-xml
php-zip
php-json
php-opcache

# 推荐扩展
php-imagick
php-intl
php-bcmath
```

## 部署准备

### 1. 创建部署用户

```bash
# 创建专用用户
sudo adduser duxadmin
sudo usermod -aG sudo duxadmin

# 切换到部署用户
su - duxadmin
```

### 2. 安装依赖软件

#### Ubuntu/Debian
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 PHP 8.2
sudo apt install software-properties-common
sudo add-apt-repository ppa:ondrej/php
sudo apt update
sudo apt install php8.2 php8.2-fpm php8.2-mysql php8.2-redis \
  php8.2-curl php8.2-gd php8.2-mbstring php8.2-xml \
  php8.2-zip php8.2-opcache php8.2-intl

# 安装 Nginx
sudo apt install nginx

# 安装 MySQL
sudo apt install mysql-server

# 安装 Redis
sudo apt install redis-server

# 安装 Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
```

#### CentOS/RHEL
```bash
# 安装 EPEL 和 Remi 仓库
sudo yum install epel-release
sudo yum install https://rpms.remirepo.net/enterprise/remi-release-8.rpm

# 启用 PHP 8.2
sudo yum module enable php:remi-8.2

# 安装 PHP
sudo yum install php php-fpm php-mysqlnd php-redis php-curl \
  php-gd php-mbstring php-xml php-zip php-opcache php-intl

# 安装其他软件
sudo yum install nginx mysql-server redis
```

## 应用部署

### 1. 下载应用代码

```bash
# 创建项目目录
sudo mkdir -p /var/www
sudo chown duxadmin:duxadmin /var/www

# 使用 Composer 创建项目（推荐）
cd /var/www
composer create-project duxweb/dux-php-admin dux-admin --no-dev --optimize-autoloader

# 或者克隆代码
# git clone https://github.com/duxweb/dux-php-admin.git dux-admin
# cd dux-admin
# composer install --no-dev --optimize-autoloader

# 设置目录所有者
sudo chown -R duxadmin:duxadmin /var/www/dux-admin
```

### 2. 配置应用

#### 编辑配置文件

编辑生产环境配置 `config/use.toml`:
```toml
# config/use.toml
[app]
name = "Dux PHP Admin"
debug = false                    # 生产环境必须关闭
timezone = "Asia/Shanghai"
secret = "your-secure-32-char-secret-key"
domain = "https://yourdomain.com"

[vite]
dev = false                     # 关闭开发模式
port = 5173

[cloud]
key = "your-production-cloud-key"
```

```toml
# config/database.toml
[db.drivers.default]
driver = "mysql"
host = "localhost"
database = "dux_admin_prod"
username = "dux_admin"
password = "secure-password"
port = 3306
prefix = "app_"
```

### 3. 设置文件权限

```bash
# 设置目录权限
sudo chown -R duxadmin:www-data /var/www/dux-admin
sudo chmod -R 755 /var/www/dux-admin
sudo chmod -R 775 /var/www/dux-admin/data
sudo chmod -R 775 /var/www/dux-admin/public/upload

# 设置配置文件权限
sudo chmod 600 /var/www/dux-admin/config/*.toml

# 设置 CLI 脚本权限
sudo chmod +x /var/www/dux-admin/dux
```

### 4. 构建前端资源

```bash
cd /var/www/dux-admin/web

# 安装 Node.js (如果未安装)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装依赖并构建
npm install --production
npm run build
```

## 数据库配置

### 1. 创建数据库

```sql
-- 登录 MySQL
mysql -u root -p

-- 创建数据库
CREATE DATABASE dux_admin_prod DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户
CREATE USER 'dux_admin'@'localhost' IDENTIFIED BY 'secure-password';

-- 授权
GRANT ALL PRIVILEGES ON dux_admin_prod.* TO 'dux_admin'@'localhost';
FLUSH PRIVILEGES;

-- 退出
EXIT;
```

### 2. 初始化数据

```bash
cd /var/www/dux-admin

# 同步数据库结构
php dux db:sync

# 创建管理员账号（如果需要）
php dux user:create admin admin@yourdomain.com --password=secure-password
```

## Web 服务器配置

### Nginx 配置

创建 `/etc/nginx/sites-available/dux-admin`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    root /var/www/dux-admin/public;
    index index.php index.html;

    # SSL 配置
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    # 安全头
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # 访问日志
    access_log /var/log/nginx/dux-admin-access.log;
    error_log /var/log/nginx/dux-admin-error.log;

    # 文件上传大小限制
    client_max_body_size 50M;

    # 静态文件缓存
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # PHP 处理
    location ~ \.php$ {
        try_files $uri =404;
        fastcgi_split_path_info ^(.+\.php)(/.+)$;
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
        
        # 安全设置
        fastcgi_param HTTPS on;
        fastcgi_param HTTP_SCHEME https;
    }

    # 前端路由支持
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # 禁止访问敏感文件
    location ~ /\. {
        deny all;
    }

    location ~ ^/(config|data|vendor)/ {
        deny all;
    }

    location ~ \.(toml|log)$ {
        deny all;
    }
}
```

启用站点：
```bash
sudo ln -s /etc/nginx/sites-available/dux-admin /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Apache 配置（可选）

创建 `/etc/apache2/sites-available/dux-admin.conf`:

```apache
<VirtualHost *:443>
    ServerName yourdomain.com
    DocumentRoot /var/www/dux-admin/public
    
    # SSL 配置
    SSLEngine on
    SSLCertificateFile /path/to/your/certificate.crt
    SSLCertificateKeyFile /path/to/your/private.key
    
    # 安全头
    Header always set X-Frame-Options DENY
    Header always set X-Content-Type-Options nosniff
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
    
    # 目录配置
    <Directory /var/www/dux-admin/public>
        AllowOverride All
        Require all granted
        
        # 前端路由支持
        RewriteEngine On
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule ^(.*)$ index.php [QSA,L]
    </Directory>
    
    # 禁止访问敏感目录
    <Directory /var/www/dux-admin/config>
        Require all denied
    </Directory>
    
    <Directory /var/www/dux-admin/data>
        Require all denied
    </Directory>
    
    <Directory /var/www/dux-admin/vendor>
        Require all denied
    </Directory>
    
    # 日志配置
    ErrorLog ${APACHE_LOG_DIR}/dux-admin-error.log
    CustomLog ${APACHE_LOG_DIR}/dux-admin-access.log combined
</VirtualHost>

<VirtualHost *:80>
    ServerName yourdomain.com
    Redirect permanent / https://yourdomain.com/
</VirtualHost>
```

## PHP-FPM 配置

编辑 `/etc/php/8.2/fpm/pool.d/www.conf`:

```ini
[www]
user = www-data
group = www-data
listen = /var/run/php/php8.2-fpm.sock
listen.owner = www-data
listen.group = www-data
listen.mode = 0660

# 进程管理
pm = dynamic
pm.max_children = 50
pm.start_servers = 5
pm.min_spare_servers = 5
pm.max_spare_servers = 35
pm.max_requests = 500

# 资源限制
request_terminate_timeout = 300
```

编辑 `/etc/php/8.2/fpm/php.ini`:

```ini
# 基础配置
memory_limit = 256M
max_execution_time = 300
max_input_time = 300

# 文件上传
upload_max_filesize = 50M
post_max_size = 50M

# OPcache 配置
opcache.enable=1
opcache.memory_consumption=128
opcache.interned_strings_buffer=8
opcache.max_accelerated_files=4000
opcache.revalidate_freq=2
opcache.fast_shutdown=1

# 会话配置
session.cookie_secure = 1
session.cookie_httponly = 1
session.use_strict_mode = 1

# 安全配置
expose_php = Off
display_errors = Off
log_errors = On
error_log = /var/log/php/error.log
```

重启 PHP-FPM：
```bash
sudo systemctl restart php8.2-fpm
```

## 数据库优化

### MySQL 配置优化

编辑 `/etc/mysql/mysql.conf.d/mysqld.cnf`:

```ini
[mysqld]
# 基础配置
bind-address = 127.0.0.1
port = 3306

# 缓冲池配置
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
innodb_flush_log_at_trx_commit = 2
sync_binlog = 0

# 连接配置
max_connections = 200
connect_timeout = 60
wait_timeout = 120
interactive_timeout = 120

# 查询缓存
query_cache_type = 1
query_cache_size = 64M

# 字符集
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci

# 慢查询日志
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow-query.log
long_query_time = 2

# 错误日志
log_error = /var/log/mysql/error.log
```

重启 MySQL：
```bash
sudo systemctl restart mysql
```

## 缓存配置

### Redis 配置

编辑 `/etc/redis/redis.conf`:

```ini
# 网络配置
bind 127.0.0.1
port 6379
timeout 300

# 内存配置
maxmemory 512mb
maxmemory-policy allkeys-lru

# 持久化配置
save 900 1
save 300 10
save 60 10000

# 安全配置
requirepass your-redis-password

# 日志配置
loglevel notice
logfile /var/log/redis/redis-server.log
```

重启 Redis：
```bash
sudo systemctl restart redis-server
```

## SSL 证书配置

### 使用 Let's Encrypt

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# 设置自动续期
sudo crontab -e
# 添加以下行
0 12 * * * /usr/bin/certbot renew --quiet
```

## 监控和日志

### 1. 日志轮转配置

创建 `/etc/logrotate.d/dux-admin`:

```
/var/www/dux-admin/data/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 0644 duxadmin www-data
    postrotate
        /bin/systemctl reload php8.2-fpm > /dev/null 2>&1 || true
    endscript
}
```

### 2. 监控脚本

创建监控脚本 `/usr/local/bin/dux-admin-monitor.sh`:

```bash
#!/bin/bash

# 检查服务状态
check_service() {
    if ! systemctl is-active --quiet $1; then
        echo "$(date): $1 is not running" >> /var/log/dux-admin-monitor.log
        systemctl restart $1
    fi
}

# 检查磁盘空间
check_disk() {
    USAGE=$(df /var/www/dux-admin | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ $USAGE -gt 80 ]; then
        echo "$(date): Disk usage is ${USAGE}%" >> /var/log/dux-admin-monitor.log
    fi
}

# 执行检查
check_service nginx
check_service php8.2-fpm
check_service mysql
check_service redis-server
check_disk
```

添加到 crontab：
```bash
sudo crontab -e
# 每5分钟检查一次
*/5 * * * * /usr/local/bin/dux-admin-monitor.sh
```

## 备份策略

### 1. 数据库备份脚本

创建 `/usr/local/bin/dux-admin-backup.sh`:

```bash
#!/bin/bash

BACKUP_DIR="/backup/dux-admin"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="dux_admin_prod"
DB_USER="dux_admin"
DB_PASS="secure-password"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 数据库备份
mysqldump -u$DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/database_$DATE.sql.gz

# 文件备份
tar -czf $BACKUP_DIR/files_$DATE.tar.gz -C /var/www/dux-admin data/upload public/upload

# 清理旧备份（保留30天）
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "$(date): Backup completed" >> /var/log/dux-admin-backup.log
```

设置自动备份：
```bash
sudo crontab -e
# 每天凌晨2点备份
0 2 * * * /usr/local/bin/dux-admin-backup.sh
```

## 安全加固

### 1. 防火墙配置

```bash
# 安装 UFW
sudo apt install ufw

# 默认策略
sudo ufw default deny incoming
sudo ufw default allow outgoing

# 允许必要端口
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS

# 启用防火墙
sudo ufw enable
```

### 2. SSH 安全配置

编辑 `/etc/ssh/sshd_config`:

```
# 禁用 root 登录
PermitRootLogin no

# 使用密钥认证
PubkeyAuthentication yes
PasswordAuthentication no

# 限制用户
AllowUsers duxadmin

# 修改默认端口（可选）
Port 2222
```

### 3. Fail2Ban 配置

```bash
# 安装 Fail2Ban
sudo apt install fail2ban

# 配置 Nginx 保护
sudo cat > /etc/fail2ban/jail.local << EOF
[nginx-http-auth]
enabled = true

[nginx-noscript]
enabled = true

[nginx-badbots]
enabled = true

[nginx-noproxy]
enabled = true
EOF

sudo systemctl restart fail2ban
```

## 性能优化

### 1. 应用级优化

```bash
# 启用生产模式缓存
php dux cache:clear
php dux config:cache
```

### 2. 数据库索引优化

```sql
-- 为常用查询添加索引
ALTER TABLE app_system_users ADD INDEX idx_email (email);
ALTER TABLE app_system_users ADD INDEX idx_status (status);
ALTER TABLE app_system_users ADD INDEX idx_created_at (created_at);
```

### 3. CDN 配置

配置 CDN 加速静态资源：

```nginx
# 在 Nginx 配置中添加
location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header Access-Control-Allow-Origin "*";
}
```

## 启动所有服务

```bash
# 启动并设置开机自启
sudo systemctl enable nginx
sudo systemctl enable php8.2-fpm
sudo systemctl enable mysql
sudo systemctl enable redis-server

sudo systemctl start nginx
sudo systemctl start php8.2-fpm
sudo systemctl start mysql
sudo systemctl start redis-server
```

## 部署完成验证

1. 访问 `https://yourdomain.com` 检查网站是否正常运行
2. 测试登录功能
3. 检查上传功能
4. 验证邮件发送
5. 查看监控日志

恭喜！您已经成功部署 Dux PHP Admin 到生产环境。记得定期更新系统和应用，监控服务状态，并保持安全补丁的及时更新。