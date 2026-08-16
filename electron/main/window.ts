import { BrowserWindow, shell, app } from 'electron';
import { join } from 'path';

/** 窗口尺寸 */
const WINDOW_WIDTH = 320;
const WINDOW_HEIGHT = 420;
/** mini 模式高度（仅显示宠物区） */
const MINI_HEIGHT = 120;

/**
 * WindowService - 窗口创建与管理
 * 负责创建 frameless + transparent + alwaysOnTop 的悬浮窗
 */
export class WindowService {
  private mainWindow: BrowserWindow | null = null;

  /**
   * 创建主窗口
   * @returns 创建的 BrowserWindow 实例
   */
  createWindow(): BrowserWindow {
    try {
      this.mainWindow = new BrowserWindow({
        width: WINDOW_WIDTH,
        height: WINDOW_HEIGHT,
        minWidth: WINDOW_WIDTH,
        minHeight: MINI_HEIGHT,
        maxWidth: WINDOW_WIDTH,
        maxHeight: WINDOW_HEIGHT,
        frame: false,
        // 禁用 GPU 的虚拟化/沙箱环境中，transparent: true 会导致窗口完全不可见，
        // 因此改用 frameless + 实色背景；圆角效果由前端 CSS 实现。
        transparent: false,
        resizable: false,
        maximizable: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        show: false,
        autoHideMenuBar: true,
        hasShadow: true,
        thickFrame: false,
        // 浅色实色背景，避免白屏闪烁，同时确保禁用 GPU 时窗口可见
        backgroundColor: '#EDF7FF',
        webPreferences: {
          preload: join(__dirname, '../preload/index.js'),
          contextIsolation: true,
          nodeIntegration: false,
          sandbox: false,
          offscreen: false,
          backgroundThrottling: false,
        },
      });

      const win = this.mainWindow;

      // 窗口准备好后再显示，避免白屏闪烁
      win.on('ready-to-show', () => {
        console.log('[WindowService] ready-to-show 触发，显示窗口');
        win.show();
      });

      // 保护机制：如果 5 秒内 ready-to-show 未触发（常见于渲染进程异常），
      // 强制尝试显示窗口并记录日志，方便排查
      let shown = false;
      const forceShowTimer = setTimeout(() => {
        if (shown || win.isDestroyed()) return;
        console.warn('[WindowService] ready-to-show 5 秒内未触发，强制 show()');
        win.show();
      }, 5000);

      win.on('show', () => {
        shown = true;
        clearTimeout(forceShowTimer);
      });

      // 阻止窗口被关闭（销毁），改为隐藏到托盘
      win.on('close', (event) => {
        event.preventDefault();
        win.hide();
      });

      // 渲染进程崩溃/被杀死
      win.webContents.on('render-process-gone', (_event, details) => {
        console.error('[WindowService] 渲染进程崩溃:', details);
      });

      // 页面无响应
      win.webContents.on('unresponsive', () => {
        console.error('[WindowService] 页面无响应');
      });

      // 页面加载失败
      win.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
        console.error('[WindowService] 页面加载失败:', errorCode, errorDescription);
      });

      // 页面加载完成
      win.webContents.on('did-finish-load', () => {
        console.log('[WindowService] 页面加载完成');
      });

      // 把渲染进程的 console 转发到主进程，方便在 cmd 里看到 React 报错
      win.webContents.on('console-message', (_event, level, message) => {
        const prefix = '[RendererConsole]';
        if (level === 2) {
          console.error(prefix, message);
        } else if (level === 1) {
          console.warn(prefix, message);
        } else {
          console.log(prefix, message);
        }
      });

      // 阻止默认的外部链接打开行为，改为系统浏览器打开
      win.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url);
        return { action: 'deny' };
      });

      // 开发环境加载 dev server URL，生产环境加载打包文件
      // electron-vite dev 模式下 Vite dev server 运行在 http://localhost:5173
      if (process.env['ELECTRON_RENDERER_URL']) {
        win.loadURL(process.env['ELECTRON_RENDERER_URL']);
      } else if (process.env['NODE_ENV'] === 'development' || !app.isPackaged) {
        win.loadURL('http://localhost:5173');
      } else {
        win.loadFile(join(__dirname, '../renderer/index.html'));
      }

      return win;
    } catch (err) {
      console.error('[WindowService] 创建 BrowserWindow 失败:', err);
      throw err;
    }
  }

  /**
   * 获取主窗口实例
   * @returns 主窗口，若未创建则返回 null
   */
  getWindow(): BrowserWindow | null {
    return this.mainWindow;
  }

  /**
   * 最小化到托盘（隐藏窗口而非真正最小化）
   */
  minimizeToTray(): void {
    if (this.mainWindow) {
      this.mainWindow.hide();
    }
  }

  /**
   * 从托盘恢复窗口
   */
  restore(): void {
    if (this.mainWindow) {
      this.mainWindow.show();
      this.mainWindow.focus();
    }
  }

  /**
   * 设置窗口为 mini 模式或完整模式
   * @param isMini true 表示 mini 模式（仅标题栏 + 宠物区），false 表示完整模式
   */
  setMiniMode(isMini: boolean): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) return;
    const height = isMini ? MINI_HEIGHT : WINDOW_HEIGHT;
    try {
      // Windows 下 resizable:false 时 setSize 可能不稳定，临时解除限制再恢复
      this.mainWindow.setResizable(true);
      this.mainWindow.setSize(WINDOW_WIDTH, height);
      this.mainWindow.setResizable(false);
      console.log(`[WindowService] 窗口切换为 ${isMini ? 'mini' : '完整'} 模式，尺寸 ${WINDOW_WIDTH}x${height}`);
    } catch (err) {
      console.error('[WindowService] 切换窗口尺寸失败:', err);
    }
  }

  /**
   * 关闭窗口到托盘（隐藏窗口）
   */
  closeToTray(): void {
    if (this.mainWindow) {
      this.mainWindow.hide();
    }
  }

  /**
   * 销毁窗口（应用退出时调用）
   * 先移除 close 事件监听器，再销毁窗口
   */
  destroy(): void {
    if (this.mainWindow) {
      this.mainWindow.removeAllListeners('close');
      this.mainWindow.destroy();
      this.mainWindow = null;
    }
  }
}
