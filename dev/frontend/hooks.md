# Hooks 使用指南

DVHA 提供了丰富的 Hooks 来简化开发，本指南介绍常用 Hooks 的基本使用方法。

详细 API 文档请参考：[https://duxweb.dux.plus/dvha/pro/hooks](https://duxweb.dux.plus/dvha/pro/hooks)

## 数据管理 Hooks

### useOne - 获取单条数据

用于获取单条记录数据：

```typescript
import { useOne } from '@duxweb/dvha-core'

// 基本使用
const { data: user, isLoading, error } = useOne({ 
  path: 'system/user/1' 
})

// 条件获取
const { data: profile } = useOne({ 
  path: 'system/profile',
  options: {
    enabled: !!userId  // 只有当 userId 存在时才请求
  }
})

// 依赖更新
const { data: userDetail } = useOne({ 
  path: `system/user/${userId}`,
  options: {
    enabled: !!userId
  }
})
```

### useList - 获取列表数据

用于获取列表数据和分页信息：

```typescript
import { useList } from '@duxweb/dvha-core'

// 基本使用
const { data: users, isLoading, meta } = useList({ 
  path: 'system/user',
  filter: { status: 1 }
})

// 带分页
const { data: articles, meta } = useList({
  path: 'content/article',
  pagination: { page: 1, limit: 20 }
})

// 带搜索和筛选
const { data: products, refresh } = useList({
  path: 'shop/product',
  filter: {
    category_id: categoryId,
    keyword: searchKeyword,
    status: 'active'
  }
})
```

### useAction - 操作按钮管理

用于管理表格和页面中的操作按钮：

```typescript
import { useAction } from '@duxweb/dvha-pro'

const action = useAction()

// 表格操作列
const actionColumn = {
  title: '操作',
  key: 'action',
  render: action.renderTable({
    items: [
      {
        label: '编辑',
        type: 'modal',
        component: () => import('./form.vue')
      },
      {
        label: '删除',
        type: 'delete',
        path: 'system/user'
      },
      {
        label: '重置密码',
        type: 'confirm',
        title: '确认重置密码？',
        api: (row) => resetPassword(row.id)
      }
    ]
  })
}

// 页面操作按钮
const pageActions = action.renderPage({
  items: [
    {
      label: '添加用户',
      color: 'primary',
      icon: 'i-tabler:plus',
      type: 'modal',
      component: () => import('./form.vue')
    },
    {
      label: '批量导入',
      color: 'info',
      icon: 'i-tabler:upload',
      type: 'modal',
      component: () => import('./import.vue')
    }
  ]
})
```

## 表格管理 Hooks

### useTable - 表格数据管理

用于管理表格的数据、分页、排序等功能：

```typescript
import { useTable } from '@duxweb/dvha-pro'

const {
  list,           // 表格数据
  isLoading,      // 加载状态
  table,          // 表格属性
  tablePagination // 分页属性
} = useTable({
  path: 'system/user',
  columns: [
    { title: 'ID', key: 'id', width: 80 },
    { title: '用户名', key: 'username', minWidth: 120 }
  ],
  filter: {
    status: 1
  }
})

// 在模板中使用
// <NDataTable v-bind="table" :pagination="tablePagination" />
```

### useTableColumn - 列渲染器

用于提供表格列的各种渲染器：

```typescript
import { useTableColumn } from '@duxweb/dvha-pro'

const {
  renderMedia,    // 媒体渲染器（头像+文本）
  renderSwitch,   // 开关渲染器
  renderStatus,   // 状态渲染器
  renderInput,    // 输入框渲染器
  renderCopy,     // 复制渲染器
  renderImage,    // 图片渲染器
  renderMap,      // 映射渲染器
  renderHidden    // 隐藏渲染器
} = useTableColumn({
  path: 'system/user',
  rowKey: 'id'
})

// 在列配置中使用
const columns = [
  {
    title: '用户信息',
    key: 'user_info',
    render: renderMedia({
      image: 'avatar',
      title: 'username',
      subtitle: 'email'
    })
  },
  {
    title: '状态',
    key: 'status',
    render: renderSwitch({
      key: 'status'
    })
  }
]
```

## 表单管理 Hooks

### useForm - 表单数据管理

用于管理表单的数据、验证、提交等功能：

```typescript
import { useForm } from '@duxweb/dvha-pro'

const {
  data,           // 表单数据
  isLoading,      // 加载状态
  submit,         // 提交函数
  reset,          // 重置函数
  validate        // 验证函数
} = useForm({
  path: 'system/user',
  id: userId,     // 编辑时的 ID
  defaultData: {  // 默认数据
    status: true,
    role_id: null
  }
})

// 提交表单
const handleSubmit = async () => {
  try {
    await submit()
    message.success('保存成功')
  } catch (error) {
    message.error('保存失败')
  }
}
```

### useFormItem - 表单项管理

用于管理单个表单项的状态和验证：

```typescript
import { useFormItem } from '@duxweb/dvha-pro'

const {
  value,          // 表单项值
  error,          // 验证错误
  validate,       // 验证函数
  reset           // 重置函数
} = useFormItem({
  path: 'username',
  rules: ['required', 'min:3', 'max:20'],
  defaultValue: ''
})

// 手动验证
const handleBlur = async () => {
  await validate()
}
```

## 业务 Hooks

### useManage - 管理页面

用于获取当前管理页面的信息：

```typescript
import { useManage } from '@duxweb/dvha-core'

const {
  getPath,        // 获取当前路径
  getTitle,       // 获取页面标题
  breadcrumb,     // 面包屑导航
  permissions     // 权限信息
} = useManage()

// 使用示例
const currentPath = getPath()        // 'system/user'
const pageTitle = getTitle()         // '用户管理'
const canEdit = permissions.edit     // true/false
```

### useModal - 模态框管理

用于管理模态框的显示状态：

```typescript
import { useModal } from '@duxweb/dvha-pro'

const {
  visible,        // 显示状态
  open,           // 打开模态框
  close,          // 关闭模态框
  loading,        // 加载状态
  setLoading      // 设置加载状态
} = useModal()

// 使用示例
const handleEdit = (id) => {
  open()
  // 执行编辑逻辑
}

const handleSave = async () => {
  setLoading(true)
  try {
    await saveData()
    close()
  } finally {
    setLoading(false)
  }
}
```

### useUpload - 文件上传

用于处理文件上传功能：

```typescript
import { useUpload } from '@duxweb/dvha-pro'

const {
  upload,         // 上传函数
  progress,       // 上传进度
  isUploading,    // 上传状态
  fileList        // 文件列表
} = useUpload({
  path: '/api/upload',
  accept: 'image/*',
  maxSize: 5 * 1024 * 1024,  // 5MB
  multiple: true
})

// 使用示例
const handleFileSelect = (files) => {
  upload(files)
}
```

## Hook 组合使用

### 完整的页面示例

```vue
<script setup>
import { 
  useOne, 
  useList, 
  useAction, 
  useModal, 
  useTable,
  useTableColumn 
} from '@duxweb/dvha-pro'
import { ref, computed, watch } from 'vue'

// 获取当前用户信息
const { data: currentUser } = useOne({ 
  path: 'system/profile' 
})

// 表格管理
const {
  list: users,
  isLoading,
  table,
  tablePagination
} = useTable({
  path: 'system/user',
  columns: [
    { title: 'ID', key: 'id', width: 80 },
    { title: '用户名', key: 'username', minWidth: 120 },
    { title: '邮箱', key: 'email', minWidth: 180 }
  ]
})

// 列渲染器
const { renderMedia, renderSwitch } = useTableColumn({
  path: 'system/user',
  rowKey: 'id'
})

// 操作管理
const action = useAction()

// 模态框管理
const { visible, open, close } = useModal()

// 筛选条件
const filter = ref({
  status: 1,
  dept_id: null
})

// 监听筛选条件变化
watch(filter, (newFilter) => {
  // 刷新表格数据
  table.refresh(newFilter)
}, { deep: true })

// 操作函数
const handleEdit = (id) => {
  open()
  // 打开编辑表单
}

const handleDelete = async (id) => {
  try {
    await deleteUser(id)
    table.refresh()
    message.success('删除成功')
  } catch (error) {
    message.error('删除失败')
  }
}
</script>

<template>
  <div>
    <!-- 筛选条件 -->
    <div class="mb-4">
      <n-form inline>
        <n-form-item label="状态">
          <n-select v-model:value="filter.status" :options="statusOptions" />
        </n-form-item>
      </n-form>
    </div>

    <!-- 数据表格 -->
    <n-data-table
      v-bind="table"
      :pagination="tablePagination"
      :loading="isLoading"
    />

    <!-- 编辑模态框 -->
    <n-modal v-model:show="visible">
      <user-form @success="close" />
    </n-modal>
  </div>
</template>
```

## 最佳实践

### 1. Hook 选择原则

```typescript
// ✅ 推荐：根据需求选择合适的 Hook
// 获取单条数据
const { data: user } = useOne({ path: 'system/user/1' })

// 获取列表数据
const { data: users } = useList({ path: 'system/user' })

// 表格功能
const table = useTable({ path: 'system/user', columns })

// ❌ 避免：过度使用复杂的 Hook
// 简单的静态数据不需要使用 useList
```

### 2. 性能优化

```typescript
// ✅ 推荐：合理使用条件请求
const { data: userDetail } = useOne({
  path: `system/user/${userId}`,
  options: {
    enabled: !!userId  // 只有当 userId 存在时才请求
  }
})

// ✅ 推荐：使用依赖数组优化
const { data: orders } = useList({
  path: 'order/list',
  filter: { user_id: userId },
  options: {
    enabled: !!userId
  }
})
```

### 3. 错误处理

```typescript
// ✅ 推荐：统一错误处理
const { data, error, isLoading } = useOne({ 
  path: 'system/user/1',
  onError: (error) => {
    console.error('获取用户失败:', error)
    message.error('获取用户信息失败')
  }
})

// 在模板中处理错误状态
if (error.value) {
  // 显示错误信息
}
```

## 相关资源

### 官方文档
- **Hooks 完整文档**：[https://duxweb.dux.plus/dvha/pro/hooks](https://duxweb.dux.plus/dvha/pro/hooks)
- **数据管理 Hooks**：[https://duxweb.dux.plus/dvha/pro/hooks/data](https://duxweb.dux.plus/dvha/pro/hooks/data)
- **表格 Hooks**：[https://duxweb.dux.plus/dvha/pro/hooks/table](https://duxweb.dux.plus/dvha/pro/hooks/table)
- **表单 Hooks**：[https://duxweb.dux.plus/dvha/pro/hooks/form](https://duxweb.dux.plus/dvha/pro/hooks/form)

### 相关文档
- [前端开发说明](./components.md) - 了解 DuxLite 前端开发方式
- [表格设计](./tables.md) - 学习表格组件的使用
- [表单设计](./forms.md) - 学习表单组件的使用

通过合理使用这些 Hooks，您可以大大简化前端开发工作，提高开发效率。
