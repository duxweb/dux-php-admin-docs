# 菜单服务

DuxLite 的菜单系统是完全自动化的，通过读取模块中的 `app.json` 文件的菜单配置，自动同步到数据库的菜单表。无需手动编写代码调用。

## 🚀 快速开始

### 菜单配置文件

在模块根目录的 `app.json` 文件中配置菜单：

```json
{
  "name": "duxweb/your-module",
  "description": "Your Module",
  "version": "1.0.0",
  "adminMenu": [
    {
      "type": "menu",
      "label": "首页",
      "name": "yourmodule.index",
      "label_lang": "yourmodule.index",
      "path": "yourmodule/index",
      "icon": "i-tabler:dashboard",
      "loader": "YourModule/Home/index",
      "hidden": false,
      "sort": 0
    },
    {
      "type": "directory",
      "label": "内容管理",
      "name": "yourmodule.content",
      "icon": "i-tabler:folder",
      "sort": 100,
      "children": [
        {
          "type": "menu",
          "label": "文章管理",
          "name": "yourmodule.article.list",
          "path": "yourmodule/article",
          "loader": "YourModule/Article/table",
          "sort": 101
        }
      ]
    }
  ]
}
```

### 自动同步菜单

使用命令行工具同步菜单到数据库：

```bash
# 同步所有模块的 admin 菜单
php artisan menu:sync admin

# 同步指定模块的菜单
php artisan menu:sync admin YourModule

# 同步所有应用类型的菜单
php artisan menu:sync
```

## 📋 菜单配置详解

### 菜单项字段说明

基于 `app/System/app.json` 的实际配置：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | string | ✅ | 菜单类型：`menu`（菜单项）或 `directory`（目录） |
| `label` | string | ✅ | 菜单显示名称 |
| `name` | string | ✅ | 菜单唯一标识，建议格式：`module.page.action` |
| `label_lang` | string | ❌ | 多语言标识，用于国际化 |
| `path` | string | ❌ | 前端路由路径，`directory` 类型可为空 |
| `icon` | string | ❌ | 图标类名，支持 Tabler Icons |
| `loader` | string | ❌ | 前端组件加载路径 |
| `hidden` | boolean | ❌ | 是否隐藏菜单，默认 `false` |
| `sort` | number | ❌ | 排序权重，数字越小越靠前 |
| `children` | array | ❌ | 子菜单数组，仅 `directory` 类型支持 |

### 菜单类型

#### 1. 菜单项 (menu)

```json
{
  "type": "menu",
  "label": "用户管理",
  "name": "system.user.list",
  "label_lang": "system.user.list",
  "path": "system/user",
  "icon": "i-tabler:users",
  "loader": "System/User/table",
  "hidden": false,
  "sort": 100
}
```

#### 2. 目录 (directory)

```json
{
  "type": "directory",
  "label": "系统管理",
  "name": "system",
  "icon": "i-tabler:settings",
  "sort": 9999,
  "children": [
    {
      "type": "menu",
      "label": "配置管理",
      "name": "system.config",
      "path": "system/config",
      "loader": "System/Config/index"
    }
  ]
}
```

### 图标规范

使用 Tabler Icons，格式为 `i-tabler:icon-name`：

```json
{
  "icon": "i-tabler:dashboard",     // 仪表盘
  "icon": "i-tabler:users",        // 用户
  "icon": "i-tabler:settings",     // 设置
  "icon": "i-tabler:folder",       // 文件夹
  "icon": "i-tabler:file-text",    // 文档
  "icon": "i-tabler:database"      // 数据库
}
```

## 🔧 实际应用示例

### 1. 内容管理模块菜单

```json
{
  "name": "duxweb/content",
  "description": "Content Management Module",
  "version": "1.0.0",
  "adminMenu": [
    {
      "type": "directory",
      "label": "内容管理",
      "name": "content",
      "icon": "i-tabler:article",
      "sort": 200,
      "children": [
        {
          "type": "menu",
          "label": "文章管理",
          "name": "content.article.list",
          "label_lang": "content.article.list",
          "path": "content/article",
          "loader": "Content/Article/table",
          "sort": 201,
          "children": [
            {
              "type": "menu",
              "label": "新增文章",
              "name": "content.article.create",
              "path": "content/article/create",
              "loader": "Content/Article/form",
              "hidden": true
            },
            {
              "type": "menu",
              "label": "编辑文章",
              "name": "content.article.edit",
              "path": "content/article/:id/edit",
              "loader": "Content/Article/form",
              "hidden": true
            }
          ]
        },
        {
          "type": "menu",
          "label": "分类管理",
          "name": "content.category.list",
          "path": "content/category",
          "loader": "Content/Category/table",
          "sort": 202
        }
      ]
    }
  ]
}
```

### 2. 电商模块菜单

```json
{
  "name": "duxweb/shop",
  "description": "E-commerce Module",
  "version": "1.0.0",
  "adminMenu": [
    {
      "type": "directory",
      "label": "商城管理",
      "name": "shop",
      "icon": "i-tabler:shopping-cart",
      "sort": 300,
      "children": [
        {
          "type": "directory",
          "label": "商品管理",
          "name": "shop.product",
          "sort": 301,
          "children": [
            {
              "type": "menu",
              "label": "商品列表",
              "name": "shop.product.list",
              "path": "shop/product",
              "loader": "Shop/Product/table",
              "sort": 302
            },
            {
              "type": "menu",
              "label": "商品分类",
              "name": "shop.category.list",
              "path": "shop/category",
              "loader": "Shop/Category/table",
              "sort": 303
            }
          ]
        },
        {
          "type": "directory",
          "label": "订单管理",
          "name": "shop.order",
          "sort": 310,
          "children": [
            {
              "type": "menu",
              "label": "订单列表",
              "name": "shop.order.list",
              "path": "shop/order",
              "loader": "Shop/Order/table",
              "sort": 311
            }
          ]
        }
      ]
    }
  ]
}
```
```

### 3. 用户中心模块菜单

```json
{
  "name": "duxweb/user",
  "description": "User Center Module",
  "version": "1.0.0",
  "adminMenu": [
    {
      "type": "directory",
      "label": "用户管理",
      "name": "user",
      "icon": "i-tabler:users",
      "sort": 400,
      "children": [
        {
          "type": "menu",
          "label": "用户列表",
          "name": "user.list",
          "path": "user/list",
          "loader": "User/List/table",
          "sort": 401
        },
        {
          "type": "menu",
          "label": "用户组管理",
          "name": "user.group.list",
          "path": "user/group",
          "loader": "User/Group/table",
          "sort": 402
        }
      ]
    }
  ]
}
```

## 🛠️ 命令行工具

### MenuCommand 使用

基于 `app/System/Command/MenuCommand.php` 的实际实现：

```bash
# 同步所有模块的 admin 菜单
php artisan menu:sync admin

# 同步指定模块的 admin 菜单
php artisan menu:sync admin System
php artisan menu:sync admin Content

# 同步所有应用类型的菜单（admin、api、web 等）
php artisan menu:sync

# 查看命令帮助
php artisan menu:sync --help
```

### 同步流程

1. **读取配置**：扫描所有模块的 `app.json` 文件
2. **解析菜单**：提取 `adminMenu` 配置数组
3. **转换格式**：将树形结构转换为扁平结构
4. **分配ID**：为新菜单分配唯一ID
5. **入库保存**：插入到 `system_menu` 表
6. **修复树形**：重建菜单的树形关系
7. **清除缓存**：清除菜单缓存

### 自动化特性

- **无需手动调用**：菜单服务完全基于配置文件
- **增量同步**：只同步新增的菜单项，不会重复插入
- **树形修复**：自动维护菜单的父子关系
- **缓存管理**：自动清除相关缓存

## 💡 最佳实践

### 1. 菜单命名规范

```json
{
  // ✅ 推荐的命名规范
  "name": "module.page.action",

  // 具体示例
  "name": "content.article.list",     // 内容模块-文章-列表
  "name": "content.article.create",   // 内容模块-文章-创建
  "name": "content.article.edit",     // 内容模块-文章-编辑
  "name": "shop.product.list",        // 商城模块-商品-列表
  "name": "user.profile.edit"         // 用户模块-资料-编辑
}
```

### 2. 路径规范

```json
{
  // ✅ 路径规范
  "path": "module/page",              // 基础路径
  "path": "module/page/create",       // 创建页面
  "path": "module/page/:id/edit",     // 编辑页面（带参数）
  "path": "module/page/:id/detail",   // 详情页面

  // 具体示例
  "path": "content/article",          // 文章列表
  "path": "content/article/create",   // 新增文章
  "path": "content/article/:id/edit", // 编辑文章
  "path": "shop/order/:id/detail"     // 订单详情
}
```

### 3. 排序规范

```json
{
  // ✅ 排序权重规范
  "sort": 0,      // 首页类菜单
  "sort": 100,    // 业务功能菜单
  "sort": 200,    // 内容管理菜单
  "sort": 300,    // 商城管理菜单
  "sort": 9999    // 系统管理菜单（最后）
}
```

### 4. 隐藏菜单使用

```json
{
  // ✅ 隐藏菜单的使用场景
  "hidden": true,  // 用于以下情况：

  // 1. 编辑/详情页面
  {
    "name": "content.article.edit",
    "path": "content/article/:id/edit",
    "hidden": true
  },

  // 2. 弹窗页面
  {
    "name": "user.profile.modal",
    "path": "user/profile/modal",
    "hidden": true
  },

  // 3. 临时禁用的功能
  {
    "name": "shop.payment.config",
    "path": "shop/payment",
    "hidden": true
  }
}
```
```

### 5. 开发流程

```bash
# 1. 在模块中配置菜单
# 编辑 app/YourModule/app.json

# 2. 同步菜单到数据库
php artisan menu:sync admin YourModule

# 3. 验证菜单是否正确同步
# 查看后台菜单是否显示

# 4. 如需修改，更新配置文件后重新同步
php artisan menu:sync admin YourModule
```

## ⚠️ 注意事项

### 1. 菜单同步规则

- **增量同步**：只会添加新菜单，不会删除已存在的菜单
- **名称唯一**：`name` 字段必须在同一应用内唯一
- **父子关系**：通过 `children` 数组建立层级关系
- **自动排序**：根据 `sort` 字段自动排序

### 2. 常见问题

```bash
# 问题1：菜单没有显示
# 解决：检查 hidden 字段是否为 true

# 问题2：菜单顺序不对
# 解决：检查 sort 字段的数值设置

# 问题3：子菜单没有层级
# 解决：检查 children 数组结构是否正确

# 问题4：图标不显示
# 解决：检查图标名称格式是否为 i-tabler:icon-name
```

### 3. 性能考虑

- **菜单缓存**：系统会自动缓存菜单数据
- **按需同步**：只在需要时执行菜单同步
- **批量操作**：避免频繁的单个菜单操作
```

## 🎉 总结

DuxLite 菜单服务的特点：

- **🤖 完全自动化**：基于 `app.json` 配置文件，无需手动编写代码
- **📁 配置驱动**：通过 JSON 配置定义菜单结构和属性
- **🔄 增量同步**：智能同步，只添加新菜单，避免重复
- **🌳 树形结构**：支持多层级菜单嵌套
- **⚡ 命令行工具**：提供便捷的同步命令
- **🎯 灵活配置**：支持图标、排序、隐藏等丰富属性

### 🔄 工作流程

1. **配置菜单**：在模块的 `app.json` 中定义 `adminMenu`
2. **执行同步**：运行 `php artisan menu:sync admin` 命令
3. **自动处理**：系统自动读取配置并同步到数据库
4. **前端显示**：菜单自动在后台界面显示

### 📋 核心优势

- **零代码**：无需编写任何 PHP 代码调用菜单服务
- **声明式**：通过 JSON 配置声明菜单结构
- **标准化**：统一的菜单配置格式和命名规范
- **可维护**：配置文件易于版本控制和维护

通过 DuxLite 的自动化菜单系统，开发者只需专注于菜单配置，系统会自动处理所有的同步和管理工作！
