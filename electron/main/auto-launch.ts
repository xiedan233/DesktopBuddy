import { app } from 'electron';

/**
 * AutoLaunchService - 开机自启动管理
 * 使用 Electron 内置的 app.setLoginItemSettings API
 */
export class AutoLaunchService {
  /**
   * 启用开机自启动
   */
  enable(): void {
    app.setLoginItemSettings({
      openAtLogin: true,
      args: ['--hidden'],
    });
  }

  /**
   * 禁用开机自启动
   */
  disable(): void {
    app.setLoginItemSettings({
      openAtLogin: false,
    });
  }

  /**
   * 查询当前是否已启用开机自启动
   * @returns 是否已启用
   */
  isEnabled(): boolean {
    const settings = app.getLoginItemSettings();
    return settings.openAtLogin;
  }
}
