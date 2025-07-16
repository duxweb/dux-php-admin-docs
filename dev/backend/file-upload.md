# 文件上传

DuxLite 提供了基于继承的文件上传解决方案，通过继承 `App\System\Extends\Upload` 基类来实现自定义上传功能。

## 🚀 快速开始

### 继承上传基类

基于 `app/System/Admin/Upload.php` 的实际代码：

```php
<?php

namespace App\YourModule\Admin;

use Core\Route\Attribute\Route;
use Core\Route\Attribute\RouteGroup;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

#[RouteGroup(app: 'admin', route: '/your-module/upload')]
class Upload extends \App\System\Extends\Upload
{
    #[Route(methods: 'GET', route: '')]
    public function sign(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $params = $request->getQueryParams();
        return send($response, "ok", parent::uploadSign(
            filename: $params['name'],
            mime: $params['mime'],
            prefix: 'your-module'
        ));
    }

    #[Route(methods: 'PUT', route: '')]
    public function save(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $data = parent::uploadSave('admin', $request);
        return send($response, "ok", $data);
    }

    #[Route(methods: 'POST', route: '')]
    public function upload(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $params = $request->getParsedBody();
        $manager = !!$params['manager'];
        $folder = $params['folder'] ?: null;
        $mime = $params['mime'];

        $data = parent::uploadStorage(
            hasType: 'admin',
            request: $request,
            manager: $manager,
            mime: $mime,
            folder: $folder,
        );

        return send($response, "ok", $data);
    }
}
```

## 📋 上传基类方法

### 核心方法说明

基于 `app/System/Extends/Upload.php` 的实际代码：

#### 1. uploadSign() - 获取 S3 协议上传签名

用于前端直传到云存储（S3 协议）：

```php
public function uploadSign(
    string $filename,
    string $mime = '',
    ?int $size = 0,
    string $driver = '',
    string $prefix = ''
): array
```

**参数说明**：
- `$filename`: 文件名
- `$mime`: MIME 类型
- `$size`: 文件大小
- `$driver`: 存储驱动（空则使用默认）
- `$prefix`: 路径前缀

**返回的签名数据结构**：
```php
[
    'url' => 'https://bucket.endpoint.com',     // S3 上传地址
    'params' => [                               // POST 表单参数
        'key' => 'uploads/2024/01/15/file.jpg', // 文件路径
        'policy' => 'base64_encoded_policy',     // 上传策略
        'signature' => 'calculated_signature',   // 签名
        'x-amz-algorithm' => 'AWS4-HMAC-SHA256',
        'x-amz-credential' => 'credential_string',
        'x-amz-date' => '20240115T120000Z',
        // ... 其他 S3 参数
    ],
    'file_field' => 'file'                      // 文件字段名（必须放在最后）
]
```

#### 2. uploadStorage() - 直接上传

处理文件上传到存储：

```php
public function uploadStorage(
    string $hasType,
    ServerRequestInterface $request,
    ?bool $manager = false,
    ?string $mime = '',
    ?string $driver = '',
    ?string $folder = '',
    ?string $prefix = ''
)
```

**参数说明**：
- `$hasType`: 关联类型（如 'admin', 'user'）
- `$request`: 请求对象
- `$manager`: 是否保存到文件管理器
- `$mime`: 指定 MIME 类型
- `$driver`: 存储驱动
- `$folder`: 文件夹 ID
- `$prefix`: 路径前缀

#### 3. uploadSave() - 保存上传记录

保存已上传的文件记录：

```php
public function uploadSave(string $hasType, ServerRequestInterface $request)
```

## 🔧 实际应用示例

### 1. 图片上传控制器

```php
<?php

namespace App\Content\Admin;

use Core\Route\Attribute\Route;
use Core\Route\Attribute\RouteGroup;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

#[RouteGroup(app: 'admin', route: '/content/image')]
class ImageUpload extends \App\System\Extends\Upload
{
    #[Route(methods: 'POST', route: '')]
    public function upload(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $params = $request->getParsedBody();

        // 只允许图片类型
        $data = parent::uploadStorage(
            hasType: 'admin',
            request: $request,
            manager: true,
            mime: 'image/*',  // 限制为图片类型
            folder: $params['folder'] ?? null,
            prefix: 'images'
        );

        return send($response, "ok", $data);
    }

    #[Route(methods: 'GET', route: '/sign')]
    public function sign(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $params = $request->getQueryParams();

        // 验证是否为图片类型
        if (!str_starts_with($params['mime'] ?? '', 'image/')) {
            return send($response, "只允许上传图片文件", null, 400);
        }

        // 获取 S3 协议上传签名
        $signData = parent::uploadSign(
            filename: $params['name'],
            mime: $params['mime'],
            size: (int)($params['size'] ?? 0),
            prefix: 'images'
        );

        return send($response, "ok", $signData);
    }
}
```

### 2. 文档上传控制器

```php
<?php

namespace App\Document\Admin;

use Core\Route\Attribute\Route;
use Core\Route\Attribute\RouteGroup;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

#[RouteGroup(app: 'admin', route: '/document/upload')]
class DocumentUpload extends \App\System\Extends\Upload
{
    private const ALLOWED_DOCUMENT_TYPES = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain'
    ];

    #[Route(methods: 'POST', route: '')]
    public function upload(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $params = $request->getParsedBody();

        // 验证文件类型
        $file = $request->getUploadedFiles()['file'] ?? null;
        if ($file && !in_array($file->getClientMediaType(), self::ALLOWED_DOCUMENT_TYPES)) {
            return send($response, "不支持的文档类型", null, 400);
        }

        $data = parent::uploadStorage(
            hasType: 'admin',
            request: $request,
            manager: true,
            folder: $params['folder'] ?? null,
            prefix: 'documents'
        );

        return send($response, "ok", $data);
    }
}
```

### 3. 头像上传控制器

```php
<?php

namespace App\System\Admin;

use Core\Route\Attribute\Route;
use Core\Route\Attribute\RouteGroup;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

#[RouteGroup(app: 'admin', route: '/system/avatar')]
class AvatarUpload extends \App\System\Extends\Upload
{
    #[Route(methods: 'POST', route: '')]
    public function upload(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        // 获取当前用户ID
        $auth = $request->getAttribute('auth');
        $userId = $auth['id'];

        // 验证文件
        $file = $request->getUploadedFiles()['file'] ?? null;
        if (!$file) {
            return send($response, "请选择头像文件", null, 400);
        }

        // 检查是否为图片
        if (!str_starts_with($file->getClientMediaType(), 'image/')) {
            return send($response, "头像必须是图片文件", null, 400);
        }

        // 检查文件大小（2MB）
        if ($file->getSize() > 2 * 1024 * 1024) {
            return send($response, "头像文件不能超过2MB", null, 400);
        }

        // 上传头像
        $data = parent::uploadStorage(
            hasType: 'admin',
            request: $request,
            manager: false,  // 头像不保存到文件管理器
            mime: 'image/*',
            prefix: "avatars/{$userId}"
        );

        // 更新用户头像
        if ($data && isset($data['url'])) {
            \App\System\Models\SystemUser::where('id', $userId)
                ->update(['avatar' => $data['url']]);
        }

        return send($response, "头像上传成功", $data);
    }
}
```

### 4. 批量上传控制器

```php
<?php

namespace App\System\Admin;

use Core\Route\Attribute\Route;
use Core\Route\Attribute\RouteGroup;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

#[RouteGroup(app: 'admin', route: '/system/batch-upload')]
class BatchUpload extends \App\System\Extends\Upload
{
    #[Route(methods: 'POST', route: '')]
    public function upload(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $files = $request->getUploadedFiles();
        $results = [];
        $successCount = 0;
        $failCount = 0;

        foreach ($files as $key => $file) {
            try {
                $data = parent::uploadStorage(
                    hasType: 'admin',
                    request: $request,
                    manager: true,
                    prefix: 'batch'
                );

                $results[] = [
                    'key' => $key,
                    'filename' => $file->getClientFilename(),
                    'status' => 'success',
                    'data' => $data
                ];
                $successCount++;

            } catch (\Exception $e) {
                $results[] = [
                    'key' => $key,
                    'filename' => $file->getClientFilename(),
                    'status' => 'failed',
                    'message' => $e->getMessage()
                ];
                $failCount++;
            }
        }

        return send($response, "批量上传完成", [
            'total' => count($files),
            'success' => $successCount,
            'failed' => $failCount,
            'results' => $results
        ]);
    }
}
```

### 文档上传服务

```php
<?php

namespace App\Document\Service;

use Core\Upload\Upload;
use App\Document\Models\Document;

class DocumentUploadService
{
    private const DOCUMENT_PATH = 'documents';
    private const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

    /**
     * 上传文档
     */
    public static function uploadDocument(int $userId, $file, array $metadata = []): array
    {
        try {
            // 验证文件
            if (!self::validateDocumentFile($file)) {
                return ['status' => false, 'message' => '文件类型不支持或文件过大'];
            }

            // 生成安全的文件名
            $originalName = $file->getClientFilename();
            $extension = pathinfo($originalName, PATHINFO_EXTENSION);
            $filename = uniqid() . '.' . $extension;

            // 上传文件
            $result = Upload::put($file, [
                'path' => self::DOCUMENT_PATH . '/' . date('Y/m'),
                'filename' => $filename,
                'allowed_types' => ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt']
            ]);

            if (!$result['status']) {
                return $result;
            }

            // 保存文档记录
            $document = Document::create([
                'user_id' => $userId,
                'original_name' => $originalName,
                'filename' => $filename,
                'file_path' => $result['path'],
                'file_url' => $result['url'],
                'file_size' => $file->getSize(),
                'mime_type' => $file->getClientMediaType(),
                'title' => $metadata['title'] ?? $originalName,
                'description' => $metadata['description'] ?? '',
                'category_id' => $metadata['category_id'] ?? null
            ]);

            return [
                'status' => true,
                'document_id' => $document->id,
                'url' => $result['url'],
                'message' => '文档上传成功'
            ];

        } catch (\Exception $e) {
            return ['status' => false, 'message' => '上传失败：' . $e->getMessage()];
        }
    }

    /**
     * 验证文档文件
     */
    private static function validateDocumentFile($file): bool
    {
        // 检查文件大小
        if ($file->getSize() > self::MAX_FILE_SIZE) {
            return false;
        }

        // 检查文件类型
        $allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain'
        ];

        if (!in_array($file->getClientMediaType(), $allowedTypes)) {
            return false;
        }

        return true;
    }

    /**
     * 删除文档
     */
    public static function deleteDocument(int $documentId): bool
    {
        try {
            $document = Document::findOrFail($documentId);
            
            // 删除物理文件
            if (file_exists($document->file_path)) {
                unlink($document->file_path);
            }
            
            // 删除数据库记录
            $document->delete();
            
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }
}
```

### 批量上传处理

```php
<?php

namespace App\System\Service;

use Core\Upload\Upload;

class BatchUploadService
{
    /**
     * 批量上传文件
     */
    public static function batchUpload(array $files, string $path = 'batch'): array
    {
        $results = [];
        $successCount = 0;
        $failCount = 0;

        foreach ($files as $index => $file) {
            try {
                $result = Upload::put($file, $path);
                
                if ($result['status']) {
                    $successCount++;
                    $results[] = [
                        'index' => $index,
                        'status' => 'success',
                        'url' => $result['url'],
                        'filename' => $file->getClientFilename()
                    ];
                } else {
                    $failCount++;
                    $results[] = [
                        'index' => $index,
                        'status' => 'failed',
                        'message' => $result['message'],
                        'filename' => $file->getClientFilename()
                    ];
                }
            } catch (\Exception $e) {
                $failCount++;
                $results[] = [
                    'index' => $index,
                    'status' => 'error',
                    'message' => $e->getMessage(),
                    'filename' => $file->getClientFilename()
                ];
            }
        }

        return [
            'total' => count($files),
            'success' => $successCount,
            'failed' => $failCount,
            'results' => $results
        ];
    }
}
```

## 💡 最佳实践

### 1. 继承基类的优势

```php
// ✅ 继承 Upload 基类的好处：
// 1. 自动处理文件验证和安全检查
// 2. 统一的上传流程和错误处理
// 3. 支持多种存储驱动
// 4. 内置文件管理器集成
// 5. 自动生成文件记录

class CustomUpload extends \App\System\Extends\Upload
{
    // 只需要实现业务逻辑，基础功能已经提供
}
```

### 2. S3 签名上传流程

```php
// ✅ S3 签名上传的完整流程
#[RouteGroup(app: 'admin', route: '/module/upload')]
class ModuleUpload extends \App\System\Extends\Upload
{
    // 1. 获取 S3 协议上传签名
    #[Route(methods: 'GET', route: '/sign')]
    public function sign(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $params = $request->getQueryParams();

        // 获取 S3 签名数据
        $signData = parent::uploadSign(
            filename: $params['name'],
            mime: $params['mime'],
            size: (int)($params['size'] ?? 0),
            prefix: 'module'
        );

        // 返回签名数据，前端用于直传云存储
        return send($response, "ok", $signData);
    }

    // 2. 直接上传到服务器
    #[Route(methods: 'POST', route: '')]
    public function upload(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $data = parent::uploadStorage(
            hasType: 'admin',
            request: $request,
            manager: true
        );

        return send($response, "ok", $data);
    }

    // 3. 保存云存储上传的文件记录
    #[Route(methods: 'PUT', route: '')]
    public function save(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        // 用于保存通过签名上传到云存储的文件记录
        $data = parent::uploadSave('admin', $request);
        return send($response, "ok", $data);
    }
}
```

### 3. S3 签名上传注意事项

```php
// ✅ 重要：FormData 字段顺序
// 前端使用签名上传时，必须按以下顺序构建 FormData：

// 1. 先添加所有 S3 参数
formData.append('key', params.key);
formData.append('policy', params.policy);
formData.append('signature', params.signature);
formData.append('x-amz-algorithm', params['x-amz-algorithm']);
// ... 其他 S3 参数

// 2. 最后添加文件字段（这个顺序很重要！）
formData.append('file', file);

// ❌ 错误：文件字段不能放在前面
// formData.append('file', file);  // 这样会导致上传失败
// formData.append('key', params.key);
```

### 3. 文件类型限制

```php
// ✅ 根据业务需求限制文件类型
public function upload(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
{
    $file = $request->getUploadedFiles()['file'] ?? null;

    // 验证文件类型
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!in_array($file->getClientMediaType(), $allowedTypes)) {
        return send($response, "只允许上传图片文件", null, 400);
    }

    // 验证文件大小
    if ($file->getSize() > 5 * 1024 * 1024) {
        return send($response, "文件大小不能超过5MB", null, 400);
    }

    return parent::uploadStorage(...);
}
```

### 4. 错误处理

```php
// ✅ 完善的错误处理
public function upload(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
{
    try {
        $data = parent::uploadStorage(
            hasType: 'admin',
            request: $request,
            manager: true
        );

        return send($response, "上传成功", $data);

    } catch (\Exception $e) {
        // 记录错误日志
        logger()->error('文件上传失败', [
            'error' => $e->getMessage(),
            'user_id' => $request->getAttribute('auth')['id'] ?? null
        ]);

        return send($response, "上传失败，请重试", null, 500);
    }
}
```

### 5. 前端 S3 签名上传集成

```javascript
// ✅ S3 签名上传示例
async function uploadFileWithSign(file) {
    try {
        // 1. 获取上传签名
        const signResponse = await fetch(`/admin/content/image/sign?name=${file.name}&mime=${file.type}&size=${file.size}`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        const signResult = await signResponse.json();
        if (signResult.code !== 200) {
            throw new Error(signResult.msg);
        }

        const { url, params } = signResult.data;

        // 2. 构建 FormData，注意 file 字段必须放在最后
        const formData = new FormData();

        // 先添加所有 S3 参数
        Object.keys(params).forEach(key => {
            formData.append(key, params[key]);
        });

        // 最后添加文件字段
        formData.append('file', file);

        // 3. 直传到云存储
        const uploadResponse = await fetch(url, {
            method: 'POST',
            body: formData
        });

        if (uploadResponse.ok) {
            console.log('上传成功:', signResult.data.url);

            // 4. 可选：保存文件记录到系统
            await saveFileRecord({
                url: signResult.data.url,
                name: file.name,
                size: file.size,
                mime: file.type
            });
        } else {
            throw new Error('上传失败');
        }

    } catch (error) {
        console.error('上传错误:', error);
    }
}

// ✅ 直接上传示例（不使用签名）
async function uploadFileDirect(file) {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/admin/your-module/upload', {
            method: 'POST',
            body: formData,
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        const result = await response.json();
        if (result.code === 200) {
            console.log('上传成功:', result.data);
        } else {
            console.error('上传失败:', result.msg);
        }
    } catch (error) {
        console.error('上传错误:', error);
    }
}

// 保存文件记录到系统
async function saveFileRecord(fileData) {
    await fetch('/admin/upload', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
            url: fileData.url,
            name: fileData.name,
            size: fileData.size,
            mime: fileData.mime,
            folder: 0  // 文件夹ID
        })
    });
}
```

## 🎉 总结

DuxLite 文件上传系统的特点：

- **🔗 基于继承**：继承 `App\System\Extends\Upload` 基类
- **🚀 简单易用**：只需实现业务逻辑，基础功能已提供
- **☁️ S3 协议支持**：完整的 S3 签名上传流程，支持直传云存储
- **🛡️ 安全可靠**：内置文件验证和安全检查
- **📊 功能完整**：支持签名上传、直接上传、文件管理
- **⚡ 高性能**：支持多种存储驱动和异步处理

### 🔄 两种上传方式

1. **S3 签名上传**：
   - 前端获取签名 → 直传云存储 → 保存文件记录
   - 适合大文件和云存储场景
   - 减轻服务器压力

2. **直接上传**：
   - 前端上传到服务器 → 服务器转存到存储
   - 适合小文件和本地存储
   - 便于文件处理和验证

通过继承上传基类，可以快速实现安全可靠的文件上传功能！
