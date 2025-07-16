# 项目上下文信息

- 文档结构清理完成：删除了重复的目录结构（guide下的backend、core、module、frontend等），移除了不存在的配置链接（task-scheduling、migration、contributing等），统一了文件命名规范，保持了清晰的目录层次结构
- 已根据 dux-lite 实际代码更新数据验证文档：基于 Valitron 验证库，修正了所有错误的验证规则语法（如 min:3 改为 lengthMin, 3），添加了 DuxLite 特有的规则映射说明，包含了实际的验证器实现示例
- 创建了第一个API文档，基于dux-php-admin实际代码示例，包含完整的用户管理API开发流程：Resource属性定义路由、validator方法验证数据、transform方法格式化输出、send函数返回响应，以及自定义API方法的实现
- 修正了第一个API文档：使用RouteGroup和Route属性而非Resource，控制器放在Api目录，app参数使用'api'，路由路径为/api/前缀，完全基于dux-php-admin实际代码示例编写
- 简化了第一个API文档：移除了数据库交互，只保留最基本的接收数据、验证、返回响应的流程，使用简单的Hello控制器示例，让新人能快速理解API开发基础
- 修改了文档配置：去掉了logo配置，在首页移除了hero图片，添加了命令行安装示例和PHP代码示例，使首页更加简洁实用
