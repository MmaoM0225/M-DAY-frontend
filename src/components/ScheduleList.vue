<template>
  <div class="schedule-list">
    <!-- 空状态 -->
    <div v-if="schedules.length === 0" class="empty-state">
      <div class="empty-icon">📅</div>
      <p class="empty-text">今日暂无日程安排</p>
      <p class="empty-desc">点击上方按钮添加新的日程</p>
    </div>
    
    <!-- 时间轴布局 -->
    <div v-else class="timeline-view" ref="timelineViewRef">
      <!-- 时间刻度轴 -->
      <div class="time-axis">
        <div 
          v-for="hour in timeHours" 
          :key="hour"
          class="time-mark"
          :style="{ top: getTimePosition(hour + ':00') + 'px' }"
        >
          <span class="time-label">{{ formatHour(hour) }}</span>
          <div class="time-line"></div>
        </div>
      </div>
      
      <!-- 日程容器 -->
      <div class="schedule-container" :style="{ height: timelineHeight + 'px' }">
        <!-- 当前时间线 -->
        <div 
          class="current-time-line"
          :style="{ top: getCurrentTimePosition() + 'px' }"
        >
          <div class="current-time-dot"></div>
          <div class="current-time-label">{{ currentTime }}</div>
        </div>
        
        <!-- 日程事件 -->
        <div 
          v-for="(schedule, index) in schedulesWithPosition" 
          :key="schedule.id"
          class="schedule-event"
          :class="[
            `priority-${schedule.priority}`,
            `category-${schedule.category}`,
            { 'is-current': isCurrentSchedule(schedule) },
            { 'is-past': isPastSchedule(schedule) },
            { 'is-upcoming': isUpcomingSchedule(schedule) },
            { 'has-overlap': schedule.hasOverlap },
            { 'is-active': activeScheduleId === schedule.id }
          ]"
          :style="{
            top: schedule.topPosition + 'px',
            height: schedule.height + 'px',
            left: schedule.leftOffset + 'px',
            width: schedule.width + 'px',
            zIndex: schedule.zIndex
          }"
          @click="handleScheduleClick(schedule)"
        >
          <!-- 时间标签 -->
          <div class="event-time">
            <span class="start-time">{{ formatTime(schedule.startTime) }}</span>
            <span v-if="schedule.endTime" class="end-time">{{ formatTime(schedule.endTime) }}</span>
          </div>
          
          <!-- 事件内容 -->
          <div class="event-content">
            <h4 class="event-title">{{ schedule.title }}</h4>
            <p v-if="schedule.description" class="event-desc">{{ schedule.description }}</p>
            
            <!-- 位置信息 -->
            <div v-if="schedule.location" class="event-location">
              <el-icon><Location /></el-icon>
              <span>{{ schedule.location }}</span>
            </div>
            
            <!-- 重叠指示器 -->
            <div v-if="schedule.hasOverlap" class="overlap-indicator">
              <el-icon><Connection /></el-icon>
              <span>{{ schedule.overlapCount }}个重叠</span>
            </div>
          </div>
          
          <!-- 进度条（仅进行中的日程） -->
          <div v-if="isCurrentSchedule(schedule)" class="event-progress">
            <div 
              class="progress-fill"
              :style="{ height: getScheduleProgress(schedule) + '%' }"
            ></div>
          </div>
          
          <!-- 激活状态指示器 -->
          <div v-if="activeScheduleId === schedule.id" class="active-indicator">
            <el-icon><View /></el-icon>
          </div>
        </div>
      </div>
    </div>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="selectedSchedule?.title || '日程详情'"
      :width="isMobile ? '100%' : '600px'"
      :fullscreen="isMobile"
      :before-close="handleDetailDialogClose"
      class="schedule-detail-dialog"
      :class="{ 'mobile-dialog': isMobile }"
    >
      <div v-if="selectedSchedule" class="schedule-detail">
        <!-- 头部信息 -->
        <div class="detail-header">
          <div class="schedule-status">
            <el-tag 
              :type="getStatusTagType(selectedSchedule)"
              size="large"
              class="status-tag"
            >
              {{ getStatusText(selectedSchedule) }}
            </el-tag>
            <el-tag 
              :type="getPriorityTagType(selectedSchedule.priority)"
              class="priority-tag"
            >
              {{ getPriorityText(selectedSchedule.priority) }}
            </el-tag>
          </div>
          <div class="schedule-time-info">
            <div class="time-range">
              <el-icon class="time-icon"><Clock /></el-icon>
              <span class="time-text">
                {{ formatTime(selectedSchedule.startTime) }}
                <span v-if="selectedSchedule.endTime"> - {{ formatTime(selectedSchedule.endTime) }}</span>
              </span>
            </div>
            <div v-if="selectedSchedule.endTime" class="duration">
              <span class="duration-text">持续时间：{{ getDuration(selectedSchedule) }}</span>
            </div>
          </div>
        </div>

        <!-- 基本信息 -->
        <div class="detail-section">
          <h4 class="section-title">基本信息</h4>
          <div class="info-grid">
            <div class="info-item">
              <label class="info-label">标题</label>
              <span class="info-value">{{ selectedSchedule.title }}</span>
            </div>
            <div v-if="selectedSchedule.description" class="info-item full-width">
              <label class="info-label">描述</label>
              <span class="info-value">{{ selectedSchedule.description }}</span>
            </div>
            <div class="info-item">
              <label class="info-label">分类</label>
              <el-tag 
                :type="getCategoryTagType(selectedSchedule.category)"
                class="category-tag"
              >
                {{ getCategoryName(selectedSchedule.category) }}
              </el-tag>
            </div>
            <div v-if="selectedSchedule.location" class="info-item">
              <label class="info-label">地点</label>
              <span class="info-value">
                <el-icon><Location /></el-icon>
                {{ selectedSchedule.location }}
              </span>
            </div>
          </div>
        </div>

        <!-- 参与者信息 -->
        <div v-if="selectedSchedule.participants && selectedSchedule.participants.length > 0" class="detail-section">
          <h4 class="section-title">参与者</h4>
          <div class="participants-list">
            <el-tag
              v-for="participant in selectedSchedule.participants"
              :key="participant"
              class="participant-tag"
            >
              <el-icon><User /></el-icon>
              {{ participant }}
            </el-tag>
          </div>
        </div>

        <!-- 重叠信息 -->
        <div v-if="selectedSchedule.hasOverlap" class="detail-section">
          <h4 class="section-title">时间冲突</h4>
          <div class="overlap-warning">
            <el-alert
              title="此日程与其他日程存在时间重叠"
              type="warning"
              :description="`共有 ${selectedSchedule.overlapCount} 个日程存在时间冲突`"
              show-icon
              :closable="false"
            />
          </div>
        </div>

        <!-- 提醒设置 -->
        <div class="detail-section">
          <h4 class="section-title">提醒设置</h4>
          <div class="reminder-info">
            <el-icon class="reminder-icon">
              <Bell v-if="selectedSchedule.isReminder" />
              <MuteNotification v-else />
            </el-icon>
            <span class="reminder-text">
              {{ selectedSchedule.isReminder ? '已开启提醒' : '未开启提醒' }}
            </span>
          </div>
        </div>

        <!-- 进度信息（仅进行中的日程） -->
        <div v-if="isCurrentSchedule(selectedSchedule)" class="detail-section">
          <h4 class="section-title">进度信息</h4>
          <div class="progress-info">
            <div class="progress-bar-detail">
              <div 
                class="progress-fill-detail"
                :style="{ width: getScheduleProgress(selectedSchedule) + '%' }"
              ></div>
            </div>
            <span class="progress-percentage">{{ Math.round(getScheduleProgress(selectedSchedule)) }}%</span>
          </div>
          <p class="progress-text">此日程正在进行中...</p>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
          <el-button 
            type="primary" 
            @click="editFromDetail"
          >
            编辑日程
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, nextTick } from 'vue'
import { Location, Connection, Clock, User, Bell, MuteNotification, View } from '@element-plus/icons-vue'

// 类型定义
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
}

// 扩展的日程接口（包含位置信息）
interface ScheduleWithPosition extends Schedule {
  topPosition: number
  height: number
  leftOffset: number
  width: number
  zIndex: number
  hasOverlap: boolean
  overlapCount: number
  overlapGroup: number
}

// Props
interface Props {
  schedules: Schedule[]
  currentTime?: string // 当前时间，格式: "HH:mm"
  startHour?: number // 时间轴开始小时
  endHour?: number // 时间轴结束小时
  hourHeight?: number // 每小时的像素高度
}

const props = withDefaults(defineProps<Props>(), {
  schedules: () => [],
  currentTime: () => {
    const now = new Date()
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  },
  startHour: 0,
  endHour: 24,
  hourHeight: 60
})

// Emits
const emit = defineEmits<{
  scheduleClick: [schedule: Schedule]
  viewDetail: [schedule: Schedule]
  editSchedule: [schedule: Schedule]
}>()

// 响应式数据
const activeScheduleId = ref<string | null>(null)
const timelineViewRef = ref<HTMLElement | null>(null)
const isInitialScroll = ref(false)
const currentTime = ref<string>('')
const timeUpdateTimer = ref<number | null>(null)
const initialTimeoutTimer = ref<number | null>(null)
const detailDialogVisible = ref(false)
const selectedSchedule = ref<ScheduleWithPosition | null>(null)
const isMobile = ref(false)

// 获取当前时间的方法
const getCurrentTimeString = () => {
  const now = new Date()
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
}

// 更新当前时间
const updateCurrentTime = () => {
  currentTime.value = getCurrentTimeString()
}

// 检测移动端
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

// 监听窗口大小变化
const handleResize = () => {
  checkMobile()
}

// 计算属性
const timeHours = computed(() => {
  const hours = []
  for (let h = props.startHour; h < props.endHour; h++) {
    hours.push(h)
  }
  return hours
})

const timelineHeight = computed(() => {
  return (props.endHour - props.startHour) * props.hourHeight
})

const sortedSchedules = computed(() => {
  return [...props.schedules].sort((a, b) => {
    const timeA = a.startTime.replace(':', '')
    const timeB = b.startTime.replace(':', '')
    return timeA.localeCompare(timeB)
  })
})

// 计算日程位置和重叠信息
const schedulesWithPosition = computed(() => {
  const schedules = sortedSchedules.value
  const result: ScheduleWithPosition[] = []
  
  // 首先检测重叠组
  const overlapGroups = findOverlapGroups(schedules)
  
  schedules.forEach((schedule, index) => {
    const startMinutes = timeToMinutes(schedule.startTime)
    const endMinutes = schedule.endTime ? timeToMinutes(schedule.endTime) : startMinutes + 60
    const duration = endMinutes - startMinutes
    
    // 计算垂直位置
    const topPosition = getTimePosition(schedule.startTime)
    const height = Math.max((duration / 60) * props.hourHeight, 30) // 最小高度30px
    
    // 查找重叠组
    const overlapGroup = overlapGroups.find(group => 
      group.schedules.some(s => s.id === schedule.id)
    )
    
    let leftOffset = isMobile.value ? 70 : 80 // 移动端使用更小的左偏移
    let width = isMobile.value ? 180 : 240 // 移动端使用更小的基础宽度
    let zIndex = 1
    
    if (overlapGroup) {
      const scheduleIndexInGroup = overlapGroup.schedules.findIndex(s => s.id === schedule.id)
      const totalInGroup = overlapGroup.schedules.length
      
      // 计算重叠布局
      if (isMobile.value) {
        // 移动端重叠布局优化
        width = Math.max(120, 180 - (totalInGroup - 1) * 15)
        leftOffset = 70 + scheduleIndexInGroup * 18 // 缩小移动端重叠偏移
      } else {
        // 桌面端重叠布局
        width = Math.max(180, 240 - (totalInGroup - 1) * 20)
        leftOffset = 80 + scheduleIndexInGroup * 25
      }
      zIndex = scheduleIndexInGroup + 1
    }
    
    result.push({
      ...schedule,
      topPosition,
      height,
      leftOffset,
      width,
      zIndex,
      hasOverlap: overlapGroup ? overlapGroup.schedules.length > 1 : false,
      overlapCount: overlapGroup ? overlapGroup.schedules.length - 1 : 0,
      overlapGroup: overlapGroup ? overlapGroup.id : -1
    })
  })
  
  return result
})

// 方法
const timeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

const getTimePosition = (time: string) => {
  const minutes = timeToMinutes(time)
  const startMinutes = props.startHour * 60
  return ((minutes - startMinutes) / 60) * props.hourHeight
}

const getCurrentTimePosition = () => {
  return getTimePosition(currentTime.value)
}

const formatTime = (time: string) => {
  return time
}

const formatHour = (hour: number) => {
  return hour.toString().padStart(2, '0') + ':00'
}

// 检测时间重叠
const hasTimeOverlap = (schedule1: Schedule, schedule2: Schedule) => {
  const start1 = timeToMinutes(schedule1.startTime)
  const end1 = schedule1.endTime ? timeToMinutes(schedule1.endTime) : start1 + 60
  const start2 = timeToMinutes(schedule2.startTime)
  const end2 = schedule2.endTime ? timeToMinutes(schedule2.endTime) : start2 + 60
  
  return start1 < end2 && start2 < end1
}

// 查找重叠组
const findOverlapGroups = (schedules: Schedule[]) => {
  const groups: { id: number, schedules: Schedule[] }[] = []
  const processed = new Set<string>()
  
  schedules.forEach(schedule => {
    if (processed.has(schedule.id)) return
    
    const overlappingSchedules = [schedule]
    processed.add(schedule.id)
    
    // 查找与当前日程重叠的所有日程
    schedules.forEach(otherSchedule => {
      if (otherSchedule.id !== schedule.id && !processed.has(otherSchedule.id)) {
        if (hasTimeOverlap(schedule, otherSchedule)) {
          overlappingSchedules.push(otherSchedule)
          processed.add(otherSchedule.id)
        }
      }
    })
    
    if (overlappingSchedules.length > 1) {
      groups.push({
        id: groups.length,
        schedules: overlappingSchedules
      })
    }
  })
  
  return groups
}

const isCurrentSchedule = (schedule: Schedule) => {
  const currentMinutes = timeToMinutes(currentTime.value)
  const startMinutes = timeToMinutes(schedule.startTime)
  const endMinutes = schedule.endTime ? timeToMinutes(schedule.endTime) : startMinutes + 60
  
  return currentMinutes >= startMinutes && currentMinutes < endMinutes
}

const isPastSchedule = (schedule: Schedule) => {
  const currentMinutes = timeToMinutes(currentTime.value)
  const endMinutes = schedule.endTime ? timeToMinutes(schedule.endTime) : timeToMinutes(schedule.startTime) + 60
  
  return currentMinutes >= endMinutes
}

const isUpcomingSchedule = (schedule: Schedule) => {
  const currentMinutes = timeToMinutes(currentTime.value)
  const startMinutes = timeToMinutes(schedule.startTime)
  
  return currentMinutes < startMinutes
}

const getScheduleProgress = (schedule: Schedule) => {
  const currentMinutes = timeToMinutes(currentTime.value)
  const startMinutes = timeToMinutes(schedule.startTime)
  const endMinutes = schedule.endTime ? timeToMinutes(schedule.endTime) : startMinutes + 60
  
  const progress = ((currentMinutes - startMinutes) / (endMinutes - startMinutes)) * 100
  return Math.min(Math.max(progress, 0), 100)
}

// 事件处理
const handleScheduleClick = (schedule: ScheduleWithPosition) => {
  if (activeScheduleId.value === schedule.id) {
    selectedSchedule.value = schedule
    detailDialogVisible.value = true
  } else {
    activeScheduleId.value = schedule.id
    
    // 将点击的事件置于顶层
    const maxZIndex = Math.max(...schedulesWithPosition.value.map(s => s.zIndex))
    schedule.zIndex = maxZIndex + 1
    
    emit('scheduleClick', schedule)
  }
}

// 滚动到当前时间
const scrollToCurrentTime = () => {
  if (!timelineViewRef.value || isInitialScroll.value) return
  
  const currentTimePosition = getCurrentTimePosition()
  const viewportHeight = timelineViewRef.value.clientHeight
  
  // 计算滚动位置，让当前时间显示在视口中央
  const scrollPosition = Math.max(0, currentTimePosition - viewportHeight / 2)
  
  timelineViewRef.value.scrollTo({
    top: scrollPosition,
    behavior: 'smooth'
  })
  
  isInitialScroll.value = true
}

// 启动时间更新定时器
const startTimeUpdater = () => {
  // 立即更新一次
  updateCurrentTime()
  
  // 计算到下一分钟的精确时间
  const now = new Date()
  const secondsUntilNextMinute = 60 - now.getSeconds()
  const millisecondsUntilNextMinute = secondsUntilNextMinute * 1000 - now.getMilliseconds()
  
  // 先等待到下一分钟，然后启动每分钟的定时器
  initialTimeoutTimer.value = setTimeout(() => {
    updateCurrentTime() // 在下一分钟开始时立即更新
    
    // 启动每分钟更新的定时器
    timeUpdateTimer.value = setInterval(() => {
      updateCurrentTime()
    }, 60000) // 60秒更新一次
  }, millisecondsUntilNextMinute)
}

// 停止时间更新定时器
const stopTimeUpdater = () => {
  // 清理初始超时定时器
  if (initialTimeoutTimer.value) {
    clearTimeout(initialTimeoutTimer.value)
    initialTimeoutTimer.value = null
  }
  
  // 清理定期更新定时器
  if (timeUpdateTimer.value) {
    clearInterval(timeUpdateTimer.value)
    timeUpdateTimer.value = null
  }
}

// 生命周期钩子
onMounted(() => {
  // 启动时间更新器
  startTimeUpdater()
  
  // 检测移动端
  checkMobile()
  
  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
  
  nextTick(() => {
    scrollToCurrentTime()
  })
})

onUnmounted(() => {
  // 清理定时器
  stopTimeUpdater()
  
  // 移除事件监听
  window.removeEventListener('resize', handleResize)
})

// 详情对话框相关方法
const openDetailDialog = (schedule: ScheduleWithPosition) => {
  selectedSchedule.value = schedule
  detailDialogVisible.value = true
}

const handleDetailDialogClose = () => {
  selectedSchedule.value = null
  detailDialogVisible.value = false
}

const editFromDetail = () => {
  if (selectedSchedule.value) {
    emit('editSchedule', selectedSchedule.value)
    handleDetailDialogClose()
  }
}

// 辅助方法
const getStatusTagType = (schedule: ScheduleWithPosition) => {
  if (isCurrentSchedule(schedule)) return 'success'
  if (isPastSchedule(schedule)) return 'info'
  return 'warning'
}

const getStatusText = (schedule: ScheduleWithPosition) => {
  if (isCurrentSchedule(schedule)) return '进行中'
  if (isPastSchedule(schedule)) return '已完成'
  return '待开始'
}

const getPriorityTagType = (priority: 'low' | 'medium' | 'high') => {
  const typeMap = {
    high: 'danger',
    medium: 'warning',
    low: 'success'
  }
  return typeMap[priority]
}

const getPriorityText = (priority: 'low' | 'medium' | 'high') => {
  const textMap = {
    high: '高优先级',
    medium: '中优先级',
    low: '低优先级'
  }
  return textMap[priority]
}

const getCategoryTagType = (category: 'work' | 'personal' | 'health' | 'study' | 'meeting' | 'event') => {
  const typeMap = {
    work: 'primary',
    personal: 'success',
    health: 'warning',
    study: 'info',
    meeting: 'danger',
    event: 'success'
  }
  return typeMap[category]
}

const getCategoryName = (category: 'work' | 'personal' | 'health' | 'study' | 'meeting' | 'event') => {
  const nameMap = {
    work: '工作',
    personal: '个人',
    health: '健康',
    study: '学习',
    meeting: '会议',
    event: '活动'
  }
  return nameMap[category]
}

const getDuration = (schedule: ScheduleWithPosition) => {
  if (!schedule.endTime) return '未设置结束时间'
  
  const startMinutes = timeToMinutes(schedule.startTime)
  const endMinutes = timeToMinutes(schedule.endTime)
  const durationMinutes = endMinutes - startMinutes
  
  const hours = Math.floor(durationMinutes / 60)
  const minutes = durationMinutes % 60
  
  if (hours > 0 && minutes > 0) {
    return `${hours}小时${minutes}分钟`
  } else if (hours > 0) {
    return `${hours}小时`
  } else {
    return `${minutes}分钟`
  }
}
</script>

<style scoped lang="scss">
.schedule-list {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  
  .empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.6;
  }
  
  .empty-text {
    font-size: 16px;
    color: #666;
    margin: 0 0 8px 0;
    font-weight: 500;
  }
  
  .empty-desc {
    font-size: 14px;
    color: #999;
    margin: 0;
  }
}

.timeline-view {
  position: relative;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}

.time-axis {
  position: absolute;
  left: 0;
  top: 0;
  width: 80px;
  height: 100%;
  background: #fafafa;
  border-right: 1px solid #e8e8e8;
  z-index: 10;
}

.time-mark {
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  
  .time-label {
    position: absolute;
    right: 8px;
    top: -8px;
    font-size: 12px;
    color: #666;
    font-weight: 500;
  }
  
  .time-line {
    position: absolute;
    right: 0;
    top: 0;
    width: 100%;
    height: 1px;
    background: #e8e8e8;
  }
}

.schedule-container {
  position: relative;
  margin-left: 80px;
  padding: 0 40px 0 20px;
  min-height: 100%;
}

.current-time-line {
  position: absolute;
  left: -80px;
  right: -20px;
  height: 2px;
  background: #ff4757;
  z-index: 15;
  
  .current-time-dot {
    position: absolute;
    left: 78px;
    top: -4px;
    width: 8px;
    height: 8px;
    background: #ff4757;
    border-radius: 50%;
    animation: currentTimePulse 2s infinite;
  }
  
  .current-time-label {
    position: absolute;
    right: 30px;
    top: -10px;
    font-size: 12px;
    color: #ff4757;
    font-weight: 600;
    background: white;
    padding: 2px 6px;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(255, 71, 87, 0.2);
    white-space: nowrap;
  }
}

.schedule-event {
  position: absolute;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e8e8e8;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
  
  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }
  
  &.is-active {
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
    transform: translateY(-4px);
  }
  
  // 状态样式
  &.is-current {
    background: linear-gradient(135deg, #e6f7ff, #f0f9ff);
    border-color: #52c41a;
    box-shadow: 0 4px 16px rgba(82, 196, 26, 0.2);
  }
  
  &.is-past {
    opacity: 0.7;
    filter: grayscale(0.3);
  }
  
  &.is-upcoming {
    background: linear-gradient(135deg, #f0f9ff, #e6f7ff);
    border-color: #1890ff;
  }
  
  // 重叠样式
  &.has-overlap {
    border-width: 2px;
    border-style: dashed;
    border-color: #faad14;
    
    &::before {
      content: '';
      position: absolute;
      top: 2px;
      right: 2px;
      width: 8px;
      height: 8px;
      background: #faad14;
      border-radius: 50%;
    }
  }
  
  // 优先级样式
  &.priority-high {
    border-left: 4px solid #ff4d4f;
  }
  
  &.priority-medium {
    border-left: 4px solid #faad14;
  }
  
  &.priority-low {
    border-left: 4px solid #52c41a;
  }
  
  // 分类样式
  &.category-work {
    background: linear-gradient(135deg, #f6ffed, #f0f9ff);
  }
  
  &.category-personal {
    background: linear-gradient(135deg, #fff0f6, #f9f0ff);
  }
  
  &.category-health {
    background: linear-gradient(135deg, #f0f9ff, #e6f7ff);
  }
  
  &.category-study {
    background: linear-gradient(135deg, #f9f0ff, #fff0f6);
  }
  
  &.category-meeting {
    background: linear-gradient(135deg, #fff7e6, #ffeaa7);
  }
  
  &.category-event {
    background: linear-gradient(135deg, #f6ffed, #e6f7ff);
  }
}

.event-time {
  position: absolute;
  top: 4px;
  right: 8px;
  font-size: 10px;
  color: #666;
  text-align: right;
  line-height: 1.2;
  
  .start-time {
    font-weight: 600;
    color: #333;
  }
  
  .end-time {
    display: block;
    margin-top: 2px;
    opacity: 0.8;
  }
}

.event-content {
  padding: 8px 12px;
  height: 100%;
  overflow: hidden;
  
  .event-title {
    font-size: 14px;
    font-weight: 600;
    color: #333;
    margin: 0 0 4px 0;
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .event-desc {
    font-size: 12px;
    color: #666;
    margin: 0 0 4px 0;
    line-height: 1.4;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  
  .event-location {
    display: flex;
    align-items: center;
    font-size: 11px;
    color: #999;
    margin-bottom: 4px;
    
    .el-icon {
      margin-right: 4px;
      font-size: 11px;
    }
  }
  
  .overlap-indicator {
    display: flex;
    align-items: center;
    font-size: 11px;
    color: #faad14;
    margin-bottom: 4px;
    
    .el-icon {
      margin-right: 4px;
      font-size: 11px;
    }
  }
}

.event-progress {
  position: absolute;
  left: 0;
  top: 0;
  width: 4px;
  height: 100%;
  background: rgba(82, 196, 26, 0.1);
  
  .progress-fill {
    width: 100%;
    background: linear-gradient(to bottom, #52c41a, #73d13d);
    transition: height 0.3s ease;
  }
}

.active-indicator {
  position: absolute;
  bottom: 4px;
  left: 4px;
  width: 20px;
  height: 20px;
  background: rgba(82, 196, 26, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
  box-shadow: 0 2px 4px rgba(82, 196, 26, 0.3);
  animation: activeIndicatorPulse 2s infinite;
  
  .el-icon {
    font-size: 12px;
    color: white;
  }
}

// 动画
@keyframes currentTimePulse {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 71, 87, 0.4);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(255, 71, 87, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 71, 87, 0);
  }
}

@keyframes activeIndicatorPulse {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(255, 255, 255, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
  }
}

// 详情对话框样式
:deep(.schedule-detail-dialog) {
  .el-dialog__header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 8px 8px 0 0;
    padding: 20px 24px;
    
    .el-dialog__title {
      color: white;
      font-size: 18px;
      font-weight: 600;
    }
    
    .el-dialog__headerbtn {
      .el-dialog__close {
        color: white;
        font-size: 18px;
        
        &:hover {
          color: #f0f0f0;
        }
      }
    }
  }
  
  .el-dialog__body {
    padding: 24px;
    max-height: 70vh;
    overflow-y: auto;
    
    // 自定义滚动条
    &::-webkit-scrollbar {
      width: 4px;
    }
    
    &::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 2px;
    }
    
    &::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 2px;
      
      &:hover {
        background: #a8a8a8;
      }
    }
  }
  
  .el-dialog__footer {
    padding: 16px 24px;
    background: #f8f9fa;
    border-radius: 0 0 8px 8px;
  }

  // 移动端全屏样式
  &.mobile-dialog {
    .el-dialog {
      margin: 0 !important;
      border-radius: 0 !important;
      height: 100vh !important;
      max-height: 100vh !important;
      overflow: hidden;
    }
    
    .el-dialog__header {
      border-radius: 0 !important;
      padding: 16px 20px;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      
      .el-dialog__title {
        font-size: 16px;
        font-weight: 600;
      }
      
      .el-dialog__headerbtn {
        .el-dialog__close {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          font-size: 16px;
          
          &:hover {
            background: rgba(255, 255, 255, 0.2);
          }
        }
      }
    }
    
    .el-dialog__body {
      padding: 16px;
      max-height: none;
      height: calc(100vh - 140px);
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      
      // 移动端滚动条优化
      &::-webkit-scrollbar {
        width: 2px;
      }
      
      &::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.2);
      }
    }
    
    .el-dialog__footer {
      border-radius: 0 !important;
      padding: 12px 16px;
      position: sticky;
      bottom: 0;
      background: #f8f9fa;
      border-top: 1px solid #e8e8e8;
      box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
      z-index: 100;
    }
  }
}

.schedule-detail {
  .detail-header {
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid #e8e8e8;
    
    .schedule-status {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
      
      .status-tag {
        font-weight: 600;
      }
      
      .priority-tag {
        font-weight: 500;
      }
    }
    
    .schedule-time-info {
      .time-range {
        display: flex;
        align-items: center;
        margin-bottom: 8px;
        
        .time-icon {
          margin-right: 8px;
          color: #666;
        }
        
        .time-text {
          font-size: 16px;
          font-weight: 600;
          color: #333;
        }
      }
      
      .duration {
        .duration-text {
          font-size: 14px;
          color: #666;
        }
      }
    }
  }
  
  .detail-section {
    margin-bottom: 24px;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: #333;
      margin: 0 0 16px 0;
      padding-bottom: 8px;
      border-bottom: 2px solid #e8e8e8;
    }
  }
  
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    
    .info-item {
      display: flex;
      flex-direction: column;
      
      &.full-width {
        grid-column: 1 / -1;
      }
      
      .info-label {
        font-size: 14px;
        color: #666;
        margin-bottom: 4px;
        font-weight: 500;
      }
      
      .info-value {
        font-size: 14px;
        color: #333;
        display: flex;
        align-items: center;
        
        .el-icon {
          margin-right: 4px;
          color: #666;
        }
      }
      
      .category-tag {
        align-self: flex-start;
      }
    }
  }
  
  .participants-list {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    
    .participant-tag {
      display: flex;
      align-items: center;
      
      .el-icon {
        margin-right: 4px;
      }
    }
  }
  
  .overlap-warning {
    .el-alert {
      border-radius: 8px;
    }
  }
  
  .reminder-info {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    background: #f8f9fa;
    border-radius: 8px;
    
    .reminder-icon {
      margin-right: 12px;
      font-size: 20px;
      color: #666;
    }
    
    .reminder-text {
      font-size: 14px;
      color: #333;
      font-weight: 500;
    }
  }
  
  .progress-info {
    .progress-bar-detail {
      width: 100%;
      height: 8px;
      background: #f0f0f0;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 8px;
      
      .progress-fill-detail {
        height: 100%;
        background: linear-gradient(90deg, #52c41a, #73d13d);
        transition: width 0.3s ease;
      }
    }
    
    .progress-percentage {
      font-size: 14px;
      font-weight: 600;
      color: #52c41a;
    }
    
    .progress-text {
      margin: 8px 0 0 0;
      font-size: 12px;
      color: #666;
      font-style: italic;
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

// 响应式设计
@media (min-width: 1200px) {
  // 大屏幕优化
  .schedule-container {
    padding: 0 60px 0 20px; // 大屏幕增加更多右侧padding
  }
  
  .schedule-event {
    min-width: 280px; // 大屏幕下最小宽度更大
  }
  
  .current-time-line {
    right: -40px; // 大屏幕下延伸更远
    
    .current-time-label {
      right: 50px; // 大屏幕下调整时间标签位置
    }
  }
}

@media (min-width: 769px) and (max-width: 1199px) {
  // 中等屏幕优化（平板等）
  .schedule-container {
    padding: 0 30px 0 20px;
  }
  
  .schedule-event {
    min-width: 220px;
  }
  
  .current-time-line {
    right: -10px; // 中等屏幕调整
    
    .current-time-label {
      right: 20px; // 中等屏幕下调整时间标签位置
    }
  }
}

@media (max-width: 768px) {
  // 时间轴响应式
  .time-axis {
    .time-label {
      right: 20px; // 缩小时间标签位置
      font-size: 10px;
      width: 45px;
      text-align: right;
    }
    
    .time-line {
      right: 70px; // 相应调整时间线位置
      width: calc(100vw - 90px); // 确保时间线不超出屏幕
    }
  }
  
  .schedule-container {
    margin-left: 60px;
    padding: 0 10px;
  }
  
  .current-time-line .current-time-dot {
    left: 58px;
  }
  
  .current-time-line .current-time-label {
    right: 15px;
    font-size: 11px;
  }
  
  .schedule-event {
    min-width: 120px;
    max-width: calc(100vw - 90px); // 减小最大宽度，确保不超出屏幕
    
    .event-content {
      padding: 4px 6px;
      word-wrap: break-word; // 确保长文本自动换行
      overflow: hidden;
    }
    
    .event-title {
      font-size: 12px;
      line-height: 1.2;
      margin-bottom: 1px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .event-desc {
      font-size: 10px;
      line-height: 1.2;
      margin-bottom: 1px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .event-time {
      font-size: 8px;
      right: 4px;
      top: 2px;
    }
    
    .event-type {
      font-size: 9px;
      padding: 1px 3px;
    }
    
    .event-repeat {
      font-size: 8px;
      padding: 1px 3px;
    }
    
    .event-overlap {
      font-size: 8px;
      padding: 1px 3px;
    }
  }
  
  // 详情对话框响应式
  :deep(.schedule-detail-dialog) {
    .el-dialog {
      width: 95% !important;
      margin: 5vh auto;
    }
    
    .el-dialog__body {
      padding: 16px;
    }
  }
  
  .schedule-detail {
    .info-grid {
      grid-template-columns: 1fr;
      gap: 12px;
    }
    
    .detail-header {
      margin-bottom: 20px;
      padding-bottom: 12px;
      
      .schedule-status {
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;
        margin-bottom: 12px;
      }
      
      .schedule-time-info {
        .time-range {
          .time-icon {
            font-size: 14px;
          }
          
          .time-text {
            font-size: 14px;
          }
        }
        
        .duration {
          .duration-text {
            font-size: 12px;
          }
        }
      }
    }
    
    .detail-section {
      margin-bottom: 20px;
      
      .section-title {
        font-size: 14px;
        margin-bottom: 12px;
        padding-bottom: 6px;
      }
      
      .info-item {
        .info-label {
          font-size: 13px;
          margin-bottom: 3px;
        }
        
        .info-value {
          font-size: 13px;
          
          .el-icon {
            font-size: 12px;
          }
        }
      }
    }
    
    .participants-list {
      flex-direction: column;
      gap: 6px;
      
      .participant-tag {
        align-self: flex-start;
        font-size: 12px;
        padding: 2px 6px;
        
        .el-icon {
          font-size: 10px;
        }
      }
    }
    
    .reminder-info {
      padding: 8px 12px;
      
      .reminder-icon {
        font-size: 16px;
        margin-right: 8px;
      }
      
      .reminder-text {
        font-size: 13px;
      }
    }
    
    .progress-info {
      .progress-bar-detail {
        height: 6px;
        margin-bottom: 6px;
      }
      
      .progress-percentage {
        font-size: 13px;
      }
      
      .progress-text {
        font-size: 11px;
        margin-top: 6px;
      }
    }
    
    .overlap-warning {
      .el-alert {
        font-size: 12px;
        padding: 8px;
        
        :deep(.el-alert__title) {
          font-size: 12px;
          line-height: 1.3;
        }
        
        :deep(.el-alert__description) {
          font-size: 11px;
          line-height: 1.3;
          margin-top: 4px;
        }
        
        :deep(.el-alert__icon) {
          font-size: 14px;
        }
      }
    }
  }
  
  .dialog-footer {
    flex-direction: column-reverse;
    gap: 8px;
    
    .el-button {
      width: 100%;
      height: 40px;
      font-size: 14px;
      
      &.el-button--primary {
        margin-bottom: 4px;
      }
    }
  }
}
</style> 