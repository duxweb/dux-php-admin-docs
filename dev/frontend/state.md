# 状态管理

在 DVHA 框架中，状态管理主要通过 Vue 3 的 Composition API 和 Pinia 实现。本指南将介绍如何有效管理应用状态。

## 组件级状态

### 基础状态管理

```vue
<script setup>
import { ref, reactive, computed } from 'vue'

// 简单状态
const loading = ref(false)
const count = ref(0)

// 复杂状态对象
const userForm = reactive({
  username: '',
  email: '',
  status: true
})

// 计算属性
const isFormValid = computed(() => {
  return userForm.username && userForm.email
})

// 状态更新方法
const updateUser = (userData) => {
  Object.assign(userForm, userData)
}
</script>
```

### 表单状态管理

```vue
<script setup>
import { ref, watch } from 'vue'

const model = ref({
  name: '',
  email: '',
  role: null
})

const errors = ref({})
const touched = ref({})

// 监听表单变化
watch(model, (newValue, oldValue) => {
  // 清除已修改字段的错误
  Object.keys(newValue).forEach(key => {
    if (newValue[key] !== oldValue[key]) {
      delete errors.value[key]
    }
  })
}, { deep: true })

// 字段验证
const validateField = (field, value) => {
  touched.value[field] = true
  
  if (field === 'email' && value && !isValidEmail(value)) {
    errors.value[field] = '请输入有效的邮箱地址'
  } else {
    delete errors.value[field]
  }
}

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
</script>
```

## 应用级状态

### 全局状态 Store

```javascript
// stores/app.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAppStore = defineStore('app', () => {
  // 状态
  const loading = ref(false)
  const theme = ref('light')
  const sidebarCollapsed = ref(false)
  const notifications = ref([])
  
  // 计算属性
  const notificationCount = computed(() => {
    return notifications.value.filter(n => !n.read).length
  })
  
  // 方法
  const setLoading = (state) => {
    loading.value = state
  }
  
  const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }
  
  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }
  
  const addNotification = (notification) => {
    notifications.value.unshift({
      id: Date.now(),
      read: false,
      timestamp: new Date(),
      ...notification
    })
  }
  
  const markAsRead = (id) => {
    const notification = notifications.value.find(n => n.id === id)
    if (notification) {
      notification.read = true
    }
  }
  
  const clearNotifications = () => {
    notifications.value = []
  }
  
  return {
    // 状态
    loading,
    theme,
    sidebarCollapsed,
    notifications,
    
    // 计算属性
    notificationCount,
    
    // 方法
    setLoading,
    toggleTheme,
    toggleSidebar,
    addNotification,
    markAsRead,
    clearNotifications
  }
})
```

### 用户状态管理

```javascript
// stores/user.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth'

export const useUserStore = defineStore('user', () => {
  // 状态
  const user = ref(null)
  const token = ref(localStorage.getItem('token'))
  const permissions = ref([])
  const roles = ref([])
  
  // 计算属性
  const isAuthenticated = computed(() => {
    return !!token.value && !!user.value
  })
  
  const userName = computed(() => {
    return user.value?.name || '未登录'
  })
  
  const userAvatar = computed(() => {
    return user.value?.avatar || '/default-avatar.png'
  })
  
  // 方法
  const login = async (credentials) => {
    try {
      const response = await authApi.login(credentials)
      
      token.value = response.token
      user.value = response.user
      permissions.value = response.permissions
      roles.value = response.roles
      
      localStorage.setItem('token', response.token)
      
      return response
    } catch (error) {
      throw error
    }
  }
  
  const logout = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      console.error('退出登录失败:', error)
    } finally {
      token.value = null
      user.value = null
      permissions.value = []
      roles.value = []
      localStorage.removeItem('token')
    }
  }
  
  const fetchProfile = async () => {
    try {
      const response = await authApi.profile()
      user.value = response.user
      permissions.value = response.permissions
      roles.value = response.roles
    } catch (error) {
      console.error('获取用户信息失败:', error)
    }
  }
  
  const hasPermission = (permission) => {
    return permissions.value.includes(permission)
  }
  
  const hasRole = (role) => {
    return roles.value.includes(role)
  }
  
  const hasAnyPermission = (permissionList) => {
    return permissionList.some(permission => hasPermission(permission))
  }
  
  return {
    // 状态
    user,
    token,
    permissions,
    roles,
    
    // 计算属性
    isAuthenticated,
    userName,
    userAvatar,
    
    // 方法
    login,
    logout,
    fetchProfile,
    hasPermission,
    hasRole,
    hasAnyPermission
  }
})
```

## 数据缓存

### 接口数据缓存

```javascript
// stores/cache.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCacheStore = defineStore('cache', () => {
  const cache = ref(new Map())
  
  const get = (key) => {
    const item = cache.value.get(key)
    if (!item) return null
    
    // 检查是否过期
    if (item.expireTime && Date.now() > item.expireTime) {
      cache.value.delete(key)
      return null
    }
    
    return item.data
  }
  
  const set = (key, data, ttl = 300000) => { // 默认5分钟
    const expireTime = ttl > 0 ? Date.now() + ttl : null
    cache.value.set(key, {
      data,
      expireTime,
      timestamp: Date.now()
    })
  }
  
  const remove = (key) => {
    cache.value.delete(key)
  }
  
  const clear = () => {
    cache.value.clear()
  }
  
  const has = (key) => {
    return cache.value.has(key) && get(key) !== null
  }
  
  return {
    get,
    set,
    remove,
    clear,
    has
  }
})
```

### 使用缓存的数据获取

```javascript
// composables/useApi.js
import { ref, computed } from 'vue'
import { useCacheStore } from '@/stores/cache'
import request from '@/utils/request'

export function useApi(url, options = {}) {
  const { 
    cache = false, 
    cacheTTL = 300000,
    immediate = true 
  } = options
  
  const cacheStore = useCacheStore()
  const data = ref(null)
  const loading = ref(false)
  const error = ref(null)
  
  const cacheKey = computed(() => `api:${url}`)
  
  const fetchData = async (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    const fullUrl = queryString ? `${url}?${queryString}` : url
    const fullCacheKey = `${cacheKey.value}:${queryString}`
    
    // 检查缓存
    if (cache && cacheStore.has(fullCacheKey)) {
      data.value = cacheStore.get(fullCacheKey)
      return data.value
    }
    
    try {
      loading.value = true
      error.value = null
      
      const response = await request.get(fullUrl)
      data.value = response
      
      // 缓存数据
      if (cache) {
        cacheStore.set(fullCacheKey, response, cacheTTL)
      }
      
      return response
    } catch (err) {
      error.value = err
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const refresh = () => {
    if (cache) {
      cacheStore.remove(cacheKey.value)
    }
    return fetchData()
  }
  
  // 自动加载
  if (immediate) {
    fetchData()
  }
  
  return {
    data,
    loading,
    error,
    fetchData,
    refresh
  }
}
```

## 响应式状态同步

### WebSocket 状态同步

```javascript
// composables/useWebSocket.js
import { ref, onUnmounted } from 'vue'
import { useUserStore } from '@/stores/user'

export function useWebSocket(url) {
  const userStore = useUserStore()
  const connected = ref(false)
  const ws = ref(null)
  
  const connect = () => {
    if (ws.value) return
    
    ws.value = new WebSocket(url)
    
    ws.value.onopen = () => {
      connected.value = true
      console.log('WebSocket 连接已建立')
      
      // 发送认证信息
      if (userStore.token) {
        ws.value.send(JSON.stringify({
          type: 'auth',
          token: userStore.token
        }))
      }
    }
    
    ws.value.onmessage = (event) => {
      const data = JSON.parse(event.data)
      handleMessage(data)
    }
    
    ws.value.onclose = () => {
      connected.value = false
      console.log('WebSocket 连接已断开')
      
      // 重连逻辑
      setTimeout(() => {
        if (userStore.isAuthenticated) {
          connect()
        }
      }, 5000)
    }
    
    ws.value.onerror = (error) => {
      console.error('WebSocket 错误:', error)
    }
  }
  
  const disconnect = () => {
    if (ws.value) {
      ws.value.close()
      ws.value = null
    }
  }
  
  const send = (data) => {
    if (ws.value && connected.value) {
      ws.value.send(JSON.stringify(data))
    }
  }
  
  const handleMessage = (data) => {
    switch (data.type) {
      case 'notification':
        const appStore = useAppStore()
        appStore.addNotification(data.payload)
        break
      case 'user_update':
        userStore.fetchProfile()
        break
      case 'system_update':
        // 处理系统更新
        break
    }
  }
  
  onUnmounted(() => {
    disconnect()
  })
  
  return {
    connected,
    connect,
    disconnect,
    send
  }
}
```

## 最佳实践

### 1. 状态结构设计

```javascript
// 好的状态结构
const store = defineStore('users', () => {
  const users = ref([])
  const currentUser = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const pagination = ref({
    page: 1,
    pageSize: 20,
    total: 0
  })
  
  // 避免深层嵌套
  const userDetails = ref(new Map()) // 使用 Map 存储详情
  
  return {
    users,
    currentUser,
    loading,
    error,
    pagination,
    userDetails
  }
})
```

### 2. 异步操作处理

```javascript
// stores/async.js
export const useAsyncStore = defineStore('async', () => {
  const loadingStates = ref(new Map())
  const errors = ref(new Map())
  
  const createAsyncAction = (key, asyncFn) => {
    return async (...args) => {
      loadingStates.value.set(key, true)
      errors.value.delete(key)
      
      try {
        const result = await asyncFn(...args)
        return result
      } catch (error) {
        errors.value.set(key, error)
        throw error
      } finally {
        loadingStates.value.set(key, false)
      }
    }
  }
  
  const isLoading = (key) => {
    return loadingStates.value.get(key) || false
  }
  
  const getError = (key) => {
    return errors.value.get(key) || null
  }
  
  return {
    createAsyncAction,
    isLoading,
    getError
  }
})
```

### 3. 状态持久化

```javascript
// plugins/persistence.js
import { watch } from 'vue'

export function persistState(store, key, options = {}) {
  const { 
    storage = localStorage,
    serializer = JSON,
    pick = null
  } = options
  
  // 恢复状态
  const savedState = storage.getItem(key)
  if (savedState) {
    try {
      const parsed = serializer.parse(savedState)
      if (pick) {
        Object.keys(parsed).forEach(field => {
          if (pick.includes(field) && store[field] !== undefined) {
            store[field] = parsed[field]
          }
        })
      } else {
        Object.assign(store, parsed)
      }
    } catch (error) {
      console.error('恢复状态失败:', error)
    }
  }
  
  // 监听状态变化
  watch(
    () => store.$state,
    (state) => {
      try {
        const toSave = pick ? 
          Object.fromEntries(
            Object.entries(state).filter(([key]) => pick.includes(key))
          ) : state
        storage.setItem(key, serializer.stringify(toSave))
      } catch (error) {
        console.error('保存状态失败:', error)
      }
    },
    { deep: true }
  )
}
```

通过合理的状态管理，您可以构建出响应迅速、数据一致的用户界面。