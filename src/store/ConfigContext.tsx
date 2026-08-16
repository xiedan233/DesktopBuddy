import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AppConfig } from '@shared/types/index';

/** 配置 Context 值类型 */
interface ConfigContextValue {
  config: AppConfig;
  setReminderInterval: (interval: number) => Promise<void>;
  setAutoLaunch: (enabled: boolean) => Promise<void>;
}

/** 默认配置 */
const DEFAULT_CONFIG: AppConfig = {
  reminderInterval: 20,
  autoLaunch: false,
};

/** 配置 Context */
const ConfigContext = createContext<ConfigContextValue | null>(null);

/**
 * ConfigProvider - 应用配置 Provider
 * 通过 IPC 从主进程加载配置，提供配置读取和更新方法
 */
export function ConfigProvider({ children }: { children: ReactNode }): JSX.Element {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);

  // 组件挂载时从主进程加载配置
  useEffect(() => {
    const loadConfig = async (): Promise<void> => {
      try {
        const loadedConfig = await window.desktopBuddy.getConfig();
        setConfig(loadedConfig);
      } catch (err) {
        console.error('[ConfigProvider] 加载配置失败:', err);
      }
    };
    loadConfig();
  }, []);

  /**
   * 设置催促间隔
   * @param interval 间隔（分钟）
   */
  const handleSetReminderInterval = async (interval: number): Promise<void> => {
    try {
      await window.desktopBuddy.setReminderInterval(interval);
      setConfig((prev) => ({ ...prev, reminderInterval: interval }));
    } catch (err) {
      console.error('[ConfigProvider] 设置催促间隔失败:', err);
    }
  };

  /**
   * 设置开机自启
   * @param enabled 是否启用
   */
  const handleSetAutoLaunch = async (enabled: boolean): Promise<void> => {
    try {
      await window.desktopBuddy.setAutoLaunch(enabled);
      setConfig((prev) => ({ ...prev, autoLaunch: enabled }));
    } catch (err) {
      console.error('[ConfigProvider] 设置开机自启失败:', err);
    }
  };

  const value: ConfigContextValue = {
    config,
    setReminderInterval: handleSetReminderInterval,
    setAutoLaunch: handleSetAutoLaunch,
  };

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
}

/**
 * useConfigContext - 获取配置 Context
 * 必须在 ConfigProvider 内部使用
 * @throws 在 ConfigProvider 外部使用时抛出错误
 */
export function useConfigContext(): ConfigContextValue {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfigContext 必须在 ConfigProvider 内部使用');
  }
  return context;
}
