# 前端开发说明

DuxLite 采用独特的**前端基座 + 运行时编译**模式，让你无需复杂的前端构建流程就能开发管理界面。

## 🚀 DuxLite 前端开发方式

### 核心特点

- **📦 前端基座**：`web/` 目录提供运行时基座，无需每次构建
- **⚡ 运行时编译**：Vue 文件直接在浏览器中运行，修改即生效
- **🎯 开箱即用**：基于 DVHA 框架，提供丰富的管理组件
- **💡 智能提示**：完整的 TypeScript 和 ESLint 支持

### 开发流程一览

```bash
# 1. 安装依赖（项目根目录，只需一次）
pnpm install

# 2. 开始开发（无需启动 dev 服务器）
# 直接编辑 app/模块/Admin/页面.vue 文件
# 刷新浏览器即可看到效果

# 3. 定制基座后重新编译（可选）
pnpm build
```

## 🏗️ 前端基座架构

### web 目录结构

```
web/                           # 前端基座目录
├── App.vue                   # 主应用组件
├── main.ts                   # 应用入口文件
├── config.ts                 # 前端配置
├── index.html                # HTML 模板
├── vite.config.ts            # Vite 配置
├── typings.d.ts              # TypeScript 声明
└── vite-env.d.ts             # Vite 环境声明
```

### 运行时编译原理

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Vue 文件      │───▶│   运行时编译     │───▶│   浏览器运行    │
│ (app/*/Admin/)  │    │  (无需构建)      │    │  (实时更新)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

- **实时编译**：Vue 文件在浏览器中直接编译运行
- **热更新**：修改文件后刷新页面即可看到效果
- **零配置**：无需配置 webpack、vite 等构建工具

## 💻 开发环境配置

### 一键配置开发环境

```bash
# 在项目根目录运行（只需执行一次）
pnpm install
```

**立即获得**：
- ✅ **完整的 TypeScript 提示**：所有 Vue 文件都有类型检查
- ✅ **ESLint 代码检查**：实时语法和规范检查
- ✅ **自动格式化**：保存时自动格式化代码
- ✅ **智能补全**：组件、API、属性的智能提示
- ✅ **错误提示**：编译错误和运行时错误提示

### 文件导入规则

**重要**：运行时编译有特定的导入限制

```typescript
// ✅ 支持的导入方式
import UserForm from './UserForm.vue'      // Vue 组件
import { formatDate } from './utils.js'    // JS 工具函数
import { NButton } from 'naive-ui'         // 第三方组件

// ❌ 不支持的导入方式
import { helper } from './utils.ts'        // TS 文件（运行时不支持）

// ✅ Vue 文件内部可以使用 TypeScript
<script setup lang="ts">
interface User {
  id: number
  name: string
  email: string
}

const user = ref<User>({
  id: 1,
  name: 'John',
  email: 'john@example.com'
})
</script>
```

### 基座定制和编译

当你需要扩展或定制前端基座时：

```bash
# 修改 web/ 目录下的文件后，重新编译基座
pnpm build

# 编译完成后，新的基座将应用到整个系统
```

**适用场景**：
- 添加全局样式或主题
- 引入新的第三方库
- 修改应用入口逻辑
- 自定义路由配置

## 🧩 DVHA 组件体系

### 什么是 DVHA？

DVHA (Dux Vue Headless Admin) 是 DuxLite 的前端框架，提供了丰富的管理后台组件。

**核心理念**：
- 📋 **表格驱动**：通过配置快速生成数据表格
- 📝 **表单驱动**：通过配置快速生成各种表单
- 🔗 **API 驱动**：组件自动绑定后端 API，无需手动请求
- 🎨 **开箱即用**：预设样式和交互，专注业务逻辑

### 组件分层架构

```
┌─────────────────────────────────────────┐
│           页面级组件                     │
│  DuxTablePage, DuxPageForm, etc.       │
├─────────────────────────────────────────┤
│           业务组件                       │
│  DuxModalForm, DuxTable, etc.          │
├─────────────────────────────────────────┤
│           扩展组件                       │
│  DuxSelect, DuxCascader, etc.          │
├─────────────────────────────────────────┤
│           基础组件                       │
│  NInput, NButton, NTable (Naive UI)    │
└─────────────────────────────────────────┘
```

### 快速上手示例

**1. 创建一个数据表格（5 行代码）**

```vue
<script setup>
import { DuxTablePage } from '@duxweb/dvha-pro'

const columns = [
  { title: 'ID', key: 'id' },
  { title: '用户名', key: 'username' },
  { title: '邮箱', key: 'email' }
]
</script>

<template>
  <DuxTablePage path="system/user" :columns="columns" />
</template>
```

**2. 创建一个表单（8 行代码）**

```vue
<script setup>
import { DuxModalForm, DuxFormItem } from '@duxweb/dvha-pro'
import { NInput } from 'naive-ui'
import { ref } from 'vue'

const model = ref({ username: '', email: '' })
</script>

<template>
  <DuxModalForm path="system/user" :data="model">
    <DuxFormItem label="用户名" path="username" rule="required">
      <NInput v-model:value="model.username" />
    </DuxFormItem>
    <DuxFormItem label="邮箱" path="email" rule="required|email">
      <NInput v-model:value="model.email" />
    </DuxFormItem>
  </DuxModalForm>
</template>
```

### 组件导入方式

```typescript
// 数据管理 Hooks
import { useOne, useList } from '@duxweb/dvha-core'

// 页面级组件（最常用）
import { DuxTablePage, DuxModalForm } from '@duxweb/dvha-pro'

// 扩展组件（API 驱动）
import { DuxSelect, DuxCascader } from '@duxweb/dvha-naiveui'

// 基础 UI 组件
import { NInput, NButton, NTable } from 'naive-ui'
```

## 表格组件概览

DVHA Pro 提供了完整的表格组件体系，用于构建数据展示界面。

### 组件分类

```typescript
import {
  DuxTable,          // 基础表格组件
  DuxTablePage,      // 完整的表格页面组件（最常用）
  DuxTableLayout,    // 表格布局组件
  DuxTableFilter,    // 表格过滤器组件
  DuxTableTools      // 表格工具栏组件
} from '@duxweb/dvha-pro'
```

### 基本使用示例

```vue
<script setup>
import { DuxTablePage } from '@duxweb/dvha-pro'

const columns = [
  { title: 'ID', key: 'id', width: 100 },
  { title: '用户名', key: 'username', minWidth: 120 },
  { title: '邮箱', key: 'email', minWidth: 180 }
]
</script>

<template>
  <DuxTablePage
    path="system/user"
    :columns="columns"
    pagination
  />
</template>
```

**详细使用方法请参考**：[表格设计文档](./tables.md) | [官方文档](https://duxweb.dux.plus/dvha/pro/components/table)

## 表单组件概览

DVHA Pro 提供了完整的表单组件体系，用于构建各种表单界面。

### 组件分类

```typescript
import {
  DuxFormItem,      // 表单项组件
  DuxFormLayout,    // 表单布局组件
  DuxModalForm,     // 模态框表单组件（最常用）
  DuxPageForm,      // 页面表单组件
  DuxDrawerForm,    // 抽屉表单组件
  DuxSettingForm    // 设置表单组件
} from '@duxweb/dvha-pro'
```

### 基本使用示例

```vue
<script setup>
import { DuxModalForm, DuxFormItem } from '@duxweb/dvha-pro'
import { NInput, NSwitch } from 'naive-ui'
import { ref } from 'vue'

const props = defineProps({
  id: [String, Number]
})

const model = ref({
  username: '',
  status: true
})
</script>

<template>
  <DuxModalForm
    :id="props.id"
    path="system/user"
    :data="model"
  >
    <DuxFormItem label="用户名" path="username" rule="required">
      <NInput v-model:value="model.username" />
    </DuxFormItem>

    <DuxFormItem label="状态" path="status">
      <NSwitch v-model:value="model.status" />
    </DuxFormItem>
  </DuxModalForm>
</template>
```

**详细使用方法请参考**：[表单设计文档](./forms.md) | [官方文档](https://duxweb.dux.plus/dvha/pro/components/form)

## 🧩 选择器组件

### DuxSelect - API 驱动选择器

```vue
<template>
  <!-- 基本使用 -->
  <DuxSelect
    v-model:value="roleId"
    path="system/role"
    label-field="name"
    value-field="id"
  />

  <!-- 带搜索 -->
  <DuxSelect
    v-model:value="userId"
    path="system/user"
    label-field="username"
    value-field="id"
    filterable
    remote
  />
</template>
```

### DuxCascader - 级联选择器

```vue
<template>
  <!-- 基本使用 -->
  <DuxCascader
    v-model:value="deptId"
    path="system/dept"
    label-field="name"
    value-field="id"
  />

  <!-- 非级联模式 -->
  <DuxCascader
    v-model:value="categoryId"
    path="content/category"
    label-field="name"
    value-field="id"
    :cascade="false"
  />
</template>
```

## 数据管理 Hooks

### useOne Hook

获取单条数据的 Hook：

```vue
<script setup>
import { useOne } from '@duxweb/dvha-core'

// 获取用户详情
const { data: user, isLoading, error, refresh } = useOne({
  path: 'system/user/1',
  options: {
    enabled: true // 是否立即加载
  }
})

// 条件加载
const { data: config } = useOne({
  path: `data/config/${name}/config`,
  options: {
    enabled: !!name // 只有当 name 存在时才加载
  }
})
</script>

<template>
  <div v-if="isLoading">加载中...</div>
  <div v-else-if="error">加载失败</div>
  <div v-else>
    <h1>{{ user?.name }}</h1>
    <p>{{ user?.email }}</p>
  </div>
</template>
```

### useList Hook

获取列表数据的 Hook：

```vue
<script setup>
import { useList } from '@duxweb/dvha-core'
import { ref } from 'vue'

const filter = ref({
  status: 1,
  keyword: ''
})

// 获取用户列表
const {
  data: users,
  isLoading,
  error,
  refresh,
  meta
} = useList({
  path: 'system/user',
  filter,
  options: {
    enabled: true
  }
})

// 搜索用户
const handleSearch = (keyword) => {
  filter.value.keyword = keyword
}
</script>

<template>
  <div>
    <input @input="handleSearch($event.target.value)" placeholder="搜索用户" />

    <div v-if="isLoading">加载中...</div>
    <div v-else-if="error">加载失败</div>
    <div v-else>
      <div v-for="user in users" :key="user.id">
        {{ user.name }}
      </div>
      <p>共 {{ meta?.total }} 条记录</p>
    </div>
  </div>
</template>
```

## 最佳实践

### 1. 前端基座开发规范

```typescript
// ✅ 推荐：在模块中直接使用 Vue 文件
// app/System/Admin/User/table.vue
<script setup lang="ts">
import { DuxTablePage } from '@duxweb/dvha-pro'

// Vue 文件内部可以使用 TypeScript
interface User {
  id: number
  username: string
}

const columns = [
  { title: 'ID', key: 'id' },
  { title: '用户名', key: 'username' }
]
</script>

<template>
  <DuxTablePage path="system/user" :columns="columns" />
</template>
```

```typescript
// ✅ 推荐：导入 JS 文件和 Vue 文件
import utils from './utils.js'        // JS 文件
import UserForm from './form.vue'     // Vue 文件

// ❌ 避免：导入 TS 文件（运行时不支持）
import utils from './utils.ts'        // 运行时编译不支持
```

```bash
# ✅ 推荐：使用项目根目录的开发工具
cd /path/to/dux-php-admin
pnpm install    # 安装依赖
pnpm lint       # ESLint 检查
pnpm dev        # 开发模式
pnpm build      # 生产编译
```

### 2. 选择合适的表单组件

```vue
<!-- ✅ 推荐：根据场景选择合适的表单组件 -->

<!-- 弹窗表单 - 适用于快速编辑 -->
<DuxModalForm path="system/user" :data="model" />

<!-- 页面表单 - 适用于复杂表单 -->
<DuxPageForm path="system/user" :data="model" />

<!-- 抽屉表单 - 适用于侧边栏编辑 -->
<DuxDrawerForm path="system/user" :data="model" />

<!-- 设置表单 - 适用于配置页面 -->
<DuxSettingForm path="system/settings" :data="settings" tabs />
```

### 2. API 驱动的设计

```vue
<!-- ✅ 推荐：通过 path 属性自动绑定 API -->
<template>
  <DuxSelect
    path="system/role"    <!-- 自动调用 /system/role API -->
    label-field="name"    <!-- 显示字段 -->
    value-field="id"      <!-- 值字段 -->
  />

  <DuxTablePage
    path="system/user"    <!-- 自动调用 /system/user API -->
    :columns="columns"
  />
</template>

<!-- ❌ 避免：手动管理数据 -->
<template>
  <NSelect :options="options" :loading="loading" />
</template>
```

### 3. 组件组合使用

```vue
<script setup>
// ✅ 推荐：组合使用 DVHA 组件
import { DuxModalForm, DuxFormItem } from '@duxweb/dvha-pro'
import { DuxSelect } from '@duxweb/dvha-naiveui'
import { NInput } from 'naive-ui'
</script>

<template>
  <DuxModalForm path="system/user" :data="model">
    <DuxFormItem label="用户名" path="username" rule="required">
      <NInput v-model:value="model.username" />
    </DuxFormItem>

    <DuxFormItem label="角色" path="role_id" rule="required">
      <DuxSelect
        path="system/role"
        v-model:value="model.role_id"
        label-field="name"
        value-field="id"
      />
    </DuxFormItem>
  </DuxModalForm>
</template>
```

## 总结

DuxLite 前端开发的核心要点：

### 前端基座架构
- **web 目录**：前端运行时基座，用于扩展和编译组件
- **运行时编译**：Vue 文件直接在浏览器中运行，无需构建步骤
- **文件导入限制**：运行时不支持导入 TS 文件，但支持 JS 和 Vue 文件
- **开发工具支持**：项目根目录 `pnpm install` 后获得完整的 ESLint 和 TypeScript 支持

### 核心特性
- **DVHA 框架**：基于 Vue 3 和 Naive UI 的管理后台框架
- **API 驱动**：通过 `path` 属性自动绑定后端 API
- **组件化设计**：丰富的开箱即用组件
- **TypeScript 支持**：Vue 文件内部可以声明为 TypeScript

### 表格组件体系
- **DuxTablePage**：完整的表格页面解决方案（最常用）
- **DuxTable**：基础表格组件
- **DuxTableLayout**：表格布局组件
- **DuxTableFilter**：表格过滤器组件
- **DuxTableTools**：表格工具栏组件

### 表单组件体系
- **DuxModalForm**：模态框表单组件（最常用）
- **DuxPageForm**：页面表单组件
- **DuxDrawerForm**：抽屉表单组件
- **DuxSettingForm**：设置表单组件
- **DuxFormItem**：表单项组件
- **DuxFormLayout**：表单布局组件
- **DuxFormRenderer**：动态表单渲染器

### 数据管理
- **useOne**：获取单条数据
- **useList**：获取列表数据
- **useAction**：操作按钮管理

### 开发建议
- **前端基座开发**：在 `web/` 目录中扩展组件，支持运行时编译和生产构建
- **文件导入规范**：运行时只能导入 JS 和 Vue 文件，不支持 TS 文件
- **开发环境配置**：使用项目根目录的 `pnpm install` 获得完整开发体验
- **组件选择**：根据场景选择合适的表格和表单组件
- **API 驱动设计**：充分利用 `path` 属性的自动绑定特性
- **验证和布局**：使用内置的验证规则和布局选项
- **组件组合**：遵循组件组合的设计模式
- **官方文档**：参考 [https://duxweb.dux.plus/dvha/pro/](https://duxweb.dux.plus/dvha/pro/)

### 相关文档
- **表格组件文档**：[https://duxweb.dux.plus/dvha/pro/components/table](https://duxweb.dux.plus/dvha/pro/components/table)
- **表单组件文档**：[https://duxweb.dux.plus/dvha/pro/components/form](https://duxweb.dux.plus/dvha/pro/components/form)

## 📚 新手开发指南

### 第一步：理解文件结构

```
app/
├── System/Admin/User/
│   ├── table.vue          # 用户列表页面
│   ├── form.vue           # 用户表单页面
│   └── UserController.php # 后端控制器
└── ...

web/                       # 前端基座（一般不需要修改）
├── App.vue
├── main.ts
└── ...
```

### 第二步：创建你的第一个页面

**1. 创建表格页面** (`app/System/Admin/User/table.vue`)

```vue
<script setup lang="ts">
import { DuxTablePage } from '@duxweb/dvha-pro'

// 定义表格列
const columns = [
  { title: 'ID', key: 'id', width: 80 },
  { title: '用户名', key: 'username', minWidth: 120 },
  { title: '邮箱', key: 'email', minWidth: 180 },
  { title: '状态', key: 'status', width: 100 }
]
</script>

<template>
  <!-- path 会自动调用 /system/user API -->
  <DuxTablePage path="system/user" :columns="columns" />
</template>
```

**2. 创建表单页面** (`app/System/Admin/User/form.vue`)

```vue
<script setup lang="ts">
import { DuxModalForm, DuxFormItem } from '@duxweb/dvha-pro'
import { NInput, NSwitch } from 'naive-ui'
import { ref } from 'vue'

// 接收父组件传递的 ID（编辑时）
const props = defineProps({
  id: [String, Number]
})

// 表单数据
const model = ref({
  username: '',
  email: '',
  status: true
})
</script>

<template>
  <DuxModalForm :id="props.id" path="system/user" :data="model">
    <DuxFormItem label="用户名" path="username" rule="required">
      <NInput v-model:value="model.username" />
    </DuxFormItem>

    <DuxFormItem label="邮箱" path="email" rule="required|email">
      <NInput v-model:value="model.email" />
    </DuxFormItem>

    <DuxFormItem label="状态" path="status">
      <NSwitch v-model:value="model.status" />
    </DuxFormItem>
  </DuxModalForm>
</template>
```

### 第三步：理解 API 驱动

```vue
<!-- 🎯 核心概念：path 属性自动绑定 API -->

<!-- 表格组件 -->
<DuxTablePage path="system/user" />
<!-- 自动调用：GET /system/user?page=1&limit=20 -->

<!-- 表单组件 -->
<DuxModalForm path="system/user" :data="model" />
<!-- 自动调用：POST /system/user (新建) 或 PUT /system/user/1 (编辑) -->

<!-- 选择器组件 -->
<DuxSelect path="system/role" />
<!-- 自动调用：GET /system/role -->
```

### 第四步：开发注意事项

**✅ 正确的做法**

```typescript
// 1. 导入文件类型
import UserForm from './form.vue'     // Vue 文件 ✅
import { formatDate } from './utils.js' // JS 文件 ✅

// 2. Vue 文件内使用 TypeScript
<script setup lang="ts">
interface User {
  id: number
  name: string
}
</script>

// 3. 利用 API 驱动特性
<DuxTablePage path="system/user" :columns="columns" />
```

**❌ 避免的做法**

```typescript
// 1. 导入 TS 文件（运行时不支持）
import { helper } from './utils.ts'  // ❌

// 2. 手动管理 API 请求
const fetchUsers = async () => {     // ❌ 不推荐
  const response = await fetch('/api/users')
  return response.json()
}

// 3. 复杂的状态管理
const [users, setUsers] = useState([]) // ❌ 不需要
```

### 第五步：开发工具配置

```bash
# 在项目根目录执行（只需一次）
pnpm install

# 现在你的 IDE 就有了：
# ✅ TypeScript 类型提示
# ✅ ESLint 代码检查
# ✅ 自动格式化
# ✅ 组件智能补全
```

**无需启动开发服务器**，直接编辑 Vue 文件，刷新浏览器即可看到效果！

## 🎯 总结

DuxLite 前端开发的核心要点：

### 前端基座架构
- **web 目录**：前端运行时基座，用于扩展和编译组件
- **运行时编译**：Vue 文件直接在浏览器中运行，无需构建步骤
- **文件导入限制**：运行时不支持导入 TS 文件，但支持 JS 和 Vue 文件
- **开发工具支持**：项目根目录 `pnpm install` 后获得完整的 ESLint 和 TypeScript 支持

### 核心特性
- **DVHA 框架**：基于 Vue 3 和 Naive UI 的管理后台框架
- **API 驱动**：通过 `path` 属性自动绑定后端 API
- **组件化设计**：丰富的开箱即用组件
- **TypeScript 支持**：Vue 文件内部可以声明为 TypeScript

### 表格组件体系
- **DuxTablePage**：完整的表格页面解决方案（最常用）
- **DuxTable**：基础表格组件
- **DuxTableLayout**：表格布局组件
- **DuxTableFilter**：表格过滤器组件
- **DuxTableTools**：表格工具栏组件

### 表单组件体系
- **DuxModalForm**：模态框表单组件（最常用）
- **DuxPageForm**：页面表单组件
- **DuxDrawerForm**：抽屉表单组件
- **DuxSettingForm**：设置表单组件
- **DuxFormItem**：表单项组件
- **DuxFormLayout**：表单布局组件
- **DuxFormRenderer**：动态表单渲染器

### 数据管理
- **useOne**：获取单条数据
- **useList**：获取列表数据
- **useAction**：操作按钮管理

### 开发建议
- **前端基座开发**：在 `web/` 目录中扩展组件，支持运行时编译和生产构建
- **文件导入规范**：运行时只能导入 JS 和 Vue 文件，不支持 TS 文件
- **开发环境配置**：使用项目根目录的 `pnpm install` 获得完整开发体验
- **组件选择**：根据场景选择合适的表格和表单组件
- **API 驱动设计**：充分利用 `path` 属性的自动绑定特性
- **验证和布局**：使用内置的验证规则和布局选项
- **组件组合**：遵循组件组合的设计模式
- **官方文档**：参考 [https://duxweb.dux.plus/dvha/pro/](https://duxweb.dux.plus/dvha/pro/)

### 相关文档
- **Hooks 使用指南**：[./hooks.md](./hooks.md) - 学习常用 Hooks 的使用方法
- **表格设计**：[./tables.md](./tables.md) - 学习表格组件的使用
- **表单设计**：[./forms.md](./forms.md) - 学习表单组件的使用
- **表格组件文档**：[https://duxweb.dux.plus/dvha/pro/components/table](https://duxweb.dux.plus/dvha/pro/components/table)
- **表单组件文档**：[https://duxweb.dux.plus/dvha/pro/components/form](https://duxweb.dux.plus/dvha/pro/components/form)
- **Hooks 完整文档**：[https://duxweb.dux.plus/dvha/pro/hooks](https://duxweb.dux.plus/dvha/pro/hooks)

通过合理使用 DVHA 框架的完整组件体系，你可以快速构建出功能完善的管理界面。