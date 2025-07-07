import { createRouter, createWebHistory} from 'vue-router'

// 页面组件导入
import Dashboard from '../views/Dashboard.vue'
import TodoList from '../views/TodoList.vue'
import Calendar from '../views/Calendar.vue'
// import Diary from '../views/Diary.vue'
// import DiaryEdit from '../views/DiaryEdit.vue'
// import DiaryDetail from '../views/DiaryDetail.vue'
// import TodoDetail from '../views/TodoDetail.vue'
// import Analytics from '../views/Analytics.vue'
// import Settings from '../views/Settings.vue'
// import SearchResult from '../views/SearchResult.vue'
// import NotFound from '../views/NotFound.vue'

// 路由配置
const routes: Array<any> = [
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard,
    meta: {
      title: '仪表盘',
      icon: 'el-icon-monitor',
      keepAlive: true
    }
  },
  {
    path: '/todos',
    name: 'TodoList',
    component: TodoList,
    meta: {
      title: '任务管理',
      icon: 'el-icon-list',
      keepAlive: true
    }
  },
  // 暂时注释其他路由，等页面创建后再启用
  // {
  //   path: '/todos/:id',
  //   name: 'TodoDetail',
  //   component: TodoDetail,
  //   meta: {
  //     title: '任务详情',
  //     hideInMenu: true
  //   }
  // },
  {
    path: '/calendar',
    name: 'Calendar',
    component: Calendar,
    meta: {
      title: '日程管理',
      icon: 'el-icon-calendar',
      keepAlive: true
    }
  },
  // 其他路由配置...
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes,
  // 路由切换时滚动到顶部
  scrollBehavior() {
    return { top: 0 }
  }
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta?.title) {
    document.title = `${to.meta.title} - 个人自律管理系统`
  }
  
  // 页面加载进度条（可选）
  // NProgress.start()
  
  next()
})

router.afterEach(() => {
  // 页面加载完成后的处理
  // NProgress.done()
  console.log('路由切换完成')
})

export default router

// 导出路由配置，供导航菜单使用
export const menuRoutes = routes.filter(route => 
  route.meta && !route.meta.hideInMenu
)
