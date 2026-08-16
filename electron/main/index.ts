// 必须在所有其他 import 之前应用沙箱/GPU 兼容开关
import './sandbox-fix';

import { app, BrowserWindow } from 'electron';
import { WindowService } from './window';
import { TrayService } from './tray';
import { AutoLaunchService } from './auto-launch';
import { registerIpcHandlers } from './ipc-handlers';
import { TaskStore } from '../services/store';
import { NotificationService } from '../services/notification';
import { ReminderScheduler } from '../services/reminder-scheduler';

// 防止垃圾回收，保持全局引用
let windowService: WindowService | null = null;
let trayService: TrayService | null = null;
let taskStore: TaskStore | null = null;
let scheduler: ReminderScheduler | null = null;
let notifier: NotificationService | null = null;

/**
 * Electron 主进程入口
 * 串联各服务的初始化流程：
 * 1. 创建 TaskStore（数据持久化）
 * 2. 创建 WindowService（悬浮窗）
 * 3. 创建 TrayService（系统托盘）
 * 4. 注册 IPC Handlers（IPC 通道）
 * 5. 启动 ReminderScheduler（双引擎提醒）
 */
function bootstrap(): void {
  // 1. 初始化数据存储
  taskStore = new TaskStore();

  // 2. 初始化通知服务
  notifier = new NotificationService();

  // 3. 创建主窗口
  windowService = new WindowService();
  const mainWindow: BrowserWindow = windowService.createWindow();
  notifier.setMainWindow(mainWindow);

  // 4. 创建系统托盘
  trayService = new TrayService();
  trayService.createTray(mainWindow);

  // 5. 初始化自启动服务（同步已有配置）
  const autoLaunchService = new AutoLaunchService();
  const config = taskStore.getConfig();
  if (config.autoLaunch) {
    autoLaunchService.enable();
  } else {
    autoLaunchService.disable();
  }

  // 6. 注册 IPC 处理器
  // 7. 初始化提醒调度器
  scheduler = new ReminderScheduler(taskStore, notifier);
  registerIpcHandlers({
    store: taskStore,
    scheduler,
    windowService,
    autoLaunchService,
  });

  // 8. 启动双引擎提醒调度器
  scheduler.start(config);

  console.log('[Main] DesktopBuddy 初始化完成');
}

/**
 * 应用就绪事件
 */
app.whenReady().then(() => {
  // 设置 Windows 通知显示的应用名称（AppUserModelId）
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.desktopbuddy.app');
  }

  bootstrap();

  // macOS: 激活时重新创建窗口
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      bootstrap();
    }
  });
});

/**
 * 所有窗口关闭时的处理
 * 由于应用驻留托盘，不退出应用
 */
app.on('window-all-closed', () => {
  // 不执行 app.quit()，保持托盘驻留
  // 仅在非 macOS 平台可考虑退出（当前设计为托盘驻留）
});

/**
 * 应用即将退出时清理资源
 */
app.on('before-quit', () => {
  if (scheduler) {
    scheduler.stop();
  }
  if (trayService) {
    trayService.destroy();
  }
  if (windowService) {
    windowService.destroy();
  }
});
