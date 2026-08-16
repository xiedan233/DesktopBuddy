import { contextBridge, ipcRenderer } from 'electron';
import type { DesktopBuddyAPI, TaskInput, Task } from './api';
import { IPC_CHANNELS } from '../../src/types';

/**
 * Preload 桥接层
 * 通过 contextBridge 安全地暴露 API 给渲染进程
 * 渲染进程零 Node 访问，所有操作通过 IPC 完成
 */
const api: DesktopBuddyAPI = {
  /** 获取所有任务 */
  getTasks: (): Promise<Task[]> => {
    return ipcRenderer.invoke(IPC_CHANNELS.TASK_GET_ALL);
  },

  /** 添加任务 */
  addTask: (input: TaskInput): Promise<Task> => {
    return ipcRenderer.invoke(IPC_CHANNELS.TASK_ADD, input);
  },

  /** 更新任务 */
  updateTask: (id: string, patch: Partial<Task>): Promise<Task> => {
    return ipcRenderer.invoke(IPC_CHANNELS.TASK_UPDATE, { id, patch });
  },

  /** 切换任务完成状态 */
  toggleTask: (id: string): Promise<Task> => {
    return ipcRenderer.invoke(IPC_CHANNELS.TASK_TOGGLE, { id });
  },

  /** 删除任务 */
  deleteTask: (id: string): Promise<void> => {
    return ipcRenderer.invoke(IPC_CHANNELS.TASK_DELETE, { id });
  },

  /** 获取配置 */
  getConfig: (): Promise<import('../../src/types').AppConfig> => {
    return ipcRenderer.invoke(IPC_CHANNELS.CONFIG_GET);
  },

  /** 设置催促间隔 */
  setReminderInterval: (interval: number): Promise<void> => {
    return ipcRenderer.invoke(IPC_CHANNELS.CONFIG_SET_INTERVAL, { interval });
  },

  /** 设置开机自启 */
  setAutoLaunch: (enabled: boolean): Promise<void> => {
    return ipcRenderer.invoke(IPC_CHANNELS.CONFIG_SET_AUTO_LAUNCH, {
      enabled,
    });
  },

  /** 最小化窗口到托盘 */
  minimizeWindow: (): Promise<void> => {
    return ipcRenderer.invoke(IPC_CHANNELS.WINDOW_MINIMIZE);
  },

  /** 关闭窗口到托盘 */
  closeWindow: (): Promise<void> => {
    return ipcRenderer.invoke(IPC_CHANNELS.WINDOW_CLOSE);
  },

  /** 切换窗口的 mini / 完整模式 */
  setMiniMode: (isMini: boolean): Promise<void> => {
    return ipcRenderer.invoke(IPC_CHANNELS.WINDOW_SET_MINI_MODE, isMini);
  },
};

// 暴露到渲染进程的 window.desktopBuddy
contextBridge.exposeInMainWorld('desktopBuddy', api);
