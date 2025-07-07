<template>
  <div class="dashboard">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
        <el-card class="stat-card task-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon><List /></el-icon>
            </div>
            <div class="stat-info">
              <h3>{{ todayTasks }}</h3>
              <p>今日任务</p>
            </div>
          </div>
          <div class="stat-footer">
            <span class="stat-detail">已完成 {{ completedTasks }} / {{ todayTasks }}</span>
            <el-progress 
              :percentage="taskProgress" 
              :stroke-width="4" 
              :show-text="false"
              color="#67C23A"
            />
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
        <el-card class="stat-card schedule-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon><Calendar /></el-icon>
            </div>
            <div class="stat-info">
              <h3>{{ todaySchedule }}</h3>
              <p>今日日程</p>
            </div>
          </div>
          <div class="stat-footer">
            <span class="stat-detail">{{ upcomingReminders }} 个即将提醒</span>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
        <el-card class="stat-card diary-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon><Notebook /></el-icon>
            </div>
            <div class="stat-info">
              <h3>{{ consecutiveDays }}</h3>
              <p>连续写作天数</p>
            </div>
          </div>
          <div class="stat-footer">
            <span class="stat-detail">本月已写 {{ monthlyDiaries }} 天</span>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
        <el-card class="stat-card habit-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon><Trophy /></el-icon>
            </div>
            <div class="stat-info">
              <h3>{{ habitScore }}</h3>
              <p>自律指数</p>
            </div>
          </div>
          <div class="stat-footer">
            <span class="stat-detail">{{ habitTrend > 0 ? '↗️' : '↘️' }} {{ Math.abs(habitTrend) }}%</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 功能区域 -->
    <el-row :gutter="20" class="content-row">
      <el-col :xs="24" :sm="24" :md="16" :lg="16" :xl="16">
        <el-card class="content-card">
          <template #header>
            <div class="card-header">
              <span>今日日程</span>
              <el-button type="primary" @click="goToCalendar">
                <el-icon><Plus /></el-icon>
                新建日程
              </el-button>
            </div>
          </template>
          <ScheduleList 
            :schedules="todaySchedules"
            :current-time="currentTime"
            @schedule-click="handleScheduleClick"
            @view-detail="viewScheduleDetail"
            @edit-schedule="editSchedule"
          />
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8">
        <el-card class="content-card">
          <template #header>
            <div class="card-header">
              <span>今日任务</span>
              <el-button type="primary" link @click="goToTodos">
                查看全部
              </el-button>
            </div>
          </template>
          <div class="task-list">
            <div v-if="recentTasks.length === 0" class="empty-state">
              <p>暂无任务</p>
            </div>
            <div v-else>
              <div 
                v-for="task in recentTasks" 
                :key="task.id"
                class="task-item"
                :class="{ completed: task.completed }"
              >
                <el-checkbox 
                  v-model="task.completed" 
                  @change="toggleTask(task)"
                />
                <div class="task-content">
                  <span class="task-title">{{ task.title }}</span>
                  <el-tag 
                    v-if="task.priority === 'high'" 
                    type="danger" 
                    size="small"
                  >
                    高优先级
                  </el-tag>
                </div>
                <div class="task-actions">
                  <el-button 
                    type="primary" 
                    link 
                    @click="viewTaskDetail(task.id)"
                  >
                    查看
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 写作统计 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
        <el-card class="chart-card">
          <template #header>
            <span>本周任务完成情况</span>
          </template>
          <div class="chart-placeholder">
            <p>📊 图表区域（后续集成图表库）</p>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
        <el-card class="chart-card">
          <template #header>
            <span>日记写作统计</span>
          </template>
          <div class="chart-placeholder">
            <p>📝 日记统计图表</p>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
// import { useRouter } from 'vue-router'
import { ElNotification } from 'element-plus'
import { 
  List, 
  Calendar, 
  Notebook, 
  Trophy, 
  Plus, 
  DataAnalysis 
} from '@element-plus/icons-vue'
import ScheduleList from '../components/ScheduleList.vue'

// const router = useRouter()

// 接口定义
interface Task {
  id: string
  title: string
  completed: boolean
  priority: 'high' | 'medium' | 'low'
  dueDate?: string
}

// 响应式数据
const todayTasks = ref(8)
const completedTasks = ref(5)
const todaySchedule = ref(3)
const upcomingReminders = ref(2)
const monthlyDiaries = ref(18)
const consecutiveDays = ref(7)
const habitScore = ref(85)
const habitTrend = ref(12)

// 当前时间
const currentTime = computed(() => {
  const now = new Date()
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
})

// 任务列表
const recentTasks = ref<Task[]>([
  {
    id: '1',
    title: '完成项目文档',
    completed: false,
    priority: 'high'
  },
  {
    id: '2',
    title: '回复客户邮件',
    completed: true,
    priority: 'medium'
  },
  {
    id: '3',
    title: '整理桌面文件',
    completed: false,
    priority: 'low'
  }
])

// 日程数据接口
interface Schedule {
  id: string
  title: string
  description?: string
  startTime: string
  endTime?: string
  priority: 'low' | 'medium' | 'high'
  category: 'work' | 'personal' | 'health' | 'study' | 'meeting' | 'event'
  location?: string
  participants?: string[]
  isReminder?: boolean
  status?: 'pending' | 'in-progress' | 'completed' | 'cancelled'
}

// 今日日程
const todaySchedules = ref<Schedule[]>([
  {
    id: '1',
    title: '团队会议',
    description: '讨论项目进展和下一步计划',
    startTime: '09:00',
    endTime: '10:30',
    priority: 'high',
    category: 'meeting',
    location: '会议室A',
    participants: ['张三', '李四', '王五'],
    isReminder: true,
    status: 'pending'
  },
  {
    id: '2',
    title: '客户拜访',
    description: '产品演示和需求沟通',
    startTime: '14:00',
    endTime: '16:00',
    priority: 'high',
    category: 'work',
    location: '客户办公室',
    participants: ['产品经理', '销售'],
    isReminder: true,
    status: 'pending'
  },
  {
    id: '3',
    title: '健身',
    description: '有氧运动30分钟',
    startTime: '18:00',
    endTime: '19:00',
    priority: 'medium',
    category: 'health',
    location: '健身房',
    isReminder: false,
    status: 'pending'
  },
  {
    id: '4',
    title: '健身',
    description: '有氧运动30分钟',
    startTime: '18:00',
    endTime: '19:00',
    priority: 'medium',
    category: 'health',
    location: '健身房',
    isReminder: false,
    status: 'pending'
  }
])

// 计算属性
const currentDate = computed(() => {
  const now = new Date()
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  }
  return now.toLocaleDateString('zh-CN', options)
})

const taskProgress = computed(() => {
  if (todayTasks.value === 0) return 0
  return Math.round((completedTasks.value / todayTasks.value) * 100)
})

// 方法
const goToTodos = () => {
  console.log('跳转到任务管理页面')
  // router.push('/todos')
}

const goToCalendar = () => {
  console.log('跳转到日历页面')
  // router.push('/calendar')
}

const goToDiary = () => {
  console.log('跳转到日记页面')
  // router.push('/diary')
}

const goToAnalytics = () => {
  console.log('跳转到数据统计页面')
  // router.push('/analytics')
}

const toggleTask = (task: Task) => {
  // 更新任务状态
  if (task.completed) {
    completedTasks.value++
  } else {
    completedTasks.value--
  }
}

const viewTaskDetail = (taskId: string) => {
  console.log('查看任务详情:', taskId)
  // router.push(`/todos/${taskId}`)
}

const handleScheduleClick = (schedule: Schedule) => {
  console.log('点击日程:', schedule.title)
  // 可以在这里添加日程点击的逻辑
}

const viewScheduleDetail = (schedule: Schedule) => {
  console.log('查看日程详情:', schedule.title)
  // router.push(`/calendar/${schedule.id}`)
}

const editSchedule = (schedule: Schedule) => {
  console.log('编辑日程:', schedule.title)
  // router.push(`/calendar/edit/${schedule.id}`)
}

// 生命周期
onMounted(() => {
  // 显示欢迎通知
  showWelcomeNotification()
  
  // 这里后续会从API获取真实数据
  console.log('Dashboard mounted')
})

// 显示欢迎通知
const showWelcomeNotification = () => {
  ElNotification({
    title: '🎯 欢迎回来！',
    message: `今天是 ${currentDate.value}，开始高效的一天吧！`,
    type: 'success',
    duration: 4000,
    position: 'top-right',
    showClose: true,
    dangerouslyUseHTMLString: false
  })
}
</script>

<style scoped lang="scss">
.dashboard {
  padding: 24px;
  background: #f5f5f5;
  min-height: 100vh;
}

.stats-row {
  margin-bottom: 24px;
  
  // 移动端才添加垂直间距
  @media (max-width: 991px) {
    :deep(.el-col) {
      margin-bottom: 12px;
      
      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}

.stat-card {
  height: 120px;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  }
  
  .stat-content {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
    
    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 12px;
      
      .el-icon {
        font-size: 24px;
        color: white;
      }
    }
    
    .stat-info {
      flex: 1;
      
      h3 {
        margin: 0;
        font-size: 24px;
        font-weight: 600;
        color: #333;
      }
      
      p {
        margin: 4px 0 0 0;
        color: #666;
        font-size: 14px;
      }
    }
  }
  
  .stat-footer {
    .stat-detail {
      font-size: 12px;
      color: #999;
    }
  }
}

.task-card .stat-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.schedule-card .stat-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.diary-card .stat-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.habit-card .stat-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.content-row {
  margin-bottom: 24px;
  
  // 设置统一的行高度，确保两个卡片一样高
  @media (min-width: 992px) {
    height: 580px; // 固定高度，包含header + content + padding
    margin-bottom: 50px !important; // 调整为50px以保持视觉一致性
  }
  
  // 移动端才添加垂直间距
  @media (max-width: 991px) {
    :deep(.el-col) {
      margin-bottom: 12px;
      
      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}

.content-card {
  border-radius: 12px;
  height: 100%;
  display: flex;
  flex-direction: column;
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    span {
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }
  }
  
  // 卡片内容区域
  :deep(.el-card__body) {
    display: flex;
    flex-direction: column;
    flex: 1;
    padding: 20px;
  }
  
  // 日程和任务列表容器
  .schedule-list,
  .task-list {
    flex: 1;
    min-height: 300px;
    max-height: 500px;
    overflow-y: auto;
    
    // 自定义滚动条样式
    &::-webkit-scrollbar {
      width: 6px;
    }
    
    &::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 3px;
    }
    
    &::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 3px;
      
      &:hover {
        background: #a8a8a8;
      }
    }
  }
}

.task-list {
  .empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    text-align: center;
    color: #999;
    
    p {
      margin: 0;
      font-size: 14px;
    }
  }
  
  .task-item {
    display: flex;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #f0f0f0;
    
    &:last-child {
      border-bottom: none;
    }
    
    &.completed {
      opacity: 0.6;
      
      .task-title {
        text-decoration: line-through;
      }
    }
    
    .task-content {
      flex: 1;
      margin-left: 12px;
      
      .task-title {
        font-size: 14px;
        color: #333;
        margin-right: 8px;
      }
    }
    
    .task-actions {
      margin-left: auto;
    }
  }
}





.chart-row {
  margin-bottom: 24px;
  
  // 桌面端确保下边距
  @media (min-width: 992px) {
    margin-bottom: 24px;
  }
  
  // 移动端才添加垂直间距
  @media (max-width: 991px) {
    :deep(.el-col) {
      margin-bottom: 12px;
      
      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}

.chart-card {
  border-radius: 12px;
  
  .chart-placeholder {
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f8f9fa;
    border-radius: 8px;
    color: #666;
    font-size: 14px;
  }
}

// 移动端响应式优化
@media (max-width: 768px) {
  .dashboard {
    padding: 16px;
  }
  
  // 移动端重置gutter，避免水平间距过大
  :deep(.el-row) {
    margin-left: -8px;
    margin-right: -8px;
    
    .el-col {
      padding-left: 8px;
      padding-right: 8px;
    }
  }
  
  // 移动端增大卡片间距
  :deep(.el-col) {
    margin-bottom: 16px !important;
    
    &:last-child {
      margin-bottom: 0 !important;
    }
  }
  
  .stats-row {
    margin-bottom: 16px;
  }
  
  .stat-card {
    height: auto;
    min-height: 100px;
    
    .stat-content {
      margin-bottom: 8px;
      
      .stat-icon {
        width: 40px;
        height: 40px;
        margin-right: 10px;
        
        .el-icon {
          font-size: 20px;
        }
      }
      
      .stat-info {
        h3 {
          font-size: 20px;
        }
        
        p {
          font-size: 12px;
        }
      }
    }
    
    .stat-footer {
      .stat-detail {
        font-size: 11px;
      }
    }
  }
  
  .content-row {
    margin-bottom: 16px;
  }
  
  .content-card {
    .card-header {
      span {
        font-size: 14px;
      }
    }
    
    .task-item {
      padding: 10px 0;
      
      .task-content {
        margin-left: 10px;
        
        .task-title {
          font-size: 13px;
        }
      }
    }
    

    

  }
  
  .chart-row {
    margin-bottom: 16px;
  }
  
  .chart-card {
    .chart-placeholder {
      height: 150px;
      font-size: 13px;
    }
  }
}

// 超小屏幕优化 (手机竖屏)
@media (max-width: 480px) {
  .dashboard {
    padding: 12px;
  }
  
  .stat-card {
    .stat-content {
      flex-direction: column;
      text-align: center;
      
      .stat-icon {
        margin-right: 0;
        margin-bottom: 8px;
      }
    }
  }
  
  .content-card {
    .card-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
      
      .el-button {
        align-self: stretch;
      }
    }
  }
}
</style> 