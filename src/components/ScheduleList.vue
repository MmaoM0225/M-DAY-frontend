<template>
  <div class="schedule-list">
    <!-- 空状态 -->
    <div v-if="schedules.length === 0" class="empty-state">
      <div class="empty-icon">📅</div>
      <p class="empty-text">今日暂无日程安排</p>
      <p class="empty-desc">点击上方按钮添加新的日程</p>
    </div>
    
    <!-- 时间轴日程列表 -->
    <div v-else class="timeline-container">
      <div class="timeline-line"></div>
      
      <div 
        v-for="(schedule, index) in sortedSchedules" 
        :key="schedule.id"
        class="schedule-item"
        :class="[
          `priority-${schedule.priority}`,
          `category-${schedule.category}`,
          { 'is-current': isCurrentSchedule(schedule) },
          { 'is-past': isPastSchedule(schedule) },
          { 'is-upcoming': isUpcomingSchedule(schedule) }
        ]"
        @click="$emit('scheduleClick', schedule)"
      >
        <!-- 时间点 -->
        <div class="time-dot">
          <div class="dot-inner"></div>
        </div>
        
        <!-- 时间显示 -->
        <div class="schedule-time">
          <span class="time-start">{{ formatTime(schedule.startTime) }}</span>
          <span v-if="schedule.endTime" class="time-end">{{ formatTime(schedule.endTime) }}</span>
        </div>
        
        <!-- 日程内容 -->
        <div class="schedule-content">
          <div class="schedule-header">
            <h4 class="schedule-title">{{ schedule.title }}</h4>
            <div class="schedule-badges">
              <span 
                v-if="schedule.priority === 'high'" 
                class="badge priority-badge"
              >
                🔥 重要
              </span>
              <span 
                v-if="schedule.isReminder" 
                class="badge reminder-badge"
              >
                🔔 提醒
              </span>
              <span 
                class="badge category-badge"
                :class="`category-${schedule.category}`"
              >
                {{ getCategoryName(schedule.category) }}
              </span>
            </div>
          </div>
          
          <p v-if="schedule.description" class="schedule-desc">
            {{ schedule.description }}
          </p>
          
          <!-- 位置信息 -->
          <div v-if="schedule.location" class="schedule-location">
            <el-icon class="location-icon"><Location /></el-icon>
            <span>{{ schedule.location }}</span>
          </div>
          
          <!-- 参与者 -->
          <div v-if="schedule.participants && schedule.participants.length > 0" class="schedule-participants">
            <el-icon class="participants-icon"><User /></el-icon>
            <span>{{ schedule.participants.join(', ') }}</span>
          </div>
          
          <!-- 进度条（仅进行中的日程） -->
          <div v-if="isCurrentSchedule(schedule)" class="schedule-progress">
            <div class="progress-bar">
              <div 
                class="progress-fill"
                :style="{ width: getScheduleProgress(schedule) + '%' }"
              ></div>
            </div>
            <span class="progress-text">进行中...</span>
          </div>
        </div>
        
        <!-- 操作按钮 -->
        <div class="schedule-actions">
          <el-button 
            type="primary" 
            link 
            @click.stop="$emit('viewDetail', schedule)"
          >
            查看
          </el-button>
          <el-button 
            type="default" 
            link 
            @click.stop="$emit('editSchedule', schedule)"
          >
            编辑
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Location, User } from '@element-plus/icons-vue'

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

// Props
interface Props {
  schedules: Schedule[]
  currentTime?: string // 当前时间，格式: "HH:mm"
}

const props = withDefaults(defineProps<Props>(), {
  schedules: () => [],
  currentTime: () => {
    const now = new Date()
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  }
})

// Emits
const emit = defineEmits<{
  scheduleClick: [schedule: Schedule]
  viewDetail: [schedule: Schedule]
  editSchedule: [schedule: Schedule]
}>()

// 计算属性
const sortedSchedules = computed(() => {
  return [...props.schedules].sort((a, b) => {
    const timeA = a.startTime.replace(':', '')
    const timeB = b.startTime.replace(':', '')
    return timeA.localeCompare(timeB)
  })
})

// 方法
const formatTime = (time: string) => {
  return time
}

const getCategoryName = (category: string) => {
  const categoryMap: Record<string, string> = {
    work: '工作',
    personal: '个人',
    health: '健康',
    study: '学习',
    meeting: '会议',
    event: '活动'
  }
  return categoryMap[category] || category
}

const timeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

const isCurrentSchedule = (schedule: Schedule) => {
  const currentMinutes = timeToMinutes(props.currentTime)
  const startMinutes = timeToMinutes(schedule.startTime)
  const endMinutes = schedule.endTime ? timeToMinutes(schedule.endTime) : startMinutes + 60
  
  return currentMinutes >= startMinutes && currentMinutes < endMinutes
}

const isPastSchedule = (schedule: Schedule) => {
  const currentMinutes = timeToMinutes(props.currentTime)
  const endMinutes = schedule.endTime ? timeToMinutes(schedule.endTime) : timeToMinutes(schedule.startTime) + 60
  
  return currentMinutes >= endMinutes
}

const isUpcomingSchedule = (schedule: Schedule) => {
  const currentMinutes = timeToMinutes(props.currentTime)
  const startMinutes = timeToMinutes(schedule.startTime)
  
  return currentMinutes < startMinutes
}

const getScheduleProgress = (schedule: Schedule) => {
  const currentMinutes = timeToMinutes(props.currentTime)
  const startMinutes = timeToMinutes(schedule.startTime)
  const endMinutes = schedule.endTime ? timeToMinutes(schedule.endTime) : startMinutes + 60
  
  const progress = ((currentMinutes - startMinutes) / (endMinutes - startMinutes)) * 100
  return Math.min(Math.max(progress, 0), 100)
}
</script>

<style scoped lang="scss">
.schedule-list {
  width: 100%;
  height: 100%;
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

.timeline-container {
  position: relative;
  padding: 20px 0;
}

.timeline-line {
  position: absolute;
  left: 30px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(to bottom, #e1e8ed, #c1c9d0);
  border-radius: 1px;
}

.schedule-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  margin-bottom: 24px;
  padding: 16px 20px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #f0f0f0;
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
  }
  
  &:last-child {
    margin-bottom: 0;
  }
  
  // 状态样式
  &.is-current {
    background: linear-gradient(135deg, #e8f5e8, #f0f9ff);
    border-color: #52c41a;
    box-shadow: 0 4px 16px rgba(82, 196, 26, 0.15);
    
    .time-dot .dot-inner {
      background: #52c41a;
      animation: pulse 2s infinite;
    }
  }
  
  &.is-past {
    opacity: 0.7;
    
    .time-dot .dot-inner {
      background: #d9d9d9;
    }
    
    .schedule-title {
      text-decoration: line-through;
      color: #999;
    }
  }
  
  &.is-upcoming {
    .time-dot .dot-inner {
      background: #1890ff;
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
}

.time-dot {
  position: absolute;
  left: -46px;
  top: 24px;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 50%;
  border: 2px solid #e1e8ed;
  
  .dot-inner {
    width: 8px;
    height: 8px;
    background: #1890ff;
    border-radius: 50%;
    transition: all 0.3s ease;
  }
}

.schedule-time {
  min-width: 80px;
  margin-right: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  
  .time-start {
    font-size: 16px;
    font-weight: 600;
    color: #333;
    line-height: 1;
  }
  
  .time-end {
    font-size: 12px;
    color: #666;
    margin-top: 2px;
    
    &::before {
      content: '~';
      margin-right: 2px;
    }
  }
}

.schedule-content {
  flex: 1;
  min-width: 0;
}

.schedule-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 8px;
  
  .schedule-title {
    font-size: 16px;
    font-weight: 600;
    color: #333;
    margin: 0;
    line-height: 1.4;
    flex: 1;
  }
  
  .schedule-badges {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-left: 12px;
  }
}

.badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
  
  &.priority-badge {
    background: #fff2e8;
    color: #fa8c16;
    border: 1px solid #ffd591;
  }
  
  &.reminder-badge {
    background: #e6f7ff;
    color: #1890ff;
    border: 1px solid #91d5ff;
  }
  
  &.category-badge {
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
    
    &.category-health {
      background: #f0f9ff;
      color: #1890ff;
      border: 1px solid #91d5ff;
    }
    
    &.category-study {
      background: #f9f0ff;
      color: #722ed1;
      border: 1px solid #d3adf7;
    }
    
    &.category-meeting {
      background: #fff7e6;
      color: #fa8c16;
      border: 1px solid #ffd591;
    }
    
    &.category-event {
      background: #f6ffed;
      color: #52c41a;
      border: 1px solid #b7eb8f;
    }
  }
}

.schedule-desc {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  margin: 0 0 8px 0;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.schedule-location,
.schedule-participants {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
  
  .el-icon {
    margin-right: 4px;
    font-size: 12px;
  }
}

.schedule-progress {
  margin-top: 8px;
  
  .progress-bar {
    height: 4px;
    background: #f0f0f0;
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 4px;
    
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #52c41a, #73d13d);
      transition: width 0.3s ease;
    }
  }
  
  .progress-text {
    font-size: 11px;
    color: #52c41a;
    font-weight: 500;
  }
}

.schedule-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-left: 12px;
  opacity: 0;
  transition: opacity 0.3s ease;
  align-items: stretch; // 让按钮拉伸到相同宽度
  
  .el-button {
    padding: 4px 8px;
    font-size: 12px;
    height: auto;
    min-height: auto;
    min-width: 48px; // 设置最小宽度
    justify-content: center; // 文字居中
    text-align: center; // 确保文字居中
    margin: 0 !important; // 重置所有margin，避免不一致
  }
}

.schedule-item:hover .schedule-actions {
  opacity: 1;
}

// 动画
@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(82, 196, 26, 0.4);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(82, 196, 26, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(82, 196, 26, 0);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .timeline-line {
    left: 20px;
  }
  
  .time-dot {
    left: -36px;
  }
  
  .schedule-item {
    padding: 12px 16px;
    margin-bottom: 16px;
  }
  
  .schedule-time {
    min-width: 60px;
    margin-right: 12px;
    
    .time-start {
      font-size: 14px;
    }
    
    .time-end {
      font-size: 11px;
    }
  }
  
  .schedule-header {
    flex-direction: column;
    align-items: flex-start;
    
    .schedule-badges {
      margin-left: 0;
      margin-top: 8px;
    }
  }
  
  .schedule-actions {
    position: static;
    opacity: 1;
    flex-direction: row;
    margin-left: 0;
    margin-top: 8px;
    border-top: 1px solid #f0f0f0;
    padding-top: 8px;
    justify-content: space-between; // 移动端按钮分布在两端
    
    .el-button {
      flex: 1; // 移动端按钮等宽
      margin: 0 4px !important; // 移动端重新设置margin
      
      &:first-child {
        margin-left: 0 !important;
      }
      
      &:last-child {
        margin-right: 0 !important;
      }
    }
  }
}
</style> 