import { useCallback, useEffect, useState } from 'react';
import type { Task, TaskInput } from '@shared/types/index';

/**
 * useTasks - 任务 CRUD Hook
 * 封装与主进程的 IPC 通信，管理渲染进程的任务状态
 */
export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * 从主进程加载全部任务
   */
  const loadTasks = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const allTasks = await window.desktopBuddy.getTasks();
      setTasks(allTasks);
    } catch (err) {
      console.error('[useTasks] 加载任务失败:', err);
      setError(err instanceof Error ? err.message : '加载任务失败');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 添加任务
   * @param input 任务输入
   */
  const addTask = useCallback(async (input: TaskInput): Promise<void> => {
    try {
      setError(null);
      const newTask = await window.desktopBuddy.addTask(input);
      setTasks((prev) => [newTask, ...prev]);
    } catch (err) {
      console.error('[useTasks] 添加任务失败:', err);
      setError(err instanceof Error ? err.message : '添加任务失败');
      throw err;
    }
  }, []);

  /**
   * 切换任务完成状态
   * @param id 任务 ID
   */
  const toggleTask = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      const updatedTask = await window.desktopBuddy.toggleTask(id);
      setTasks((prev) => prev.map((t) => (t.id === id ? updatedTask : t)));
    } catch (err) {
      console.error('[useTasks] 切换任务状态失败:', err);
      setError(err instanceof Error ? err.message : '操作失败');
    }
  }, []);

  /**
   * 删除任务
   * @param id 任务 ID
   */
  const deleteTask = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      await window.desktopBuddy.deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error('[useTasks] 删除任务失败:', err);
      setError(err instanceof Error ? err.message : '删除任务失败');
    }
  }, []);

  /**
   * 更新任务
   * @param id 任务 ID
   * @param patch 需要更新的字段
   */
  const updateTask = useCallback(
    async (id: string, patch: Partial<Task>): Promise<void> => {
      try {
        setError(null);
      const updatedTask = await window.desktopBuddy.updateTask(id, patch);
      setTasks((prev) => prev.map((t) => (t.id === id ? updatedTask : t)));
    } catch (err) {
      console.error('[useTasks] 更新任务失败:', err);
      setError(err instanceof Error ? err.message : '更新任务失败');
      throw err;
    }
    },
    [],
  );

  // 组件挂载时加载任务
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  return {
    tasks,
    loading,
    error,
    addTask,
    toggleTask,
    deleteTask,
    updateTask,
    reload: loadTasks,
  };
}
