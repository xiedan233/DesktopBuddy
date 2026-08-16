import type {
  Task,
  TaskInput,
  AppConfig,
  DesktopBuddyAPI,
} from '../../src/types';

/**
 * 全局类型声明
 * 将 desktopBuddy API 挂载到 Window 接口
 */
declare global {
  interface Window {
    desktopBuddy: DesktopBuddyAPI;
  }
}

export type { Task, TaskInput, AppConfig, DesktopBuddyAPI };
