# API 签名

DuxLite 提供了基于 HMAC-SHA256 的 API 签名验证机制，确保 API 请求的安全性和完整性。

## 🚀 快速开始

### 签名流程

1. **客户端**：使用 AccessKey 和 SecretKey 生成签名
2. **服务端**：验证签名的有效性和时间戳
3. **响应**：签名验证通过后处理请求

### 基础示例

```javascript
// JavaScript 客户端签名
function generateSignature(path, query, timestamp, secretKey) {
  const signData = [
    path,           // 请求路径：/api/users
    query || '',    // 查询参数：name=john&age=25
    timestamp.toString()  // 时间戳：1234567890
  ]
  const signStr = signData.join('\n')
  
  // 使用 CryptoJS 生成 HMAC-SHA256 签名
  const signature = CryptoJS.HmacSHA256(signStr, secretKey)
  return signature.toString(CryptoJS.enc.Hex)
}
```

## 📋 签名算法

### 签名数据格式

基于 `Core\Api\ApiMiddleware` 的实际实现：

```php
// 签名数据组成
$signData = [
    $request->getUri()->getPath(),           // 请求路径
    urldecode($request->getUri()->getQuery()), // URL 解码后的查询参数
    $timestamp                               // Unix 时间戳
];

// 生成签名
$signature = hash_hmac('SHA256', implode("\n", $signData), $secretKey);
```

### 请求头要求

```http
AccessKey: your_access_key_id
Content-Date: 1234567890
Content-MD5: generated_signature_hash
```

| 请求头 | 说明 | 示例 |
|--------|------|------|
| `AccessKey` | API 密钥 ID | `app_001` |
| `Content-Date` | Unix 时间戳 | `1234567890` |
| `Content-MD5` | HMAC-SHA256 签名 | `abcdef123456...` |

## 🔧 客户端实现

### JavaScript 实现

```javascript
class ApiClient {
  constructor(baseURL, accessKey, secretKey) {
    this.baseURL = baseURL
    this.accessKey = accessKey
    this.secretKey = secretKey
  }

  // 生成签名
  generateSignature(path, query, timestamp) {
    const signData = [
      path,
      query || '',
      timestamp.toString()
    ]
    const signStr = signData.join('\n')
    return CryptoJS.HmacSHA256(signStr, this.secretKey).toString(CryptoJS.enc.Hex)
  }

  // 发送请求
  async request(method, path, params = {}, data = null) {
    const timestamp = Math.floor(Date.now() / 1000)
    const url = new URL(path, this.baseURL)
    
    // 添加查询参数
    Object.keys(params).forEach(key => {
      url.searchParams.append(key, params[key])
    })
    
    const query = url.search ? url.search.substring(1) : ''
    const signature = this.generateSignature(url.pathname, query, timestamp)
    
    const headers = {
      'AccessKey': this.accessKey,
      'Content-Date': timestamp.toString(),
      'Content-MD5': signature,
      'Content-Type': 'application/json'
    }
    
    const options = {
      method: method.toUpperCase(),
      headers
    }
    
    if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      options.body = JSON.stringify(data)
    }
    
    const response = await fetch(url.toString(), options)
    return response.json()
  }

  // GET 请求
  async get(path, params = {}) {
    return this.request('GET', path, params)
  }

  // POST 请求
  async post(path, data, params = {}) {
    return this.request('POST', path, params, data)
  }

  // PUT 请求
  async put(path, data, params = {}) {
    return this.request('PUT', path, params, data)
  }

  // DELETE 请求
  async delete(path, params = {}) {
    return this.request('DELETE', path, params)
  }
}

// 使用示例
const client = new ApiClient(
  'https://api.example.com',
  'your_access_key',
  'your_secret_key'
)

// 获取用户列表
const users = await client.get('/api/users', { page: 1, limit: 10 })

// 创建用户
const newUser = await client.post('/api/users', {
  username: 'john',
  email: 'john@example.com'
})
```

### PHP 实现

```php
<?php

class ApiClient
{
    private string $baseURL;
    private string $accessKey;
    private string $secretKey;

    public function __construct(string $baseURL, string $accessKey, string $secretKey)
    {
        $this->baseURL = rtrim($baseURL, '/');
        $this->accessKey = $accessKey;
        $this->secretKey = $secretKey;
    }

    /**
     * 生成签名
     */
    private function generateSignature(string $path, string $query, int $timestamp): string
    {
        $signData = [
            $path,
            urldecode($query),
            $timestamp
        ];

        return hash_hmac('SHA256', implode("\n", $signData), $this->secretKey);
    }

    /**
     * 发送请求
     */
    public function request(string $method, string $path, array $params = [], $data = null): array
    {
        $timestamp = time();
        $query = http_build_query($params);
        $url = $this->baseURL . $path;
        
        if ($query) {
            $url .= '?' . $query;
        }

        $signature = $this->generateSignature($path, $query, $timestamp);

        $headers = [
            'AccessKey: ' . $this->accessKey,
            'Content-Date: ' . $timestamp,
            'Content-MD5: ' . $signature,
            'Content-Type: application/json'
        ];

        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => strtoupper($method),
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_TIMEOUT => 30
        ]);

        if ($data && in_array(strtoupper($method), ['POST', 'PUT', 'PATCH'])) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($response === false) {
            throw new Exception('请求失败');
        }

        $result = json_decode($response, true);
        
        if ($httpCode >= 400) {
            throw new Exception($result['message'] ?? '请求失败');
        }

        return $result;
    }

    /**
     * GET 请求
     */
    public function get(string $path, array $params = []): array
    {
        return $this->request('GET', $path, $params);
    }

    /**
     * POST 请求
     */
    public function post(string $path, $data, array $params = []): array
    {
        return $this->request('POST', $path, $params, $data);
    }

    /**
     * PUT 请求
     */
    public function put(string $path, $data, array $params = []): array
    {
        return $this->request('PUT', $path, $params, $data);
    }

    /**
     * DELETE 请求
     */
    public function delete(string $path, array $params = []): array
    {
        return $this->request('DELETE', $path, $params);
    }
}

// 使用示例
$client = new ApiClient(
    'https://api.example.com',
    'your_access_key',
    'your_secret_key'
);

try {
    // 获取用户列表
    $users = $client->get('/api/users', ['page' => 1, 'limit' => 10]);
    
    // 创建用户
    $newUser = $client->post('/api/users', [
        'username' => 'john',
        'email' => 'john@example.com'
    ]);
    
    echo "用户创建成功，ID: " . $newUser['data']['id'];
    
} catch (Exception $e) {
    echo "请求失败: " . $e->getMessage();
}
```

## 🛡️ 服务端实现

### 中间件配置

基于 `Core\Api\ApiMiddleware` 的实际实现：

```php
<?php

use Core\Api\ApiMiddleware;

// 创建 API 签名中间件
$apiMiddleware = new ApiMiddleware(function (string $accessKey): ?string {
    // 从数据库或配置文件获取密钥
    $keys = [
        'mobile_app' => 'mobile_secret_key_123',
        'web_app' => 'web_secret_key_456',
        'third_party' => 'third_party_secret_789'
    ];

    return $keys[$accessKey] ?? null;
});

// 在路由中使用
$route->group('/api', function($route) {
    $route->get('/users', [UserController::class, 'index']);
    $route->post('/users', [UserController::class, 'store']);
})->middleware($apiMiddleware);
```

### 自定义时间容错

```php
<?php

use Core\Api\ApiMiddleware;

class CustomApiMiddleware extends ApiMiddleware
{
    // 自定义时间容错为 5 分钟
    protected int $time = 300;
}

// 使用自定义中间件
$customMiddleware = new CustomApiMiddleware(function (string $accessKey): ?string {
    return $this->getSecretKey($accessKey);
});
```

### 签名验证逻辑

```php
// 基于实际代码的签名验证过程
protected function signVerify(Request $request): bool
{
    $time = $request->getHeader('Content-Date')[0];
    $sign = $request->getHeader('Content-MD5')[0];
    $id = $request->getHeader('AccessKey')[0];

    if (empty($id) || empty($sign) || empty($time)) {
        throw new ExceptionBusiness('Parameter signature failed', 402);
    }

    $secretKey = call_user_func($this->callback, $id);
    if (!$secretKey) {
        throw new ExceptionBusiness('Signature authorization failed', 402);
    }

    // 生成签名数据
    $signData = [];
    $signData[] = $request->getUri()->getPath();
    $signData[] = urldecode($request->getUri()->getQuery());
    $signData[] = $time;

    $signStr = hash_hmac("SHA256", implode("\n", $signData), $secretKey);

    // 兼容性检查（支持编码和非编码的查询参数）
    $signDataCheck = [];
    $signDataCheck[] = $request->getUri()->getPath();
    $signDataCheck[] = $request->getUri()->getQuery();
    $signDataCheck[] = $time;
    $signStrCheck = hash_hmac("SHA256", implode("\n", $signDataCheck), $secretKey);

    return $signStr === $sign || $signStrCheck === $sign;
}
```

## ⚠️ 安全考虑

### 时间戳验证

```php
// 防重放攻击 - 时间戳验证
protected function allowTimestamp(Request $request): bool
{
    $queryTime = (int)$request->getHeader('Content-Date')[0];

    // 默认 60 秒容错时间
    if ($queryTime + $this->time < time()) {
        return false;
    }

    return true;
}
```

### 密钥管理

```php
// ✅ 安全的密钥管理
class SecretKeyManager
{
    /**
     * 从安全存储获取密钥
     */
    public static function getSecretKey(string $accessKey): ?string
    {
        // 从数据库获取
        $app = App::where('access_key', $accessKey)
            ->where('status', 1)
            ->first();

        return $app?->secret_key;
    }

    /**
     * 生成新的密钥对
     */
    public static function generateKeyPair(): array
    {
        return [
            'access_key' => 'app_' . uniqid(),
            'secret_key' => bin2hex(random_bytes(32))
        ];
    }

    /**
     * 轮换密钥
     */
    public static function rotateKey(string $accessKey): array
    {
        $app = App::where('access_key', $accessKey)->first();
        if (!$app) {
            throw new Exception('应用不存在');
        }

        $newSecretKey = bin2hex(random_bytes(32));
        $app->update(['secret_key' => $newSecretKey]);

        return [
            'access_key' => $accessKey,
            'secret_key' => $newSecretKey
        ];
    }
}
```

### 错误处理

```php
// API 签名验证的错误响应
try {
    // 签名验证逻辑
} catch (ExceptionBusiness $e) {
    // 统一错误响应格式
    return response()->json([
        'code' => $e->getCode(),
        'message' => $e->getMessage(),
        'data' => null
    ], $e->getCode());
}
```

**常见错误码：**
- `402` - 签名验证失败
- `402` - 签名参数缺失
- `402` - AccessKey 无效
- `408` - 请求超时（时间戳验证失败）

## 💡 最佳实践

### 1. 客户端实现

```javascript
// ✅ 使用请求拦截器自动添加签名
axios.interceptors.request.use(config => {
  const timestamp = Math.floor(Date.now() / 1000)
  const url = new URL(config.url, config.baseURL)
  const query = url.search ? url.search.substring(1) : ''

  const signature = generateSignature(url.pathname, query, timestamp, secretKey)

  config.headers.AccessKey = accessKey
  config.headers['Content-Date'] = timestamp
  config.headers['Content-MD5'] = signature

  return config
})
```

### 2. 服务端实现

```php
// ✅ 记录签名验证日志
protected function signVerify(Request $request): bool
{
    $accessKey = $request->getHeader('AccessKey')[0] ?? '';

    try {
        // 签名验证逻辑...

        app('log')->info('API签名验证成功', [
            'access_key' => $accessKey,
            'path' => $request->getUri()->getPath(),
            'ip' => $request->getServerParams()['REMOTE_ADDR'] ?? ''
        ]);

        return true;

    } catch (Exception $e) {
        app('log')->warning('API签名验证失败', [
            'access_key' => $accessKey,
            'error' => $e->getMessage(),
            'path' => $request->getUri()->getPath(),
            'ip' => $request->getServerParams()['REMOTE_ADDR'] ?? ''
        ]);

        throw $e;
    }
}
```

### 3. 密钥轮换

```php
// ✅ 定期轮换密钥
class KeyRotationService
{
    public static function rotateExpiredKeys(): void
    {
        $expiredApps = App::where('key_created_at', '<', now()->subDays(90))->get();

        foreach ($expiredApps as $app) {
            $newKey = bin2hex(random_bytes(32));
            $app->update([
                'secret_key' => $newKey,
                'key_created_at' => now()
            ]);

            // 通知应用管理员
            // ...
        }
    }
}
```

## 🎉 总结

DuxLite API 签名特点：

- **🔐 HMAC-SHA256**：使用安全的签名算法
- **⏰ 时间戳验证**：防止重放攻击
- **🔑 密钥管理**：支持多应用密钥管理
- **🛡️ 安全可靠**：完善的错误处理和日志记录
- **📱 多语言支持**：提供多种语言的客户端实现

通过 API 签名机制，可以确保 API 请求的安全性和完整性！
