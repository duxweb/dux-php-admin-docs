# 第一个模块

通过创建您的第一个模块，您将学会 Dux PHP Admin 的基本开发流程。本教程将指导您创建一个简单的文章管理模块。

## 准备工作

在开始之前，请确保您已经：

1. 完成了 [环境搭建](./environment.md)
2. 完成了 [项目安装](./installation.md)
3. 了解了 [目录结构](./directory-structure.md)

## 创建模块

按照以下结构创建模块：

```bash
# 创建模块目录
mkdir -p app/Article/{Admin,Models}

# 创建必要的文件
touch app/Article/app.json
touch app/Article/Admin/Article.php
touch app/Article/Admin/table.vue
touch app/Article/Admin/form.vue
touch app/Article/Models/Article.php
```

## 创建数据模型

首先，我们创建文章模型。编辑 `app/Article/Models/Article.php`：

```php
<?php

namespace App\Article\Models;

use Core\Database\Model;
use Core\Database\Attribute\AutoMigrate;

#[AutoMigrate]
class Article extends Model
{
    protected $table = 'articles';
    
    protected $fillable = [
        'title',
        'content',
        'status'
    ];
    
    /**
     * 定义数据库结构
     */
    public function migration(): array
    {
        return [
            'id' => ['type' => 'id'],
            'title' => ['type' => 'string', 'length' => 255, 'comment' => '文章标题'],
            'content' => ['type' => 'text', 'comment' => '文章内容'],
            'status' => ['type' => 'boolean', 'default' => true, 'comment' => '发布状态'],
            'created_at' => ['type' => 'timestamp', 'nullable' => true],
            'updated_at' => ['type' => 'timestamp', 'nullable' => true]
        ];
    }
    
    public function transform(): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'content' => $this->content,
            'status' => $this->status,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at
        ];
    }
}
```

## 创建后台控制器

编辑 `app/Article/Admin/Article.php`：

```php
<?php

namespace App\Article\Admin;

use App\Article\Models\Article as ModelsArticle;
use Core\Resources\Action\Resources;
use Core\Resources\Attribute\Resource;
use Illuminate\Database\Eloquent\Builder;

#[Resource(app: 'admin', route: '/article', name: 'article')]
class Article extends Resources
{
    protected string $model = ModelsArticle::class;
    
    public function query(Builder $query): void
    {
        $query->orderBy('created_at', 'desc');
    }
    
    public function transform(object $item): array
    {
        return $item->transform();
    }
}
```

## 创建前端页面

### 创建表格页面

创建 `app/Article/Admin/table.vue`：

```vue
<script setup lang="ts">
import { DuxTablePage, useAction, useTableColumn } from '@duxweb/dvha-pro'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const action = useAction()
const column = useTableColumn()

const columns = computed(() => {
  return [
    {
      title: 'ID',
      key: 'id',
      width: 80,
      sorter: true,
    },
    {
      title: '标题',
      key: 'title',
      minWidth: 200,
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: column.renderStatus({
        key: 'status',
        maps: {
          true: { label: '已发布', value: 'success' },
          false: { label: '草稿', value: 'warning' }
        }
      })
    },
    {
      title: '创建时间',
      key: 'created_at',
      width: 180,
      sorter: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: action.renderTable({
        align: 'center',
        type: 'button',
        text: true,
        items: [
          {
            label: '编辑',
            type: 'modal',
            component: () => import('./form.vue'),
          },
          {
            label: '删除',
            type: 'delete',
            path: 'admin/article',
          }
        ]
      })
    }
  ]
})

const actions = computed(() => {
  return [
    {
      label: '添加',
      color: 'primary',
      icon: 'i-tabler:plus',
      type: 'modal',
      component: () => import('./form.vue'),
    }
  ]
})

const filter = ref({})
</script>

<template>
  <DuxTablePage
    path="admin/article"
    :filter="filter"
    :columns="columns"
    :actions="actions"
  />
</template>
```

### 创建表单页面

创建 `app/Article/Admin/form.vue`：

```vue
<script setup lang="ts">
import { DuxFormPage } from '@duxweb/dvha-pro'
import { computed } from 'vue'

const schema = computed(() => {
  return [
    {
      label: '标题',
      tag: 'n-input',
      attrs: {
        'v-model:value': ['formData', 'title'],
        placeholder: '请输入文章标题'
      },
      rules: [
        { required: true, message: '请输入文章标题' }
      ]
    },
    {
      label: '内容',
      tag: 'n-input',
      attrs: {
        'v-model:value': ['formData', 'content'],
        type: 'textarea',
        rows: 8,
        placeholder: '请输入文章内容'
      },
      rules: [
        { required: true, message: '请输入文章内容' }
      ]
    },
    {
      label: '状态',
      tag: 'n-switch',
      attrs: {
        'v-model:value': ['formData', 'status']
      },
      children: [
        {
          tag: 'template',
          attrs: {
            '#checked': true
          },
          children: '已发布'
        },
        {
          tag: 'template',
          attrs: {
            '#unchecked': true
          },
          children: '草稿'
        }
      ]
    }
  ]
})
</script>

<template>
  <DuxFormPage
    path="admin/article"
    :schema="schema"
  />
</template>
```

## 配置模块

创建 `app/Article/app.json`：

```json
{
  "name": "文章管理",
  "description": "文章管理模块",
  "version": "1.0.0",
  "namespace": "App\\Article",
  "registers": ["App\\Article\\App"],
  "adminMenu": [
    {
      "type": "menu",
      "label": "文章管理",
      "name": "article.list",
      "path": "article",
      "icon": "i-tabler:article",
      "loader": "Article/table",
      "hidden": false,
      "sort": 200
    }
  ]
}
```

## 同步菜单

创建完模块后，需要同步菜单到数据库：

```bash
# 同步所有模块的菜单
php dux menu:sync

# 同步指定模块的菜单  
php dux menu:sync Article
```

菜单同步后，系统会：
1. 从 `app.json` 中读取 `adminMenu` 配置
2. 将菜单数据写入 `system_menu` 表
3. 前端会自动加载菜单并渲染对应的组件

## 运行数据库迁移

```bash
# 查看自动迁移模型列表
php dux db:list

# 同步模型数据表和字段
php dux db:sync

# 同步指定应用的数据表
php dux db:sync Article
```

## 启动服务

```bash
# 启动 FrankenPHP Worker 模式
php dux worker:start

# 指定端口启动
php dux worker:start --port=8080

# 使用 PHP 内置服务器（开发环境）
composer serve
```

## 测试模块

1. **启动开发服务器**
   ```bash
   php dux worker:start
   ```

2. **访问管理后台**
   - 打开浏览器访问 http://localhost:8080
   - 使用管理员账号登录

3. **测试功能**
   - 创建新文章
   - 编辑文章
   - 删除文章
   - 搜索文章

## 下一步

完成第一个模块后，您可以继续学习：

- [核心概念](../core/architecture.md) - 了解框架架构
- [数据库操作](../database/migration.md) - 数据库迁移和查询
- [前端开发](../frontend/components.md) - 前端组件开发
- [API 开发](../api/rest.md) - 创建 API 接口