/**
 * DesktopBuddy 核心类型定义
 * 主进程与渲染进程共享的类型文件
 */

/** 优先级枚举 */
export enum Priority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

/** 截止提醒级别枚举 */
export enum DeadlineLevel {
  ONE_HOUR = '1h',
  THIRTY_MIN = '30min',
  TEN_MIN = '10min',
  OVERDUE = 'overdue',
}

/** 宠物状态枚举 */
export enum PetState {
  /** 无任务 - 熊在睡觉 */
  SLEEPING = 'sleeping',
  /** 有任务但 0% 完成 - 熊刚醒来 */
  AWAKENING = 'awakening',
  /** 1-15% 完成 - 熊开始动起来 */
  STARTING = 'starting',
  /** 16-35% 完成 - 熊忙得团团转 */
  BUSY = 'busy',
  /** 36-55% 完成 - 熊认真工作中 */
  WORKING = 'working',
  /** 56-75% 完成 - 熊过半啦 */
  HALFWAY = 'halfway',
  /** 76-95% 完成 - 熊看到曙光 */
  ALMOST_DONE = 'almost',
  /** 96-99% 完成 - 熊最后冲刺 */
  FINAL_SPRINT = 'sprint',
  /** 100% 完成 - 熊全部搞定 */
  CELEBRATING = 'celebrate',
  /** 有逾期任务 - 熊急死了 */
  PANICKING = 'panic',
}

/** 已通知的截止提醒去重记录
 * 以「级别 + 截止时间」双重去重：同一级别只有在其截止时间不变时才去重一次，
 * 截止时间被修改后，旧记录自动失效，新截止时间下的提醒会重新生效。
 */
export interface NotifiedDeadline {
  /** 截止提醒级别 */
  level: DeadlineLevel;
  /** 触发去重时的截止时间 ISO 字符串；截止时间变化后旧去重自动失效 */
  deadline: string | null;
}

/** 任务模型 */
export interface Task {
  /** UUID */
  id: string;
  /** 任务标题 */
  title: string;
  /** 是否完成 */
  completed: boolean;
  /** 优先级 */
  priority: Priority;
  /** ISO 8601 截止时间，null 表示无截止 */
  deadline: string | null;
  /** ISO 8601 创建时间 */
  createdAt: string;
  /** ISO 8601 完成时间 */
  completedAt: string | null;
  /** 已通知过的截止提醒记录（按「级别 + 截止时间」双重去重） */
  notifiedDeadlines: NotifiedDeadline[];
}

/** 应用配置 */
export interface AppConfig {
  /** 催促间隔（分钟），15~30 */
  reminderInterval: number;
  /** 是否开机自启 */
  autoLaunch: boolean;
}

/** 新建任务输入 */
export interface TaskInput {
  title: string;
  priority: Priority;
  deadline: string | null;
}

/** 截止提醒级别常量 */
export const DEADLINE_LEVELS = [
  { level: DeadlineLevel.ONE_HOUR, minutesBefore: 60, label: '1小时' },
  { level: DeadlineLevel.THIRTY_MIN, minutesBefore: 30, label: '30分钟' },
  { level: DeadlineLevel.TEN_MIN, minutesBefore: 10, label: '10分钟' },
] as const;

/** 宠物状态阈值常量（PANICKING 为特殊状态，由 usePetState 根据逾期任务单独触发） */
export const PET_STATE_THRESHOLDS = [
  { state: PetState.SLEEPING, min: 0, max: 0, requiresNoTasks: true },
  { state: PetState.AWAKENING, min: 0, max: 0, requiresNoTasks: false },
  { state: PetState.STARTING, min: 0.01, max: 0.15 },
  { state: PetState.BUSY, min: 0.16, max: 0.35 },
  { state: PetState.WORKING, min: 0.36, max: 0.55 },
  { state: PetState.HALFWAY, min: 0.56, max: 0.75 },
  { state: PetState.ALMOST_DONE, min: 0.76, max: 0.95 },
  { state: PetState.FINAL_SPRINT, min: 0.96, max: 0.99 },
  { state: PetState.CELEBRATING, min: 1.0, max: 1.0 },
] as const;

/** DesktopBuddy API 接口 - 暴露给渲染进程的安全 API */
export interface DesktopBuddyAPI {
  getTasks(): Promise<Task[]>;
  addTask(input: TaskInput): Promise<Task>;
  updateTask(id: string, patch: Partial<Task>): Promise<Task>;
  toggleTask(id: string): Promise<Task>;
  deleteTask(id: string): Promise<void>;
  getConfig(): Promise<AppConfig>;
  setReminderInterval(interval: number): Promise<void>;
  setAutoLaunch(enabled: boolean): Promise<void>;
  minimizeWindow(): Promise<void>;
  closeWindow(): Promise<void>;
  /** 切换窗口的 mini / 完整模式 */
  setMiniMode(isMini: boolean): Promise<void>;
}

/** IPC 通道名常量 */
export const IPC_CHANNELS = {
  TASK_GET_ALL: 'task:getAll',
  TASK_ADD: 'task:add',
  TASK_UPDATE: 'task:update',
  TASK_TOGGLE: 'task:toggle',
  TASK_DELETE: 'task:delete',
  CONFIG_GET: 'config:get',
  CONFIG_SET_INTERVAL: 'config:setInterval',
  CONFIG_SET_AUTO_LAUNCH: 'config:setAutoLaunch',
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_CLOSE: 'window:close',
  WINDOW_SET_MINI_MODE: 'window:setMiniMode',
} as const;

/** JSON 存储文件结构 */
export interface StoreData {
  tasks: Task[];
  config: AppConfig;
}

/** 截止检查中收集的紧急任务项 */
export interface UrgentTaskInfo {
  task: Task;
  level: DeadlineLevel;
  label: string;
  minutesLeft: number;
}
