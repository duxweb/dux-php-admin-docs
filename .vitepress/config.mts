import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Dux PHP Admin",
  description: "现代化PHP后台管理系统解决方案，基于 dux-lite 和 DVHA，前后端分离架构，企业级管理系统开发框架",
  lang: 'zh-CN',
  base: '/',
  ignoreDeadLinks: true,

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#646cff' }],
    ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
    ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:locale', content: 'zh_CN' }],
    ['meta', { property: 'og:title', content: 'Dux PHP Admin | 现代化PHP后台管理系统' }],
    ['meta', { property: 'og:site_name', content: 'Dux PHP Admin' }],
    ['meta', { property: 'og:image', content: '/og-image.png' }],
    ['meta', { property: 'og:url', content: 'https://dux-php-admin.dux.cn/' }]
  ],

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    siteTitle: 'Dux PHP Admin',

    nav: [
      { text: '指南', link: '/guide/introduction', activeMatch: '/guide/' },
      { text: '开发', link: '/dev/quick-start/installation', activeMatch: '/dev/' },
      {
        text: '生态系统',
        items: [
          {
            text: '核心项目',
            items: [
              { text: 'Dux Lite', link: 'https://github.com/duxweb/dux-lite' },
              { text: 'DVHA', link: 'https://duxweb.github.io/dvha/' },
              { text: 'DVHA Pro', link: 'https://duxweb.github.io/dvha/pro/' },
              { text: 'Dux Vue Admin', link: 'https://github.com/duxweb/dux-vue-admin' },
              { text: 'Dux App', link: 'https://duxapp.com/' }
              
            ]
          },
          {
            text: '在线资源',
            items: [
              { text: '演示站点', link: 'https://demo.dux.cn' },
              { text: 'GitHub', link: 'https://github.com/duxweb/dux-php-admin' }
            ]
          }
        ]
      },
      {
        text: '版本',
        items: [
          { text: 'v2.x (当前)', link: '/guide/introduction' },
          { text: '更新日志', link: 'https://github.com/duxweb/dux-php-admin/releases' }
        ]
      }
    ],

    sidebar: {
      '/guide/': [
        {
          text: '开始',
          collapsed: false,
          items: [
            { text: '项目介绍', link: '/guide/introduction' },
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '目录结构', link: '/guide/directory-structure' }
          ]
        },
        {
          text: '基础配置',
          collapsed: false,
          items: [
            { text: '系统配置', link: '/guide/configuration' },
            { text: '数据库配置', link: '/guide/database' },
            { text: '缓存配置', link: '/guide/cache' }
          ]
        },
        {
          text: '系统使用',
          collapsed: false,
          items: [
            { text: '系统概览', link: '/guide/system-overview' },
            { text: '用户权限', link: '/guide/user-permissions' },
            { text: '数据管理', link: '/guide/data-management' },
            { text: '系统配置', link: '/guide/system-configuration' },
            { text: '日志审计', link: '/guide/logging-audit' }
          ]
        },


        {
          text: '部署与运维',
          collapsed: false,
          items: [
            { text: '生产部署', link: '/guide/deployment' }
          ]
        },
        {
          text: '其他',
          collapsed: true,
          items: [
            { text: '故障排除', link: '/guide/troubleshooting' },
            { text: '常见问题', link: '/guide/faq' }
          ]
        }
      ],
      '/dev/': [
        {
          text: '快速开始',
          collapsed: false,
          items: [
            { text: '环境搭建', link: '/dev/quick-start/environment' },
            { text: '项目安装', link: '/dev/quick-start/installation' },
            { text: '目录结构', link: '/dev/quick-start/directory-structure' },
            { text: '第一个API', link: '/dev/quick-start/first-api' },
            { text: '第一个模块', link: '/dev/quick-start/first-module' }
          ]
        },
        {
          text: '核心概念',
          collapsed: false,
          items: [
            { text: '架构概述', link: '/dev/core/architecture' },
            { text: '模块系统', link: '/dev/core/modules' },
            { text: '请求生命周期', link: '/dev/core/lifecycle' },
            { text: '依赖注入', link: '/dev/core/dependency-injection' },
            { text: 'API 签名', link: '/dev/core/signature' }
          ]
        },
        {
          text: '模块开发',
          collapsed: false,
          items: [
            { text: '模块结构', link: '/dev/module/structure' },
            { text: '控制器开发', link: '/dev/module/controllers' },
            { text: '模型与数据库', link: '/dev/module/models' },
            { text: '服务层开发', link: '/dev/module/services' },
            { text: '事件系统', link: '/dev/module/events' }
          ]
        },
        {
          text: '前端开发',
          collapsed: false,
          items: [
            { text: 'DVHA 框架', link: '/dev/frontend/dvha' },
            { text: '开发说明', link: '/dev/frontend/components' },
            { text: '表单设计', link: '/dev/frontend/forms' },
            { text: '表格设计', link: '/dev/frontend/tables' },
            { text: 'Hooks 使用', link: '/dev/frontend/hooks' },
            { text: '状态管理', link: '/dev/frontend/state' }
          ]
        },
        {
          text: '后端开发',
          collapsed: false,
          items: [
            { text: 'API 开发', link: '/dev/backend/api' },
            { text: '数据库操作', link: '/dev/backend/database' },
            { text: '数据验证', link: '/dev/backend/validation' },
            { text: '权限系统', link: '/dev/backend/permissions' },
            { text: '缓存系统', link: '/dev/backend/cache' },
            { text: '队列系统', link: '/dev/backend/queue' },
            { text: '日志系统', link: '/dev/backend/logging' },
            { text: '文件上传', link: '/dev/backend/file-upload' },
            { text: '分布式锁', link: '/dev/backend/lock' }
          ]
        },
        {
          text: '系统服务',
          collapsed: false,
          items: [
            { text: '上传服务', link: '/dev/service/upload' },
            { text: '配置服务', link: '/dev/service/config' },
            { text: '存储服务', link: '/dev/service/storage' },
            { text: '统计服务', link: '/dev/service/stats' },
            { text: '菜单服务', link: '/dev/service/menu' },
          ]
        },
        {
          text: '最佳实践',
          collapsed: false,
          items: [
            { text: '代码规范', link: '/dev/best-practices/coding-standards' }
          ]
        },
        {
          text: '工具与部署',
          collapsed: false,
          items: [
            { text: '开发工具', link: '/dev/tools-deployment/development-tools' },
            { text: '部署指南', link: '/dev/tools-deployment/deployment' }
          ]
        }
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/duxweb/dux-php-admin' }
    ],

    footer: {
      message: '基于 <a href="https://github.com/duxweb/dux-php-admin/blob/main/LICENSE">Apache 2.0</a> 协议发布',
      copyright: 'Copyright © 2024-present <a href="https://www.dux.cn">DuxWeb Team</a>'
    },

    editLink: {
      pattern: 'https://github.com/duxweb/dux-php-admin/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页面'
    },

    lastUpdated: {
      text: '最后更新于',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'medium'
      }
    },

    search: {
      provider: 'local',
      options: {
        locales: {
          zh: {
            translations: {
              button: {
                buttonText: '搜索文档',
                buttonAriaLabel: '搜索文档'
              },
              modal: {
                noResultsText: '无法找到相关结果',
                resetButtonTitle: '清除查询条件',
                footer: {
                  selectText: '选择',
                  navigateText: '切换',
                  closeText: '关闭'
                }
              }
            }
          }
        }
      }
    },

    docFooter: {
      prev: '上一页',
      next: '下一页'
    },

    outline: {
      label: '页面导航'
    },

    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式'
  }
})
