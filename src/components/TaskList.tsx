import { useMemo, type ReactNode } from 'react';
import type { Task } from '../types';
import { useTaskContext } from '../store/TaskContext';
import { sortTasks } from '../utils/task-utils';
import TaskItem from './TaskItem';

/**
 * TaskList - 可滚动任务列表组件
 * 按排序规则显示所有任务
 */
export default function TaskList(): JSX.Element {
  const { tasks, loading, toggleTask, deleteTask, updateTask } = useTaskContext();

  // 排序后的任务列表
  const sortedTasks = useMemo(() => sortTasks(tasks), [tasks]);

  // 分组：未完成 + 已完成
  const incompleteTasks = sortedTasks.filter((t) => !t.completed);
  const completedTasks = sortedTasks.filter((t) => t.completed);

  /** 渲染任务列表区块 */
  const renderTaskGroup = (
    label: string,
    taskList: Task[],
  ): ReactNode | null => {
    if (taskList.length === 0) return null;
    return (
      <div>
        <div className="px-2.5 py-1 text-2xs font-medium uppercase tracking-wide text-gray-300">
          {label} ({taskList.length})
        </div>
        {taskList.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onToggle={toggleTask}
            onDelete={deleteTask}
            onUpdate={updateTask}
          />
        ))}
      </div>
    );
  };

  // 加载中状态
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="text-xs text-gray-400">加载中...</span>
      </div>
    );
  }

  // 空状态
  if (tasks.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-4">
        <span className="text-2xl">📝</span>
        <p className="text-center text-xs text-gray-400">
          还没有任务哦~
          <br />
          在上方添加你的第一个任务吧！
        </p>
      </div>
    );
  }

  return (
    <div className="scrollbar-thin h-full overflow-y-auto py-1">
      {renderTaskGroup('待完成', incompleteTasks)}
      {renderTaskGroup('已完成', completedTasks)}
    </div>
  );
}
