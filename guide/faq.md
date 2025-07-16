# 常见问题解答

## 安装和配置问题

### Q1: 安装时提示 PHP 版本不兼容

**问题描述**: 运行 `composer install` 时提示 "requires php ^8.2"

**解决方案**:
```bash
# 检查 PHP 版本
php -v

# 如果版本低于 8.2，请升级 PHP
# Ubuntu/Debian
sudo apt update
sudo apt install php8.2

# CentOS/RHEL
sudo yum install php82

# macOS (使用 Homebrew)
brew install php@8.2
```

### Q2: Composer 依赖安装失败

**问题描述**: `composer install` 时出现内存不足或网络错误

**解决方案**:
```bash
# 增加内存限制
php -d memory_limit=2G /usr/local/bin/composer install

# 使用国内镜像
composer config repo.packagist composer https://mirrors.aliyun.com/composer/

# 跳过平台检查（谨慎使用）
composer install --ignore-platform-reqs
```

### Q3: 数据库连接失败

**问题描述**: 系统提示 "SQLSTATE[HY000] [2002] Connection refused"

**解决方案**:
1. 检查数据库服务是否启动:
```bash
# MySQL
sudo systemctl status mysql
sudo systemctl start mysql

# 检查端口是否开放
netstat -tlnp | grep 3306
```

2. 检查配置文件 `config/database.toml`:
```toml
[db.drivers.default]
driver = "mysql"
host = "localhost"  # 确保主机地址正确
port = 3306         # 确保端口正确
database = "dux_admin"
username = "root"
password = "your_password"
```

3. 测试数据库连接:
```bash
mysql -h localhost -u root -p
```

### Q4: 前端资源加载失败

**问题描述**: 页面样式错乱，浏览器控制台显示 404 错误

**解决方案**:
1. 检查 Vite 配置:
```toml
# config/use.toml
[vite]
dev = false  # 生产环境设为 false
port = 5173
```

2. 检查静态资源目录权限:
```bash
chmod -R 755 public/static/
chown -R www-data:www-data public/static/
```

3. 重新构建前端资源:
```bash
cd web
npm run build
```

## 权限和认证问题

### Q5: 用户无法登录系统

**问题描述**: 输入正确的用户名密码后仍然无法登录

**解决方案**:
1. 检查用户状态:
```sql
SELECT * FROM app_system_users WHERE username = 'your_username';
-- 确保 status = 1 (启用状态)
```

2. 检查应用密钥配置:
```toml
# config/use.toml
[app]
secret = "your-32-character-secret-key"  # 必须是32位字符
```

3. 清除缓存:
```bash
php dux cache:clear
```

### Q6: 权限验证失败

**问题描述**: 用户登录后无法访问某些页面，提示权限不足

**解决方案**:
1. 检查用户角色分配:
```bash
php dux user:roles username@example.com
```

2. 同步角色权限:
```bash
php dux role:sync
```

3. 检查权限配置:
```bash
php dux role:show role_name
```

## 性能问题

### Q7: 系统响应缓慢

**问题描述**: 页面加载时间过长，接口响应慢

**解决方案**:
1. 启用缓存:
```toml
# config/use.toml
[cache]
driver = "redis"  # 使用 Redis 缓存
```

2. 启用 PHP OPcache:
```ini
; php.ini
opcache.enable=1
opcache.memory_consumption=128
opcache.max_accelerated_files=4000
```

3. 优化数据库查询:
```bash
# 查看慢查询
php dux db:slow-queries

# 添加索引
ALTER TABLE app_system_users ADD INDEX idx_email (email);
```

### Q8: 内存使用过高

**问题描述**: PHP 进程占用内存过多

**解决方案**:
1. 调整 PHP 内存限制:
```ini
; php.ini
memory_limit = 256M
```

2. 优化数据库查询:
```php
// 使用分页查询大量数据
$users = User::paginate(50);

// 使用 chunk 处理大量数据
User::chunk(100, function($users) {
    foreach ($users as $user) {
        // 处理逻辑
    }
});
```

3. 清理无用缓存:
```bash
php dux cache:clear
```

## 前端开发问题

### Q9: Vue 组件热更新不生效

**问题描述**: 修改 Vue 文件后页面不会自动更新

**解决方案**:
1. 检查开发模式配置:
```toml
# config/use.toml
[vite]
dev = true   # 开发环境设为 true
port = 5173
```

2. 启动 Vite 开发服务器:
```bash
cd web
npm run dev
```

3. 检查浏览器控制台错误信息

### Q10: TypeScript 类型错误

**问题描述**: 编译时出现 TypeScript 类型检查错误

**解决方案**:
1. 安装类型定义:
```bash
npm install @types/node --save-dev
```

2. 检查 tsconfig.json 配置:
```json
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

3. 更新类型声明:
```typescript
// typings.d.ts
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
```

## 部署和运维问题

### Q11: 生产环境部署后出现 500 错误

**问题描述**: 线上环境访问时出现服务器内部错误

**解决方案**:
1. 检查错误日志:
```bash
tail -f data/logs/app-*.log
```

2. 检查文件权限:
```bash
chmod -R 755 data/
chmod -R 755 public/upload/
chmod 600 config/*.toml
```

3. 检查环境配置:
```toml
# config/use.toml
[app]
debug = false  # 生产环境必须关闭调试
```

### Q12: Docker 容器启动失败

**问题描述**: 使用 Docker 部署时容器无法正常启动

**解决方案**:
1. 检查 Docker 日志:
```bash
docker logs container_name
```

2. 检查端口映射:
```yaml
# docker-compose.yml
services:
  app:
    ports:
      - "8080:80"  # 确保端口映射正确
```

3. 检查环境变量:
```yaml
environment:
  - APP_DEBUG=false
  - DB_HOST=mysql
  - DB_PASSWORD=${DB_PASSWORD}
```

## 数据库问题

### Q13: 数据库迁移失败

**问题描述**: 运行 `php dux db:sync` 时报错

**解决方案**:
1. 检查数据库权限:
```sql
SHOW GRANTS FOR 'username'@'localhost';
```

2. 手动执行 SQL:
```bash
# 查看要执行的 SQL
php dux db:sync --dry-run

# 强制同步（谨慎使用）
php dux db:sync --force
```

3. 备份后重新初始化:
```bash
php dux db:backup
php dux db:sync
```

### Q14: 数据丢失或损坏

**问题描述**: 重要数据意外丢失

**解决方案**:
1. 立即停止应用避免进一步损坏
2. 从备份恢复:
```bash
php dux db:restore backup_file.sql
```

3. 检查数据完整性:
```sql
CHECK TABLE app_system_users;
REPAIR TABLE app_system_users;
```

## 文件上传问题

### Q15: 文件上传失败

**问题描述**: 用户无法上传文件，或上传后显示异常

**解决方案**:
1. 检查 PHP 配置:
```ini
; php.ini
upload_max_filesize = 50M
post_max_size = 50M
max_execution_time = 300
```

2. 检查目录权限:
```bash
chmod -R 755 public/upload/
chown -R www-data:www-data public/upload/
```

3. 检查磁盘空间:
```bash
df -h
```

## 邮件发送问题

### Q16: 邮件发送失败

**问题描述**: 系统无法发送邮件通知

**解决方案**:
1. 检查邮件配置:
```toml
# config/use.toml
[mail]
driver = "smtp"
host = "smtp.example.com"
port = 587
username = "your_email@example.com"
password = "your_password"
encryption = "tls"
```

2. 测试邮件配置:
```bash
php dux mail:test test@example.com
```

3. 检查防火墙和端口:
```bash
telnet smtp.example.com 587
```

## 调试技巧

### 启用调试模式

```toml
# config/use.toml
[app]
debug = true
```

### 查看日志

```bash
# 实时查看应用日志
tail -f data/logs/app-*.log

# 查看特定类型日志
grep "ERROR" data/logs/app-*.log
```

### 使用调试工具

```php
// 在代码中添加调试信息
error_log("Debug info: " . json_encode($data));

// 使用 var_dump 输出变量
var_dump($variable);

// 使用断点调试
xdebug_break();
```

## 获取帮助

### 官方文档
- [项目文档](https://github.com/duxweb/dux-php-admin)
- [DuxLite 文档](https://github.com/duxweb/dux-lite)
- [DVHA 文档](https://duxweb.github.io/dvha/)

### 社区支持
- 提交 Issue: [GitHub Issues](https://github.com/duxweb/dux-php-admin/issues)
- 参与讨论: [GitHub Discussions](https://github.com/duxweb/dux-php-admin/discussions)

### 商业支持
如需专业技术支持，请联系 [DuxWeb 团队](mailto:admin@dux.cn)