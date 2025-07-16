# 安全考虑

在开发 Dux PHP Admin 应用时，安全是至关重要的考虑因素。本指南介绍主要的安全威胁和防护措施。

## 认证与授权

### JWT 认证
```php
// 生成 JWT Token
$token = JWT::encode([
    'user_id' => $user->id,
    'exp' => time() + 3600, // 1小时过期
    'iat' => time(),
    'iss' => 'dux-admin'
], $this->getSecretKey(), 'HS256');

// 验证 JWT Token
try {
    $decoded = JWT::decode($token, new Key($this->getSecretKey(), 'HS256'));
    $userId = $decoded->user_id;
} catch (Exception $e) {
    throw new UnauthorizedException('Invalid token');
}
```

### 权限验证
```php
#[Resource(app: 'admin', route: '/system/user', name: 'system.user')]
class User extends Resources
{
    public function queryMany(Builder $query, ServerRequestInterface $request, array $args): void
    {
        // 检查用户权限
        if (!$this->hasPermission('system.user.view')) {
            throw new ForbiddenException('没有访问权限');
        }
        
        // 数据权限过滤
        $this->applyDataPermission($query, $request);
    }
    
    private function applyDataPermission(Builder $query, ServerRequestInterface $request): void
    {
        $user = $request->getAttribute('user');
        
        // 普通用户只能查看自己的数据
        if (!$user->isAdmin()) {
            $query->where('user_id', $user->id);
        }
    }
}
```

## 输入验证

### 数据验证
```php
public function validator(array $data, ServerRequestInterface $request, array $args): array
{
    return [
        'username' => [
            ['required', '用户名不能为空'],
            ['string', '用户名必须是字符串'],
            ['max:50', '用户名不能超过50个字符'],
            [function ($field, $value) {
                // 防止 XSS 攻击
                if ($value !== strip_tags($value)) {
                    return false;
                }
                // 防止 SQL 注入
                if (preg_match('/[\'";]/', $value)) {
                    return false;
                }
                return true;
            }, '用户名包含非法字符']
        ],
        'email' => [
            ['required', '邮箱不能为空'],
            ['email', '邮箱格式不正确'],
            ['max:100', '邮箱不能超过100个字符']
        ],
        'password' => [
            ['required', '密码不能为空'],
            ['min:8', '密码长度至少8位'],
            [function ($field, $value) {
                // 强密码验证
                if (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/', $value)) {
                    return false;
                }
                return true;
            }, '密码必须包含大小写字母、数字和特殊字符']
        ]
    ];
}
```

### SQL 注入防护
```php
// 使用参数化查询
$users = DB::select('SELECT * FROM users WHERE id = ? AND status = ?', [$id, $status]);

// 使用 ORM 查询构建器
$users = User::where('id', $id)->where('status', $status)->get();

// 避免直接拼接 SQL
// 错误示例：
// $sql = "SELECT * FROM users WHERE name = '" . $name . "'";
```

## XSS 防护

### 输出转义
```php
// 在模板中转义输出
echo htmlspecialchars($userInput, ENT_QUOTES, 'UTF-8');

// 使用框架提供的转义函数
echo e($userInput);
```

### 前端防护
```vue
<template>
  <div>
    <!-- 使用 v-text 而不是 v-html -->
    <p v-text="userContent"></p>
    
    <!-- 必须使用 v-html 时要确保内容安全 -->
    <div v-html="sanitizedContent"></div>
  </div>
</template>

<script setup>
import DOMPurify from 'dompurify'

const userContent = ref('')
const sanitizedContent = computed(() => {
  return DOMPurify.sanitize(userContent.value)
})
</script>
```

## CSRF 防护

### CSRF Token
```php
// 生成 CSRF Token
$token = bin2hex(random_bytes(32));
$_SESSION['csrf_token'] = $token;

// 验证 CSRF Token
if (!hash_equals($_SESSION['csrf_token'], $request->getParsedBody()['csrf_token'])) {
    throw new ForbiddenException('CSRF token mismatch');
}
```

### 前端处理
```javascript
// 在请求头中添加 CSRF Token
axios.defaults.headers.common['X-CSRF-TOKEN'] = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

// 或在表单中添加隐藏字段
<input type="hidden" name="csrf_token" value="{{ csrf_token() }}">
```

## 文件上传安全

### 文件类型验证
```php
public function uploadFile(UploadedFileInterface $file): string
{
    // 验证文件类型
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (!in_array($file->getClientMediaType(), $allowedTypes)) {
        throw new BadRequestException('不支持的文件类型');
    }
    
    // 验证文件大小
    if ($file->getSize() > 5 * 1024 * 1024) { // 5MB
        throw new BadRequestException('文件大小不能超过5MB');
    }
    
    // 验证文件扩展名
    $extension = pathinfo($file->getClientFilename(), PATHINFO_EXTENSION);
    $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'pdf'];
    if (!in_array(strtolower($extension), $allowedExtensions)) {
        throw new BadRequestException('不支持的文件扩展名');
    }
    
    // 生成安全的文件名
    $filename = uniqid() . '.' . $extension;
    $uploadPath = '/uploads/' . date('Y/m/d') . '/' . $filename;
    
    // 移动文件到安全目录
    $file->moveTo($uploadPath);
    
    return $uploadPath;
}
```

### 文件存储安全
```php
// 将上传文件存储在 web 根目录之外
$uploadDir = '/var/www/storage/uploads/';

// 或使用云存储服务
$s3Client = new S3Client([
    'region' => 'us-west-2',
    'credentials' => [
        'key' => $accessKey,
        'secret' => $secretKey,
    ],
]);
```

## 会话安全

### 会话配置
```php
// 设置安全的会话配置
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', 1);
ini_set('session.cookie_samesite', 'Strict');
ini_set('session.use_strict_mode', 1);
```

### 会话管理
```php
// 登录时重新生成会话 ID
session_regenerate_id(true);

// 登出时销毁会话
session_destroy();
unset($_SESSION);
```

## 数据加密

### 敏感数据加密
```php
// 加密敏感数据
function encryptData(string $data): string
{
    $key = base64_decode($this->getEncryptionKey());
    $iv = random_bytes(16);
    $encrypted = openssl_encrypt($data, 'AES-256-CBC', $key, 0, $iv);
    return base64_encode($iv . $encrypted);
}

// 解密数据
function decryptData(string $encryptedData): string
{
    $key = base64_decode($this->getEncryptionKey());
    $data = base64_decode($encryptedData);
    $iv = substr($data, 0, 16);
    $encrypted = substr($data, 16);
    return openssl_decrypt($encrypted, 'AES-256-CBC', $key, 0, $iv);
}
```

### 密码哈希
```php
// 密码哈希
$hashedPassword = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);

// 密码验证
if (password_verify($inputPassword, $hashedPassword)) {
    // 密码正确
} else {
    // 密码错误
}
```

## API 安全

### 请求频率限制
```php
class RateLimitMiddleware
{
    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $clientIp = $request->getServerParams()['REMOTE_ADDR'];
        $key = 'rate_limit:' . $clientIp;
        
        $current = $this->redis->get($key);
        if ($current && $current > 100) { // 每分钟最多100次请求
            throw new TooManyRequestsException('请求过于频繁');
        }
        
        $this->redis->incr($key);
        $this->redis->expire($key, 60); // 60秒过期
        
        return $handler->handle($request);
    }
}
```

### API 访问控制
```php
// 设置 CORS 头
header('Access-Control-Allow-Origin: https://yourdomain.com');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// 设置安全头
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
```

## 日志记录

### 安全日志
```php
// 记录登录尝试
Log::info('用户登录', [
    'user_id' => $user->id,
    'ip' => $request->getServerParams()['REMOTE_ADDR'],
    'user_agent' => $request->getHeaderLine('User-Agent'),
    'timestamp' => date('Y-m-d H:i:s')
]);

// 记录权限检查
Log::warning('权限检查失败', [
    'user_id' => $user->id,
    'action' => $action,
    'resource' => $resource,
    'ip' => $clientIp
]);

// 记录异常访问
Log::error('异常访问', [
    'ip' => $clientIp,
    'url' => $request->getUri(),
    'method' => $request->getMethod(),
    'error' => $exception->getMessage()
]);
```

## 配置安全

### 环境配置
```toml
# config/app.toml
[app]
debug = false
key = "your-secret-key-here"

[session]
lifetime = 3600
secure = true
httponly = true

[database]
# 不要在配置文件中存储敏感信息
# 使用环境变量
host = "${DB_HOST}"
username = "${DB_USERNAME}"
password = "${DB_PASSWORD}"
```

### 文件权限
```bash
# 设置合适的文件权限
chmod 755 /var/www/html
chmod 644 /var/www/html/*.php
chmod 600 /var/www/html/config/*.toml
chmod 755 /var/www/html/storage
chmod 755 /var/www/html/storage/logs
```

## 监控与审计

### 安全监控
```php
// 监控异常登录
if ($this->detectSuspiciousLogin($user, $request)) {
    Log::alert('检测到异常登录', [
        'user_id' => $user->id,
        'ip' => $clientIp,
        'location' => $this->getLocationByIp($clientIp)
    ]);
    
    // 发送警报邮件
    $this->sendSecurityAlert($user, $clientIp);
}
```

### 审计日志
```php
// 记录敏感操作
Log::audit('用户数据修改', [
    'operator_id' => $currentUser->id,
    'target_user_id' => $targetUser->id,
    'action' => 'update',
    'changes' => $changes,
    'ip' => $clientIp,
    'timestamp' => time()
]);
```

## 定期安全检查

### 代码审计
- 定期进行代码安全审计
- 使用静态分析工具检查安全漏洞
- 关注依赖包的安全更新

### 渗透测试
- 定期进行渗透测试
- 检查常见的安全漏洞
- 验证安全措施的有效性

### 安全更新
- 及时更新框架和依赖包
- 关注安全公告和漏洞报告
- 制定应急响应计划

通过实施这些安全措施，可以大大提高 Dux PHP Admin 应用的安全性，保护用户数据和系统资源。