<template>
  <div class="todo-list">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">
          <el-icon class="title-icon"><List /></el-icon>
          任务管理
        </h1>
        <p class="page-subtitle">管理您的日常任务，提高工作效率</p>
      </div>
      <div class="header-right">
        <el-button 
          type="primary" 
          size="large"
          @click="showAddDialog = true"
        >
          <el-icon><Plus /></el-icon>
          新建任务
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-overview">
      <el-row :gutter="20">
        <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
          <div class="stat-card total">
            <div class="stat-icon">
              <el-icon><List /></el-icon>
            </div>
            <div class="stat-info">
              <h3>{{ totalTasks }}</h3>
              <p>总任务数</p>
            </div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
          <div class="stat-card pending">
            <div class="stat-icon">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <h3>{{ pendingTasks }}</h3>
              <p>待完成</p>
            </div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
          <div class="stat-card completed">
            <div class="stat-icon">
              <el-icon><Check /></el-icon>
            </div>
            <div class="stat-info">
              <h3>{{ completedTasks }}</h3>
              <p>已完成</p>
            </div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
          <div class="stat-card overdue">
            <div class="stat-icon">
              <el-icon><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <h3>{{ overdueTasks }}</h3>
              <p>已逾期</p>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 任务列表双栏布局 -->
    <el-row :gutter="20" class="task-main-container">
      <!-- 左侧：当日任务 -->
      <el-col :xs="24" :sm="24" :md="10" :lg="10" :xl="10">
        <div class="today-tasks-section">
          <div class="section-header">
            <h3 class="section-title">
              <el-icon><Calendar /></el-icon>
              今日任务
            </h3>
            <span class="task-count">{{ todayTasks.length }} 个任务</span>
          </div>
          
          <div class="task-list-container">
            <div v-if="todayTasks.length === 0" class="empty-state">
              <div class="empty-icon">📅</div>
              <h3>今日暂无任务</h3>
              <p>今天还没有安排任务，去右侧添加一些任务吧</p>
            </div>
            <div v-else class="task-list">
              <div 
                v-for="task in todayTasks" 
                :key="`today-${task.id}`"
                class="task-item"
                :class="[
                  `priority-${task.priority}`,
                  { 'completed': task.completed },
                  { 'overdue': isOverdue(task) }
                ]"
              >
                <div class="task-checkbox">
                  <el-checkbox 
                    v-model="task.completed" 
                    @change="toggleTask(task)"
                    :disabled="isOverdue(task)"
                  />
                </div>
                <div class="task-content" @click="viewTaskDetail(task)">
                  <div class="task-header">
                    <h4 class="task-title">{{ task.title }}</h4>
                    <div class="task-badges">
                      <span 
                        class="priority-badge"
                        :class="`priority-${task.priority}`"
                      >
                        {{ getPriorityText(task.priority) }}
                      </span>
                      <span 
                        v-if="task.category"
                        class="category-badge"
                        :class="`category-${task.category}`"
                      >
                        {{ getCategoryText(task.category) }}
                      </span>
                    </div>
                  </div>
                  <p v-if="task.description" class="task-description">
                    {{ task.description }}
                  </p>
                  <div class="task-meta">
                    <span v-if="task.dueDate" class="due-date">
                      <el-icon><Calendar /></el-icon>
                      {{ formatDate(task.dueDate) }}
                    </span>
                    <span class="create-date">
                      <el-icon><Clock /></el-icon>
                      {{ formatDate(task.createdAt) }}
                    </span>
                  </div>
                </div>
                <div class="task-actions">
                  <el-button 
                    type="primary" 
                    link 
                    @click="editTask(task)"
                  >
                    <el-icon><Edit /></el-icon>
                  </el-button>
                  <el-button 
                    type="danger" 
                    link 
                    @click="deleteTask(task)"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-col>

      <!-- 右侧：全部任务 -->
      <el-col :xs="24" :sm="24" :md="14" :lg="14" :xl="14">
        <div class="all-tasks-section">
          <div class="section-header">
            <h3 class="section-title">
              <el-icon><List /></el-icon>
              全部任务
            </h3>
            <span class="task-count">{{ filteredTasks.length }} 个任务</span>
          </div>

          <!-- 筛选和搜索 -->
          <div class="filter-section">
            <div class="filter-top">
              <el-input
                v-model="searchQuery"
                placeholder="搜索任务..."
                style="width: 300px"
                clearable
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </div>
            <div class="filter-bottom">
              <el-select 
                v-model="selectedStatus" 
                placeholder="选择状态"
                style="width: 120px"
                clearable
              >
                <el-option label="全部" value="" />
                <el-option label="待完成" value="pending" />
                <el-option label="已完成" value="completed" />
                <el-option label="已逾期" value="overdue" />
              </el-select>
              <el-select 
                v-model="selectedPriority" 
                placeholder="选择优先级"
                style="width: 120px; margin-left: 12px"
                clearable
              >
                <el-option label="全部" value="" />
                <el-option label="高优先级" value="high" />
                <el-option label="中优先级" value="medium" />
                <el-option label="低优先级" value="low" />
              </el-select>
              <el-select 
                v-model="selectedTimeRange" 
                placeholder="选择时间"
                style="width: 120px; margin-left: 12px"
                clearable
              >
                <el-option label="全部" value="" />
                <el-option label="今天" value="today" />
                <el-option label="明天" value="tomorrow" />
                <el-option label="本周" value="thisWeek" />
                <el-option label="下周" value="nextWeek" />
                <el-option label="本月" value="thisMonth" />
                <el-option label="已逾期" value="overdue" />
                <el-option label="无截止日期" value="noDate" />
              </el-select>
              <el-button 
                type="default" 
                @click="resetFilters"
                style="margin-left: 12px"
              >
                <el-icon><RefreshLeft /></el-icon>
                重置
              </el-button>
            </div>
          </div>
          
          <div class="task-list-container">
            <div v-if="filteredTasks.length === 0" class="empty-state">
              <div class="empty-icon">📝</div>
              <h3>暂无任务</h3>
              <p>点击上方"新建任务"按钮创建您的第一个任务</p>
            </div>
            <div v-else class="task-list">
              <div 
                v-for="task in filteredTasks" 
                :key="`all-${task.id}`"
                class="task-item"
                :class="[
                  `priority-${task.priority}`,
                  { 'completed': task.completed },
                  { 'overdue': isOverdue(task) }
                ]"
              >
                <div class="task-checkbox">
                  <el-checkbox 
                    v-model="task.completed" 
                    @change="toggleTask(task)"
                    :disabled="isOverdue(task)"
                  />
                </div>
                <div class="task-content" @click="viewTaskDetail(task)">
                  <div class="task-header">
                    <h4 class="task-title">{{ task.title }}</h4>
                    <div class="task-badges">
                      <span 
                        class="priority-badge"
                        :class="`priority-${task.priority}`"
                      >
                        {{ getPriorityText(task.priority) }}
                      </span>
                      <span 
                        v-if="task.category"
                        class="category-badge"
                        :class="`category-${task.category}`"
                      >
                        {{ getCategoryText(task.category) }}
                      </span>
                    </div>
                  </div>
                  <p v-if="task.description" class="task-description">
                    {{ task.description }}
                  </p>
                  <div class="task-meta">
                    <span v-if="task.dueDate" class="due-date">
                      <el-icon><Calendar /></el-icon>
                      {{ formatDate(task.dueDate) }}
                    </span>
                    <span class="create-date">
                      <el-icon><Clock /></el-icon>
                      {{ formatDate(task.createdAt) }}
                    </span>
                  </div>
                </div>
                <div class="task-actions">
                  <el-button 
                    type="primary" 
                    link 
                    @click="editTask(task)"
                  >
                    <el-icon><Edit /></el-icon>
                  </el-button>
                  <el-button 
                    type="danger" 
                    link 
                    @click="deleteTask(task)"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 新建任务对话框 -->
    <el-dialog
      v-model="showAddDialog"
      title="新建任务"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="newTask" :rules="taskRules" ref="taskForm" label-width="80px">
        <el-form-item label="任务标题" prop="title">
          <el-input 
            v-model="newTask.title" 
            placeholder="请输入任务标题"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="任务描述" prop="description">
          <el-input 
            v-model="newTask.description" 
            type="textarea"
            placeholder="请输入任务描述"
            :rows="3"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-select v-model="newTask.priority" placeholder="选择优先级">
            <el-option label="高优先级" value="high" />
            <el-option label="中优先级" value="medium" />
            <el-option label="低优先级" value="low" />
          </el-select>
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-select v-model="newTask.category" placeholder="选择分类">
            <el-option label="工作" value="work" />
            <el-option label="个人" value="personal" />
            <el-option label="学习" value="study" />
            <el-option label="健康" value="health" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="截止日期" prop="dueDate">
          <el-date-picker
            v-model="newTask.dueDate"
            type="date"
            placeholder="选择截止日期"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="createTask">创建任务</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  List, 
  Plus, 
  Search, 
  RefreshLeft,
  Clock,
  Check,
  Warning,
  Calendar,
  Edit,
  Delete
} from '@element-plus/icons-vue'

// 类型定义
interface Task {
  id: string
  title: string
  description?: string
  completed: boolean
  priority: 'high' | 'medium' | 'low'
  category?: 'work' | 'personal' | 'study' | 'health' | 'other'
  dueDate?: string
  createdAt: string
}

// 响应式数据
const showAddDialog = ref(false)
const searchQuery = ref('')
const selectedStatus = ref('')
const selectedPriority = ref('')
const selectedTimeRange = ref('')

// 任务列表
const tasks = ref<Task[]>([
  {
    id: '1',
    title: '完成项目文档',
    description: '整理和完善项目的技术文档，包括API文档和用户手册',
    completed: false,
    priority: 'high',
    category: 'work',
    dueDate: new Date().toISOString().split('T')[0], // 今天
    createdAt: '2024-02-01'
  },
  {
    id: '2',
    title: '回复客户邮件',
    description: '回复客户关于产品功能的询问邮件',
    completed: true,
    priority: 'medium',
    category: 'work',
    dueDate: new Date().toISOString().split('T')[0], // 今天
    createdAt: '2024-02-01'
  },
  {
    id: '3',
    title: '学习Vue3新特性',
    description: '深入学习Vue3的Composition API和新功能',
    completed: false,
    priority: 'medium',
    category: 'study',
    dueDate: '2024-02-20',
    createdAt: '2024-02-02'
  },
  {
    id: '4',
    title: '健身房锻炼',
    description: '进行力量训练和有氧运动',
    completed: false,
    priority: 'low',
    category: 'health',
    dueDate: new Date().toISOString().split('T')[0], // 今天
    createdAt: '2024-02-02'
  },
  {
    id: '5',
    title: '团队会议准备',
    description: '准备下周团队会议的议程和资料',
    completed: false,
    priority: 'medium',
    category: 'work',
    dueDate: (() => {
      const nextWeek = new Date()
      nextWeek.setDate(nextWeek.getDate() + 7)
      return nextWeek.toISOString().split('T')[0]
    })(),
    createdAt: '2024-02-02'
  },
  {
    id: '6',
    title: '购买生日礼物',
    description: '为朋友的生日挑选合适的礼物',
    completed: false,
    priority: 'low',
    category: 'personal',
    dueDate: (() => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      return tomorrow.toISOString().split('T')[0]
    })(),
    createdAt: '2024-02-02'
  },
  {
    id: '7',
    title: '年度总结报告',
    description: '完成年度工作总结和计划制定',
    completed: false,
    priority: 'high',
    category: 'work',
    dueDate: '2024-01-30', // 逾期任务
    createdAt: '2024-01-15'
  },
  {
    id: '8',
    title: '思考人生方向',
    description: '没有设定具体截止时间的思考类任务',
    completed: false,
    priority: 'low',
    category: 'personal',
    dueDate: '', // 无截止日期
    createdAt: '2024-02-01'
  }
])

// 新建任务表单
const newTask = ref({
  title: '',
  description: '',
  priority: 'medium',
  category: 'work',
  dueDate: ''
})

// 表单校验规则
const taskRules = {
  title: [
    { required: true, message: '请输入任务标题', trigger: 'blur' },
    { min: 1, max: 100, message: '标题长度在1到100个字符', trigger: 'blur' }
  ],
  priority: [
    { required: true, message: '请选择优先级', trigger: 'change' }
  ]
}

// 计算属性
const totalTasks = computed(() => tasks.value.length)
const pendingTasks = computed(() => tasks.value.filter(task => !task.completed).length)
const completedTasks = computed(() => tasks.value.filter(task => task.completed).length)
const overdueTasks = computed(() => tasks.value.filter(task => isOverdue(task)).length)

// 当日任务（截止日期是今天的任务）
const todayTasks = computed(() => {
  const today = new Date().toISOString().split('T')[0] // 获取今天的日期字符串 YYYY-MM-DD
  return tasks.value.filter(task => task.dueDate === today)
})

const filteredTasks = computed(() => {
  let filtered = tasks.value

  // 搜索过滤
  if (searchQuery.value) {
    filtered = filtered.filter(task => 
      task.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.value.toLowerCase()))
    )
  }

  // 状态过滤
  if (selectedStatus.value) {
    if (selectedStatus.value === 'pending') {
      filtered = filtered.filter(task => !task.completed)
    } else if (selectedStatus.value === 'completed') {
      filtered = filtered.filter(task => task.completed)
    } else if (selectedStatus.value === 'overdue') {
      filtered = filtered.filter(task => isOverdue(task))
    }
  }

  // 优先级过滤
  if (selectedPriority.value) {
    filtered = filtered.filter(task => task.priority === selectedPriority.value)
  }

  // 时间范围过滤
  if (selectedTimeRange.value) {
    filtered = filtered.filter(task => {
      return isInTimeRange(task, selectedTimeRange.value)
    })
  }

  return filtered
})

// 方法
const isOverdue = (task: Task) => {
  if (!task.dueDate || task.completed) return false
  return new Date(task.dueDate) < new Date()
}

// 时间范围判断
const isInTimeRange = (task: Task, timeRange: string) => {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  // 获取本周的开始和结束日期
  const getWeekRange = (date: Date) => {
    const start = new Date(date)
    const day = start.getDay()
    const diff = start.getDate() - day + (day === 0 ? -6 : 1) // 周一为一周开始
    start.setDate(diff)
    start.setHours(0, 0, 0, 0)
    
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    end.setHours(23, 59, 59, 999)
    
    return { start, end }
  }
  
  // 获取本月的开始和结束日期
  const getMonthRange = (date: Date) => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1)
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0)
    end.setHours(23, 59, 59, 999)
    return { start, end }
  }
  
  const formatDate = (date: Date) => date.toISOString().split('T')[0]
  
  switch (timeRange) {
    case 'today':
      return task.dueDate === formatDate(today)
      
    case 'tomorrow':
      return task.dueDate === formatDate(tomorrow)
      
    case 'thisWeek':
      if (!task.dueDate) return false
      const thisWeek = getWeekRange(today)
      const taskDate = new Date(task.dueDate)
      return taskDate >= thisWeek.start && taskDate <= thisWeek.end
      
    case 'nextWeek':
      if (!task.dueDate) return false
      const nextWeekStart = new Date(today)
      nextWeekStart.setDate(today.getDate() + (7 - today.getDay() + 1)) // 下周一
      const nextWeek = getWeekRange(nextWeekStart)
      const nextWeekTaskDate = new Date(task.dueDate)
      return nextWeekTaskDate >= nextWeek.start && nextWeekTaskDate <= nextWeek.end
      
    case 'thisMonth':
      if (!task.dueDate) return false
      const thisMonth = getMonthRange(today)
      const monthTaskDate = new Date(task.dueDate)
      return monthTaskDate >= thisMonth.start && monthTaskDate <= thisMonth.end
      
    case 'overdue':
      return isOverdue(task)
      
    case 'noDate':
      return !task.dueDate
      
    default:
      return true
  }
}

const getPriorityText = (priority: string) => {
  const map: Record<string, string> = {
    high: '高',
    medium: '中',
    low: '低'
  }
  return map[priority] || priority
}

const getCategoryText = (category: string) => {
  const map: Record<string, string> = {
    work: '工作',
    personal: '个人',
    study: '学习',
    health: '健康',
    other: '其他'
  }
  return map[category] || category
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('zh-CN')
}

const toggleTask = (task: Task) => {
  ElMessage.success(task.completed ? '任务已完成' : '任务已取消完成')
}

const viewTaskDetail = (task: Task) => {
  console.log('查看任务详情:', task.title)
  // 这里可以跳转到任务详情页面
}

const editTask = (task: Task) => {
  console.log('编辑任务:', task.title)
  // 这里可以打开编辑对话框
}

const deleteTask = (task: Task) => {
  ElMessageBox.confirm(
    '确定要删除这个任务吗？',
    '删除任务',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    const index = tasks.value.findIndex(t => t.id === task.id)
    if (index > -1) {
      tasks.value.splice(index, 1)
      ElMessage.success('任务删除成功')
    }
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

const createTask = () => {
  // 这里应该有表单验证
  const task: Task = {
    id: Date.now().toString(),
    title: newTask.value.title,
    description: newTask.value.description,
    completed: false,
    priority: newTask.value.priority as 'high' | 'medium' | 'low',
    category: newTask.value.category as 'work' | 'personal' | 'study' | 'health' | 'other',
    dueDate: newTask.value.dueDate,
    createdAt: new Date().toISOString().split('T')[0]
  }
  
  tasks.value.unshift(task)
  showAddDialog.value = false
  
  // 重置表单
  newTask.value = {
    title: '',
    description: '',
    priority: 'medium',
    category: 'work',
    dueDate: ''
  }
  
  ElMessage.success('任务创建成功')
}

const resetFilters = () => {
  searchQuery.value = ''
  selectedStatus.value = ''
  selectedPriority.value = ''
  selectedTimeRange.value = ''
}

onMounted(() => {
  console.log('TodoList页面已加载')
})
</script>

<style scoped lang="scss">
.todo-list {
  padding: 24px;
  background: #f5f5f5;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  
  .header-left {
    .page-title {
      display: flex;
      align-items: center;
      margin: 0 0 8px 0;
      font-size: 28px;
      font-weight: 600;
      color: #333;
      
      .title-icon {
        margin-right: 12px;
        font-size: 32px;
        color: #1890ff;
      }
    }
    
    .page-subtitle {
      margin: 0;
      font-size: 14px;
      color: #666;
    }
  }
  
  .header-right {
    .el-button {
      padding: 12px 24px;
      font-size: 14px;
    }
  }
}

.stats-overview {
  margin-bottom: 24px;
  
  .stat-card {
    display: flex;
    align-items: center;
    padding: 20px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    border: 1px solid #f0f0f0;
    transition: all 0.3s ease;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    }
    
    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;
      
      .el-icon {
        font-size: 24px;
        color: white;
      }
    }
    
    .stat-info {
      h3 {
        margin: 0 0 4px 0;
        font-size: 24px;
        font-weight: 600;
        color: #333;
      }
      
      p {
        margin: 0;
        font-size: 14px;
        color: #666;
      }
    }
    
    &.total .stat-icon {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    
    &.pending .stat-icon {
      background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
    }
    
    &.completed .stat-icon {
      background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
    }
    
    &.overdue .stat-icon {
      background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
    }
  }
}

// 双栏布局容器
.task-main-container {
  margin-bottom: 24px;
  
  // 确保桌面端两列等高
  @media (min-width: 768px) {
    :deep(.el-row) {
      display: flex;
      align-items: stretch;
    }
    
    :deep(.el-col) {
      display: flex;
      flex-direction: column;
    }
  }
}

// 区域样式
.today-tasks-section,
.all-tasks-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #f0f0f0;
  padding: 20px;
  min-height: 500px;
  max-height: 800px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0; // 防止标题区域被压缩
  
  .section-title {
    display: flex;
    align-items: center;
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #333;
    
    .el-icon {
      margin-right: 8px;
      font-size: 20px;
      color: #1890ff;
    }
  }
  
  .task-count {
    font-size: 14px;
    color: #666;
    background: #f5f5f5;
    padding: 4px 12px;
    border-radius: 12px;
  }
}

.filter-section {
  margin-bottom: 20px;
  flex-shrink: 0; // 防止筛选区域被压缩
  
  .filter-top {
    margin-bottom: 12px;
  }
  
  .filter-bottom {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
  }
}

.task-list-container {
  flex: 1;
  overflow-y: auto;
  min-height: 0; // 关键：允许flex子项收缩
  
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
  
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 300px;
    text-align: center;
    
    .empty-icon {
      font-size: 64px;
      margin-bottom: 16px;
      opacity: 0.6;
    }
    
    h3 {
      margin: 0 0 8px 0;
      font-size: 18px;
      color: #333;
    }
    
    p {
      margin: 0;
      font-size: 14px;
      color: #666;
    }
  }
  
  .task-list {
    padding: 0;
    
    .task-item {
      display: flex;
      align-items: flex-start;
      padding: 16px;
      margin-bottom: 8px;
      background: #fafafa;
      border-radius: 8px;
      border: 1px solid #f0f0f0;
      transition: all 0.3s ease;
      
      &:hover {
        background: white;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        transform: translateY(-1px);
      }
      
      &:last-child {
        margin-bottom: 0;
      }
      
      &.completed {
        opacity: 0.7;
        
        .task-title {
          text-decoration: line-through;
          color: #999;
        }
      }
      
      &.overdue {
        border-left: 4px solid #ff4d4f;
        background: #fff2f0;
      }
      
      &.priority-high {
        border-left: 4px solid #ff4d4f;
      }
      
      &.priority-medium {
        border-left: 4px solid #faad14;
      }
      
      &.priority-low {
        border-left: 4px solid #52c41a;
      }
      
      .task-checkbox {
        margin-right: 16px;
        margin-top: 4px;
      }
      
      .task-content {
        flex: 1;
        cursor: pointer;
        
        .task-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
          
          .task-title {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
            color: #333;
            line-height: 1.4;
          }
          
          .task-badges {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
            margin-left: 12px;
          }
        }
        
        .task-description {
          margin: 0 0 12px 0;
          font-size: 14px;
          color: #666;
          line-height: 1.5;
        }
        
        .task-meta {
          display: flex;
          gap: 16px;
          font-size: 12px;
          color: #999;
          
          .due-date,
          .create-date {
            display: flex;
            align-items: center;
            gap: 4px;
          }
        }
      }
      
      .task-actions {
        display: flex;
        gap: 8px;
        margin-left: 16px;
        opacity: 0;
        transition: opacity 0.3s ease;
        
        .el-button {
          padding: 4px 8px;
        }
      }
      
      &:hover .task-actions {
        opacity: 1;
      }
    }
  }
}

.priority-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  
  &.priority-high {
    background: #fff2f0;
    color: #ff4d4f;
    border: 1px solid #ffccc7;
  }
  
  &.priority-medium {
    background: #fffbe6;
    color: #faad14;
    border: 1px solid #ffe58f;
  }
  
  &.priority-low {
    background: #f6ffed;
    color: #52c41a;
    border: 1px solid #b7eb8f;
  }
}

.category-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  
  &.category-work {
    background: #f6ffed;
    color: #52c41a;
    border: 1px solid #b7eb8f;
  }
  
  &.category-personal {
    background: #fff0f6;
    color: #eb2f96;
    border: 1px solid #ffadd2;
  }
  
  &.category-study {
    background: #f9f0ff;
    color: #722ed1;
    border: 1px solid #d3adf7;
  }
  
  &.category-health {
    background: #e6f7ff;
    color: #1890ff;
    border: 1px solid #91d5ff;
  }
  
  &.category-other {
    background: #f0f0f0;
    color: #666;
    border: 1px solid #d9d9d9;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .todo-list {
    padding: 16px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 16px;
    
    .header-right {
      align-self: stretch;
      
      .el-button {
        width: 100%;
      }
    }
  }
  
  // 移动端双栏变单栏
  .task-main-container {
    .today-tasks-section {
      margin-bottom: 20px;
    }
    
    // 移动端重置高度限制
    .today-tasks-section,
    .all-tasks-section {
      min-height: auto;
      max-height: none;
      height: auto;
    }
    
    .task-list-container {
      overflow-y: visible;
      
      .empty-state {
        height: auto;
        min-height: 200px;
        padding: 40px 20px;
      }
    }
  }
  
  .section-header {
    .section-title {
      font-size: 16px;
      
      .el-icon {
        font-size: 18px;
      }
    }
    
    .task-count {
      font-size: 12px;
      padding: 2px 8px;
    }
  }
  
  .filter-section {
    .filter-top {
      margin-bottom: 16px;
      
      .el-input {
        width: 100% !important;
      }
    }
    
    .filter-bottom {
      justify-content: flex-start;
      flex-wrap: wrap;
      gap: 8px;
      
      .el-select {
        width: 100px !important;
        margin-left: 0 !important;
      }
      
      .el-button {
        margin-left: 0 !important;
      }
    }
  }
  
  .task-item {
    .task-header {
      flex-direction: column;
      align-items: flex-start;
      
      .task-badges {
        margin-left: 0;
        margin-top: 8px;
      }
    }
    
    .task-actions {
      opacity: 1;
      margin-left: 0;
      margin-top: 8px;
      border-top: 1px solid #f0f0f0;
      padding-top: 8px;
    }
  }
}
</style> 