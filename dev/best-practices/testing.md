# 测试策略

完善的测试策略是确保 Dux PHP Admin 应用质量的关键。本指南介绍不同层次的测试方法和最佳实践。

## 测试层次

### 测试金字塔
```
    E2E Tests (端到端测试)
      ↑ 少量，慢速，昂贵
    Integration Tests (集成测试)  
      ↑ 中等数量，中等速度
    Unit Tests (单元测试)
      ↑ 大量，快速，便宜
```

## 单元测试

### 控制器测试
```php
<?php

namespace Tests\Unit\Controllers;

use App\System\Admin\User;
use App\System\Models\SystemUser;
use Core\Database\Eloquent\Builder;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\ServerRequestInterface;

class UserControllerTest extends TestCase
{
    private User $controller;
    private ServerRequestInterface $request;

    protected function setUp(): void
    {
        parent::setUp();
        $this->controller = new User();
        $this->request = $this->createMock(ServerRequestInterface::class);
    }

    public function testTransform()
    {
        $user = new SystemUser([
            'id' => 1,
            'username' => 'testuser',
            'nickname' => 'Test User',
            'status' => 1,
            'email' => 'test@example.com'
        ]);

        $result = $this->controller->transform($user);

        $this->assertIsArray($result);
        $this->assertEquals(1, $result['id']);
        $this->assertEquals('testuser', $result['username']);
        $this->assertEquals('Test User', $result['nickname']);
        $this->assertTrue($result['status']);
    }

    public function testValidator()
    {
        $data = [
            'username' => 'testuser',
            'nickname' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password123'
        ];

        $rules = $this->controller->validator($data, $this->request, []);

        $this->assertIsArray($rules);
        $this->assertArrayHasKey('username', $rules);
        $this->assertArrayHasKey('nickname', $rules);
        $this->assertArrayHasKey('email', $rules);
    }

    public function testQueryManyWithFilters()
    {
        $query = $this->createMock(Builder::class);
        $this->request->method('getQueryParams')->willReturn([
            'keyword' => 'test',
            'status' => '1',
            'dept_id' => '1'
        ]);

        $query->expects($this->once())
              ->method('where')
              ->with('nickname', 'like', '%test%');

        $this->controller->queryMany($query, $this->request, []);
    }
}
```

### 服务层测试
```php
<?php

namespace Tests\Unit\Services;

use App\System\Services\UserService;
use App\System\Models\SystemUser;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserServiceTest extends TestCase
{
    use RefreshDatabase;

    private UserService $userService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->userService = new UserService();
    }

    public function testCreateUser()
    {
        $userData = [
            'username' => 'testuser',
            'nickname' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password123',
            'status' => true
        ];

        $user = $this->userService->createUser($userData);

        $this->assertInstanceOf(SystemUser::class, $user);
        $this->assertEquals('testuser', $user->username);
        $this->assertEquals('Test User', $user->nickname);
        $this->assertEquals('test@example.com', $user->email);
        $this->assertTrue($user->status);
        $this->assertDatabaseHas('users', [
            'username' => 'testuser',
            'email' => 'test@example.com'
        ]);
    }

    public function testUpdateUser()
    {
        $user = SystemUser::factory()->create([
            'username' => 'olduser',
            'email' => 'old@example.com'
        ]);

        $updateData = [
            'username' => 'newuser',
            'email' => 'new@example.com'
        ];

        $updatedUser = $this->userService->updateUser($user->id, $updateData);

        $this->assertEquals('newuser', $updatedUser->username);
        $this->assertEquals('new@example.com', $updatedUser->email);
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'username' => 'newuser',
            'email' => 'new@example.com'
        ]);
    }

    public function testDeleteUser()
    {
        $user = SystemUser::factory()->create();

        $result = $this->userService->deleteUser($user->id);

        $this->assertTrue($result);
        $this->assertDatabaseMissing('users', ['id' => $user->id]);
    }

    public function testGetUserWithPermissions()
    {
        $user = SystemUser::factory()
            ->hasRole()
            ->hasPermissions(3)
            ->create();

        $userWithPermissions = $this->userService->getUserWithPermissions($user->id);

        $this->assertNotNull($userWithPermissions);
        $this->assertTrue($userWithPermissions->relationLoaded('role'));
        $this->assertTrue($userWithPermissions->relationLoaded('permissions'));
    }
}
```

### 模型测试
```php
<?php

namespace Tests\Unit\Models;

use App\System\Models\SystemUser;
use App\System\Models\SystemRole;
use App\System\Models\SystemDept;
use Tests\TestCase;

class SystemUserTest extends TestCase
{
    public function testUserBelongsToRole()
    {
        $role = SystemRole::factory()->create();
        $user = SystemUser::factory()->create(['role_id' => $role->id]);

        $this->assertInstanceOf(SystemRole::class, $user->role);
        $this->assertEquals($role->id, $user->role->id);
    }

    public function testUserBelongsToDepartment()
    {
        $dept = SystemDept::factory()->create();
        $user = SystemUser::factory()->create(['dept_id' => $dept->id]);

        $this->assertInstanceOf(SystemDept::class, $user->dept);
        $this->assertEquals($dept->id, $user->dept->id);
    }

    public function testUserHasPermissions()
    {
        $user = SystemUser::factory()->hasPermissions(3)->create();

        $this->assertCount(3, $user->permissions);
        $this->assertTrue($user->hasPermission('users.view'));
    }

    public function testUserScopeActive()
    {
        SystemUser::factory()->create(['status' => 0]);
        SystemUser::factory()->create(['status' => 1]);

        $activeUsers = SystemUser::active()->get();

        $this->assertCount(1, $activeUsers);
        $this->assertTrue($activeUsers->first()->status);
    }

    public function testPasswordHashing()
    {
        $user = SystemUser::factory()->create([
            'password' => 'plaintext'
        ]);

        $this->assertNotEquals('plaintext', $user->password);
        $this->assertTrue(password_verify('plaintext', $user->password));
    }
}
```

## 集成测试

### API 测试
```php
<?php

namespace Tests\Feature\Api;

use App\System\Models\SystemUser;
use App\System\Models\SystemRole;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserApiTest extends TestCase
{
    use RefreshDatabase;

    private SystemUser $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = SystemUser::factory()->create(['role_id' => 1]);
    }

    public function testGetUsers()
    {
        SystemUser::factory()->count(5)->create();

        $response = $this->actingAs($this->admin)
                        ->getJson('/api/admin/system/user');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'code',
                    'message',
                    'data' => [
                        'items' => [
                            '*' => [
                                'id',
                                'username',
                                'nickname',
                                'email',
                                'status',
                                'created_at'
                            ]
                        ],
                        'pagination' => [
                            'total',
                            'per_page',
                            'current_page',
                            'last_page'
                        ]
                    ]
                ]);
    }

    public function testCreateUser()
    {
        $userData = [
            'username' => 'newuser',
            'nickname' => 'New User',
            'email' => 'new@example.com',
            'password' => 'password123',
            'role_id' => 1,
            'status' => true
        ];

        $response = $this->actingAs($this->admin)
                        ->postJson('/api/admin/system/user', $userData);

        $response->assertStatus(201)
                ->assertJsonStructure([
                    'code',
                    'message',
                    'data' => [
                        'id',
                        'username',
                        'nickname',
                        'email',
                        'status'
                    ]
                ]);

        $this->assertDatabaseHas('users', [
            'username' => 'newuser',
            'email' => 'new@example.com'
        ]);
    }

    public function testUpdateUser()
    {
        $user = SystemUser::factory()->create();
        $updateData = [
            'username' => 'updateduser',
            'nickname' => 'Updated User',
            'email' => 'updated@example.com'
        ];

        $response = $this->actingAs($this->admin)
                        ->putJson("/api/admin/system/user/{$user->id}", $updateData);

        $response->assertStatus(200);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'username' => 'updateduser',
            'email' => 'updated@example.com'
        ]);
    }

    public function testDeleteUser()
    {
        $user = SystemUser::factory()->create();

        $response = $this->actingAs($this->admin)
                        ->deleteJson("/api/admin/system/user/{$user->id}");

        $response->assertStatus(204);

        $this->assertDatabaseMissing('users', ['id' => $user->id]);
    }

    public function testUnauthorizedAccess()
    {
        $response = $this->getJson('/api/admin/system/user');

        $response->assertStatus(401);
    }

    public function testValidationErrors()
    {
        $invalidData = [
            'username' => '',
            'email' => 'invalid-email',
            'password' => '123'
        ];

        $response = $this->actingAs($this->admin)
                        ->postJson('/api/admin/system/user', $invalidData);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['username', 'email', 'password']);
    }
}
```

### 数据库测试
```php
<?php

namespace Tests\Feature\Database;

use App\System\Models\SystemUser;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserDatabaseTest extends TestCase
{
    use RefreshDatabase;

    public function testUserCreation()
    {
        $userData = [
            'username' => 'testuser',
            'nickname' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password123',
            'status' => true
        ];

        $user = SystemUser::create($userData);

        $this->assertDatabaseHas('users', [
            'username' => 'testuser',
            'email' => 'test@example.com'
        ]);

        $this->assertNotNull($user->created_at);
        $this->assertNotNull($user->updated_at);
    }

    public function testUserDeletion()
    {
        $user = SystemUser::factory()->create();

        $user->delete();

        $this->assertDatabaseMissing('users', ['id' => $user->id]);
    }

    public function testUserQueries()
    {
        $activeUser = SystemUser::factory()->create(['status' => 1]);
        $inactiveUser = SystemUser::factory()->create(['status' => 0]);

        $activeUsers = SystemUser::where('status', 1)->get();
        $inactiveUsers = SystemUser::where('status', 0)->get();

        $this->assertCount(1, $activeUsers);
        $this->assertCount(1, $inactiveUsers);
        $this->assertEquals($activeUser->id, $activeUsers->first()->id);
        $this->assertEquals($inactiveUser->id, $inactiveUsers->first()->id);
    }
}
```

## 前端测试

### 组件测试
```javascript
// tests/components/UserForm.test.js
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import UserForm from '@/components/UserForm.vue'

describe('UserForm', () => {
  it('renders form fields correctly', () => {
    const wrapper = mount(UserForm)
    
    expect(wrapper.find('input[placeholder="用户名"]').exists()).toBe(true)
    expect(wrapper.find('input[placeholder="邮箱"]').exists()).toBe(true)
    expect(wrapper.find('input[type="password"]').exists()).toBe(true)
  })

  it('validates required fields', async () => {
    const wrapper = mount(UserForm)
    const form = wrapper.find('form')
    
    await form.trigger('submit')
    
    expect(wrapper.text()).toContain('用户名不能为空')
    expect(wrapper.text()).toContain('邮箱不能为空')
  })

  it('emits submit event with form data', async () => {
    const wrapper = mount(UserForm)
    
    await wrapper.find('input[placeholder="用户名"]').setValue('testuser')
    await wrapper.find('input[placeholder="邮箱"]').setValue('test@example.com')
    await wrapper.find('input[type="password"]').setValue('password123')
    
    await wrapper.find('form').trigger('submit')
    
    expect(wrapper.emitted('submit')).toBeTruthy()
    expect(wrapper.emitted('submit')[0][0]).toEqual({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    })
  })

  it('displays loading state', async () => {
    const wrapper = mount(UserForm, {
      props: { loading: true }
    })
    
    const submitButton = wrapper.find('button[type="submit"]')
    expect(submitButton.attributes('disabled')).toBeDefined()
    expect(submitButton.text()).toContain('提交中...')
  })
})
```

### 页面测试
```javascript
// tests/pages/Users.test.js
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import Users from '@/pages/Users.vue'

// Mock API
vi.mock('@/api/users', () => ({
  getUsers: vi.fn(() => Promise.resolve({
    data: {
      items: [
        { id: 1, username: 'user1', email: 'user1@example.com' },
        { id: 2, username: 'user2', email: 'user2@example.com' }
      ],
      pagination: { total: 2, per_page: 20, current_page: 1, last_page: 1 }
    }
  }))
}))

describe('Users Page', () => {
  const router = createRouter({
    history: createWebHistory(),
    routes: [{ path: '/users', component: Users }]
  })

  it('loads and displays users', async () => {
    const wrapper = mount(Users, {
      global: {
        plugins: [router]
      }
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('user1')
    expect(wrapper.text()).toContain('user2')
  })

  it('handles search functionality', async () => {
    const wrapper = mount(Users, {
      global: {
        plugins: [router]
      }
    })

    const searchInput = wrapper.find('input[placeholder="搜索用户"]')
    await searchInput.setValue('user1')
    await searchInput.trigger('keyup.enter')

    // 验证搜索参数被正确传递
    expect(wrapper.vm.searchParams.keyword).toBe('user1')
  })

  it('shows loading state', () => {
    const wrapper = mount(Users, {
      global: {
        plugins: [router]
      },
      data() {
        return {
          loading: true
        }
      }
    })

    expect(wrapper.find('.loading-spinner').exists()).toBe(true)
  })
})
```

## 端到端测试

### Cypress 测试
```javascript
// cypress/e2e/users.cy.js
describe('User Management', () => {
  beforeEach(() => {
    // 登录
    cy.login('admin', 'password')
    cy.visit('/users')
  })

  it('should display user list', () => {
    cy.get('[data-cy="user-table"]').should('exist')
    cy.get('[data-cy="user-row"]').should('have.length.greaterThan', 0)
  })

  it('should create new user', () => {
    cy.get('[data-cy="add-user-btn"]').click()
    
    cy.get('[data-cy="username-input"]').type('newuser')
    cy.get('[data-cy="email-input"]').type('new@example.com')
    cy.get('[data-cy="password-input"]').type('password123')
    
    cy.get('[data-cy="submit-btn"]').click()
    
    cy.get('[data-cy="success-message"]').should('contain', '用户创建成功')
    cy.get('[data-cy="user-table"]').should('contain', 'newuser')
  })

  it('should edit existing user', () => {
    cy.get('[data-cy="user-row"]').first().find('[data-cy="edit-btn"]').click()
    
    cy.get('[data-cy="username-input"]').clear().type('updateduser')
    cy.get('[data-cy="submit-btn"]').click()
    
    cy.get('[data-cy="success-message"]').should('contain', '用户更新成功')
    cy.get('[data-cy="user-table"]').should('contain', 'updateduser')
  })

  it('should delete user', () => {
    cy.get('[data-cy="user-row"]').first().find('[data-cy="delete-btn"]').click()
    cy.get('[data-cy="confirm-delete"]').click()
    
    cy.get('[data-cy="success-message"]').should('contain', '用户删除成功')
  })

  it('should search users', () => {
    cy.get('[data-cy="search-input"]').type('admin')
    cy.get('[data-cy="search-btn"]').click()
    
    cy.get('[data-cy="user-row"]').should('have.length', 1)
    cy.get('[data-cy="user-row"]').first().should('contain', 'admin')
  })
})
```

## 测试数据管理

### 工厂类
```php
<?php

namespace Database\Factories;

use App\System\Models\SystemUser;
use Illuminate\Database\Eloquent\Factories\Factory;

class SystemUserFactory extends Factory
{
    protected $model = SystemUser::class;

    public function definition(): array
    {
        return [
            'username' => $this->faker->unique()->userName,
            'nickname' => $this->faker->name,
            'email' => $this->faker->unique()->safeEmail,
            'password' => '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
            'status' => $this->faker->boolean(80), // 80% 概率为 true
            'role_id' => 1,
            'dept_id' => 1,
            'created_at' => $this->faker->dateTimeBetween('-1 year', 'now'),
            'updated_at' => now()
        ];
    }

    public function active(): self
    {
        return $this->state(fn (array $attributes) => [
            'status' => 1
        ]);
    }

    public function inactive(): self
    {
        return $this->state(fn (array $attributes) => [
            'status' => 0
        ]);
    }

    public function hasRole(): self
    {
        return $this->hasOne(SystemRole::factory(), 'id', 'role_id');
    }

    public function hasPermissions(int $count = 3): self
    {
        return $this->hasMany(SystemPermission::factory(), 'user_id', 'id')->count($count);
    }
}
```

### 测试数据播种
```php
<?php

namespace Database\Seeders;

use App\System\Models\SystemUser;
use App\System\Models\SystemRole;
use Illuminate\Database\Seeder;

class TestDataSeeder extends Seeder
{
    public function run(): void
    {
        // 创建角色
        $adminRole = SystemRole::create([
            'name' => 'Administrator',
            'permissions' => ['*']
        ]);

        $userRole = SystemRole::create([
            'name' => 'User',
            'permissions' => ['users.view', 'users.create']
        ]);

        // 创建测试用户
        SystemUser::factory()->create([
            'username' => 'admin',
            'email' => 'admin@example.com',
            'role_id' => $adminRole->id
        ]);

        SystemUser::factory()->count(10)->create([
            'role_id' => $userRole->id
        ]);
    }
}
```

## 测试配置

### PHPUnit 配置
```xml
<?xml version="1.0" encoding="UTF-8"?>
<phpunit xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="vendor/phpunit/phpunit/phpunit.xsd"
         bootstrap="vendor/autoload.php"
         colors="true">
    <testsuites>
        <testsuite name="Unit">
            <directory>tests/Unit</directory>
        </testsuite>
        <testsuite name="Feature">
            <directory>tests/Feature</directory>
        </testsuite>
    </testsuites>
    <php>
        <env name="APP_ENV" value="testing"/>
        <env name="BCRYPT_ROUNDS" value="4"/>
        <env name="CACHE_DRIVER" value="array"/>
        <env name="DB_CONNECTION" value="sqlite"/>
        <env name="DB_DATABASE" value=":memory:"/>
        <env name="MAIL_MAILER" value="array"/>
        <env name="QUEUE_CONNECTION" value="sync"/>
        <env name="SESSION_DRIVER" value="array"/>
    </php>
</phpunit>
```

### Vitest 配置
```javascript
// vitest.config.js
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.js']
  },
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname
    }
  }
})
```

## 持续集成

### GitHub Actions 配置
```yaml
# .github/workflows/tests.yml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ALLOW_EMPTY_PASSWORD: yes
          MYSQL_DATABASE: test_db
        ports:
          - 3306:3306
        options: --health-cmd="mysqladmin ping" --health-interval=10s --health-timeout=5s --health-retries=3
      
      redis:
        image: redis:6.2
        ports:
          - 6379:6379

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup PHP
      uses: shivammathur/setup-php@v2
      with:
        php-version: '8.2'
        extensions: pdo, pdo_mysql, redis
        coverage: xdebug

    - name: Install dependencies
      run: composer install --no-progress --prefer-dist --optimize-autoloader

    - name: Run tests
      run: |
        php vendor/bin/phpunit --coverage-clover coverage.xml
        
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage.xml
        fail_ci_if_error: true
```

通过实施这些测试策略，可以确保 Dux PHP Admin 应用的质量和稳定性，降低上线风险。