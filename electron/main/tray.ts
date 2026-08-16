import { Tray, Menu, nativeImage, app } from 'electron';
import { join } from 'path';
import type { BrowserWindow } from 'electron';

/**
 * TrayService - 系统托盘图标与右键菜单
 * 提供显示窗口、退出应用等快捷操作
 */
export class TrayService {
  private tray: Tray | null = null;

  /**
   * 创建系统托盘
   * @param window 主窗口实例
   */
  createTray(window: BrowserWindow): void {
    // 尝试加载托盘图标，加载失败则使用空图标占位
    let icon: ReturnType<typeof nativeImage.createFromPath>;
    const iconPath = join(process.env['VITE_PUBLIC'] ?? __dirname, '../../resources/tray-icon.png');
    try {
      icon = nativeImage.createFromPath(iconPath);
      if (icon.isEmpty()) {
        // 回退：使用 16x16 的默认图标
        icon = nativeImage.createEmpty();
      }
    } catch {
      icon = nativeImage.createEmpty();
    }

    this.tray = new Tray(icon);
    this.tray.setToolTip('DesktopBuddy - 熊秘书');

    this.updateMenu(window);

    // 双击托盘图标恢复窗口
    this.tray.on('double-click', () => {
      if (!window.isVisible()) {
        window.show();
      }
      window.focus();
    });
  }

  /**
   * 更新托盘右键菜单
   * @param window 主窗口实例
   */
  updateMenu(window: BrowserWindow): void {
    if (!this.tray) return;

    const contextMenu = Menu.buildFromTemplate([
      {
        label: '显示窗口',
        click: (): void => {
          window.show();
          window.focus();
        },
      },
      {
        label: '隐藏到托盘',
        click: (): void => {
          window.hide();
        },
      },
      { type: 'separator' },
      {
        label: '退出',
        click: (): void => {
          app.quit();
        },
      },
    ]);

    this.tray.setContextMenu(contextMenu);
  }

  /**
   * 销毁托盘
   */
  destroy(): void {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
}
