# 表格设计

在 Dux PHP Admin 中，表格是数据展示的核心组件。本指南将介绍如何使用 DVHA 框架创建高效、易用的数据表格。

详细组件文档请参考：[https://duxweb.dux.plus/dvha/pro/components/table](https://duxweb.dux.plus/dvha/pro/components/table)

## 表格组件体系

### 组件总览

```typescript
import {
  DuxTable,          // 基础表格组件
  DuxTablePage,      // 完整的表格页面组件
  DuxTableLayout,    // 表格布局组件
  DuxTableFilter,    // 表格过滤器组件
  DuxTableTools      // 表格工具栏组件
} from '@duxweb/dvha-pro'
```

## DuxTablePage 完整表格页面

最常用的表格组件，提供完整的表格页面解决方案：

```vue
<script setup>
import { DuxTablePage, useAction } from '@duxweb/dvha-pro'
import { ref } from 'vue'

const action = useAction()

// 表格列配置
const columns = [
  { title: 'ID', key: 'id', width: 100 },
  { title: '用户名', key: 'username', minWidth: 120 },
  { title: '昵称', key: 'nickname', minWidth: 120 },
  {
    title: '操作',
    key: 'action',
    align: 'center',
    width: 120,
    render: action.renderTable({
      align: 'center',
      type: 'button',
      text: true,
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
        }
      ]
    })
  }
]

// 操作按钮配置
const actions = [
  {
    label: '添加用户',
    color: 'primary',
    icon: 'i-tabler:plus',
    type: 'modal',
    component: () => import('./form.vue')
  }
]

// 筛选条件
const filter = ref({})

// 筛选表单配置
const filterSchema = [
  {
    tag: 'n-input',
    title: '搜索',
    attrs: {
      'placeholder': '请输入用户名',
      'v-model:value': [filter.value, 'keyword']
    }
  }
]
</script>

<template>
  <DuxTablePage
    path="system/user"
    :filter="filter"
    :filter-schema="filterSchema"
    :columns="columns"
    :actions="actions"
    pagination
  />
</template>
```

## DuxTable 基础表格

基础表格组件，提供数据绑定和分页功能：

```vue
<script setup>
import { DuxTable } from '@duxweb/dvha-pro'

const columns = [
  { key: 'id', title: 'ID' },
  { key: 'name', title: '姓名' },
  { key: 'email', title: '邮箱' }
]
</script>

<template>
  <DuxTable
    path="/api/users"
    :columns="columns"
    :pagination="{ pageSize: 10 }"
  />
</template>
```

## DuxTableLayout 表格布局

表格布局组件，提供更灵活的表格布局控制：

```vue
<script setup>
import { DuxTableLayout } from '@duxweb/dvha-pro'
import { NDataTable } from 'naive-ui'
import { ref } from 'vue'

const filters = ref({})
const columns = [
  { title: 'ID', key: 'id', width: 100 },
  { title: '用户名', key: 'username', minWidth: 120 }
]

const filterSchema = [
  {
    tag: 'n-input',
    title: '搜索',
    attrs: {
      'v-model:value': [filters.value, 'keyword'],
      'placeholder': '请输入搜索关键词'
    }
  }
]
</script>

<template>
  <DuxTableLayout
    path="/api/users"
    :filter="filters"
    :filter-schema="filterSchema"
    :columns="columns"
  >
    <template #default="{ table, width }">
      <NDataTable
        v-bind="table"
        :scroll-x="width"
        class="h-full"
      />
    </template>
  </DuxTableLayout>
</template>
```

## 带侧边栏的表格

```vue
<script setup>
import { DuxTablePage, DuxTreeFilter } from '@duxweb/dvha-pro'
import { ref, watch } from 'vue'

const deptID = ref([])
const filter = ref({})

// 监听部门选择
watch(deptID, (v) => {
  filter.value.dept_id = v[0]
}, { immediate: true })

const columns = [
  { title: 'ID', key: 'id', width: 100 },
  { title: '用户名', key: 'username', minWidth: 120 },
  { title: '部门', key: 'dept.name', minWidth: 120 }
]
</script>

<template>
  <DuxTablePage
    path="system/user"
    :filter="filter"
    :columns="columns"
  >
    <template #sideLeft>
      <div class="lg:w-50">
        <DuxTreeFilter 
          v-model:value="deptID" 
          :bordered="false" 
          path="system/dept" 
          label-field="name" 
          key-field="id" 
        />
      </div>
    </template>
  </DuxTablePage>
</template>
```

## 表格筛选和操作

### 筛选配置

```vue
<script setup>
const filterSchema = [
  {
    tag: 'n-input',
    title: '用户名',
    attrs: {
      'v-model:value': [filter.value, 'username'],
      'placeholder': '请输入用户名'
    }
  },
  {
    tag: 'n-select',
    title: '状态',
    attrs: {
      'v-model:value': [filter.value, 'status'],
      'placeholder': '请选择状态',
      'options': [
        { label: '启用', value: 1 },
        { label: '禁用', value: 0 }
      ]
    }
  },
  {
    tag: 'n-date-picker',
    title: '创建时间',
    attrs: {
      'v-model:value': [filter.value, 'created_at'],
      'type': 'daterange'
    }
  }
]
</script>
```

### 操作按钮配置

```vue
<script setup>
const actions = [
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
  },
  {
    label: '导出数据',
    icon: 'i-tabler:download',
    type: 'export',
    path: 'system/user/export'
  }
]

// 行操作配置
const action = useAction()
const actionColumn = {
  title: '操作',
  key: 'action',
  align: 'center',
  width: 160,
  render: action.renderTable({
    align: 'center',
    type: 'button',
    text: true,
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
</script>
```

## useTableColumn 列渲染器

`useTableColumn` 是 DVHA Pro 提供的表格列渲染器 Hook，提供了多种预设的列渲染功能，用于简化表格列的显示和交互逻辑。

### 基本使用

```vue
<script setup>
import { DuxTablePage, useTableColumn } from '@duxweb/dvha-pro'

// 创建列渲染器
const column = useTableColumn({
  path: 'system/user',  // API 路径
  rowKey: 'id'          // 行键字段
})

// 获取各种渲染器
const {
  renderMedia,    // 媒体渲染器（头像+文本）
  renderImage,    // 图片渲染器
  renderSwitch,   // 开关渲染器
  renderStatus,   // 状态渲染器
  renderMap,      // 映射渲染器
  renderInput,    // 输入框渲染器
  renderCopy,     // 复制渲染器
  renderHidden    // 隐藏渲染器
} = column

// 表格列配置
const columns = [
  { title: 'ID', key: 'id', width: 80 },
  {
    title: '用户信息',
    key: 'user_info',
    render: renderMedia({
      image: 'avatar',      // 头像字段
      title: 'username',    // 主标题字段
      subtitle: 'email'     // 副标题字段
    })
  },
  {
    title: '状态',
    key: 'status',
    render: renderSwitch({
      key: 'status'         // 开关字段
    })
  }
]
</script>

<template>
  <DuxTablePage path="system/user" :columns="columns" />
</template>
```

### 内置渲染器详解

#### 1. renderMedia - 媒体渲染器

用于显示头像+文本的组合：

```vue
<script setup>
const columns = [
  {
    title: '用户信息',
    key: 'user_info',
    render: renderMedia({
      image: 'avatar',        // 头像字段
      title: 'username',      // 主标题
      subtitle: 'email',      // 副标题
      size: 'medium'          // 头像大小：small | medium | large
    })
  }
]
</script>
```

#### 2. renderImage - 图片渲染器

用于显示单张图片：

```vue
<script setup>
const columns = [
  {
    title: '商品图片',
    key: 'image',
    render: renderImage({
      key: 'image',           // 图片字段
      width: 60,              // 图片宽度
      height: 60,             // 图片高度
      preview: true           // 是否支持预览
    })
  }
]
</script>
```

#### 3. renderSwitch - 开关渲染器

用于显示可切换的开关状态：

```vue
<script setup>
const columns = [
  {
    title: '状态',
    key: 'status',
    render: renderSwitch({
      key: 'status',          // 开关字段
      checkedText: '启用',    // 开启时文本
      uncheckedText: '禁用'   // 关闭时文本
    })
  }
]
</script>
```

#### 4. renderStatus - 状态渲染器

用于显示带颜色的状态标签：

```vue
<script setup>
const columns = [
  {
    title: '订单状态',
    key: 'order_status',
    render: renderStatus({
      key: 'status',
      maps: {
        'pending': { text: '待处理', color: 'warning' },
        'completed': { text: '已完成', color: 'success' },
        'cancelled': { text: '已取消', color: 'error' }
      }
    })
  }
]
</script>
```

#### 5. renderMap - 映射渲染器

用于显示多个字段的映射信息：

```vue
<script setup>
const columns = [
  {
    title: '详细信息',
    key: 'details',
    render: renderMap({
      maps: [
        {
          label: '手机号',
          key: 'phone',
          icon: 'i-tabler:phone'
        },
        {
          label: '部门',
          key: 'department.name',
          icon: 'i-tabler:building'
        },
        {
          label: '创建时间',
          key: 'created_at',
          icon: 'i-tabler:calendar',
          render: (value) => new Date(value).toLocaleDateString()
        }
      ]
    })
  }
]
</script>
```

#### 6. renderInput - 输入框渲染器

用于行内编辑功能：

```vue
<script setup>
const columns = [
  {
    title: '排序',
    key: 'sort',
    render: renderInput({
      key: 'sort',            // 编辑字段
      tag: NInputNumber       // 使用的组件（默认 NInput）
    })
  }
]
</script>
```

#### 7. renderCopy - 复制渲染器

用于显示可复制的文本：

```vue
<script setup>
const columns = [
  {
    title: 'API Key',
    key: 'api_key',
    render: renderCopy({
      key: 'api_key',         // 复制字段
      text: '复制'            // 复制按钮文本
    })
  }
]
</script>
```

#### 8. renderHidden - 隐藏渲染器

用于显示可切换显示的敏感信息：

```vue
<script setup>
const columns = [
  {
    title: '密码',
    key: 'password',
    render: renderHidden({
      key: 'password',        // 隐藏字段
      percent: 30             // 显示的字符百分比
    })
  }
]
</script>
```

### 完整示例

```vue
<script setup>
import { DuxTablePage, useTableColumn } from '@duxweb/dvha-pro'
import { NInputNumber } from 'naive-ui'

const column = useTableColumn({
  path: 'system/user',
  rowKey: 'id'
})

const {
  renderMedia,
  renderSwitch,
  renderStatus,
  renderMap,
  renderInput,
  renderCopy
} = column

const columns = [
  { title: 'ID', key: 'id', width: 80 },
  {
    title: '用户信息',
    key: 'user_info',
    minWidth: 200,
    render: renderMedia({
      image: 'avatar',
      title: 'username',
      subtitle: 'email'
    })
  },
  {
    title: '详细信息',
    key: 'details',
    minWidth: 180,
    render: renderMap({
      maps: [
        { label: '手机', key: 'phone', icon: 'i-tabler:phone' },
        { label: '部门', key: 'dept.name', icon: 'i-tabler:building' }
      ]
    })
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render: renderStatus({
      key: 'status',
      maps: {
        1: { text: '启用', color: 'success' },
        0: { text: '禁用', color: 'error' }
      }
    })
  },
  {
    title: '排序',
    key: 'sort',
    width: 100,
    render: renderInput({
      key: 'sort',
      tag: NInputNumber
    })
  },
  {
    title: 'Token',
    key: 'token',
    width: 120,
    render: renderCopy({
      key: 'api_token',
      text: '复制'
    })
  }
]
</script>

<template>
  <DuxTablePage path="system/user" :columns="columns" />
</template>
```

## 最佳实践

### 1. 表格性能优化

```vue
<script setup>
// 合理设置分页大小
const pagination = {
  pageSize: 20,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100]
}

// 使用虚拟滚动处理大量数据
const tableProps = {
  virtualScroll: true,
  maxHeight: 600
}

// 防抖搜索
import { debounce } from 'lodash-es'
const debouncedFilter = debounce(() => {
  // 触发表格刷新
}, 300)
</script>
```

### 2. 列渲染器选择

```vue
<script setup>
// ✅ 推荐：根据数据类型选择合适的渲染器
const columns = [
  // 用户信息 - 使用 renderMedia
  {
    title: '用户',
    render: renderMedia({ image: 'avatar', title: 'name' })
  },

  // 开关状态 - 使用 renderSwitch
  {
    title: '状态',
    render: renderSwitch({ key: 'status' })
  },

  // 枚举值 - 使用 renderStatus
  {
    title: '类型',
    render: renderStatus({ key: 'type', maps: typeMap })
  },

  // 行内编辑 - 使用 renderInput
  {
    title: '排序',
    render: renderInput({ key: 'sort', tag: NInputNumber })
  }
]
</script>
```

### 3. 用户体验优化

```vue
<script setup>
// 加载状态
const loading = ref(false)

// 错误处理
const handleError = (error) => {
  console.error('操作失败:', error)
  message.error(error.message || '操作失败，请重试')
}

// 操作确认
const confirmDelete = (row) => {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除 "${row.name}" 吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: () => deleteItem(row.id)
  })
}
</script>
```

## 相关资源

### 官方文档
- **表格组件文档**：[https://duxweb.dux.plus/dvha/pro/components/table](https://duxweb.dux.plus/dvha/pro/components/table)
- **表格 Hooks 文档**：[https://duxweb.dux.plus/dvha/pro/hooks/table](https://duxweb.dux.plus/dvha/pro/hooks/table)
- **DVHA Pro 完整文档**：[https://duxweb.dux.plus/dvha/pro/](https://duxweb.dux.plus/dvha/pro/)

### 相关文档
- [前端开发说明](./components.md) - 了解 DuxLite 前端开发方式
- [Hooks 使用指南](./hooks.md) - 学习常用 Hooks 的使用方法
- [表单设计](./forms.md) - 学习表单组件的使用

通过这些表格设计模式，您可以创建出功能完善、性能优良的数据展示界面。
