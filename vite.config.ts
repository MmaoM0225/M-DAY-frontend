import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Element Plus 自动导入相关插件
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import ElementPlus from 'unplugin-element-plus/vite'

// PWA 插件
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    
    // Element Plus 自动导入
    AutoImport({
      imports: [
        'vue',
        'vue-router', 
        'pinia',
        '@vueuse/core'
      ],
      resolvers: [ElementPlusResolver()],
      dts: true, // 生成类型定义文件
    }),
    
    // 组件自动导入
    Components({
      resolvers: [ElementPlusResolver()],
      dts: true,
    }),
    
    // Element Plus 样式自动导入
    ElementPlus({
      useSource: true,
    }),
    
    // PWA 支持
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'safari-pinned-tab.svg'],
      manifest: {
        name: '个人自律管理系统',
        short_name: '自律管理',
        description: '个人任务管理、日程安排和日记记录系统',
        theme_color: '#409eff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  
  // CSS 预处理器配置
  css: {
    preprocessorOptions: {
      scss: {}
    },
  },
  
  // 开发服务器配置
  server: {
    port: 3000,
    open: true,
    cors: true,
  },
  
  // 构建配置
  build: {
    target: 'es2015',
    cssTarget: 'chrome80',
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          'element-plus': ['element-plus', '@element-plus/icons-vue'],
          'utils': ['axios', 'dayjs', '@vueuse/core'],
          'editor': ['quill']
        }
      }
    }
  }
})
