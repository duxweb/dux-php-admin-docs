# 数据管理

数据管理是 Dux PHP Admin 的核心特色功能，提供可视化的数据配置和管理解决方案。通过数据配置、字段设计、表单设计和表格设计，实现方便的数据同步管理，不需要在数据库中直接操作。

## 功能概览

### 核心特色
- **数据同步配置**：通过可视化界面配置数据结构和管理界面
- **动态API生成**：自动生成RESTful API接口
- **自动菜单生成**：自动创建管理菜单和权限
- **灵活权限控制**：支持API权限和数据权限配置
- **丰富字段类型**：支持文本、数字、日期、文件、富文本等多种字段类型
- **关联数据支持**：支持与其他数据模型的关联关系

### 访问路径
- **数据配置管理**：`/admin/data/config`
- **动态数据管理**：`/admin/data/data/{配置标识}`

### 应用场景
- **内容管理**：文章、新闻、产品、广告等内容管理
- **业务数据**：客户资料、订单信息、库存数据等业务管理
- **配置数据**：数据字典、系统参数、分类数据等配置管理
- **用户数据**：用户反馈、调查问卷、表单收集等用户数据

## 数据配置管理

### 创建数据配置

#### 基本信息配置
通过数据配置列表页面创建新的数据配置：

**必填字段**：
- **数据名称** (`name`)：显示名称，如"文章管理"
- **数据标识** (`label`)：唯一标识符，用于API路径，如"article"

**数据类型配置**：
- **表格类型** (`table_type`)：
  - `list` - 普通列表（默认）
  - `tree` - 树形结构
- **表单类型** (`form_type`)：
  - `modal` - 弹窗表单（默认）
  - `page` - 独立页面表单

**API权限配置**：
- `api_sign` - 是否需要签名验证
- `api_user` - 是否需要用户认证
- `api_user_self` - 是否限制用户只能操作自己的数据
- `api_list` - 启用列表接口
- `api_info` - 启用详情接口
- `api_create` - 启用创建接口
- `api_update` - 启用更新接口
- `api_delete` - 启用删除接口

### 配置管理功能

#### 数据配置列表
```php
public function queryMany(Builder $query, ServerRequestInterface $request, array $args): void
{
    $params = $request->getQueryParams();
    $keyword = $params['keyword'] ?? '';
    if ($keyword) {
        $query->where('name', 'like', "%{$keyword}%");
    }
    $query->orderBy('id');
}
```

#### 配置信息获取
```php
#[Action(methods: 'GET', route: '/{name}/config')]
public function config(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
{
    $name = $args['name'];
    $info = DataConfig::query()->where('label', $name)->first();
    return send($response, 'ok', $info);
}
```

## 字段设计器

字段设计器是数据管理的核心功能，用于定义数据结构和字段属性。

### 字段配置流程

1. **进入字段设计**：在数据配置列表中点击"字段"按钮
2. **添加字段**：点击"添加字段"按钮
3. **配置字段属性**：
   - **字段名称**：数据库字段名（如：title、content）
   - **字段标题**：显示标签（如：标题、内容）
   - **字段类型**：选择合适的字段类型
   - **是否必填**：设置字段验证规则
   - **默认值**：设置字段初始值
   - **提示信息**：字段输入提示
4. **保存配置**：完成字段配置后保存

### 支持的字段类型

#### 文本输入类
- **文本** (`input`)：单行文本输入
- **多行文本** (`textarea`)：多行文本输入
- **富文本** (`editor`)：HTML富文本编辑器
- **数字** (`number`)：数字输入
- **密码** (`password`)：密码输入

#### 选择类
- **下拉选择** (`select`)：单选下拉框
- **单选按钮** (`radio`)：单选按钮组
- **多选框** (`checkbox`)：多选框组
- **开关** (`switch`)：开关切换

#### 日期时间类
- **日期** (`date`)：日期选择器
- **日期时间** (`datetime`)：日期时间选择器
- **时间** (`time`)：时间选择器

#### 文件上传类
- **文件上传** (`upload`)：通用文件上传
- **图片上传** (`image`)：图片文件上传

#### 特殊类型
- **标签** (`tags`)：标签输入器
- **关联选择** (`relation`)：关联其他数据模型

### 系统保留字段

以下字段为系统保留，不可在字段设计器中使用：
- `id` - 主键ID
- `parent_id` - 父级ID（树形结构）
- `config_id` - 配置ID
- `has_type` - 关联类型
- `has_id` - 关联ID
- `created_at` - 创建时间
- `updated_at` - 更新时间

### 字段设计API

#### 获取字段配置
```php
#[Action(methods: 'GET', route: '/{id}/field')]
public function fieldDesign(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
{
    $id = (int) $args['id'];
    $info = DataConfig::query()->find($id);
    return send($response, 'ok', $info->field_data);
}
```

#### 保存字段配置
```php
#[Action(methods: 'PUT', route: '/{id}/field')]
public function fieldSave(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
{
    $data = $request->getParsedBody();
    $id = (int) $args['id'];
    $info = DataConfig::query()->find($id);

    // 验证系统保留字段
    $systemFields = ['id', 'parent_id', 'config_id', 'has_type', 'has_id', 'created_at', 'updated_at'];
    foreach ($data['data'] as $vo) {
        if (in_array($vo['field'], $systemFields)) {
            throw new ExceptionBusiness('字段名不能使用系统保留字');
        }
    }

    $info->field_data = $data;
    $info->save();
    return send($response, 'ok');
}
```

## 表单设计器

表单设计器用于定义数据录入表单的布局和字段显示方式。

### 表单配置功能

1. **进入表单设计**：在数据配置列表中点击"表单"按钮
2. **拖拽字段**：从左侧字段列表拖拽到表单区域
3. **配置字段属性**：
   - **显示标签**：字段在表单中的显示名称
   - **占用宽度**：字段在表单中的宽度比例
   - **表单控件**：选择合适的输入控件类型
   - **验证规则**：设置字段验证条件
   - **提示信息**：字段输入提示文本
4. **布局调整**：通过拖拽调整字段顺序和布局
5. **保存表单**：完成表单设计后保存配置

### 表单控件类型

#### 基础控件
- `input` - 文本输入框
- `textarea` - 多行文本域
- `number` - 数字输入框
- `password` - 密码输入框

#### 选择控件
- `select` - 下拉选择框
- `radio` - 单选按钮组
- `checkbox` - 多选框组
- `switch` - 开关切换器

#### 日期时间控件
- `date` - 日期选择器
- `datetime` - 日期时间选择器
- `time` - 时间选择器

#### 文件控件
- `upload` - 文件上传器
- `image` - 图片上传器

#### 高级控件
- `editor` - 富文本编辑器
- `markdown` - Markdown编辑器
- `tags` - 标签输入器

### 表单设计API

#### 获取表单配置
```php
#[Action(methods: 'GET', route: '/{id}/form')]
public function formDesign(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
{
    $id = (int) $args['id'];
    $info = DataConfig::query()->find($id);
    return send($response, 'ok', $info->form_data);
}
```

#### 保存表单配置
```php
#[Action(methods: 'PUT', route: '/{id}/form')]
public function formSave(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
{
    $data = $request->getParsedBody();
    $id = (int) $args['id'];
    $info = DataConfig::query()->find($id);

    $info->form_data = $data['data'];
    $info->save();
    return send($response, 'ok');
}
```

## 表格设计器

表格设计器用于定义数据列表的展示方式和列配置。

### 表格配置功能

1. **进入表格设计**：在数据配置列表中点击"表格"按钮
2. **选择显示字段**：勾选需要在列表中显示的字段
3. **配置列属性**：
   - **列标题**：列在表格中的显示名称
   - **列宽度**：设置列的显示宽度
   - **对齐方式**：左对齐、居中、右对齐
   - **是否排序**：该列是否支持排序功能
   - **格式化**：数据显示格式化方式
4. **操作列配置**：设置表格操作按钮
5. **保存配置**：完成表格设计后保存

### 列格式化类型

#### 文本类
- `text` - 普通文本显示
- `link` - 链接显示
- `tag` - 标签显示

#### 状态类
- `status` - 状态标识
- `switch` - 开关状态
- `progress` - 进度条

#### 数值类
- `number` - 数字格式化
- `currency` - 货币格式
- `percentage` - 百分比

#### 日期时间类
- `date` - 日期格式
- `datetime` - 日期时间格式
- `time` - 时间格式
- `relative` - 相对时间

#### 媒体类
- `image` - 图片缩略图
- `file` - 文件链接
- `avatar` - 头像显示

#### 关联类
- `relation` - 关联数据显示
- `array` - 数组数据展示

### 表格设计API

#### 获取表格配置
```php
#[Action(methods: 'GET', route: '/{id}/table')]
public function tableDesign(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
{
    $id = (int) $args['id'];
    $info = DataConfig::query()->find($id);
    return send($response, 'ok', $info->table_data);
}
```

#### 保存表格配置
```php
#[Action(methods: 'PUT', route: '/{id}/table')]
public function tableSave(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
{
    $data = $request->getParsedBody();
    $id = (int) $args['id'];
    $info = DataConfig::query()->find($id);

    $info->table_data = $data;
    $info->save();
    return send($response, 'ok');
}
```

## 关联配置

数据管理支持与其他数据模型建立关联关系。

### 模型关联配置

1. **进入关联配置**：在字段设计器中点击"关联配置"
2. **选择关联模型**：从可用模型列表中选择
3. **设置关联类型**：
   - `belongsTo` - 从属关系（多对一）
   - `hasOne` - 拥有关系（一对一）
   - `hasMany` - 拥有关系（一对多）
   - `belongsToMany` - 多对多关系
4. **配置关联参数**：
   - **外键字段**：关联的外键字段名
   - **本地键**：本模型的关联键
   - **中间表**：多对多关系的中间表（如需要）

### 可用模型列表

系统自动扫描所有带有 `#[AutoMigrate]` 注解的模型类：

```php
#[Action(methods: 'GET', route: '/models')]
public function models(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
{
    $models = [];
    $attributes = App::attributes();
    
    foreach ($attributes as $attribute) {
        if (empty($attribute['annotations'])) {
            continue;
        }
        
        foreach ($attribute['annotations'] as $annotation) {
            if ($annotation['name'] === AutoMigrate::class) {
                $className = $attribute['class'];
                $modelName = substr($className, strrpos($className, '\\') + 1);

                $models[] = [
                    'label' => $modelName,
                    'value' => $className,
                ];
                break;
            }
        }
    }
    
    usort($models, function($a, $b) {
        return strcasecmp($a['label'], $b['label']);
    });
    
    return send($response, 'ok', $models);
}
```

## API接口生成

数据配置完成后，系统会根据配置自动生成对应的API接口。

### API路径规则

根据数据配置的标识（label）自动生成前端API路径：

| 方法 | 路径 | 说明 | 权限控制 |
|------|------|------|----------|
| GET | `/api/data/{label}` | 获取数据列表 | `api_list` |
| GET | `/api/data/{label}/{id}` | 获取单条数据 | `api_info` |
| POST | `/api/data/{label}` | 创建数据 | `api_create` |
| PUT | `/api/data/{label}/{id}` | 更新数据 | `api_update` |
| DELETE | `/api/data/{label}/{id}` | 删除数据 | `api_delete` |

### 数据处理流程

数据管理系统提供完整的数据处理流程，确保数据的准确性和安全性：

#### 查询处理
- 基于配置和参数构建查询条件
- 处理配置的关联关系
- 自动应用数据权限过滤
- 支持搜索、排序、筛选功能

#### 数据保存
- 基于字段配置验证数据
- 将表单数据格式化为存储格式
- 处理关联数据的保存
- 将结构化数据转换为JSON存储

## 菜单权限生成

数据配置完成后，可以自动生成对应的管理菜单和权限。

### 菜单生成功能

系统提供自动菜单生成功能，能够根据数据配置自动创建对应的管理菜单：

1. **主菜单创建**：创建数据管理的主菜单项
2. **权限按钮生成**：自动生成详情、创建、编辑、删除等权限按钮
3. **子菜单支持**：当表单类型为页面模式时，生成创建和编辑子菜单
4. **权限标识**：使用 `data.{label}` 作为权限前缀

### 菜单配置规则

**菜单路径**：`data/{配置标识}`
**权限前缀**：`data.{配置标识}`
**页面组件**：
- 列表页面：`Data/Data/table`
- 表单页面：`Data/Data/page`（仅当表单类型为page时）

### 权限节点
自动生成以下权限节点：
- `{label}.show` - 查看权限
- `{label}.create` - 创建权限
- `{label}.edit` - 编辑权限
- `{label}.store` - 更新权限
- `{label}.delete` - 删除权限

### 权限控制

生成的菜单会自动添加到权限系统中：
- **角色分配**：为不同角色分配数据管理权限
- **按钮权限**：控制用户对数据的具体操作权限
- **数据权限**：结合数据权限设置控制数据访问范围

## 数据存储机制

### 统一数据表结构

数据管理使用统一的数据表存储所有动态数据：

**核心字段**：
- `id` - 数据主键
- `config_id` - 关联的配置ID
- `data` - JSON格式存储的具体数据内容
- `created_at` / `updated_at` - 时间戳

**关联字段**（用于关联查询）：
- `has_type` - 关联模型类型
- `has_id` - 关联模型ID

**树形结构字段**（当table_type为tree时）：
- `parent_id` - 父级数据ID

### 数据处理流程

#### 数据保存处理
1. **数据验证**：基于字段配置验证数据
2. **格式化处理**：将表单数据格式化为存储格式
3. **关联处理**：处理关联数据的保存
4. **JSON存储**：将结构化数据转换为JSON存储

#### 数据查询处理
1. **配置加载**：根据数据标识加载对应配置
2. **查询构建**：基于配置和参数构建查询条件
3. **关联处理**：处理配置的关联关系
4. **数据转换**：将JSON数据转换为结构化格式
5. **权限过滤**：应用数据权限过滤

## 最佳实践

### 配置设计建议

1. **标识命名**：使用有意义的英文标识，避免中文和特殊字符
2. **字段设计**：合理规划字段类型，避免过度复杂的嵌套结构
3. **权限设置**：根据实际需要开启API权限，避免不必要的安全风险
4. **关联设计**：谨慎设计数据关联，避免循环引用

### 性能优化

1. **查询优化**：为常用筛选字段添加索引
2. **数据量控制**：大数据量场景使用分页和筛选
3. **关联控制**：避免过深的关联查询
4. **缓存策略**：对配置数据进行适当缓存

### 维护建议

1. **定期清理**：清理无用的配置和数据
2. **备份重要数据**：对重要业务数据定期备份
3. **监控使用情况**：关注数据量增长和性能表现
4. **权限审核**：定期审核数据权限分配

通过强大的数据管理功能，用户可以快速创建和管理各种业务数据，方便管理字段和数据结构同步，大幅提升开发效率。