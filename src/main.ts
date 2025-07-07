import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

// Element Plus 相关导入
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// 暂时注释路由，等安装vue-router后再启用
import router from './router'

const app = createApp(App)

// 注册 Element Plus
app.use(ElementPlus)

// 注册所有图标组件
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 暂时注释路由，等安装vue-router后再启用
app.use(router)

app.mount('#app')
