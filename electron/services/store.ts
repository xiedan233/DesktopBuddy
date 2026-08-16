import { app } from 'electron';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { Task, TaskInput, AppConfig, StoreData, DeadlineLevel, NotifiedDeadline } from '@shared/types/index';
import { deadlineToTs } from '@shared/utils/datetime';

/**
 * 将磁盘上的 notifiedDeadlines 兼容迁移为统一的 NotifiedDeadline[] 新格式
 *
 * 兼容策略：
 *  - 旧格式（字符串数组）：每条用 DeadlineLevel 作为 level，任务 deadline 作为 deadline。
 *  - 新格式（对象数组）：直接复用。
 *  - 非数组 / 缺失：初始化为空数组。
 *
 * @param task 原始任务对象（可能为任意形状的解析结果）
 * @returns 归一化后的去重记录数组
 */
function migrateNotifiedDeadlines(task: {
  deadline?: string | null;
  notifiedDeadlines?: unknown;
}): NotifiedDeadline[] {
  const raw = task.notifiedDeadlines;
  if (Array.isArray(raw)) {
    // 旧格式：元素是字符串（DeadlineLevel 枚举值）
    if (raw.length > 0 && raw.every((x) => typeof x === 'string')) {
      const deadline = task.deadline ?? null;
      return raw.map((level) => ({
        level: level as DeadlineLevel,
        deadline,
      }));
    }
    // 新格式：元素已是 { level, deadline } 对象
    if (raw.length > 0 && raw.every((x) => typeof x === 'object' && x !== null)) {
      return raw.map((x) => {
        const entry = x as { level?: DeadlineLevel; deadline?: string | null };
        return {
          level: entry.level as DeadlineLevel,
          deadline: entry.deadline ?? null,
        };
      });
    }
    // 空数组：直接返回空数组
    return [];
  }
  return [];
}

/**
 * TaskStore - JSON 文件持久化存储
 * 负责任务数据的 CRUD 和配置管理
 * 所有数据存储在 app.getPath('userData') + '/tasks.json'
 */
export class TaskStore {
  private filePath: string;
  private data: StoreData;

  /** 默认配置 */
  private static readonly DEFAULT_CONFIG: AppConfig = {
    reminderInterval: 20,
    autoLaunch: false,
  };

  constructor() {
    this.filePath = join(app.getPath('userData'), 'tasks.json');
    this.data = this.load();
  }

  /**
   * 从磁盘加载 JSON 数据，文件不存在或解析失败时使用默认值
   */
  private load(): StoreData {
    try {
      if (existsSync(this.filePath)) {
        const raw = readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw) as StoreData;
        return {
          tasks: Array.isArray(parsed.tasks)
            ? parsed.tasks.map((t) => ({
                ...t,
                notifiedDeadlines: migrateNotifiedDeadlines(t),
              }))
            : [],
          config: { ...TaskStore.DEFAULT_CONFIG, ...parsed.config },
        };
      }
    } catch (error) {
      console.error('[TaskStore] 加载文件失败，使用默认值:', error);
    }
    return {
      tasks: [],
      config: { ...TaskStore.DEFAULT_CONFIG },
    };
  }

  /**
   * 将数据写入磁盘
   */
  private save(): void {
    try {
      const dir = dirname(this.filePath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (error) {
      console.error('[TaskStore] 写入文件失败:', error);
    }
  }

  /**
   * 获取所有任务
   */
  getAll(): Task[] {
    return [...this.data.tasks];
  }

  /**
   * 添加新任务
   * 若存在同名未完成任务，抛出 DUPLICATE_TITLE 错误
   */
  addTask(input: TaskInput): Task {
    const trimmedTitle = input.title.trim();
    const duplicate = this.data.tasks.some(
      (t) => !t.completed && t.title.trim() === trimmedTitle,
    );
    if (duplicate) {
      throw new Error('DUPLICATE_TITLE');
    }

    const now = new Date().toISOString();
    const newTask: Task = {
      id: uuidv4(),
      title: trimmedTitle,
      completed: false,
      priority: input.priority,
      deadline: input.deadline,
      createdAt: now,
      completedAt: null,
      notifiedDeadlines: [],
    };
    this.data.tasks.push(newTask);
    this.save();
    return newTask;
  }

  /**
   * 更新任务（部分更新）
   * 若标题更新后与【其他】未完成任务同名，抛出 DUPLICATE_TITLE 错误
   */
  updateTask(id: string, patch: Partial<Task>): Task {
    const index = this.data.tasks.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error(`Task not found: ${id}`);
    }

    if (patch.title !== undefined) {
      const trimmedTitle = patch.title.trim();
      const duplicate = this.data.tasks.some(
        (t) => t.id !== id && !t.completed && t.title.trim() === trimmedTitle,
      );
      if (duplicate) {
        throw new Error('DUPLICATE_TITLE');
      }
    }

    const existing = this.data.tasks[index];
    // 若截止时间被修改（含往后延长），重置去重标记，
    // 让 1h/30min/10min/逾期 提醒相对新截止时间重新生效（否则延长后这些级别不会再弹）
    const deadlineChanged =
      patch.deadline !== undefined &&
      deadlineToTs(patch.deadline) !== deadlineToTs(existing.deadline);

    this.data.tasks[index] = {
      ...existing,
      ...patch,
      ...(deadlineChanged ? { notifiedDeadlines: [] } : {}),
    };
    this.save();
    return this.data.tasks[index];
  }

  /**
   * 切换任务完成状态
   */
  toggleTask(id: string): Task {
    const index = this.data.tasks.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error(`Task not found: ${id}`);
    }
    const task = this.data.tasks[index];
    const now = new Date().toISOString();
    this.data.tasks[index] = {
      ...task,
      completed: !task.completed,
      completedAt: !task.completed ? now : null,
    };
    this.save();
    return this.data.tasks[index];
  }

  /**
   * 删除任务
   */
  deleteTask(id: string): void {
    this.data.tasks = this.data.tasks.filter((t) => t.id !== id);
    this.save();
  }

  /**
   * 获取配置
   */
  getConfig(): AppConfig {
    return { ...this.data.config };
  }

  /**
   * 设置催促间隔
   */
  setReminderInterval(interval: number): void {
    this.data.config.reminderInterval = interval;
    this.save();
  }

  /**
   * 设置开机自启
   */
  setAutoLaunch(enabled: boolean): void {
    this.data.config.autoLaunch = enabled;
    this.save();
  }

  /**
   * 批量更新任务的 notifiedDeadlines 字段
   * 用于截止提醒去重（按「level + '|' + deadline」双重去重合并）
   * @param id 任务 ID
   * @param entries 本次新触发的去重记录
   */
  updateNotifiedDeadlines(id: string, entries: NotifiedDeadline[]): void {
    const index = this.data.tasks.findIndex((t) => t.id === id);
    if (index !== -1) {
      const existing = this.data.tasks[index].notifiedDeadlines || [];
      const seen = new Set<string>();
      const merged: NotifiedDeadline[] = [];
      for (const entry of [...entries, ...existing]) {
        const key = `${entry.level}|${deadlineToTs(entry.deadline)}`;
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(entry);
        }
      }
      this.data.tasks[index] = {
        ...this.data.tasks[index],
        notifiedDeadlines: merged,
      };
    }
  }

  /**
   * 持久化当前状态（批量更新后调用）
   */
  persist(): void {
    this.save();
  }
}
