import type { Task } from '@shared/types/index';
import { Priority } from '@shared/types/index';

/** 优先级排序权重：数值越小优先级越高 */
const PRIORITY_WEIGHT: Record<Priority, number> = {
  [Priority.HIGH]: 0,
  [Priority.MEDIUM]: 1,
  [Priority.LOW]: 2,
};

/** 优先级显示信息（标签 + 圆点颜色） */
export const PRIORITY_LABELS: Record<Priority, { label: string; dot: string }> = {
  [Priority.HIGH]: { label: '高', dot: 'bg-red-500' },
  [Priority.MEDIUM]: { label: '中', dot: 'bg-orange-400' },
  [Priority.LOW]: { label: '低', dot: 'bg-green-400' },
};

/** 优先级颜色（Tailwind 类名） */
export const PRIORITY_COLORS: Record<Priority, string> = {
  [Priority.HIGH]: 'bg-red-100 text-red-600 border-red-300',
  [Priority.MEDIUM]: 'bg-orange-100 text-orange-600 border-orange-300',
  [Priority.LOW]: 'bg-green-100 text-green-600 border-green-300',
};

/** 优先级圆点颜色 */
export const PRIORITY_DOT_COLORS: Record<Priority, string> = {
  [Priority.HIGH]: 'bg-red-500',
  [Priority.MEDIUM]: 'bg-orange-400',
  [Priority.LOW]: 'bg-green-400',
};

/**
 * 任务排序：未完成在前 → 优先级高在前 → 截止时间近在前 → 创建时间新在前
 * @param tasks 任务数组
 * @returns 排序后的任务数组（新数组，不修改原数组）
 */
export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    // 1. 未完成的排前面
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }

    // 2. 优先级高（权重小）的排前面
    const weightDiff = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
    if (weightDiff !== 0) return weightDiff;

    // 3. 有截止时间的排前面，截止时间近的排前面
    if (a.deadline && b.deadline) {
      const timeDiff = new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      if (timeDiff !== 0) return timeDiff;
    } else if (a.deadline && !b.deadline) {
      return -1;
    } else if (!a.deadline && b.deadline) {
      return 1;
    }

    // 4. 创建时间新的排前面
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

/**
 * 格式化截止时间显示
 * 统一格式：今天/明天显示前缀，其他显示 MM/DD，均带 HH:MM
 * @param deadline ISO 8601 截止时间字符串
 * @returns 格式化后的字符串，如 "今天 14:30" 或 "明天 14:30" 或 "12/15 14:30"
 */
export function formatDeadline(deadline: string | null): string {
  if (!deadline) return '';

  const date = new Date(deadline);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const isSameDay = date.toDateString() === now.toDateString();

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const time = `${hours}:${minutes}`;

  if (isSameDay) {
    return `今天 ${time}`;
  } else if (isTomorrow) {
    return `明天 ${time}`;
  } else {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${month}/${day} ${time}`;
  }
}

/**
 * 判断任务是否紧急（截止时间在 1 小时内且未完成）
 * @param task 任务对象
 * @returns 是否紧急
 */
export function isTaskUrgent(task: Task): boolean {
  if (task.completed || !task.deadline) return false;

  const deadlineTime = new Date(task.deadline).getTime();
  if (isNaN(deadlineTime)) return false;

  const now = Date.now();
  const minutesLeft = (deadlineTime - now) / (60 * 1000);

  return minutesLeft > 0 && minutesLeft <= 60;
}

/**
 * 判断任务是否紧急（isTaskUrgent 的别名，供 TaskItem 使用）
 */
export function isUrgent(task: Task): boolean {
  return isTaskUrgent(task);
}

/**
 * 判断任务是否已过期（截止时间已过且未完成）
 * @param task 任务对象
 * @returns 是否已过期
 */
export function isOverdue(task: Task): boolean {
  if (task.completed || !task.deadline) return false;

  const deadlineTime = new Date(task.deadline).getTime();
  if (isNaN(deadlineTime)) return false;

  return deadlineTime < Date.now();
}

/**
 * 获取任务的紧急程度标签
 * @param task 任务对象
 * @returns 紧急标签文本（如 "已过期"、"10分钟"、"30分钟"、"1小时"），不紧急时返回空字符串
 */
export function getUrgencyLabel(task: Task): string {
  if (task.completed || !task.deadline) return '';

  const deadlineTime = new Date(task.deadline).getTime();
  if (isNaN(deadlineTime)) return '';

  const now = Date.now();
  const minutesLeft = (deadlineTime - now) / (60 * 1000);

  if (minutesLeft < 0) return '已过期';
  if (minutesLeft <= 10) return '10分钟';
  if (minutesLeft <= 30) return '30分钟';
  if (minutesLeft <= 60) return '1小时';
  return '';
}

/**
 * 计算剩余时间文本
 * @param deadline ISO 8601 截止时间字符串
 * @returns 剩余时间描述，如 "还剩 30 分钟" 或 "已过期"
 */
export function getTimeRemaining(deadline: string | null): string {
  if (!deadline) return '';

  const deadlineTime = new Date(deadline).getTime();
  if (isNaN(deadlineTime)) return '';

  const now = Date.now();
  const diffMs = deadlineTime - now;

  if (diffMs <= 0) return '已过期';

  const minutes = Math.floor(diffMs / (60 * 1000));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `还剩 ${days} 天 ${hours % 24} 小时`;
  } else if (hours > 0) {
    return `还剩 ${hours} 小时 ${minutes % 60} 分钟`;
  } else if (minutes > 0) {
    return `还剩 ${minutes} 分钟`;
  } else {
    return '即将截止';
  }
}

/**
 * 生成 datetime-local 输入框的默认值（当前时间 + 1 小时）
 * @returns 格式为 "YYYY-MM-DDTHH:mm" 的字符串
 */
export function getDefaultDeadlineInput(): string {
  const now = new Date();
  now.setHours(now.getHours() + 1);
  now.setMinutes(0, 0, 0);

  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * 将 datetime-local 输入值转换为 ISO 8601 字符串
 * @param value datetime-local 输入值
 * @returns ISO 8601 字符串或 null
 */
export function deadlineInputToIso(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (isNaN(date.getTime())) return null;
  return date.toISOString();
}

/**
 * 将 ISO 8601 字符串转换为 datetime-local 输入值
 * @param iso ISO 8601 截止时间字符串
 * @returns 格式为 "YYYY-MM-DDTHH:mm" 的字符串，无效时返回空字符串
 */
export function isoToDeadlineInput(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
