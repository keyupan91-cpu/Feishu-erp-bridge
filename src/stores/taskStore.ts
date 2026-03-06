import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TaskStatus } from '../types';
import type { TaskConfig, TaskInstance, TaskLog } from '../types';

interface TaskStore {
  // 任务配置
  tasks: TaskConfig[];
  // 任务实例
  taskInstances: TaskInstance[];
  
  // 任务管理
  addTask: (task: Omit<TaskConfig, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (id: string, task: Partial<TaskConfig>) => void;
  deleteTask: (id: string) => void;
  copyTask: (id: string, newName: string) => void;
  toggleTask: (id: string) => void;
  
  // 任务实例管理
  createTaskInstance: (taskId: string) => TaskInstance;
  updateTaskInstance: (id: string, instance: Partial<TaskInstance>) => void;
  deleteTaskInstance: (id: string) => void;
  addTaskLog: (instanceId: string, log: TaskLog) => void;
  addWebApiLog: (instanceId: string, log: import('../types').WebAPILog) => void;
  
  // 任务执行控制
  startTask: (taskId: string) => TaskInstance;
  stopTask: (instanceId: string) => void;
  
  // 数据导出导入
  exportData: () => { tasks: TaskConfig[]; taskInstances: TaskInstance[]; exportTime: string };
  importData: (data: { tasks: TaskConfig[]; taskInstances: TaskInstance[] }) => void;
  clearAllData: () => void;
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      // 初始状态
      tasks: [],
      taskInstances: [],
      
      // 添加任务
      addTask: (task) => {
        const newTask: TaskConfig = {
          ...task,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({
          tasks: [...state.tasks, newTask],
        }));
      },
      
      // 更新任务
      updateTask: (id, task) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  ...task,
                  updatedAt: new Date().toISOString(),
                }
              : t
          ),
        }));
      },
      
      // 删除任务
      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
          taskInstances: state.taskInstances.filter((i) => i.taskId !== id),
        }));
      },
      
      // 复制任务
      copyTask: (id, newName) => {
        const task = get().tasks.find((t) => t.id === id);
        if (task) {
          get().addTask({
            ...task,
            name: newName,
            enabled: false,
          });
        }
      },
      
      // 切换任务启用状态
      toggleTask: (id) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, enabled: !t.enabled } : t
          ),
        }));
      },
      
      // 创建任务实例
      createTaskInstance: (taskId) => {
        const newInstance: TaskInstance = {
          id: Date.now().toString(),
          taskId,
          status: TaskStatus.IDLE,
          logs: [],
          webApiLogs: [],
          progress: 0,
        };
        set((state) => ({
          taskInstances: [...state.taskInstances, newInstance],
        }));
        return newInstance;
      },
      
      // 更新任务实例
      updateTaskInstance: (id, instance) => {
        set((state) => ({
          taskInstances: state.taskInstances.map((i) =>
            i.id === id ? { ...i, ...instance } : i
          ),
        }));
      },
      
      // 添加任务日志（限制最多保留500条，防止存储过大）
      addTaskLog: (instanceId: string, log: TaskLog) => {
        set((state) => ({
          taskInstances: state.taskInstances.map((i) => {
            if (i.id !== instanceId) return i;
            const newLogs = [...i.logs, log];
            // 只保留最近500条日志
            if (newLogs.length > 500) {
              newLogs.splice(0, newLogs.length - 500);
            }
            return { ...i, logs: newLogs };
          }),
        }));
      },

      // 添加WebAPI日志（限制最多保留100条）
      addWebApiLog: (instanceId: string, log: import('../types').WebAPILog) => {
        set((state) => ({
          taskInstances: state.taskInstances.map((i) => {
            if (i.id !== instanceId) return i;
            const newLogs = [...i.webApiLogs, log];
            // 只保留最近100条WebAPI日志
            if (newLogs.length > 100) {
              newLogs.splice(0, newLogs.length - 100);
            }
            return { ...i, webApiLogs: newLogs };
          }),
        }));
      },
      
      // 删除任务实例
      deleteTaskInstance: (id) => {
        set((state) => ({
          taskInstances: state.taskInstances.filter((i) => i.id !== id),
        }));
      },
      
      // 开始任务
      startTask: (taskId: string) => {
        const instance = get().createTaskInstance(taskId);
        get().updateTaskInstance(instance.id, {
          status: TaskStatus.RUNNING,
          startTime: new Date().toISOString(),
        });
        return instance;
      },
      
      // 停止任务
      stopTask: (instanceId) => {
        get().updateTaskInstance(instanceId, {
          status: TaskStatus.ERROR,
          endTime: new Date().toISOString(),
        });
      },
      
      // 导出所有数据
      exportData: () => {
        const state = get();
        return {
          tasks: state.tasks,
          taskInstances: state.taskInstances,
          exportTime: new Date().toISOString(),
        };
      },
      
      // 导入数据（会覆盖现有数据）
      importData: (data) => {
        set({
          tasks: data.tasks || [],
          taskInstances: data.taskInstances || [],
        });
      },
      
      // 清空所有数据
      clearAllData: () => {
        set({
          tasks: [],
          taskInstances: [],
        });
      },
    }),
    {
      name: 'kingdee-task-storage',
    }
  )
);
