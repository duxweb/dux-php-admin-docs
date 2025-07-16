# 第一个 API

学习 DuxLite 最基本的 API 开发：定义路由、验证数据、返回响应。

## 🎯 目标

创建一个简单的 API，接收用户信息，验证后直接返回。

## 📁 创建控制器

创建文件 `app/Demo/Api/Hello.php`：

```php
<?php

declare(strict_types=1);

namespace App\Demo\Api;

use Core\Validator\Validator;
use Core\Route\Attribute\Route;
use Core\Route\Attribute\RouteGroup;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Message\ResponseInterface;

#[RouteGroup(app: 'api', route: '/hello')]
class Hello
{
    /**
     * 简单的 GET 接口
     */
    #[Route(methods: 'GET', route: '')]
    public function index(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $data = [
            'message' => 'Hello DuxLite!',
            'time' => date('Y-m-d H:i:s')
        ];

        return send($response, '获取成功', $data);
    }

    /**
     * 接收数据并验证
     */
    #[Route(methods: 'POST', route: '')]
    public function create(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        // 验证数据
        $data = Validator::parser($request->getParsedBody(), [
            "name" => ["required", '姓名不能为空'],
            "email" => ["required", "email", '邮箱格式不正确'],
            "age" => ["required", "integer", "min", 18, '年龄必须大于18岁'],
        ]);

        // 直接返回验证后的数据
        $result = [
            'name' => $data->name,
            'email' => $data->email,
            'age' => $data->age,
            'created_at' => date('Y-m-d H:i:s')
        ];

        return send($response, '提交成功', $result);
    }
}
```
```

## 🚀 测试 API

### 1. GET 请求

**请求**：
```http
GET /api/hello
```

**响应**：
```json
{
    "code": 200,
    "message": "获取成功",
    "data": {
        "message": "Hello DuxLite!",
        "time": "2024-01-01 12:00:00"
    },
    "meta": []
}
```

### 2. POST 请求

**请求**：
```http
POST /api/hello
Content-Type: application/json

{
    "name": "张三",
    "email": "zhangsan@example.com",
    "age": 25
}
```

**响应**：
```json
{
    "code": 200,
    "message": "提交成功",
    "data": {
        "name": "张三",
        "email": "zhangsan@example.com",
        "age": 25,
        "created_at": "2024-01-01 12:00:00"
    },
    "meta": []
}
```

### 3. 验证失败示例

**请求**：
```http
POST /api/hello
Content-Type: application/json

{
    "name": "",
    "email": "invalid-email",
    "age": 16
}
```

**响应**：
```json
{
    "code": 422,
    "message": "姓名不能为空",
    "data": null,
    "meta": []
}
```

## 📋 关键知识点

### 1. RouteGroup 定义路由组
```php
#[RouteGroup(app: 'api', route: '/hello')]
```
- `app: 'api'` - 对应路由应用名称
- `route: '/hello'` - 路由前缀

### 2. Route 定义具体路由
```php
#[Route(methods: 'GET', route: '')]     // GET /api/hello
#[Route(methods: 'POST', route: '')]    // POST /api/hello
```

### 3. 数据验证
```php
$data = Validator::parser($request->getParsedBody(), [
    "name" => ["required", '姓名不能为空'],
    "email" => ["required", "email", '邮箱格式不正确'],
    "age" => ["required", "integer", "min", 18, '年龄必须大于18岁'],
]);
```

### 4. 返回响应
```php
return send($response, '提交成功', $result);
```
- 第一个参数：响应对象
- 第二个参数：消息
- 第三个参数：数据

## 🎉 完成

恭喜！你已经创建了第一个 DuxLite API：

✅ 定义了路由组和路由
✅ 接收并验证了请求数据
✅ 返回了标准化响应

这就是 DuxLite API 开发的基本流程！


