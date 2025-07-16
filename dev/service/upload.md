# 上传服务

基于 `app/System/Service/Upload.php` 的上传服务，提供文件上传配置管理和安全检查功能。

## 🚀 快速开始

### 基础使用

```php
use App\System\Service\Upload;

// 获取上传配置
$config = Upload::getUploadConfig();

// 检查文件扩展名
$isAllowed = Upload::checkExtension('jpg');

// 验证文件安全性
$isSafe = Upload::validateFile($uploadedFile);
```

## 📋 主要功能

### 1. 获取上传配置

```php
use App\System\Service\Upload;

// 获取完整的上传配置
$config = Upload::getUploadConfig();

/*
返回数据结构：
[
    'upload_ext' => ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'txt'],  // 允许的扩展名
    'upload_size' => 5,                                           // 最大文件大小(MB)
    // ... 其他系统配置
]
*/
```

### 2. 文件扩展名检查

基于实际代码的扩展名验证：

```php
use App\System\Service\Upload;

// 检查单个扩展名
$isAllowed = Upload::checkExtension('jpg');        // true
$isBlocked = Upload::checkExtension('php');        // false (在黑名单中)

// 检查文件对象的扩展名
$uploadedFile = $request->getUploadedFiles()['file'];
$extension = pathinfo($uploadedFile->getClientFilename(), PATHINFO_EXTENSION);
$isValid = Upload::checkExtension($extension);
```

### 3. 黑名单扩展名

系统内置的危险文件扩展名黑名单：

```php
// 系统禁止的文件扩展名
private const BLACK_EXTENSIONS = [
    // PHP 相关
    'php', 'php3', 'php4', 'php5', 'phtml', 'pht',
    
    // Web 脚本
    'jsp', 'asp', 'aspx', 'cer', 'asa', 'cdx',
    
    // 客户端脚本
    'js', 'vbs', 'bat', 'cmd', 'com', 'exe', 'scr', 'msi',
    
    // 系统脚本
    'sh', 'py', 'pl', 'rb', 'jar', 'class',
    
    // 配置文件
    'htaccess', 'htpasswd', 'ini', 'dll', 'so'
];
```

## 🔧 实际应用示例

### 1. 控制器中的文件上传

```php
<?php

namespace App\Content\Admin;

use App\System\Service\Upload;
use App\System\Service\Storage;
use Core\Resources\Action\Resources;
use Core\Resources\Attribute\Resource;

#[Resource(app: "admin", route: "/content/media", name: "content.media")]
class Media extends Resources
{
    public function upload(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        try {
            // 获取上传文件
            $uploadedFile = $request->getUploadedFiles()['file'] ?? null;
            if (!$uploadedFile) {
                return error($response, '请选择要上传的文件');
            }

            // 获取上传配置
            $config = Upload::getUploadConfig();
            
            // 验证文件扩展名
            $filename = $uploadedFile->getClientFilename();
            $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
            
            if (!in_array($extension, $config['upload_ext'])) {
                return error($response, '不支持的文件类型');
            }

            // 验证文件大小
            $maxSize = $config['upload_size'] * 1024 * 1024; // 转换为字节
            if ($uploadedFile->getSize() > $maxSize) {
                return error($response, "文件大小不能超过 {$config['upload_size']}MB");
            }

            // 使用存储服务上传文件
            $storage = Storage::getObject();
            $path = 'uploads/' . date('Y/m/d') . '/' . uniqid() . '.' . $extension;
            
            $stream = $uploadedFile->getStream();
            $storage->writeStream($path, $stream->detach());

            return success($response, '上传成功', [
                'url' => $storage->url($path),
                'path' => $path,
                'size' => $uploadedFile->getSize(),
                'name' => $filename
            ]);

        } catch (\Exception $e) {
            return error($response, '上传失败：' . $e->getMessage());
        }
    }
}
```

### 2. 批量文件验证

```php
<?php

namespace App\System\Service;

class FileValidator
{
    /**
     * 批量验证文件
     */
    public static function validateFiles(array $files): array
    {
        $config = Upload::getUploadConfig();
        $results = [];
        $maxSize = $config['upload_size'] * 1024 * 1024;

        foreach ($files as $index => $file) {
            $result = [
                'index' => $index,
                'name' => $file->getClientFilename(),
                'size' => $file->getSize(),
                'valid' => true,
                'errors' => []
            ];

            // 检查扩展名
            $extension = strtolower(pathinfo($file->getClientFilename(), PATHINFO_EXTENSION));
            if (!in_array($extension, $config['upload_ext'])) {
                $result['valid'] = false;
                $result['errors'][] = '不支持的文件类型';
            }

            // 检查文件大小
            if ($file->getSize() > $maxSize) {
                $result['valid'] = false;
                $result['errors'][] = "文件大小超过限制({$config['upload_size']}MB)";
            }

            // 检查文件内容
            if ($file->getSize() === 0) {
                $result['valid'] = false;
                $result['errors'][] = '文件内容为空';
            }

            $results[] = $result;
        }

        return $results;
    }
}
```

### 3. 图片上传专用服务

```php
<?php

namespace App\System\Service;

class ImageUpload
{
    /**
     * 上传并处理图片
     */
    public static function uploadImage($uploadedFile, array $options = []): array
    {
        // 获取配置
        $config = Upload::getUploadConfig();
        
        // 验证是否为图片
        $imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        $extension = strtolower(pathinfo($uploadedFile->getClientFilename(), PATHINFO_EXTENSION));
        
        if (!in_array($extension, $imageExtensions)) {
            throw new \Exception('只支持图片文件');
        }

        // 验证图片尺寸
        $tempPath = $uploadedFile->getStream()->getMetadata('uri');
        $imageInfo = getimagesize($tempPath);
        
        if (!$imageInfo) {
            throw new \Exception('无效的图片文件');
        }

        [$width, $height] = $imageInfo;
        
        // 检查最小尺寸
        $minWidth = $options['min_width'] ?? 100;
        $minHeight = $options['min_height'] ?? 100;
        
        if ($width < $minWidth || $height < $minHeight) {
            throw new \Exception("图片尺寸不能小于 {$minWidth}x{$minHeight}");
        }

        // 检查最大尺寸
        $maxWidth = $options['max_width'] ?? 2000;
        $maxHeight = $options['max_height'] ?? 2000;
        
        if ($width > $maxWidth || $height > $maxHeight) {
            throw new \Exception("图片尺寸不能大于 {$maxWidth}x{$maxHeight}");
        }

        // 上传文件
        $storage = Storage::getObject();
        $path = 'images/' . date('Y/m/d') . '/' . uniqid() . '.' . $extension;
        
        $stream = $uploadedFile->getStream();
        $storage->writeStream($path, $stream->detach());

        return [
            'url' => $storage->url($path),
            'path' => $path,
            'width' => $width,
            'height' => $height,
            'size' => $uploadedFile->getSize(),
            'name' => $uploadedFile->getClientFilename()
        ];
    }
}
```

## 💡 最佳实践

### 1. 安全检查

```php
// ✅ 完整的文件安全检查
public function validateUploadSecurity($uploadedFile): bool
{
    // 1. 检查扩展名
    $extension = strtolower(pathinfo($uploadedFile->getClientFilename(), PATHINFO_EXTENSION));
    $config = Upload::getUploadConfig();
    
    if (!in_array($extension, $config['upload_ext'])) {
        return false;
    }

    // 2. 检查 MIME 类型
    $allowedMimes = [
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg', 
        'png' => 'image/png',
        'gif' => 'image/gif',
        'pdf' => 'application/pdf'
    ];
    
    $expectedMime = $allowedMimes[$extension] ?? null;
    if ($expectedMime && $uploadedFile->getClientMediaType() !== $expectedMime) {
        return false;
    }

    // 3. 检查文件头
    $tempPath = $uploadedFile->getStream()->getMetadata('uri');
    $fileHeader = file_get_contents($tempPath, false, null, 0, 10);
    
    // 检查是否包含可执行代码特征
    $dangerousPatterns = ['<?php', '<%', '<script', '#!/'];
    foreach ($dangerousPatterns as $pattern) {
        if (stripos($fileHeader, $pattern) !== false) {
            return false;
        }
    }

    return true;
}
```

### 2. 配置管理

```php
// ✅ 动态配置管理
class UploadConfigManager
{
    public static function updateConfig(array $newConfig): void
    {
        $currentConfig = \App\System\Service\Config::getJsonValue('system', []);
        
        // 合并配置
        $updatedConfig = array_merge($currentConfig, [
            'upload_ext' => implode(',', $newConfig['extensions'] ?? []),
            'upload_size' => $newConfig['max_size'] ?? 5
        ]);
        
        \App\System\Service\Config::setValue('system', $updatedConfig);
    }

    public static function addAllowedExtension(string $extension): void
    {
        $config = Upload::getUploadConfig();
        $extensions = $config['upload_ext'];
        
        if (!in_array($extension, $extensions)) {
            $extensions[] = $extension;
            self::updateConfig(['extensions' => $extensions]);
        }
    }
}
```

### 3. 错误处理

```php
// ✅ 统一的错误处理
class UploadException extends \Exception
{
    public const ERROR_INVALID_TYPE = 1001;
    public const ERROR_SIZE_EXCEEDED = 1002;
    public const ERROR_SECURITY_RISK = 1003;

    public static function invalidType(string $extension): self
    {
        return new self("不支持的文件类型: {$extension}", self::ERROR_INVALID_TYPE);
    }

    public static function sizeExceeded(int $size, int $maxSize): self
    {
        $sizeMB = round($size / 1024 / 1024, 2);
        $maxSizeMB = round($maxSize / 1024 / 1024, 2);
        return new self("文件大小 {$sizeMB}MB 超过限制 {$maxSizeMB}MB", self::ERROR_SIZE_EXCEEDED);
    }

    public static function securityRisk(): self
    {
        return new self("文件存在安全风险", self::ERROR_SECURITY_RISK);
    }
}
```

## 🎉 总结

上传服务的特点：

- **🛡️ 安全可靠**：内置黑名单扩展名，防止恶意文件上传
- **⚙️ 配置灵活**：基于数据库配置，支持动态调整
- **🔧 易于集成**：简单的静态方法调用
- **📊 功能完整**：支持扩展名检查、大小验证、安全检查

通过合理使用上传服务，可以构建安全可靠的文件上传功能！
