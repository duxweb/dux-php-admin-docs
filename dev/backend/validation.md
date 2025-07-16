# 数据验证

DuxLite 基于 [Valitron](https://github.com/vlucas/valitron) 提供了强大而简洁的数据验证系统，让你轻松处理表单验证和数据校验。

## 🚀 快速开始

### 基础验证

在 Resource 控制器中定义验证规则：

```php
public function validator(array $data, ServerRequestInterface $request, array $args): array
{
    return [
        "title" => ["required", '标题不能为空'],
        "email" => ["required", "email", '请输入有效的邮箱地址'],
        "age" => ["required", "integer", "min", 18, '年龄必须大于18岁'],
    ];
}
```

### 验证规则格式

每个字段的验证规则格式为：`[规则名, 参数1, 参数2, ..., 错误消息]`

```php
return [
    // 基础规则：[规则名, 错误消息]
    "name" => ["required", '姓名不能为空'],

    // 带参数规则：[规则名, 参数, 错误消息]
    "age" => ["min", 18, '年龄必须大于18岁'],

    // 多个规则：[[规则1, 消息1], [规则2, 参数, 消息2]]
    "password" => [
        ["required", '密码不能为空'],
        ["lengthMin", 6, '密码长度至少6位']
    ]
];
```

## 📋 内置验证规则

### 必填验证

```php
return [
    // 基础必填
    "name" => ["required", '姓名不能为空'],

    // 条件必填 - 当其他字段存在时必填
    "password" => ["requiredWith", "username", '用户名存在时密码必填'],

    // 条件必填 - 当其他字段不存在时必填
    "email" => ["requiredWithout", "phone", '手机号不存在时邮箱必填'],
];
```

### 类型验证

```php
return [
    "email" => ["email", '邮箱格式不正确'],
    "age" => ["integer", '年龄必须是整数'],
    "price" => ["numeric", '价格必须是数字'],
    "website" => ["url", '网址格式不正确'],
    "is_active" => ["boolean", '状态必须是布尔值'],
    "tags" => ["array", '标签必须是数组'],
];
```

### 长度验证

```php
return [
    "title" => ["length", 10, '标题必须是10个字符'],
    "content" => ["lengthBetween", 10, 500, '内容长度必须在10-500字符之间'],
    "summary" => ["lengthMin", 5, '摘要至少5个字符'],
    "description" => ["lengthMax", 200, '描述最多200个字符'],
];
```

### 数值验证

```php
return [
    "age" => ["min", 18, '年龄必须大于等于18'],
    "score" => ["max", 100, '分数不能超过100'],
    "price" => ["numeric", '价格必须是数字'],
    "quantity" => ["integer", '数量必须是整数'],
];
```

### 选项验证

```php
return [
    "status" => ["in", ["active", "inactive"], '状态值无效'],
    "role" => ["notIn", ["admin"], '不能选择管理员角色'],
    "colors" => ["listContains", "red", '颜色列表必须包含红色'],
];
```

### 字符串验证

```php
return [
    "name" => ["alpha", '姓名只能包含字母'],
    "username" => ["alphaNum", '用户名只能包含字母和数字'],
    "slug" => ["slug", 'URL别名格式不正确'],
    "content" => ["ascii", '内容只能包含ASCII字符'],
];
```

### 正则验证

```php
return [
    "phone" => ["regex", "/^1[3-9]\d{9}$/", '手机号格式不正确'],
    "username" => ["regex", "/^[a-zA-Z0-9_]{3,16}$/", '用户名格式不正确'],
];
```

### 日期验证

```php
return [
    "birthday" => ["date", '生日格式不正确'],
    "created_at" => ["dateFormat", "Y-m-d H:i:s", '创建时间格式不正确'],
    "start_date" => ["dateBefore", "2024-12-31", '开始日期必须在2024年之前'],
    "end_date" => ["dateAfter", "2024-01-01", '结束日期必须在2024年之后'],
];
```

### 其他验证

```php
return [
    "terms" => ["accepted", '必须同意服务条款'],
    "password" => ["equals", "password_confirm", '两次密码输入不一致'],
    "new_password" => ["different", "old_password", '新密码不能与旧密码相同'],
    "ip_address" => ["ip", 'IP地址格式不正确'],
    "email_dns" => ["emailDNS", '邮箱域名无效'],
    "website" => ["urlActive", '网站地址无法访问'],
];
```

## 🎯 DuxLite 特有规则

DuxLite 在 Valitron 基础上扩展了一些常用的验证规则：

```php
return [
    // 身份证号验证
    "idcard" => ["regex", "/^(\\d{18,18}|\\d{15,15}|\\d{17,17}x)$/i", '身份证号格式不正确'],

    // 手机号验证
    "phone" => ["regex", "/^1[3-9]\\d{9}$/", '手机号格式不正确'],

    // 枚举值验证
    "status" => [function($field, $value, $params, $fields) {
        return in_array($value, ['active', 'inactive']);
    }, '状态值无效'],
];
```

### 规则映射

DuxLite 会自动将一些常见规则映射到 Valitron 规则：

| DuxLite 规则 | Valitron 规则 | 说明 |
|-------------|---------------|------|
| `boolean` | `boolean` | 布尔值验证 |
| `date` | `date` | 日期验证 |
| `email` | `email` | 邮箱验证 |
| `enum` | 自定义函数 | 枚举值验证 |
| `idcard` | `regex` | 身份证号验证 |
| `length` | `length` | 长度验证 |
| `min` | `lengthMin` | 最小长度验证 |
| `max` | `lengthMax` | 最大长度验证 |
| `number` | `numeric` | 数字验证 |
| `pattern` | `regex` | 正则验证 |
| `required` | `required` | 必填验证 |
| `telnumber` | `regex` | 手机号验证 |
| `url` | `url` | URL验证 |

## 🔧 自定义验证规则

### 闭包验证

```php
public function validator(array $data, ServerRequestInterface $request, array $args): array
{
    return [
        "username" => [
            ["required", '用户名不能为空'],
            [function ($field, $value, $params, $fields) use ($args) {
                // 检查用户名唯一性
                $query = User::where('username', $value);
                if ($args['id']) {
                    $query->where('id', '<>', $args['id']);
                }
                return !$query->exists();
            }, '用户名已存在']
        ],

        "email" => [
            ["required", "email", '请输入有效的邮箱'],
            [function ($field, $value) {
                // 检查邮箱域名
                $domain = substr(strrchr($value, "@"), 1);
                $allowedDomains = ['gmail.com', 'qq.com', 'company.com'];
                return in_array($domain, $allowedDomains);
            }, '只允许使用指定邮箱域名']
        ],

        "password" => [
            ["required", '密码不能为空'],
            [function ($field, $value) {
                // 密码强度检查
                return preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/', $value);
            }, '密码必须包含大小写字母和数字，至少8位']
        ],
    ];
}
```

### 跨字段验证

```php
public function validator(array $data, ServerRequestInterface $request, array $args): array
{
    return [
        "password" => ["required", '密码不能为空'],
        "password_confirmation" => [
            ["required", '确认密码不能为空'],
            [function ($field, $value, $params, $fields) {
                return $value === $fields['password'];
            }, '两次密码输入不一致']
        ],

        "start_date" => ["required", "date", '开始日期不能为空'],
        "end_date" => [
            ["required", "date", '结束日期不能为空'],
            [function ($field, $value, $params, $fields) {
                return strtotime($value) > strtotime($fields['start_date']);
            }, '结束日期必须大于开始日期']
        ],
    ];
}
```

## 📊 条件验证

### 基于请求类型的验证

```php
public function validator(array $data, ServerRequestInterface $request, array $args): array
{
    $isEdit = !empty($args['id']);

    $rules = [
        "title" => ["required", '标题不能为空'],
        "content" => ["required", '内容不能为空'],
    ];

    // 创建时密码必填，编辑时可选
    if (!$isEdit) {
        $rules["password"] = [
            ["required", '密码不能为空'],
            ["lengthMin", 6, '密码至少6位']
        ];
    } else {
        $rules["password"] = ["lengthMin", 6, '密码至少6位'];
    }

    return $rules;
}
```

### 基于用户权限的验证

```php
public function validator(array $data, ServerRequestInterface $request, array $args): array
{
    // 获取当前用户认证信息
    $auth = $request->getAttribute('auth');
    $isAdmin = $auth['role'] === 'admin'; // 根据实际权限逻辑判断

    $rules = [
        "title" => ["required", '标题不能为空'],
        "content" => ["required", '内容不能为空'],
    ];

    // 只有管理员可以设置置顶
    if (!$isAdmin) {
        unset($data['is_top']);
    } else {
        $rules["is_top"] = ["boolean", '置顶状态格式错误'];
    }

    return $rules;
}
```

## 🎯 实际应用示例

### 用户管理验证（基于真实代码）

基于 `app/System/Admin/User.php` 的实际验证逻辑：

```php
public function validator(array $data, ServerRequestInterface $request, array $args): array
{
    return [
        "nickname" => ["required", '昵称不能为空'],
        "username" => [
            ["required", '用户名不能为空'],
            [function ($field, $value, $params, $fields) use ($args) {
                $model = SystemUser::query()->where('username', $fields['username']);
                if ($args['id']) {
                    $model->where("id", "<>", $args['id']);
                }
                return !$model->exists();
            }, '用户名已存在']
        ],
        "password" => ["requiredWithout", "id", '密码不能为空'],
        "role_id" => ["required", '角色不能为空'],
    ];
}
```

### 文章发布验证

```php
public function validator(array $data, ServerRequestInterface $request, array $args): array
{
    return [
        "title" => [
            ["required", '标题不能为空'],
            ["lengthMax", 100, '标题不能超过100个字符'],
            [function ($field, $value, $params, $fields) use ($args) {
                $query = Article::where('title', $value);
                if ($args['id']) {
                    $query->where('id', '<>', $args['id']);
                }
                return !$query->exists();
            }, '标题已存在']
        ],

        "slug" => [
            ["required", 'URL别名不能为空'],
            ["regex", "/^[a-z0-9-]+$/", 'URL别名只能包含小写字母、数字和连字符'],
            [function ($field, $value, $params, $fields) use ($args) {
                $query = Article::where('slug', $value);
                if ($args['id']) {
                    $query->where('id', '<>', $args['id']);
                }
                return !$query->exists();
            }, 'URL别名已存在']
        ],

        "content" => [
            ["required", '内容不能为空'],
            ["lengthMin", 10, '内容至少10个字符']
        ],

        "category_id" => [
            ["required", "integer", '请选择分类'],
            [function ($field, $value) {
                return Category::where('id', $value)->exists();
            }, '分类不存在']
        ],
    ];
}
```

## 🔍 验证错误处理

### 自动错误响应

验证失败时，DuxLite 会自动返回错误响应：

```json
{
  "code": 422,
  "message": "验证失败",
  "data": {
    "username": ["用户名不能为空", "用户名已存在"],
    "email": ["邮箱格式不正确"],
    "password": ["密码至少8位"]
  }
}
```

### 自定义错误处理

```php
public function validator(array $data, ServerRequestInterface $request, array $args): array
{
    return [
        "email" => [
            [function ($field, $value) {
                if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
                    // 抛出自定义异常
                    throw new \InvalidArgumentException('邮箱格式不正确，请检查输入');
                }
                return true;
            }, '邮箱验证失败']
        ]
    ];
}
```

## 💡 最佳实践

### 1. 验证规则分组

```php
public function validator(array $data, ServerRequestInterface $request, array $args): array
{
    // 基础验证规则
    $baseRules = [
        "title" => [
            ["required", '标题不能为空'],
            ["lengthMax", 100, '标题不超过100字符']
        ],
        "content" => ["required", '内容不能为空'],
    ];

    // 高级验证规则
    $advancedRules = [
        "slug" => [
            ["required", 'URL别名不能为空'],
            [function ($field, $value, $params, $fields) use ($args) {
                return $this->validateUniqueSlug($value, $args['id'] ?? null);
            }, 'URL别名已存在']
        ],
    ];

    return array_merge($baseRules, $advancedRules);
}

private function validateUniqueSlug(string $slug, ?int $excludeId = null): bool
{
    $query = Article::where('slug', $slug);
    if ($excludeId) {
        $query->where('id', '<>', $excludeId);
    }
    return !$query->exists();
}
```

### 2. 复用验证逻辑

```php
trait UserValidationTrait
{
    protected function getUsernameRules(?int $excludeId = null): array
    {
        return [
            ["required", '用户名不能为空'],
            ["lengthBetween", 3, 20, '用户名长度为3-20个字符'],
            [function ($field, $value) use ($excludeId) {
                $query = User::where('username', $value);
                if ($excludeId) {
                    $query->where('id', '<>', $excludeId);
                }
                return !$query->exists();
            }, '用户名已存在']
        ];
    }
}

class User extends Resources
{
    use UserValidationTrait;

    public function validator(array $data, ServerRequestInterface $request, array $args): array
    {
        return [
            "username" => $this->getUsernameRules($args['id'] ?? null),
            // 其他规则...
        ];
    }
}
```

## 🎉 总结

DuxLite 的验证系统特点：

- **📝 声明式验证**：简洁的数组语法定义验证规则
- **🔧 灵活扩展**：支持自定义验证函数和复杂逻辑
- **🎯 条件验证**：基于上下文的动态验证规则
- **✅ 自动处理**：验证失败自动返回标准错误响应
- **🚀 高性能**：内置缓存和优化机制

通过合理使用这些验证功能，你可以构建出安全、可靠的数据处理逻辑！