import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useTasks } from '../hooks/useTasks';
import type { Task, TaskInput } from '@shared/types/index';

/** 任务 Context 值类型 */
interface TaskContextValue {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  addTask: (input: TaskInput) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  updateTask: (id: string, patch: Partial<Task>) => Promise<void>;
  reload: () => Promise<void>;
}

/** 任务 Context（默认值用 null，使用时通过 useTaskContext 断言非空） */
const TaskContext = createContext<TaskContextValue | null>(null);

/**
 * TaskProvider - 任务状态 Provider
 * 包装 useTasks hook，通过 Context 向子组件提供任务数据和操作方法
 */
export function TaskProvider({ children }: { children: ReactNode }): JSX.Element {
  const taskState = useTasks();

  // 每 30 秒自动重新加载任务，确保截止时间变化后 UI 能自动刷新
  // （熊的状态、任务「已过期」标签、紧急程度都会随当前时间更新）
  useEffect(() => {
    const timer = setInterval(() => {
      taskState.reload().catch((err) => {
        console.error('[TaskProvider] 自动刷新任务失败:', err);
      });
    }, 30 * 1000);

    return () => {
      clearInterval(timer);
    };
  }, [taskState.reload]);

  return <TaskContext.Provider value={taskState}>{children}</TaskContext.Provider>;
}

/**
 * useTaskContext - 获取任务 Context
 * 必须在 TaskProvider 内部使用
 * @throws 在 TaskProvider 外部使用时抛出错误
 */
export function useTaskContext(): TaskContextValue {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTaskContext 必须在 TaskProvider 内部使用');
  }
  return context;
}
