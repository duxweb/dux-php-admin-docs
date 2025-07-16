# 存储服务

基于 `app/System/Service/Storage.php` 的文件存储服务，提供多存储后端支持、文件上传下载和 URL 签名功能。

## 🚀 快速开始

### 基础使用

```php
use App\System\Service\Storage;

// 获取默认存储对象
$storage = Storage::getObject();

// 获取指定名称的存储对象
$storage = Storage::getObject('qiniu');

// 上传文件
$storage->writeStream('path/file.jpg', $fileStream);

// 获取文件 URL
$url = $storage->url('path/file.jpg');
```

## 📋 主要功能

### 1. 多存储后端支持

```php
use App\System\Service\Storage;

// 本地存储
$localStorage = Storage::getObject('local');

// 七牛云存储
$qiniuStorage = Storage::getObject('qiniu');

// 阿里云 OSS
$ossStorage = Storage::getObject('oss');

// 腾讯云 COS
$cosStorage = Storage::getObject('cos');
```

### 2. 文件操作

```php
use App\System\Service\Storage;

$storage = Storage::getObject();

// 写入文件流
$fileStream = fopen('/path/to/local/file.jpg', 'r');
$storage->writeStream('uploads/image.jpg', $fileStream);

// 读取文件
$content = $storage->read('uploads/image.jpg');

// 检查文件是否存在
$exists = $storage->fileExists('uploads/image.jpg');

// 获取文件大小
$size = $storage->fileSize('uploads/image.jpg');

// 删除文件
$storage->delete('uploads/image.jpg');
```

### 3. URL 签名

```php
use App\System\Service\Storage;

// 生成本地文件签名 URL
$signedUrl = Storage::localSign('/uploads/private/document.pdf');

// 带过期时间的签名（3600秒后过期）
$signedUrl = Storage::localSign('/uploads/private/document.pdf', 3600);
```

## 🔧 实际应用示例

### 1. 文件上传服务

```php
<?php

namespace App\System\Service;

use App\System\Service\Storage;

class FileUploadService
{
    /**
     * 上传文件到指定存储
     */
    public static function uploadFile($uploadedFile, array $options = []): array
    {
        try {
            // 获取存储对象
            $storageType = $options['storage'] ?? 'default';
            $storage = Storage::getObject($storageType);

            // 生成文件路径
            $category = $options['category'] ?? 'general';
            $extension = pathinfo($uploadedFile->getClientFilename(), PATHINFO_EXTENSION);
            $filename = ($options['filename'] ?? uniqid()) . '.' . $extension;
            $path = "{$category}/" . date('Y/m/d') . "/{$filename}";

            // 上传文件
            $stream = $uploadedFile->getStream();
            $storage->writeStream($path, $stream->detach());

            // 获取文件信息
            $url = $storage->url($path);
            $size = $uploadedFile->getSize();

            return [
                'success' => true,
                'data' => [
                    'url' => $url,
                    'path' => $path,
                    'size' => $size,
                    'name' => $uploadedFile->getClientFilename(),
                    'type' => $uploadedFile->getClientMediaType(),
                    'storage' => $storageType
                ]
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    /**
     * 批量上传文件
     */
    public static function uploadMultipleFiles(array $files, array $options = []): array
    {
        $results = [];
        $successCount = 0;
        $failCount = 0;

        foreach ($files as $index => $file) {
            $result = self::uploadFile($file, $options);
            
            if ($result['success']) {
                $successCount++;
            } else {
                $failCount++;
            }

            $results[] = [
                'index' => $index,
                'filename' => $file->getClientFilename(),
                'result' => $result
            ];
        }

        return [
            'total' => count($files),
            'success' => $successCount,
            'failed' => $failCount,
            'results' => $results
        ];
    }

    /**
     * 复制文件到不同存储
     */
    public static function copyToStorage(string $sourcePath, string $targetStorage, string $targetPath = null): array
    {
        try {
            // 获取源存储和目标存储
            $sourceStorage = Storage::getObject();
            $targetStorageObj = Storage::getObject($targetStorage);

            // 使用原路径或指定新路径
            $targetPath = $targetPath ?? $sourcePath;

            // 读取源文件
            $content = $sourceStorage->read($sourcePath);

            // 写入目标存储
            $targetStorageObj->write($targetPath, $content);

            return [
                'success' => true,
                'source_path' => $sourcePath,
                'target_path' => $targetPath,
                'target_storage' => $targetStorage,
                'target_url' => $targetStorageObj->url($targetPath)
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
}
```

### 2. 私有文件访问

```php
<?php

namespace App\System\Admin;

use App\System\Service\Storage;
use Core\Resources\Action\Resources;

class PrivateFile extends Resources
{
    /**
     * 生成私有文件访问链接
     */
    public function generateAccessUrl(string $filePath, int $expireTime = 3600): array
    {
        try {
            // 检查用户权限
            $auth = request()->getAttribute('auth');
            if (!$this->checkFileAccess($auth['id'], $filePath)) {
                return error('无权限访问此文件');
            }

            // 生成签名 URL
            $signedUrl = Storage::localSign($filePath, $expireTime);

            return success('访问链接生成成功', [
                'url' => $signedUrl,
                'expire_time' => $expireTime,
                'expire_at' => date('Y-m-d H:i:s', time() + $expireTime)
            ]);

        } catch (\Exception $e) {
            return error('生成访问链接失败：' . $e->getMessage());
        }
    }

    /**
     * 下载私有文件
     */
    public function downloadFile(string $filePath): ResponseInterface
    {
        try {
            // 检查权限
            $auth = request()->getAttribute('auth');
            if (!$this->checkFileAccess($auth['id'], $filePath)) {
                throw new \Exception('无权限下载此文件');
            }

            // 获取文件
            $storage = Storage::getObject();
            
            if (!$storage->fileExists($filePath)) {
                throw new \Exception('文件不存在');
            }

            $content = $storage->read($filePath);
            $filename = basename($filePath);

            // 返回文件下载响应
            $response = response();
            $response->getBody()->write($content);
            
            return $response
                ->withHeader('Content-Type', 'application/octet-stream')
                ->withHeader('Content-Disposition', "attachment; filename=\"{$filename}\"")
                ->withHeader('Content-Length', strlen($content));

        } catch (\Exception $e) {
            return error('文件下载失败：' . $e->getMessage());
        }
    }

    /**
     * 检查文件访问权限
     */
    private function checkFileAccess(int $userId, string $filePath): bool
    {
        // 实现文件访问权限检查逻辑
        // 例如：检查文件所有者、部门权限、角色权限等
        return true;
    }
}
```

### 3. 文件管理服务

```php
<?php

namespace App\System\Service;

use App\System\Service\Storage;

class FileManagerService
{
    /**
     * 获取目录文件列表
     */
    public static function listFiles(string $directory = '', string $storage = 'default'): array
    {
        try {
            $storageObj = Storage::getObject($storage);
            
            // 这里需要根据具体存储实现来获取文件列表
            // 不同存储后端的实现方式可能不同
            
            return [
                'success' => true,
                'directory' => $directory,
                'files' => []  // 实际实现中返回文件列表
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    /**
     * 创建目录
     */
    public static function createDirectory(string $directory, string $storage = 'default'): array
    {
        try {
            $storageObj = Storage::getObject($storage);
            
            // 创建一个空的 .gitkeep 文件来创建目录
            $keepFile = rtrim($directory, '/') . '/.gitkeep';
            $storageObj->write($keepFile, '');

            return [
                'success' => true,
                'directory' => $directory,
                'message' => '目录创建成功'
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    /**
     * 删除文件或目录
     */
    public static function deleteFile(string $path, string $storage = 'default'): array
    {
        try {
            $storageObj = Storage::getObject($storage);
            
            if (!$storageObj->fileExists($path)) {
                return [
                    'success' => false,
                    'message' => '文件不存在'
                ];
            }

            $storageObj->delete($path);

            return [
                'success' => true,
                'path' => $path,
                'message' => '文件删除成功'
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    /**
     * 移动/重命名文件
     */
    public static function moveFile(string $sourcePath, string $targetPath, string $storage = 'default'): array
    {
        try {
            $storageObj = Storage::getObject($storage);
            
            if (!$storageObj->fileExists($sourcePath)) {
                return [
                    'success' => false,
                    'message' => '源文件不存在'
                ];
            }

            // 读取源文件内容
            $content = $storageObj->read($sourcePath);
            
            // 写入目标位置
            $storageObj->write($targetPath, $content);
            
            // 删除源文件
            $storageObj->delete($sourcePath);

            return [
                'success' => true,
                'source_path' => $sourcePath,
                'target_path' => $targetPath,
                'target_url' => $storageObj->url($targetPath),
                'message' => '文件移动成功'
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    /**
     * 获取文件信息
     */
    public static function getFileInfo(string $path, string $storage = 'default'): array
    {
        try {
            $storageObj = Storage::getObject($storage);
            
            if (!$storageObj->fileExists($path)) {
                return [
                    'success' => false,
                    'message' => '文件不存在'
                ];
            }

            $info = [
                'path' => $path,
                'url' => $storageObj->url($path),
                'size' => $storageObj->fileSize($path),
                'last_modified' => $storageObj->lastModified($path),
                'extension' => pathinfo($path, PATHINFO_EXTENSION),
                'filename' => basename($path),
                'storage' => $storage
            ];

            return [
                'success' => true,
                'info' => $info
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
}
```

## 💡 最佳实践

### 1. 存储选择策略

```php
// ✅ 根据文件类型选择存储
public function getOptimalStorage(string $fileType, int $fileSize): string
{
    // 大文件使用云存储
    if ($fileSize > 10 * 1024 * 1024) { // 10MB
        return 'qiniu';
    }

    // 图片文件使用 CDN 存储
    if (in_array($fileType, ['jpg', 'png', 'gif', 'webp'])) {
        return 'oss';
    }

    // 私有文件使用本地存储
    if (in_array($fileType, ['pdf', 'doc', 'docx'])) {
        return 'local';
    }

    return 'default';
}
```

### 2. 错误处理

```php
// ✅ 完善的错误处理
public function safeFileOperation(callable $operation): array
{
    try {
        return $operation();
    } catch (\League\Flysystem\FileNotFoundException $e) {
        return ['success' => false, 'message' => '文件不存在'];
    } catch (\League\Flysystem\FileExistsException $e) {
        return ['success' => false, 'message' => '文件已存在'];
    } catch (\Exception $e) {
        logger()->error('存储操作失败', [
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);
        return ['success' => false, 'message' => '存储操作失败'];
    }
}
```

### 3. 文件路径规范

```php
// ✅ 标准化文件路径
public function normalizePath(string $path): string
{
    // 移除开头的斜杠
    $path = ltrim($path, '/');
    
    // 替换反斜杠为正斜杠
    $path = str_replace('\\', '/', $path);
    
    // 移除连续的斜杠
    $path = preg_replace('/\/+/', '/', $path);
    
    return $path;
}

// ✅ 生成安全的文件路径
public function generateSafePath(string $category, string $filename): string
{
    $extension = pathinfo($filename, PATHINFO_EXTENSION);
    $safeFilename = uniqid() . '.' . $extension;
    
    return $this->normalizePath("{$category}/" . date('Y/m/d') . "/{$safeFilename}");
}
```

### 4. 性能优化

```php
// ✅ 批量操作优化
public function batchUpload(array $files): array
{
    $storage = Storage::getObject();
    $results = [];

    // 使用事务或批量操作（如果存储支持）
    foreach ($files as $file) {
        try {
            $result = $this->uploadSingleFile($storage, $file);
            $results[] = $result;
        } catch (\Exception $e) {
            $results[] = ['success' => false, 'error' => $e->getMessage()];
        }
    }

    return $results;
}
```

## 🎉 总结

存储服务的特点：

- **🔧 多后端支持**：支持本地、七牛、OSS、COS 等多种存储
- **🛡️ 安全可靠**：支持文件签名和权限控制
- **⚡ 高性能**：优化的文件操作和批量处理
- **📊 功能完整**：涵盖文件的增删改查操作
- **🔗 易于集成**：统一的 API 接口

通过合理使用存储服务，可以构建灵活可扩展的文件管理系统！
