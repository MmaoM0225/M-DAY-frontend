<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { computed } from 'vue'
import { 
  Monitor, 
  List, 
  Calendar, 
  Notebook, 
  DataAnalysis, 
  Setting 
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

// 当前激活的菜单项
const activeMenu = computed(() => route.path)

// 菜单选择处理
const handleMenuSelect = (key: string) => {
  console.log('菜单选择:', key)
  router.push(key)
}
</script>

<template>
  <div id="app">
    <!-- 主导航 -->
    <el-container class="layout-container">
      <el-header class="app-header">
        <div class="header-content">
          <div class="logo-section">
            <h2>🎯 个人管理系统</h2>
          </div>
          <div class="nav-section">
            <el-menu
              mode="horizontal"
              :default-active="activeMenu"
              class="header-menu"
              @select="handleMenuSelect"
            >
              <el-menu-item index="/">
                <el-icon><Monitor /></el-icon>
                <span>主页</span>
              </el-menu-item>
              <el-menu-item index="/todos">
                <el-icon><List /></el-icon>
                <span>任务管理</span>
              </el-menu-item>
              <el-menu-item index="/calendar">
                <el-icon><Calendar /></el-icon>
                <span>日程管理</span>
              </el-menu-item>
              <el-menu-item index="/diary">
                <el-icon><Notebook /></el-icon>
                <span>日记管理</span>
              </el-menu-item>
              <el-menu-item index="/analytics">
                <el-icon><DataAnalysis /></el-icon>
                <span>数据统计</span>
              </el-menu-item>
              <el-menu-item index="/settings">
                <el-icon><Setting /></el-icon>
                <span>设置</span>
              </el-menu-item>
            </el-menu>
          </div>
        </div>
      </el-header>
      
      <el-main class="app-main">
        <!-- 路由视图 -->
        <router-view />
      </el-main>
    </el-container>
  </div>
</template>

<style lang="scss">
// 全局样式重置
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow-x: hidden;
}

#app {
  width: 100%;
  min-height: 100vh;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
}

.layout-container {
  width: 100%;
  min-height: 100vh;
}

.app-header {
  width: 100%;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  height: 60px !important;
  line-height: 60px;
  padding: 0;
  
  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 100%;
    width: 100%;
    max-width: none;
    padding: 0 24px;
    
    .logo-section {
      h2 {
        color: #333;
        font-size: 20px;
        font-weight: 600;
        margin: 0;
        white-space: nowrap;
      }
    }
    
    .nav-section {
      flex: 1;
      display: flex;
      justify-content: flex-end;
      
      .header-menu {
        background: transparent;
        border-bottom: none;
        
        .el-menu-item {
          height: 60px;
          line-height: 60px;
          padding: 0 20px;
          
          .el-icon {
            margin-right: 8px;
          }
          
          &.is-active {
            background-color: #ecf5ff;
            color: #409eff;
          }
          
          &:hover {
            background-color: #f5f7fa;
          }
        }
      }
    }
  }
}

.app-main {
  width: 100%;
  padding: 0 !important;
  background: #f5f5f5;
  min-height: calc(100vh - 60px);
  overflow-x: hidden;
  
  // 宽屏时限制内容宽度
  @media (min-width: 1200px) {
    max-width: 75%;
    margin: 0 auto;
  }
}

// Element Plus 样式覆盖
.el-container {
  width: 100%;
}

.el-header {
  width: 100%;
  display: flex;
  align-items: center;
  padding: 0 !important;
}

.el-main {
  width: 100%;
  overflow-x: hidden;
  overflow-y: auto;
}

// 响应式设计
@media (max-width: 768px) {
  .app-header {
    .header-content {
      padding: 0 16px;
      
      .logo-section h2 {
        font-size: 16px;
      }
      
      .nav-section .header-menu .el-menu-item {
        padding: 0 12px;
        
        span {
          display: none;
        }
      }
    }
  }
}

@media (max-width: 480px) {
  .app-header {
    .header-content {
      padding: 0 12px;
    }
  }
}
</style>
