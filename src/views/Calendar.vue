<template>
  <div class="calendar-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-title">
        <h1>日程管理</h1>
        <p>管理您的日程安排和提醒</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="showCreateDialog" size="large">
          <el-icon><Plus /></el-icon>
          新建日程
        </el-button>
      </div>
    </div>

    <!-- 搜索和筛选区域 -->
    <div class="filter-section">
      <div class="filter-row">
        <div class="search-box">
          <el-input
            v-model="searchQuery"
            placeholder="搜索日程..."
            prefix-icon="Search"
            clearable
            @input="onSearchChange"
            size="large"
          />
        </div>
        <div class="filter-controls">
          <el-select
            v-model="filterType"
            placeholder="类型筛选"
            clearable
            @change="onFilterChange"
            size="large"
          >
            <el-option label="全部" value="" />
            <el-option label="工作" value="work" />
            <el-option label="学习" value="study" />
            <el-option label="运动" value="exercise" />
            <el-option label="娱乐" value="entertainment" />
            <el-option label="生活" value="life" />
            <el-option label="其他" value="other" />
          </el-select>
          <el-select
            v-model="filterStatus"
            placeholder="状态筛选"
            clearable
            @change="onFilterChange"
            size="large"
          >
            <el-option label="全部" value="" />
            <el-option label="待开始" value="pending" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="completed" />
          </el-select>
          <el-date-picker
            v-model="selectedDate"
            type="date"
            placeholder="选择日期"
            @change="onDateChange"
            size="large"
          />
        </div>
      </div>
    </div>

    <!-- 日程列表 -->
    <div class="schedule-content">
      <div class="schedule-header">
        <h2>今日日程</h2>
        <div class="schedule-stats">
          <span class="stat-item">
            <el-icon><Clock /></el-icon>
            {{ filteredSchedules.length }} 项日程
          </span>
          <span class="stat-item">
            <el-icon><Check /></el-icon>
            {{ completedCount }} 项完成
          </span>
        </div>
      </div>
      
      <div class="schedule-list-container">
        <ScheduleList :schedules="filteredSchedules" @schedule-click="onScheduleClick" />
      </div>
    </div>

    <!-- 创建/编辑日程对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑日程' : '新建日程'"
      width="600px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <el-form
        ref="scheduleFormRef"
        :model="scheduleForm"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="日程标题" prop="title">
          <el-input
            v-model="scheduleForm.title"
            placeholder="请输入日程标题"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="日程描述" prop="description">
          <el-input
            v-model="scheduleForm.description"
            type="textarea"
            placeholder="请输入日程描述"
            :rows="3"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="日程类型" prop="type">
          <el-select v-model="scheduleForm.type" placeholder="请选择类型">
            <el-option label="工作" value="work" />
            <el-option label="学习" value="study" />
            <el-option label="运动" value="exercise" />
            <el-option label="娱乐" value="entertainment" />
            <el-option label="生活" value="life" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="开始时间" prop="startTime">
          <el-time-picker
            v-model="scheduleForm.startTime"
            format="HH:mm"
            placeholder="选择开始时间"
          />
        </el-form-item>
        
        <el-form-item label="结束时间" prop="endTime">
          <el-time-picker
            v-model="scheduleForm.endTime"
            format="HH:mm"
            placeholder="选择结束时间"
          />
        </el-form-item>
        
        <el-form-item label="日程日期" prop="date">
          <el-date-picker
            v-model="scheduleForm.date"
            type="date"
            placeholder="选择日期"
          />
        </el-form-item>
        
        <el-form-item label="参与者">
          <el-input
            v-model="scheduleForm.participants"
            placeholder="输入参与者（可选）"
          />
        </el-form-item>
        
        <el-form-item label="重复设置">
          <el-checkbox v-model="scheduleForm.isRepeated">重复日程</el-checkbox>
        </el-form-item>
        
        <el-form-item v-if="scheduleForm.isRepeated" label="重复类型">
          <el-select v-model="scheduleForm.repeatType" placeholder="选择重复类型">
            <el-option label="每天" value="daily" />
            <el-option label="每周" value="weekly" />
            <el-option label="每月" value="monthly" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="提醒设置">
          <el-checkbox v-model="scheduleForm.hasReminder">开启提醒</el-checkbox>
        </el-form-item>
        
        <el-form-item v-if="scheduleForm.hasReminder" label="提醒时间">
          <el-select v-model="scheduleForm.reminderTime" placeholder="选择提醒时间">
            <el-option label="准时提醒" value="0" />
            <el-option label="提前5分钟" value="5" />
            <el-option label="提前10分钟" value="10" />
            <el-option label="提前15分钟" value="15" />
            <el-option label="提前30分钟" value="30" />
            <el-option label="提前1小时" value="60" />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancelEdit">取消</el-button>
          <el-button type="primary" @click="saveSchedule" :loading="saving">
            {{ isEdit ? '更新' : '创建' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Clock, Check } from '@element-plus/icons-vue'
import ScheduleList from '../components/ScheduleList.vue'

// 接口定义
interface Schedule {
  id: string
  title: string
  description?: string
  startTime: string // 格式: "HH:mm"
  endTime?: string // 格式: "HH:mm"
  priority: 'low' | 'medium' | 'high'
  category: 'work' | 'personal' | 'health' | 'study' | 'meeting' | 'event'
  location?: string
  participants?: string[]
  isReminder?: boolean
  status?: 'pending' | 'in-progress' | 'completed' | 'cancelled'
  // 额外字段用于日程管理
  date?: string
  type?: string
  isRepeated?: boolean
  repeatType?: string
  hasReminder?: boolean
  reminderTime?: string
  progress?: number
}

// 响应式数据
const schedules = ref<Schedule[]>([])
const searchQuery = ref('')
const filterType = ref('')
const filterStatus = ref('')
const selectedDate = ref('')
const dialogVisible = ref(false)
const isEdit = ref(false)
const currentScheduleId = ref('')
const saving = ref(false)
const scheduleFormRef = ref()

// 日程表单数据
const scheduleForm = reactive({
  title: '',
  description: '',
  type: '',
  startTime: '',
  endTime: '',
  date: '',
  participants: '',
  isRepeated: false,
  repeatType: '',
  hasReminder: false,
  reminderTime: ''
})

// 表单验证规则
const formRules = {
  title: [
    { required: true, message: '请输入日程标题', trigger: 'blur' },
    { min: 1, max: 50, message: '标题长度在1到50个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择日程类型', trigger: 'change' }
  ],
  startTime: [
    { required: true, message: '请选择开始时间', trigger: 'change' }
  ],
  endTime: [
    { required: true, message: '请选择结束时间', trigger: 'change' }
  ],
  date: [
    { required: true, message: '请选择日期', trigger: 'change' }
  ]
}

// 计算属性
const filteredSchedules = computed(() => {
  let filtered = schedules.value

  // 搜索过滤
  if (searchQuery.value) {
    filtered = filtered.filter(schedule => 
      schedule.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (schedule.description && schedule.description.toLowerCase().includes(searchQuery.value.toLowerCase()))
    )
  }

  // 类型过滤
  if (filterType.value) {
    filtered = filtered.filter(schedule => schedule.type === filterType.value || schedule.category === filterType.value)
  }

  // 状态过滤
  if (filterStatus.value) {
    filtered = filtered.filter(schedule => schedule.status === filterStatus.value)
  }

  // 日期过滤
  if (selectedDate.value) {
    filtered = filtered.filter(schedule => schedule.date === selectedDate.value)
  }

  return filtered
})

const completedCount = computed(() => {
  return filteredSchedules.value.filter(schedule => schedule.status === 'completed').length
})

// 方法
const loadSchedules = () => {
  // 模拟加载日程数据
  schedules.value = [
    {
      id: '1',
      title: '早晨锻炼',
      description: '晨跑30分钟，保持身体健康',
      startTime: '07:00',
      endTime: '07:30',
      priority: 'medium',
      category: 'health',
      type: 'exercise',
      date: '2024-01-20',
      status: 'completed',
      progress: 100,
      hasReminder: true,
      reminderTime: '10',
      isReminder: true
    },
    {
      id: '2',
      title: '工作会议',
      description: '团队周会，讨论项目进展',
      startTime: '09:00',
      endTime: '10:00',
      priority: 'high',
      category: 'work',
      type: 'work',
      date: '2024-01-20',
      participants: ['张三', '李四', '王五'],
      status: 'in-progress',
      progress: 60,
      hasReminder: true,
      reminderTime: '15',
      isReminder: true
    },
    {
      id: '3',
      title: '学习新技术',
      description: '学习Vue 3新特性',
      startTime: '14:00',
      endTime: '16:00',
      priority: 'medium',
      category: 'study',
      type: 'study',
      date: '2024-01-20',
      status: 'pending',
      progress: 0,
      isRepeated: true,
      repeatType: 'daily'
    },
    {
      id: '4',
      title: '健身',
      description: '力量训练1小时',
      startTime: '18:00',
      endTime: '19:00',
      priority: 'low',
      category: 'health',
      type: 'exercise',
      date: '2024-01-20',
      status: 'pending',
      progress: 0
    },
    {
      id: '5',
      title: '洗漱',
      description: '晚上洗漱准备休息',
      startTime: '18:30',
      endTime: '19:30',
      priority: 'low',
      category: 'personal',
      type: 'life',
      date: '2024-01-20',
      status: 'pending',
      progress: 0
    }
  ]
}

const showCreateDialog = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

const onScheduleClick = (schedule: Schedule) => {
  // 处理日程点击事件
  console.log('日程点击:', schedule)
}

const onSearchChange = () => {
  // 搜索变化处理
  console.log('搜索内容:', searchQuery.value)
}

const onFilterChange = () => {
  // 过滤条件变化处理
  console.log('过滤条件变化')
}

const onDateChange = () => {
  // 日期变化处理
  console.log('日期变化:', selectedDate.value)
}

const resetForm = () => {
  Object.assign(scheduleForm, {
    title: '',
    description: '',
    type: '',
    startTime: '',
    endTime: '',
    date: new Date().toISOString().split('T')[0],
    participants: '',
    isRepeated: false,
    repeatType: '',
    hasReminder: false,
    reminderTime: ''
  })
}

const saveSchedule = async () => {
  if (!scheduleFormRef.value) return

  try {
    await scheduleFormRef.value.validate()
    saving.value = true

    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 根据类型映射到category
    const typeToCategory = {
      'work': 'work',
      'study': 'study',
      'exercise': 'health',
      'entertainment': 'personal',
      'life': 'personal',
      'other': 'personal'
    } as const

    const newSchedule: Schedule = {
      id: isEdit.value ? currentScheduleId.value : Date.now().toString(),
      title: scheduleForm.title,
      description: scheduleForm.description,
      startTime: scheduleForm.startTime,
      endTime: scheduleForm.endTime,
      priority: 'medium', // 默认优先级
      category: typeToCategory[scheduleForm.type as keyof typeof typeToCategory] || 'personal',
      type: scheduleForm.type,
      date: scheduleForm.date,
      participants: scheduleForm.participants ? scheduleForm.participants.split(',').map(p => p.trim()) : [],
      isRepeated: scheduleForm.isRepeated,
      repeatType: scheduleForm.repeatType,
      hasReminder: scheduleForm.hasReminder,
      reminderTime: scheduleForm.reminderTime,
      isReminder: scheduleForm.hasReminder,
      status: 'pending',
      progress: 0
    }

    if (isEdit.value) {
      const index = schedules.value.findIndex(s => s.id === currentScheduleId.value)
      if (index !== -1) {
        schedules.value[index] = newSchedule
      }
      ElMessage.success('日程更新成功')
    } else {
      schedules.value.push(newSchedule)
      ElMessage.success('日程创建成功')
    }

    dialogVisible.value = false
    resetForm()
  } catch (error) {
    console.error('保存失败:', error)
  } finally {
    saving.value = false
  }
}

const cancelEdit = () => {
  dialogVisible.value = false
  resetForm()
}

// 生命周期
onMounted(() => {
  loadSchedules()
})
</script>

<style scoped lang="scss">
.calendar-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);

  .header-title {
    h1 {
      font-size: 28px;
      color: #2c3e50;
      margin: 0 0 8px 0;
    }

    p {
      color: #7f8c8d;
      margin: 0;
      font-size: 14px;
    }
  }

  .header-actions {
    .el-button {
      padding: 12px 24px;
      font-size: 16px;
    }
  }
}

.filter-section {
  margin-bottom: 20px;
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);

  .filter-row {
    display: flex;
    gap: 15px;
    align-items: center;

    .search-box {
      flex: 1;
      max-width: 300px;
    }

    .filter-controls {
      display: flex;
      gap: 10px;

      .el-select {
        width: 120px;
      }

      .el-date-picker {
        width: 140px;
      }
    }
  }
}

.schedule-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;

  .schedule-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #ebeef5;

    h2 {
      margin: 0;
      font-size: 20px;
      color: #2c3e50;
    }

    .schedule-stats {
      display: flex;
      gap: 20px;

      .stat-item {
        display: flex;
        align-items: center;
        gap: 5px;
        color: #7f8c8d;
        font-size: 14px;

        .el-icon {
          font-size: 16px;
        }
      }
    }
  }

  .schedule-list-container {
    padding: 0;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

// 响应式设计
@media (max-width: 768px) {
  .calendar-container {
    padding: 10px;
  }

  .page-header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;

    .header-actions {
      width: 100%;

      .el-button {
        width: 100%;
      }
    }
  }

  .filter-section {
    .filter-row {
      flex-direction: column;
      gap: 10px;

      .search-box {
        max-width: none;
        width: 100%;
      }

      .filter-controls {
        width: 100%;
        flex-wrap: wrap;

        .el-select,
        .el-date-picker {
          width: 100%;
        }
      }
    }
  }

  .schedule-content {
    .schedule-header {
      flex-direction: column;
      gap: 10px;
      align-items: flex-start;

      .schedule-stats {
        flex-direction: column;
        gap: 10px;
      }
    }
  }
}
</style> 