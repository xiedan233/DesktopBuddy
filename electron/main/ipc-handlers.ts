import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '@shared/types/index';
import type { Task, TaskInput, AppConfig } from '@shared/types/index';
import type { TaskStore } from '../services/store';
import type { ReminderScheduler } from '../services/reminder-scheduler';
import type { WindowService } from './window';
import { AutoLaunchService } from './auto-launch';

/**
 * IPC 处理器依赖项
 */
interface IpcHandlerDeps {
  store: TaskStore;
  scheduler: ReminderScheduler;
  windowService: WindowService;
  autoLaunchService: AutoLaunchService;
}

/**
 * 注册所有 IPC 通道处理器
 * 将渲染进程的 IPC 调用桥接到主进程的服务层
 * @param deps 依赖的服务实例
 */
export function registerIpcHandlers(deps: IpcHandlerDeps): void {
  const { store, scheduler, windowService, autoLaunchService } = deps;

  // ===== Task 相关通道 =====

  // 获取全部任务
  ipcMain.handle(IPC_CHANNELS.TASK_GET_ALL, (): Task[] => {
    return store.getAll();
  });

  // 添加任务
  ipcMain.handle(IPC_CHANNELS.TASK_ADD, (_event, input: TaskInput): Task => {
    return store.addTask(input);
  });

  // 更新任务
  ipcMain.handle(
    IPC_CHANNELS.TASK_UPDATE,
    (_event, { id, patch }: { id: string; patch: Partial<Task> }): Task => {
      return store.updateTask(id, patch);
    },
  );

  // 切换任务完成状态
  ipcMain.handle(IPC_CHANNELS.TASK_TOGGLE, (_event, { id }: { id: string }): Task => {
    return store.toggleTask(id);
  });

  // 删除任务
  ipcMain.handle(IPC_CHANNELS.TASK_DELETE, (_event, { id }: { id: string }): void => {
    store.deleteTask(id);
  });

  // ===== Config 相关通道 =====

  // 获取配置
  ipcMain.handle(IPC_CHANNELS.CONFIG_GET, (): AppConfig => {
    return store.getConfig();
  });

  // 设置催促间隔
  ipcMain.handle(
    IPC_CHANNELS.CONFIG_SET_INTERVAL,
    (_event, { interval }: { interval: number }): void => {
      store.setReminderInterval(interval);
      scheduler.updateInterval(interval);
    },
  );

  // 设置开机自启
  ipcMain.handle(
    IPC_CHANNELS.CONFIG_SET_AUTO_LAUNCH,
    (_event, { enabled }: { enabled: boolean }): void => {
      store.setAutoLaunch(enabled);
      if (enabled) {
        autoLaunchService.enable();
      } else {
        autoLaunchService.disable();
      }
    },
  );

  // ===== Window 相关通道 =====

  // 最小化到托盘
  ipcMain.handle(IPC_CHANNELS.WINDOW_MINIMIZE, (): void => {
    windowService.minimizeToTray();
  });

  // 关闭到托盘
  ipcMain.handle(IPC_CHANNELS.WINDOW_CLOSE, (): void => {
    windowService.closeToTray();
  });

  // 切换 mini / 完整模式
  ipcMain.handle(IPC_CHANNELS.WINDOW_SET_MINI_MODE, (_event, isMini: boolean): void => {
    windowService.setMiniMode(isMini);
  });
}
