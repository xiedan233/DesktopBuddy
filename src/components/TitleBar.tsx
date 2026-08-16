import { useCallback } from 'react';
import bearIcon from '../assets/pet/bear-icon.png';

/**
 * TitleBar 组件 Props
 */
interface TitleBarProps {
  /** 是否处于 mini 模式，用于切换按钮的图标与文案 */
  isMini?: boolean;
  /** 点击缩小/展开按钮时的回调 */
  onToggleMini?: () => void;
}

/**
 * TitleBar - 标题栏组件
 * 包含拖动区域 + 应用名称 + 缩小/展开/最小化/关闭按钮
 * 使用 CSS -webkit-app-region: drag 实现窗口拖动
 */
function TitleBar({ isMini = false, onToggleMini }: TitleBarProps): JSX.Element {
  /**
   * 最小化到托盘
   */
  const handleMinimize = useCallback(async (): Promise<void> => {
    try {
      await window.desktopBuddy.minimizeWindow();
    } catch (err) {
      console.error('[TitleBar] 最小化失败:', err);
    }
  }, []);

  /**
   * 关闭到托盘
   */
  const handleClose = useCallback(async (): Promise<void> => {
    try {
      await window.desktopBuddy.closeWindow();
    } catch (err) {
      console.error('[TitleBar] 关闭失败:', err);
    }
  }, []);

  return (
    <div
      className="flex h-8 items-center justify-between border-b border-gray-200/50 px-3"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* 应用名称 */}
      <div className="flex items-center gap-1.5">
        <img
          src={bearIcon}
          alt="自嘲熊"
          className="h-5 w-5 rounded-full object-cover"
          draggable={false}
        />
        <span className="text-xs font-medium text-gray-600">DesktopBuddy</span>
      </div>

      {/* 窗口控制按钮 */}
      <div
        className="flex items-center gap-1"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {/* 缩小/展开按钮（放在最小化按钮左边） */}
        <button
          onClick={onToggleMini}
          className="flex h-5 w-5 items-center justify-center rounded text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors focus:outline-none focus:ring-0"
          title={isMini ? '展开' : '缩小'}
        >
          {isMini ? (
            // 展开：向外箭头（四角向外的折角）
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M3.5 1L3.5 3.5L1 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M6.5 1L6.5 3.5L9 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M3.5 9L3.5 6.5L1 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M6.5 9L6.5 6.5L9 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          ) : (
            // 缩小：向内箭头（四角向内的折角）
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1 3.5L3.5 3.5L3.5 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M9 3.5L6.5 3.5L6.5 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M1 6.5L3.5 6.5L3.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M9 6.5L6.5 6.5L6.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          )}
        </button>

        {/* 最小化按钮 */}
        <button
          onClick={handleMinimize}
          className="flex h-5 w-5 items-center justify-center rounded text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors focus:outline-none focus:ring-0"
          title="最小化到托盘"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <rect x="1" y="4.5" width="8" height="1.5" rx="0.5" fill="currentColor" />
          </svg>
        </button>

        {/* 关闭按钮 */}
        <button
          onClick={handleClose}
          className="flex h-5 w-5 items-center justify-center rounded text-gray-400 hover:bg-red-400 hover:text-white transition-colors focus:outline-none focus:ring-0"
          title="关闭到托盘"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d="M2 2L8 8M8 2L2 8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default TitleBar;
