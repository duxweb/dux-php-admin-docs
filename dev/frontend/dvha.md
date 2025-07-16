# DVHA 框架

DVHA (Dux Vue Headless Admin) 是为 Dux PHP Admin 量身定制的前端框架，基于 Vue 3 和 Naive UI 构建，专注于快速开发现代化的管理后台界面。

## DVHA 概述

### 什么是 DVHA

DVHA 是一个运行时编译的前端框架，具有以下特点：

- **运行时编译** - Vue 组件直接在浏览器中编译，无需构建步骤
- **组件化设计** - 丰富的开箱即用组件  
- **API 驱动** - 通过 API 路径自动绑定数据
- **前后端一体化** - Vue 组件与 PHP 控制器同目录存放
- **TypeScript 支持** - 完整的类型定义

### 核心技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Vue.js | 3.x | 前端框架 |
| DVHA Core | 1.x | 核心框架 |
| DVHA Pro | 1.x | 专业组件 |
| DVHA Naive UI | 1.x | UI 组件库 |
| Naive UI | 1.x | 基础 UI 组件 |

## 组件目录结构

### 前后端一体化结构

在 DuxLite 中，Vue 组件与 PHP 控制器放在同一目录下：

```
app/System/Admin/
├── User.php                 # Resource 控制器
├── User/                    # 与控制器同名的组件目录
│   ├── form.vue            # 表单组件
│   ├── table.vue           # 表格组件
│   └── detail.vue          # 详情组件
├── Role.php                 # 角色控制器
└── Role/                    # 角色组件目录
    ├── form.vue
    └── table.vue
```

### 组件自动发现

DuxLite 支持运行时编译，Vue 组件会被自动发现和加载：

- 当访问 `/admin#/system/user` 时，自动加载 `System/User/table.vue`
- 在 `app.json` 中通过 `loader` 字段指定组件路径

```json
{
  "adminMenu": [
    {
      "type": "menu",
      "label": "用户管理",
      "path": "system/user",
      "loader": "System/User/table"
    }
  ]
}
```

## 核心组件

### 1. DuxModalForm - 模态表单组件

基于实际的 User/form.vue，展示 DVHA 的核心特性：

```vue
<script setup>
import { DuxCascader, DuxSelect } from '@duxweb/dvha-naiveui'
import { DuxFormItem, DuxModalForm } from '@duxweb/dvha-pro'
import { NInput, NSwitch } from 'naive-ui'
import { ref } from 'vue'

const props = defineProps({
  id: {
    type: [String, Number],
    required: false,
  },
})

const model = ref({
  status: true,
})
</script>

<template>
  <DuxModalForm :id="props.id" path="system/user" :data="model">
      <DuxFormItem label="用户名">
        <NInput v-model:value="model.username" />
      </DuxFormItem>
      
      <DuxFormItem label="所属角色">
        <DuxSelect 
          v-model:value="model.role_id" 
          path="system/role" 
          label-field="name" 
          value-field="id" 
        />
      </DuxFormItem>
      
      <DuxFormItem label="所属部门">
        <DuxCascader 
          v-model:value="model.dept_id" 
          :cascade="false" 
          path="system/dept" 
          label-field="name" 
          value-field="id" 
        />
      </DuxFormItem>
      
      <DuxFormItem label="状态">
        <NSwitch v-model:value="model.status" />
      </DuxFormItem>
  </DuxModalForm>
</template>
```

**核心特性说明：**

1. **DuxModalForm** - 自动处理表单的增删改查操作
   - `path="system/user"` - 对应后端 Resource 路由
   - `id` - 编辑时的记录 ID
   - `data` - 表单数据模型

2. **DuxSelect** - API 驱动的选择器
   - `path="system/role"` - 自动调用 `/system/role` API
   - `label-field="name"` - 显示字段
   - `value-field="id"` - 值字段

3. **DuxCascader** - 级联选择器
   - 支持树形数据结构
   - `cascade="false"` - 非严格级联模式

### 2. 组件包结构

DVHA 分为多个包，各有不同职责：

#### @duxweb/dvha-core
- 核心功能和基础组件
- 路由管理和状态管理
- API 客户端和工具函数

#### @duxweb/dvha-pro  
- 专业表单和表格组件
- DuxModalForm、DuxFormItem 等
- 高级交互组件

#### @duxweb/dvha-naiveui
- 基于 Naive UI 的扩展组件
- DuxSelect、DuxCascader 等
- 与后端 API 自动绑定

## 运行时编译

### 1. 开发模式

在开发环境中，DuxLite 支持运行时编译 Vue 组件：

```bash
# 修改 Vue 文件后直接刷新页面即可看到效果
# 无需运行 npm run dev 或构建命令
```

### 2. 生产环境

生产环境需要预编译前端资源：

```bash
# 安装依赖
npm install

# 构建前端资源  
npm run build

# 构建后的文件输出到 public/static/web/
```

### 3. Vite 配置

如果需要自定义前端构建，可以配置 `vite.config.ts`：

```javascript
// vite.config.ts (可选)
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: 'public/static/web',
    assetsDir: 'assets'
  }
})
```

## 常用组件

### 表单组件

```vue
<!-- 基础表单项 -->
<DuxFormItem label="标题" required>
  <NInput v-model:value="model.title" placeholder="请输入标题" />
</DuxFormItem>

<!-- 选择器 - API 驱动 -->
<DuxFormItem label="分类">
  <DuxSelect 
    v-model:value="model.category_id"
    path="category/list"
    label-field="name"
    value-field="id"
    placeholder="请选择分类"
  />
</DuxFormItem>

<!-- 开关组件 -->
<DuxFormItem label="状态">
  <NSwitch v-model:value="model.status" />
</DuxFormItem>
```

### 表格组件

```vue
<!-- 基础表格 -->
<DuxTable 
  :data="tableData"
  :columns="columns"
  @edit="handleEdit"
  @delete="handleDelete"
/>
```

### 上传组件

```vue
<!-- 文件上传 -->
<DuxFormItem label="头像">
  <DuxUpload 
    v-model:value="model.avatar"
    type="image"
    action="/api/upload"
  />
</DuxFormItem>
```

## 数据绑定

### API 路径绑定

DVHA 的核心特性是通过 `path` 属性自动绑定后端 API：

```vue
<!-- 自动调用 GET /system/role API -->
<DuxSelect path="system/role" />

<!-- 自动调用 GET /category/list API -->  
<DuxSelect path="category/list" />
```

### 字段映射

通过 `label-field` 和 `value-field` 指定数据字段：

```vue
<DuxSelect 
  path="system/user"
  label-field="nickname"  <!-- 显示昵称 -->
  value-field="id"        <!-- 值为 ID -->
/>
```

## 事件处理

### 表单事件

```vue
<script setup>
const handleSubmit = (data) => {
  console.log('表单数据:', data)
}

const handleSuccess = (response) => {
  console.log('提交成功:', response)
}
</script>

<template>
  <DuxModalForm 
    @submit="handleSubmit"
    @success="handleSuccess"
  />
</template>
```

### 表格事件

```vue
<script setup>
const handleEdit = (row) => {
  console.log('编辑:', row)
}

const handleDelete = (row) => {
  console.log('删除:', row)
}
</script>

<template>
  <DuxTable 
    @edit="handleEdit"
    @delete="handleDelete"
  />
</template>
```

## 最佳实践

### 1. 组件命名

- 组件文件使用小写，如 `form.vue`、`table.vue`
- 与控制器同名的目录存放相关组件
- 一个功能模块一个组件目录

### 2. 数据结构

```vue
<script setup>
// 使用 ref 包装表单数据
const model = ref({
  title: '',
  status: true,
  category_id: null
})

// 设置默认值
const model = ref({
  status: true,  // 布尔值默认值
  sort: 0        // 数值默认值
})
</script>
```

### 3. API 路径规范

- 使用 Resource 控制器的路由路径
- 与后端路由保持一致
- 避免硬编码完整 URL

```vue
<!-- 好的做法 -->
<DuxSelect path="system/user" />

<!-- 避免的做法 -->
<DuxSelect :api="'/api/system/user'" />
```

## 总结

DVHA 框架的核心优势：

1. **运行时编译** - 开发时无需构建步骤，修改即生效
2. **API 驱动** - 通过 path 属性自动绑定后端接口
3. **前后端一体化** - 组件与控制器同目录，便于维护
4. **简化开发** - 减少样板代码，专注业务逻辑
5. **类型安全** - TypeScript 支持，提供完整类型提示

DVHA 框架为开发者提供了高效的管理后台开发体验，通过标准化的组件和约定，大大提升了开发效率。