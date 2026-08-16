import { useState, useCallback } from 'react';
import { TaskProvider } from './store/TaskContext';
import { ConfigProvider } from './store/ConfigContext';
import TitleBar from './components/TitleBar';
import PetArea from './components/PetArea';
import TaskInput from './components/TaskInput';
import TaskList from './components/TaskList';

/**
 * App 根组件
 * 组合 Provider 层与 UI 布局：标题栏 + 宠物区 + 任务输入 + 任务列表
 * 支持 mini 模式：仅显示宠物区（宠物熊 + 状态文案），无标题栏，可拖动并展开
 */
function App(): JSX.Element {
  /** 是否处于 mini 模式 */
  const [isMini, setIsMini] = useState<boolean>(false);

  /**
   * 切换 mini / 完整模式
   * 先通知主进程调整窗口尺寸，再更新本地状态做条件渲染
   */
  const handleToggleMini = useCallback(async (): Promise<void> => {
    const next = !isMini;
    try {
      await window.desktopBuddy.setMiniMode(next);
      setIsMini(next);
    } catch (err) {
      console.error('[App] 切换 mini 模式失败:', err);
    }
  }, [isMini]);

  return (
    <ConfigProvider>
      <TaskProvider>
        {isMini ? (
          /* mini 模式：仅包裹宠物区自身，无标题栏；容器可拖动，右上角提供展开按钮 */
          <div
            className="relative w-[320px] h-[120px] overflow-hidden rounded-2xl bg-[#EDF7FF] shadow-lg"
            style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
          >
            <button
              onClick={handleToggleMini}
              title="展开"
              className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors focus:outline-none focus:ring-0"
              style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M3.5 1L3.5 3.5L1 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M6.5 1L6.5 3.5L9 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M3.5 9L3.5 6.5L1 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M6.5 9L6.5 6.5L9 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            {/* 宠物角色区（宠物熊 + 状态文案） */}
            <PetArea />
          </div>
        ) : (
          /* 完整模式：标题栏 + 宠物区 + 任务输入 + 任务列表 */
          <div className="flex h-screen w-screen flex-col overflow-hidden rounded-2xl bg-[#EDF7FF] shadow-lg">
            {/* 1. 顶部标题栏（拖动区 + 按钮） */}
            <TitleBar isMini={isMini} onToggleMini={handleToggleMini} />
            {/* 2. 宠物角色区 */}
            <PetArea />
            {/* 3. 任务输入区 */}
            <TaskInput />
            {/* 4. 任务列表区（可滚动） */}
            <div className="flex-1 overflow-hidden">
              <TaskList />
            </div>
          </div>
        )}
      </TaskProvider>
    </ConfigProvider>
  );
}

export default App;
