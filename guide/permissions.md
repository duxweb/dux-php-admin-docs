# 权限系统

Dux PHP Admin 采用基于角色的访问控制（RBAC）模型，提供细粒度的权限管理功能。

## 权限模型概述

### RBAC 模型结构

```
用户 (User) ←→ 角色 (Role) ←→ 权限 (Permission)
     ↓              ↓              ↓
用户组织关系    角色层级关系    权限资源关系
```

### 核心概念

**权限 (Permission)**
- 最小的权限单元
- 采用点分割命名：`模块.资源.操作`
- 例如：`user.list`、`article.create`、`system.config.edit`

**角色 (Role)**  
- 权限的集合
- 可以继承父角色权限
- 支持角色层级结构

**用户 (User)**
- 可以分配多个角色
- 可以直接分配权限（覆盖角色权限）
- 支持数据权限控制

## 权限配置

### 权限定义

权限采用模块化定义，在每个模块的 `app.json` 中声明：

```json
{
    "name": "Blog",
    "permissions": [
        {
            "name": "blog.article.list",
            "title": "文章列表",
            "description": "查看文章列表",
            "group": "文章管理"
        },
        {
            "name": "blog.article.create", 
            "title": "创建文章",
            "description": "创建新文章",
            "group": "文章管理"
        },
        {
            "name": "blog.article.edit",
            "title": "编辑文章", 
            "description": "编辑现有文章",
            "group": "文章管理"
        },
        {
            "name": "blog.article.delete",
            "title": "删除文章",
            "description": "删除文章", 
            "group": "文章管理"
        },
        {
            "name": "blog.category.*",
            "title": "分类管理",
            "description": "分类所有权限",
            "group": "分类管理"
        }
    ]
}
```

### 权限分组

权限支持分组管理，便于在界面中组织显示：

```php
// 获取权限分组
$groups = SystemPermission::getGroups();

// 按分组获取权限
$permissions = SystemPermission::getByGroup('文章管理');
```

### 动态权限

支持动态权限注册，适用于插件或动态模块：

```php
// 注册动态权限
PermissionManager::register([
    'name' => 'plugin.custom.action',
    'title' => '自定义操作',
    'group' => '插件权限'
]);
```

## 角色管理

### 角色创建

**管理后台创建**：
```
系统管理 → 角色管理 → 添加角色
```

**代码创建**：
```php
use App\System\Models\SystemRole;

$role = SystemRole::create([
    'name' => 'editor',
    'title' => '编辑',
    'description' => '内容编辑人员',
    'status' => 1,
    'parent_id' => null // 父角色ID
]);

// 分配权限
$role->permissions()->attach([
    'blog.article.list',
    'blog.article.create', 
    'blog.article.edit'
]);
```

### 角色层级

支持角色继承，子角色自动继承父角色权限：

```php
// 创建父角色
$parentRole = SystemRole::create([
    'name' => 'content_manager',
    'title' => '内容管理',
    'parent_id' => null
]);

// 创建子角色
$childRole = SystemRole::create([
    'name' => 'article_editor', 
    'title' => '文章编辑',
    'parent_id' => $parentRole->id
]);

// 子角色自动继承父角色权限
$hasPermission = $childRole->hasPermission('content.manage');
```

### 角色权限管理

```php
// 获取角色所有权限（包括继承）
$permissions = $role->getAllPermissions();

// 获取角色直接权限
$directPermissions = $role->permissions;

// 检查权限
if ($role->hasPermission('user.create')) {
    // 有权限
}

// 批量分配权限
$role->syncPermissions([
    'user.list',
    'user.create',
    'user.edit'
]);
```

## 用户权限

### 用户角色分配

```php
use App\System\Models\SystemUser;

$user = SystemUser::find(1);

// 分配角色
$user->roles()->attach([1, 2, 3]);

// 移除角色
$user->roles()->detach([2]);

// 同步角色（替换现有）
$user->roles()->sync([1, 3]);
```

### 直接权限分配

用户可以直接分配权限，优先级高于角色权限：

```php
// 分配直接权限
$user->permissions()->attach([
    'system.config.edit' => ['type' => 'allow'],
    'user.delete' => ['type' => 'deny']
]);

// 检查最终权限
$hasPermission = $user->hasPermission('system.config.edit'); // true
$canDelete = $user->hasPermission('user.delete'); // false
```

### 权限检查

```php
// 检查单个权限
if ($user->hasPermission('user.create')) {
    // 执行操作
}

// 检查多个权限（AND）
if ($user->hasAllPermissions(['user.list', 'user.edit'])) {
    // 执行操作
}

// 检查多个权限（OR）
if ($user->hasAnyPermission(['user.edit', 'user.delete'])) {
    // 执行操作  
}

// 通配符权限检查
if ($user->hasPermission('blog.*')) {
    // 拥有博客所有权限
}
```

## 数据权限

### 数据权限类型

**全部数据权限**
- 可以访问所有数据
- 通常分配给超级管理员

**部门数据权限**
- 只能访问本部门及下级部门数据
- 根据用户所属部门过滤

**个人数据权限**
- 只能访问自己创建的数据
- 根据 `created_by` 字段过滤

**自定义数据权限**
- 根据自定义规则过滤数据
- 支持复杂的查询条件

### 数据权限配置

```php
// 用户数据权限配置
$user->dataPermissions()->create([
    'resource' => 'user', // 资源类型
    'type' => 'department', // 权限类型
    'departments' => [1, 2, 3], // 允许的部门
    'custom_rules' => [
        'status' => 1,
        'level' => ['<=', 5]
    ]
]);
```

### 数据权限应用

```php
// 在查询中应用数据权限
$query = SystemUser::query();

// 应用数据权限过滤
$query = DataPermissionService::applyFilter($query, $currentUser, 'user');

// 获取结果
$users = $query->get();
```

## 权限中间件

### 基础权限中间件

```php
// 检查是否有指定权限
Route::middleware('permission:user.create')->group(function () {
    Route::post('/users', [UserController::class, 'store']);
});

// 检查多个权限
Route::middleware('permission:user.list,user.edit')->group(function () {
    Route::get('/users', [UserController::class, 'index']);
});
```

### 动态权限中间件

```php
// 根据路由动态检查权限
Route::middleware('dynamic.permission')->group(function () {
    Route::apiResource('users', UserController::class);
    // 自动映射：GET /users → user.list
    // 自动映射：POST /users → user.create  
    // 自动映射：PUT /users/{id} → user.edit
    // 自动映射：DELETE /users/{id} → user.delete
});
```

### 权限注解

支持在控制器方法上使用注解定义权限：

```php
class UserController
{
    /**
     * @Permission("user.list")
     */
    public function index()
    {
        // 用户列表
    }

    /**
     * @Permission("user.create")
     */
    public function store()
    {
        // 创建用户
    }

    /**
     * @Permission("user.edit,user.self")
     * @DataPermission("self")  
     */
    public function update($id)
    {
        // 编辑用户
    }
}
```

## 前端权限控制

### Vue 权限指令

```vue
<template>
  <!-- 权限显示/隐藏 -->
  <button v-permission="'user.create'">创建用户</button>
  
  <!-- 多权限检查 -->
  <button v-permission:all="['user.edit', 'user.status']">编辑</button>
  
  <!-- 任一权限 -->
  <button v-permission:any="['user.edit', 'user.delete']">操作</button>
  
  <!-- 角色检查 -->
  <div v-role="'admin'">管理员内容</div>
</template>
```

### 权限组合式函数

```typescript
// composables/usePermission.ts
import { computed } from 'vue'
import { useUserStore } from '@/stores/user'

export function usePermission() {
  const userStore = useUserStore()
  
  const hasPermission = (permission: string) => {
    return userStore.permissions.includes(permission) || 
           userStore.permissions.includes('*')
  }
  
  const hasAllPermissions = (permissions: string[]) => {
    return permissions.every(p => hasPermission(p))
  }
  
  const hasAnyPermission = (permissions: string[]) => {
    return permissions.some(p => hasPermission(p))
  }
  
  return {
    hasPermission,
    hasAllPermissions, 
    hasAnyPermission
  }
}
```

### 路由权限控制

```typescript
// router/index.ts
router.beforeEach((to, from, next) => {
  const permission = to.meta.permission
  
  if (permission && !hasPermission(permission)) {
    next({ name: 'Forbidden' })
  } else {
    next()
  }
})

// 路由配置
const routes = [
  {
    path: '/users',
    component: UserList,
    meta: { 
      permission: 'user.list',
      title: '用户管理'
    }
  },
  {
    path: '/users/create',
    component: UserForm,
    meta: { 
      permission: 'user.create',
      title: '创建用户'
    }
  }
]
```

## 权限缓存

### 权限缓存策略

```php
// 缓存用户权限
Cache::put("user_permissions_{$userId}", $permissions, 3600);

// 缓存角色权限
Cache::put("role_permissions_{$roleId}", $permissions, 7200);

// 清理权限缓存
Cache::forget("user_permissions_{$userId}");
Cache::tags(['permissions'])->flush();
```

### 权限更新策略

```php
// 权限变更时自动清理缓存
class PermissionObserver
{
    public function updated($permission)
    {
        // 清理相关缓存
        Cache::tags(['permissions'])->flush();
        
        // 通知前端更新权限
        broadcast(new PermissionUpdated($permission));
    }
}
```

## API 权限验证

### API 权限中间件

```php
// API 路由权限验证
Route::middleware(['auth:api', 'permission:api'])->group(function () {
    Route::apiResource('users', UserApiController::class);
});
```

### API 权限响应

```json
// 权限不足响应
{
    "code": 403,
    "message": "权限不足",
    "error_code": 30001,
    "data": {
        "required_permission": "user.create",
        "user_permissions": ["user.list", "user.edit"]
    }
}
```

## 权限审计

### 权限变更日志

```php
// 记录权限变更
SystemLog::create([
    'type' => 'permission',
    'action' => 'role_permission_updated',
    'user_id' => auth()->id(),
    'data' => [
        'role_id' => $roleId,
        'old_permissions' => $oldPermissions,
        'new_permissions' => $newPermissions
    ]
]);
```

### 权限使用统计

```php
// 统计权限使用情况
PermissionUsage::create([
    'user_id' => auth()->id(),
    'permission' => $permission,
    'resource' => $resource,
    'action' => $action,
    'ip_address' => request()->ip(),
    'user_agent' => request()->userAgent()
]);
```

## 最佳实践

### 权限设计原则

1. **最小权限原则** - 只授予必要的权限
2. **职责分离** - 不同角色承担不同职责
3. **权限分组** - 相关权限组织在一起
4. **继承设计** - 合理使用角色继承

### 权限命名规范

```
// 推荐格式：模块.资源.操作
user.list          // 用户列表
user.create        // 创建用户
user.edit          // 编辑用户
user.delete        // 删除用户
user.export        // 导出用户

// 通配符权限
user.*             // 用户所有权限
*.list             // 所有列表权限
*                  // 超级权限
```

### 性能优化

1. **权限缓存** - 缓存用户权限信息
2. **批量检查** - 一次检查多个权限
3. **索引优化** - 为权限查询添加索引
4. **延迟加载** - 权限信息按需加载

### 安全建议

1. **定期审计** - 定期检查权限分配
2. **权限回收** - 及时回收离职人员权限
3. **最小化原则** - 避免过度授权
4. **监控异常** - 监控权限异常使用