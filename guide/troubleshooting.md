# 故障排除

本文档帮助您诊断和解决使用 Dux PHP Admin 过程中可能遇到的常见问题。

## 安装问题

### 1. Composer 安装失败

**问题描述**: `composer install` 执行失败或速度过慢

**可能原因**:
- 网络连接问题
- Composer 镜像设置问题
- PHP 版本不兼容

**解决方案**:

```bash
# 检查 PHP 版本
php --version

# 更新 Composer
composer self-update

# 设置国内镜像
composer config -g repo.packagist composer https://mirrors.aliyun.com/composer/

# 清理缓存重新安装
composer clear-cache
composer install --no-dev --optimize-autoloader
```

### 2. 数据库连接失败

**问题描述**: 无法连接到数据库

**错误信息**:
```
SQLSTATE[HY000] [2002] Connection refused
SQLSTATE[28000] [1045] Access denied for user
```

**解决方案**:

1. **检查数据库服务**:
```bash
# MySQL 服务状态
systemctl status mysql
# 或
service mysql status

# 启动 MySQL
systemctl start mysql
```

2. **验证连接参数**:
```bash
# 测试数据库连接
mysql -h localhost -u root -p

# 检查配置文件
cat config/database.toml
```

3. **修正配置**:
```toml
[default]
driver = "mysql"
host = "127.0.0.1"  # 尝试使用 IP 而非 localhost
port = 3306
database = "dux_admin"
username = "your_username"
password = "your_password"
```

### 3. 权限问题

**问题描述**: 文件写入失败或权限被拒绝

**错误信息**:
```
Permission denied
file_put_contents(): failed to open stream
```

**解决方案**:

```bash
# 检查目录权限
ls -la data/
ls -la public/upload/

# 设置正确权限
chmod -R 755 data/
chmod -R 755 public/upload/

# 设置所有者（如果需要）
chown -R www-data:www-data data/
chown -R www-data:www-data public/upload/

# 验证权限
ls -la data/
```

## 运行时问题

### 1. 500 内部服务器错误

**问题描述**: 页面显示 500 错误

**排查步骤**:

1. **查看错误日志**:
```bash
# 查看应用日志
tail -f data/logs/app.log

# 查看 Web 服务器日志
tail -f /var/log/nginx/error.log
# 或
tail -f /var/log/apache2/error.log

# 查看 PHP 错误日志
tail -f /var/log/php8.2-fpm.log
```

2. **开启调试模式**:
```toml
# config/use.toml
[app]
debug = true
```

3. **检查 .htaccess**:
```apache
# public/.htaccess
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [QSA,L]
```

### 2. 页面无法访问

**问题描述**: 特定页面返回 404 错误

**解决方案**:

1. **检查路由配置**:
```bash
# 清理路由缓存
php dux cache:clear

# 查看路由列表
php dux route:list
```

2. **验证 URL 重写**:
```bash
# Apache
a2enmod rewrite
systemctl reload apache2

# Nginx 配置检查
nginx -t
systemctl reload nginx
```

### 3. 登录问题

**问题描述**: 无法登录或登录后立即退出

**排查步骤**:

1. **检查用户状态**:
```bash
# 使用数据库查询用户状态
mysql -u root -p -e "SELECT id, username, status FROM system_users WHERE username='admin';"
```

2. **验证密码**:
```php
// 在控制台中重置密码
php dux user:password admin newpassword123
```

3. **检查会话配置**:
```toml
# config/use.toml
[session]
driver = "file"  # 临时改为 file 测试
lifetime = 7200
```

## 性能问题

### 1. 页面加载缓慢

**问题描述**: 页面响应时间过长

**优化方案**:

1. **启用缓存**:
```toml
# config/use.toml
[cache]
driver = "redis"  # 使用 Redis 缓存
```

2. **数据库查询优化**:
```bash
# 开启慢查询日志
mysql -u root -p -e "SET GLOBAL slow_query_log = 'ON';"
mysql -u root -p -e "SET GLOBAL long_query_time = 1;"

# 查看慢查询
tail -f /var/log/mysql/mysql-slow.log
```

3. **PHP 优化**:
```ini
# php.ini
opcache.enable=1
opcache.memory_consumption=128
opcache.max_accelerated_files=4000
```

### 2. 内存不足

**问题描述**: PHP 内存限制错误

**错误信息**:
```
Fatal error: Allowed memory size exhausted
```

**解决方案**:

```ini
# php.ini
memory_limit = 256M

# 或临时设置
php -d memory_limit=256M dux command
```

### 3. 文件上传失败

**问题描述**: 大文件上传失败

**解决方案**:

```ini
# php.ini
upload_max_filesize = 50M
post_max_size = 50M
max_execution_time = 300
max_input_time = 300
```

```nginx
# nginx.conf
client_max_body_size 50M;
```

## 数据库问题

### 1. 迁移失败

**问题描述**: 数据库迁移执行失败

**解决方案**:

```bash
# 检查迁移状态
php dux migrate:status

# 回滚上一次迁移
php dux migrate:rollback

# 强制执行迁移
php dux migrate --force

# 重新运行特定迁移
php dux migrate:refresh --step=1
```

### 2. 数据丢失

**问题描述**: 数据意外丢失或损坏

**恢复方案**:

```bash
# 从备份恢复
mysql -u root -p dux_admin < backup/database_20240101.sql

# 检查数据完整性
php dux db:check

# 修复表
mysql -u root -p -e "REPAIR TABLE system_users;"
```

### 3. 字符编码问题

**问题描述**: 中文显示乱码

**解决方案**:

```sql
-- 检查字符集
SHOW VARIABLES LIKE 'character_set%';

-- 修改表字符集
ALTER TABLE system_users CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

```toml
# config/database.toml
[default]
charset = "utf8mb4"
collation = "utf8mb4_unicode_ci"
```

## 前端问题

### 1. 静态资源加载失败

**问题描述**: CSS/JS 文件 404 错误

**解决方案**:

1. **检查文件路径**:
```bash
# 验证文件存在
ls -la public/assets/

# 检查权限
chmod -R 755 public/assets/
```

2. **清理缓存**:
```bash
# 清理浏览器缓存
# 清理应用缓存
php dux cache:clear
```

### 2. Vue 组件渲染失败

**问题描述**: 页面显示空白或组件不渲染

**解决方案**:

1. **检查控制台错误**:
```javascript
// 打开浏览器开发者工具查看错误信息
console.log('检查是否有 JavaScript 错误');
```

2. **验证组件语法**:
```bash
# 如果使用前端构建工具
npm run build
npm run dev
```

## 缓存问题

### 1. 缓存不生效

**问题描述**: 配置修改后不生效

**解决方案**:

```bash
# 清理所有缓存
php dux cache:clear

# 清理特定缓存
php dux cache:clear config
php dux cache:clear routes
php dux cache:clear views
```

### 2. Redis 连接失败

**问题描述**: 无法连接到 Redis

**解决方案**:

```bash
# 检查 Redis 服务
systemctl status redis
systemctl start redis

# 测试连接
redis-cli ping

# 检查配置
redis-cli info server
```

## 日志分析

### 1. 应用日志

```bash
# 查看最新日志
tail -f data/logs/app.log

# 搜索错误日志
grep "ERROR" data/logs/app.log

# 按日期查看日志
grep "2024-01-01" data/logs/app.log
```

### 2. Web 服务器日志

```bash
# Nginx 访问日志
tail -f /var/log/nginx/access.log

# Nginx 错误日志
tail -f /var/log/nginx/error.log

# Apache 日志
tail -f /var/log/apache2/access.log
tail -f /var/log/apache2/error.log
```

### 3. PHP 日志

```bash
# PHP-FPM 日志
tail -f /var/log/php8.2-fpm.log

# PHP 错误日志
tail -f /var/log/php_errors.log
```

## 诊断工具

### 1. 系统信息检查

```bash
# 创建诊断脚本
php dux system:info

# 检查环境要求
php dux system:check

# 测试数据库连接
php dux db:test

# 测试 Redis 连接
php dux redis:test
```

### 2. 性能分析

```bash
# 查看系统资源使用
top
htop
free -m
df -h

# 查看进程状态
ps aux | grep php
ps aux | grep nginx
```

### 3. 网络测试

```bash
# 测试端口连通性
telnet localhost 3306
telnet localhost 6379

# 检查防火墙
ufw status
iptables -L
```

## 常见解决方案

### 1. 重置管理员密码

```bash
# 方法1：使用命令行
php dux user:password admin newpassword123

# 方法2：直接修改数据库
mysql -u root -p -e "UPDATE system_users SET password = PASSWORD('newpassword123') WHERE username = 'admin';"
```

### 2. 清理系统

```bash
# 清理所有缓存
php dux cache:clear

# 清理日志文件
rm -f data/logs/*.log

# 清理临时文件
rm -rf data/temp/*
```

### 3. 重新安装

```bash
# 备份数据
mysqldump -u root -p dux_admin > backup.sql
cp -r public/upload backup_uploads

# 重新安装依赖
composer install --no-dev --optimize-autoloader

# 重新运行迁移
php dux migrate:refresh

# 恢复数据
mysql -u root -p dux_admin < backup.sql
```

## 联系支持

如果以上解决方案都无法解决您的问题，请：

1. **收集错误信息**:
   - 错误日志内容
   - 系统环境信息
   - 复现步骤

2. **提交问题**:
   - GitHub Issues: https://github.com/duxweb/dux-php-admin/issues
   - 邮件支持: admin@dux.cn

3. **提供信息**:
   - PHP 版本
   - 数据库版本
   - 操作系统版本
   - 浏览器版本

## 预防措施

### 1. 定期备份

```bash
#!/bin/bash
# 自动备份脚本
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u root -p dux_admin > backup/database_$DATE.sql
tar -czf backup/files_$DATE.tar.gz public/upload/
```

### 2. 监控系统

```bash
# 设置监控脚本
php dux monitor:health

# 配置日志轮转
logrotate -f /etc/logrotate.d/dux-admin
```

### 3. 更新维护

```bash
# 定期更新依赖
composer update

# 检查安全更新
php dux security:check

# 清理系统垃圾
php dux system:cleanup
```