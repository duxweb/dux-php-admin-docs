# 表单设计

在 Dux PHP Admin 中，表单是用户与系统交互的核心界面。本指南将介绍如何使用 DVHA 框架创建高效、易用的表单。

详细组件文档请参考：[https://duxweb.dux.plus/dvha/pro/components/form](https://duxweb.dux.plus/dvha/pro/components/form)

## 表单组件体系

### 组件总览

```typescript
import {
  DuxFormItem,      // 表单项组件
  DuxFormLayout,    // 表单布局组件
  DuxModalForm,     // 模态框表单组件
  DuxPageForm,      // 页面表单组件
  DuxDrawerForm,    // 抽屉表单组件
  DuxSettingForm    // 设置表单组件
} from '@duxweb/dvha-pro'
```

## DuxModalForm 模态框表单

最常用的表单组件，提供模态框形式的表单：

```vue
<script setup>
import { DuxModalForm, DuxFormItem } from '@duxweb/dvha-pro'
import { DuxSelect, DuxCascader } from '@duxweb/dvha-naiveui'
import { NInput, NSwitch } from 'naive-ui'
import { ref } from 'vue'

const props = defineProps({
  id: [String, Number]
})

const model = ref({
  username: '',
  nickname: '',
  role_id: null,
  dept_id: null,
  status: true
})
</script>

<template>
  <DuxModalForm
    :id="props.id"
    path="system/user"
    :data="model"
    title="用户管理"
    @success="handleSuccess"
  >
    <DuxFormItem label="用户名" path="username" rule="required">
      <NInput v-model:value="model.username" />
    </DuxFormItem>

    <DuxFormItem label="昵称" path="nickname">
      <NInput v-model:value="model.nickname" />
    </DuxFormItem>

    <DuxFormItem label="所属角色" path="role_id" rule="required">
      <DuxSelect
        v-model:value="model.role_id"
        path="system/role"
        label-field="name"
        value-field="id"
      />
    </DuxFormItem>

    <DuxFormItem label="所属部门" path="dept_id">
      <DuxCascader
        v-model:value="model.dept_id"
        :cascade="false"
        path="system/dept"
        label-field="name"
        value-field="id"
      />
    </DuxFormItem>

    <DuxFormItem label="状态" path="status">
      <NSwitch v-model:value="model.status" />
    </DuxFormItem>
  </DuxModalForm>
</template>
```

## DuxPageForm 页面表单

页面表单组件，提供完整的页面级表单布局：

```vue
<script setup>
import { DuxPageForm, DuxFormItem, DuxFormLayout } from '@duxweb/dvha-pro'
import { NInput, NInputNumber } from 'naive-ui'
import { ref } from 'vue'

const formData = ref({
  name: '',
  email: '',
  age: null
})

const handleSuccess = (data) => {
  console.log('表单提交成功:', data)
}
</script>

<template>
  <DuxPageForm
    path="/api/users"
    action="create"
    :data="formData"
    size="large"
    @success="handleSuccess"
  >
    <template #default="{ form, isLoading }">
      <DuxFormLayout label-placement="top" divider>
        <DuxFormItem label="姓名" path="name" rule="required">
          <NInput v-model:value="form.name" :disabled="isLoading" />
        </DuxFormItem>

        <DuxFormItem label="邮箱" path="email" rule="required|email">
          <NInput v-model:value="form.email" :disabled="isLoading" />
        </DuxFormItem>

        <DuxFormItem label="年龄" path="age" rule="required|numeric">
          <NInputNumber v-model:value="form.age" :disabled="isLoading" />
        </DuxFormItem>
      </DuxFormLayout>
    </template>
  </DuxPageForm>
</template>
```

## DuxDrawerForm 抽屉表单

抽屉表单组件，适用于侧边栏表单：

```vue
<script setup>
import { DuxDrawerForm, DuxFormItem } from '@duxweb/dvha-pro'
import { NInput } from 'naive-ui'
import { ref } from 'vue'

const props = defineProps({
  id: [String, Number]
})

const model = ref({
  name: '',
  description: ''
})
</script>

<template>
  <DuxDrawerForm
    :id="props.id"
    path="system/category"
    :data="model"
    title="分类管理"
    @close="$emit('close')"
  >
    <DuxFormItem label="分类名称" path="name" rule="required">
      <NInput v-model:value="model.name" />
    </DuxFormItem>

    <DuxFormItem label="描述" path="description">
      <NInput
        v-model:value="model.description"
        type="textarea"
        :rows="4"
      />
    </DuxFormItem>
  </DuxDrawerForm>
</template>
```

## DuxSettingForm 设置表单

设置表单组件，适用于设置页面，支持标签页布局：

```vue
<script setup>
import { DuxSettingForm, DuxFormItem, DuxFormLayout } from '@duxweb/dvha-pro'
import { NInput, NSwitch, NTabPane } from 'naive-ui'
import { ref } from 'vue'

const settingsData = ref({
  siteName: '',
  siteUrl: '',
  emailEnabled: false,
  emailHost: ''
})
</script>

<template>
  <DuxSettingForm
    path="/api/settings"
    action="edit"
    :data="settingsData"
    tabs
    default-tab="basic"
    size="large"
  >
    <NTabPane name="basic" tab="基础设置">
      <DuxFormLayout label-placement="setting" divider>
        <DuxFormItem label="站点名称" path="siteName" rule="required">
          <NInput v-model:value="settingsData.siteName" />
        </DuxFormItem>

        <DuxFormItem label="站点URL" path="siteUrl" rule="required|url">
          <NInput v-model:value="settingsData.siteUrl" />
        </DuxFormItem>
      </DuxFormLayout>
    </NTabPane>

    <NTabPane name="email" tab="邮件设置">
      <DuxFormLayout label-placement="setting" divider>
        <DuxFormItem label="启用邮件" path="emailEnabled">
          <NSwitch v-model:value="settingsData.emailEnabled" />
        </DuxFormItem>

        <DuxFormItem label="邮件主机" path="emailHost" rule="required_if:emailEnabled,true">
          <NInput
            v-model:value="settingsData.emailHost"
            :disabled="!settingsData.emailEnabled"
          />
        </DuxFormItem>
      </DuxFormLayout>
    </NTabPane>
  </DuxSettingForm>
</template>
```

## 表单验证规则

### 内置验证规则

DVHA 表单支持多种内置验证规则：

```vue
<template>
  <DuxModalForm path="system/user" :data="model">
    <!-- 必填验证 -->
    <DuxFormItem label="用户名" path="username" rule="required">
      <NInput v-model:value="model.username" />
    </DuxFormItem>

    <!-- 邮箱验证 -->
    <DuxFormItem label="邮箱" path="email" rule="required|email">
      <NInput v-model:value="model.email" />
    </DuxFormItem>

    <!-- 数字验证 -->
    <DuxFormItem label="年龄" path="age" rule="required|numeric|min:18|max:100">
      <NInputNumber v-model:value="model.age" />
    </DuxFormItem>

    <!-- 长度验证 -->
    <DuxFormItem label="密码" path="password" rule="required|min:6|max:20">
      <NInput v-model:value="model.password" type="password" />
    </DuxFormItem>

    <!-- 条件验证 -->
    <DuxFormItem label="确认密码" path="password_confirmation" rule="required|confirmed:password">
      <NInput v-model:value="model.password_confirmation" type="password" />
    </DuxFormItem>

    <!-- 正则验证 -->
    <DuxFormItem label="手机号" path="phone" rule="required|regex:/^1[3-9]\d{9}$/">
      <NInput v-model:value="model.phone" />
    </DuxFormItem>
  </DuxModalForm>
</template>
```

### 自定义验证规则

```vue
<script setup>
const customRules = {
  username: [
    { required: true, message: '请输入用户名' },
    { min: 3, max: 20, message: '用户名长度为3-20个字符' },
    {
      validator: (rule, value) => {
        return /^[a-zA-Z0-9_]+$/.test(value)
      },
      message: '用户名只能包含字母、数字和下划线'
    }
  ]
}
</script>

<template>
  <DuxModalForm path="system/user" :data="model" :rules="customRules">
    <DuxFormItem label="用户名" path="username">
      <NInput v-model:value="model.username" />
    </DuxFormItem>
  </DuxModalForm>
</template>
```

## 表单布局

### DuxFormLayout 布局组件

```vue
<template>
  <DuxModalForm path="system/user" :data="model">
    <DuxFormLayout label-placement="top" divider>
      <DuxFormItem label="基本信息" type="divider" />

      <DuxFormItem label="用户名" path="username" rule="required">
        <NInput v-model:value="model.username" />
      </DuxFormItem>

      <DuxFormItem label="邮箱" path="email" rule="required|email">
        <NInput v-model:value="model.email" />
      </DuxFormItem>

      <DuxFormItem label="联系方式" type="divider" />

      <DuxFormItem label="手机号" path="phone">
        <NInput v-model:value="model.phone" />
      </DuxFormItem>
    </DuxFormLayout>
  </DuxModalForm>
</template>
```

### 响应式布局

```vue
<template>
  <DuxModalForm path="system/user" :data="model">
    <DuxFormLayout :cols="{ xs: 1, sm: 2, md: 3 }">
      <DuxFormItem label="姓名" path="name" rule="required">
        <NInput v-model:value="model.name" />
      </DuxFormItem>

      <DuxFormItem label="年龄" path="age" rule="required|numeric">
        <NInputNumber v-model:value="model.age" />
      </DuxFormItem>

      <DuxFormItem label="性别" path="gender">
        <NSelect
          v-model:value="model.gender"
          :options="[
            { label: '男', value: 'male' },
            { label: '女', value: 'female' }
          ]"
        />
      </DuxFormItem>
    </DuxFormLayout>
  </DuxModalForm>
</template>
```

## 高级功能

### 动态表单渲染

```vue
<script setup>
import { DuxFormRenderer, DuxModalForm } from '@duxweb/dvha-pro'
import { useOne } from '@duxweb/dvha-core'
import { computed, ref } from 'vue'

const props = defineProps({
  id: [String, Number],
  name: String,
  config: Object
})

// 获取表单配置
const { data: configData } = useOne({
  path: `data/config/${props.name}/config`,
  options: {
    enabled: !props.config
  }
})

// 表单数据结构
const data = computed(() => {
  return props.config?.form_data?.data || configData.value?.data?.form_data?.data || []
})

// 表单配置
const config = computed(() => {
  return props.config?.form_data?.config || configData.value?.data?.form_data?.config || []
})

const model = ref({})
</script>

<template>
  <DuxModalForm :id="props.id" :path="`data/data/${props.name}`" :data="model">
    <DuxFormRenderer
      v-model:value="model"
      :data="data"
      :config="config"
      :readonly="false"
      :disabled="false"
    />
  </DuxModalForm>
</template>
```

### 文件上传组件

```vue
<template>
  <DuxFormItem label="头像" path="avatar">
    <DuxUpload
      v-model:value="model.avatar"
      type="image"
      accept="image/*"
      :max-size="2 * 1024 * 1024"
      :max-count="1"
    />
  </DuxFormItem>

  <DuxFormItem label="附件" path="files">
    <DuxUpload
      v-model:value="model.files"
      type="file"
      :max-size="10 * 1024 * 1024"
      :max-count="5"
      multiple
    />
  </DuxFormItem>
</template>
```

### 富文本编辑器

```vue
<template>
  <DuxFormItem label="内容" path="content" rule="required">
    <DuxEditor
      v-model:value="model.content"
      :height="400"
      :toolbar="['bold', 'italic', 'underline', 'link', 'image']"
    />
  </DuxFormItem>
</template>
```

## 最佳实践

### 1. 表单数据初始化

```vue
<script setup>
// 设置合理的默认值
const model = ref({
  status: true,        // 布尔值默认值
  sort: 0,            // 数值默认值
  category_id: null,   // 外键默认值
  tags: [],           // 数组默认值
  config: {}          // 对象默认值
})

// 根据编辑模式初始化数据
const initFormData = (id) => {
  if (id) {
    // 编辑模式：从 API 加载数据
    loadUserData(id).then(data => {
      Object.assign(model.value, data)
    })
  } else {
    // 新建模式：使用默认值
    model.value = {
      status: true,
      sort: 0,
      category_id: null,
      tags: []
    }
  }
}
</script>
```

### 2. 条件显示和联动

```vue
<template>
  <DuxModalForm path="system/user" :data="model">
    <DuxFormItem label="用户类型" path="type" rule="required">
      <NSelect v-model:value="model.type" :options="typeOptions" />
    </DuxFormItem>

    <!-- 条件显示 -->
    <DuxFormItem v-if="model.type === 'admin'" label="管理权限" path="permissions">
      <NCheckboxGroup v-model:value="model.permissions" :options="permissionOptions" />
    </DuxFormItem>

    <!-- 字段联动 -->
    <DuxFormItem label="部门" path="dept_id" rule="required">
      <DuxCascader
        v-model:value="model.dept_id"
        path="system/dept"
        @change="handleDeptChange"
      />
    </DuxFormItem>

    <DuxFormItem label="角色" path="role_id" rule="required">
      <DuxSelect
        v-model:value="model.role_id"
        :path="`system/role?dept_id=${model.dept_id}`"
        :disabled="!model.dept_id"
      />
    </DuxFormItem>
  </DuxModalForm>
</template>

<script setup>
const handleDeptChange = (value) => {
  // 部门变化时重置角色选择
  model.value.role_id = null
}
</script>
```

### 3. 表单提交处理

```vue
<script setup>
const handleSuccess = (data) => {
  message.success('保存成功')
  // 刷新父组件数据
  emit('refresh')
  // 关闭表单
  emit('close')
}

const handleError = (error) => {
  console.error('表单提交失败:', error)
  message.error(error.message || '保存失败，请重试')
}

const beforeSubmit = (formData) => {
  // 提交前的数据处理
  return {
    ...formData,
    // 格式化时间
    created_at: formData.created_at ? dayjs(formData.created_at).format('YYYY-MM-DD HH:mm:ss') : null,
    // 处理数组数据
    tags: formData.tags?.join(',') || '',
    // 移除空值
    ...Object.fromEntries(
      Object.entries(formData).filter(([_, value]) => value !== null && value !== '')
    )
  }
}
</script>

<template>
  <DuxModalForm
    path="system/user"
    :data="model"
    @success="handleSuccess"
    @error="handleError"
    :before-submit="beforeSubmit"
  >
    <!-- 表单内容 -->
  </DuxModalForm>
</template>
```

### 4. 表单性能优化

```vue
<script setup>
// 使用防抖优化搜索
import { debounce } from 'lodash-es'

const debouncedSearch = debounce((keyword) => {
  // 执行搜索逻辑
}, 300)

// 大数据量选择器优化
const loadOptions = async (query) => {
  if (!query || query.length < 2) return []

  const response = await searchUsers({ keyword: query, limit: 50 })
  return response.data.map(user => ({
    label: `${user.name} (${user.email})`,
    value: user.id
  }))
}
</script>

<template>
  <DuxFormItem label="用户搜索" path="user_id">
    <NSelect
      v-model:value="model.user_id"
      filterable
      remote
      :loading="searchLoading"
      :options="userOptions"
      @search="debouncedSearch"
    />
  </DuxFormItem>
</template>
```

## 相关资源

### 官方文档
- **表单组件文档**：[https://duxweb.dux.plus/dvha/pro/components/form](https://duxweb.dux.plus/dvha/pro/components/form)
- **表单 Hooks 文档**：[https://duxweb.dux.plus/dvha/pro/hooks/form](https://duxweb.dux.plus/dvha/pro/hooks/form)
- **DVHA Pro 完整文档**：[https://duxweb.dux.plus/dvha/pro/](https://duxweb.dux.plus/dvha/pro/)

### 相关文档
- [前端开发说明](./components.md) - 了解 DuxLite 前端开发方式
- [Hooks 使用指南](./hooks.md) - 学习常用 Hooks 的使用方法
- [表格设计](./tables.md) - 学习表格组件的使用

通过这些表单设计模式，您可以创建出功能完善、用户体验良好的管理界面。