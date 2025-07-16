import os

# 配置文件中定义的链接
guide_links = [
    '/guide/introduction',
    '/guide/getting-started',
    '/guide/directory-structure',
    '/guide/configuration',
    '/guide/database',
    '/guide/cache',
    '/guide/system-overview',
    '/guide/user-permissions',
    '/guide/data-management',
    '/guide/system-configuration',
    '/guide/logging-audit',
    '/guide/service-container',
    '/guide/event-system',
    '/guide/middleware',
    '/guide/validation',
    '/guide/plugins',
    '/guide/task-scheduling',
    '/guide/queue',
    '/guide/file-upload',
    '/guide/custom-services',
    '/guide/config-extension',
    '/guide/language-pack',
    '/guide/theme-development',
    '/guide/deployment',
    '/guide/performance',
    '/guide/security',
    '/guide/monitoring',
    '/guide/troubleshooting',
    '/guide/faq',
    '/guide/migration',
    '/guide/contributing'
]

dev_links = [
    '/dev/quick-start/environment',
    '/dev/quick-start/installation',
    '/dev/quick-start/directory-structure',
    '/dev/quick-start/first-module',
    '/dev/core/architecture',
    '/dev/core/modules',
    '/dev/core/lifecycle',
    '/dev/core/dependency-injection',
    '/dev/core/api-signature',
    '/dev/module/structure',
    '/dev/module/controllers',
    '/dev/module/models',
    '/dev/module/services',
    '/dev/module/events',
    '/dev/frontend/dvha',
    '/dev/frontend/components',
    '/dev/frontend/forms',
    '/dev/frontend/tables',
    '/dev/frontend/hooks',
    '/dev/frontend/state',
    '/dev/backend/api',
    '/dev/backend/database',
    '/dev/backend/validation',
    '/dev/backend/permissions',
    '/dev/backend/cache',
    '/dev/backend/queue',
    '/dev/backend/logging',
    '/dev/backend/file-upload',
    '/dev/backend/lock',
    '/dev/service/upload',
    '/dev/service/config',
    '/dev/service/storage',
    '/dev/service/stats',
    '/dev/service/menu',
    '/dev/best-practices/coding-standards',
    '/dev/tools-deployment/development-tools',
    '/dev/tools-deployment/deployment'
]

print("=== 检查 Guide 部分缺失的文件 ===")
missing_guide = []
for link in guide_links:
    file_path = link[1:] + '.md'  # 移除开头的 / 并添加 .md
    if not os.path.exists(file_path):
        missing_guide.append(link)
        print(f"❌ 缺失: {file_path}")
    else:
        print(f"✅ 存在: {file_path}")

print(f"\nGuide 部分缺失文件数量: {len(missing_guide)}")

print("\n=== 检查 Dev 部分缺失的文件 ===")
missing_dev = []
for link in dev_links:
    file_path = link[1:] + '.md'  # 移除开头的 / 并添加 .md
    if not os.path.exists(file_path):
        missing_dev.append(link)
        print(f"❌ 缺失: {file_path}")
    else:
        print(f"✅ 存在: {file_path}")

print(f"\nDev 部分缺失文件数量: {len(missing_dev)}")

print(f"\n总计缺失文件数量: {len(missing_guide) + len(missing_dev)}")

# 输出缺失的链接列表
if missing_guide or missing_dev:
    print("\n=== 需要从配置文件中移除的链接 ===")
    for link in missing_guide + missing_dev:
        print(link)
