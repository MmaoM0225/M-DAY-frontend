<template>
  <div class="todo-list">
    <div class="todo-header">
      <h2>任务管理</h2>
      <el-button type="primary" @click="showAddDialog = true">
        <el-icon><Plus /></el-icon>
        新建任务
      </el-button>
    </div>
    
    <div class="todo-content">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="全部" name="all">
          <todo-item 
            v-for="todo in filteredTodos" 
            :key="todo.id"
            :todo="todo"
            @update="handleUpdate"
            @delete="handleDelete"
          />
        </el-tab-pane>
        <el-tab-pane label="进行中" name="active">
          <todo-item 
            v-for="todo in activeTodos" 
            :key="todo.id"
            :todo="todo"
            @update="handleUpdate"
            @delete="handleDelete"
          />
        </el-tab-pane>
        <el-tab-pane label="已完成" name="completed">
          <todo-item 
            v-for="todo in completedTodos" 
            :key="todo.id"
            :todo="todo"
            @update="handleUpdate"
            @delete="handleDelete"
          />
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 添加任务对话框 -->
    <el-dialog v-model="showAddDialog" title="新建任务" width="500px">
      <el-form :model="newTodo" label-width="80px">
        <el-form-item label="任务标题">
          <el-input v-model="newTodo.title" placeholder="请输入任务标题" />
        </el-form-item>
        <el-form-item label="任务描述">
          <el-input 
            v-model="newTodo.description" 
            type="textarea" 
            placeholder="请输入任务描述"
            :rows="3"
          />
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="newTodo.priority" placeholder="请选择优先级">
            <el-option label="高" value="high" />
            <el-option label="中" value="medium" />
            <el-option label="低" value="low" />
          </el-select>
        </el-form-item>
        <el-form-item label="截止日期">
          <el-date-picker
            v-model="newTodo.dueDate"
            type="date"
            placeholder="请选择截止日期"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="addTodo">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineComponent } from 'vue'
import type { PropType } from 'vue'
import { Plus } from '@element-plus/icons-vue'

// 类型定义
interface Todo {
  id: string
  title: string
  description: string
  completed: boolean
  priority: 'high' | 'medium' | 'low'
  dueDate: Date | null
  createdAt: Date
}

// 响应式数据
const activeTab = ref('all')
const showAddDialog = ref(false)
const todos = ref<Todo[]>([])
const newTodo = ref({
  title: '',
  description: '',
  priority: 'medium' as 'high' | 'medium' | 'low',
  dueDate: null as Date | null
})

// 计算属性
const filteredTodos = computed(() => {
  return todos.value
})

const activeTodos = computed(() => {
  return todos.value.filter(todo => !todo.completed)
})

const completedTodos = computed(() => {
  return todos.value.filter(todo => todo.completed)
})

// 方法
const handleTabChange = (tab: string) => {
  activeTab.value = tab
}

const addTodo = () => {
  if (!newTodo.value.title.trim()) return
  
  const todo: Todo = {
    id: Date.now().toString(),
    title: newTodo.value.title,
    description: newTodo.value.description,
    completed: false,
    priority: newTodo.value.priority,
    dueDate: newTodo.value.dueDate,
    createdAt: new Date()
  }
  
  todos.value.push(todo)
  
  // 重置表单
  newTodo.value = {
    title: '',
    description: '',
    priority: 'medium',
    dueDate: null
  }
  
  showAddDialog.value = false
}

const handleUpdate = (updatedTodo: Todo) => {
  const index = todos.value.findIndex(todo => todo.id === updatedTodo.id)
  if (index !== -1) {
    todos.value[index] = updatedTodo
  }
}

const handleDelete = (todoId: string) => {
  const index = todos.value.findIndex(todo => todo.id === todoId)
  if (index !== -1) {
    todos.value.splice(index, 1)
  }
}

// 临时组件（后续会移到独立文件）
const TodoItem = defineComponent({
  name: 'TodoItem',
  props: {
    todo: {
      type: Object as PropType<Todo>,
      required: true
    }
  },
  emits: ['update', 'delete'],
  setup(props, { emit }) {
    const toggleComplete = () => {
      emit('update', { ...props.todo, completed: !props.todo.completed })
    }
    
    const deleteTodo = () => {
      emit('delete', props.todo.id)
    }
    
    return {
      toggleComplete,
      deleteTodo
    }
  },
  template: `
    <el-card class="todo-item" :class="{ completed: todo.completed }">
      <div class="todo-content">
        <el-checkbox 
          :model-value="todo.completed" 
          @change="toggleComplete"
        />
        <div class="todo-info">
          <h4>{{ todo.title }}</h4>
          <p v-if="todo.description">{{ todo.description }}</p>
          <div class="todo-meta">
            <el-tag :type="todo.priority === 'high' ? 'danger' : todo.priority === 'medium' ? 'warning' : 'info'">
              {{ todo.priority === 'high' ? '高优先级' : todo.priority === 'medium' ? '中优先级' : '低优先级' }}
            </el-tag>
            <span v-if="todo.dueDate" class="due-date">
              截止: {{ new Date(todo.dueDate).toLocaleDateString() }}
            </span>
          </div>
        </div>
        <div class="todo-actions">
          <el-button type="primary" link @click="$router.push(\`/todos/\${todo.id}\`)">
            查看详情
          </el-button>
          <el-button type="danger" link @click="deleteTodo">
            删除
          </el-button>
        </div>
      </div>
    </el-card>
  `
})
</script>

<style scoped lang="scss">
.todo-list {
  padding: 20px;
}

.todo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  
  h2 {
    margin: 0;
    color: #333;
  }
}

.todo-content {
  .todo-item {
    margin-bottom: 15px;
    
    &.completed {
      opacity: 0.6;
      
      .todo-info h4 {
        text-decoration: line-through;
        color: #999;
      }
    }
    
    .todo-content {
      display: flex;
      align-items: flex-start;
      gap: 15px;
      
      .todo-info {
        flex: 1;
        
        h4 {
          margin: 0 0 8px 0;
          color: #333;
        }
        
        p {
          margin: 0 0 10px 0;
          color: #666;
          font-size: 14px;
        }
        
        .todo-meta {
          display: flex;
          align-items: center;
          gap: 10px;
          
          .due-date {
            font-size: 12px;
            color: #999;
          }
        }
      }
      
      .todo-actions {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
    }
  }
}
</style> 