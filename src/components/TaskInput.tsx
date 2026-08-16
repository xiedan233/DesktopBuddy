import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from 'react';
import { Priority } from '../types';
import { useTaskContext } from '../store/TaskContext';

/** 任务输入框最大高度（px），超出后内部滚动 */
const MAX_TEXTAREA_HEIGHT = 96;

/**
 * TaskInput - 任务输入组件
 * 多行输入框（自动撑高）+ 截止时间选择 + 优先级选择
 * 回车提交任务；Shift+Enter 换行
 */
export default function TaskInput(): JSX.Element {
  const { addTask } = useTaskContext();

  const [title, setTitle] = useState<string>('');
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);
  const [deadline, setDeadline] = useState<string>('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // 应用内非阻塞错误提示（替代原生 alert，避免无边框窗口关弹窗后丢失焦点导致输入框"假死"）
  const [inputError, setInputError] = useState<string | null>(null);

  /**
   * 根据内容自动调整 textarea 高度：
   * 初始约 1 行，随内容增加高度，超过 MAX 后固定高度并内部滚动。
   */
  const autoResize = useCallback((): void => {
    const el = textareaRef.current;
    if (!el) return;
    // 先重置高度，使 scrollHeight 反映真实内容高度
    el.style.height = 'auto';
    const nextHeight = Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT);
    el.style.height = `${nextHeight}px`;
  }, []);

  // 内容变化（或挂载）时重新计算高度
  useEffect(() => {
    autoResize();
  }, [title, autoResize]);

  /** 提交任务 */
  const handleSubmit = useCallback(async (): Promise<void> => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    // 将本地时间转换为 ISO 8601 UTC 字符串
    let deadlineISO: string | null = null;
    if (deadline) {
      const date = new Date(deadline);
      if (!Number.isNaN(date.getTime())) {
        deadlineISO = date.toISOString();
      }
    }

    try {
      await addTask({
        title: trimmedTitle,
        priority,
        deadline: deadlineISO,
      });

      // 清空输入
      setTitle('');
      setDeadline('');
      setPriority(Priority.MEDIUM);
      setInputError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : '添加任务失败';
      if (message === 'DUPLICATE_TITLE') {
        // 重复名：清空任务名并立即聚焦，方便立刻重输；提示用应用内红条，不用原生 alert
        setInputError('已存在相同名称的任务，请换一个名字');
        setTitle('');
        setDeadline('');
        setPriority(Priority.MEDIUM);
        textareaRef.current?.focus();
      } else {
        // 其他错误：保留用户输入，仅聚焦方便重试
        setInputError(`添加任务失败：${message}`);
        textareaRef.current?.focus();
      }
    }
  }, [title, priority, deadline, addTask]);

  // 错误提示 4 秒后自动消失
  useEffect(() => {
    if (!inputError) return;
    const timer = setTimeout(() => setInputError(null), 4000);
    return () => clearTimeout(timer);
  }, [inputError]);

  /** 键盘事件：回车提交；Shift+Enter 换行（默认行为） */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>): void => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  return (
    <div className="relative">
      {inputError && (
        <div className="absolute left-2 right-2 -top-7 z-50 rounded-md bg-red-500/95 px-2 py-1 text-[11px] leading-tight text-white shadow-lg">
          {inputError}
        </div>
      )}
      <div className="flex items-start gap-1.5 border-b border-gray-100 px-2.5 py-1">
      {/* 任务输入框（多行自动撑高） */}
      <textarea
        ref={textareaRef}
        value={title}
        rows={1}
        onChange={(e) => {
          setTitle(e.target.value);
          if (inputError) setInputError(null);
        }}
        onKeyDown={handleKeyDown}
        placeholder="添加任务..."
        maxLength={100}
        className="min-h-[28px] max-h-[96px] min-w-0 flex-1 resize-none overflow-y-auto rounded-md border border-gray-200 bg-white px-2 py-1 text-xs leading-tight text-gray-700 placeholder-gray-300 focus:border-primary focus:outline-none"
      />

      {/* 截止时间选择器 */}
      <input
        type="datetime-local"
        value={deadline}
        onChange={(e) => setDeadline(e.target.value)}
        className="w-[120px] rounded-md border border-gray-200 bg-white px-1 py-1 text-2xs text-gray-600 focus:border-primary focus:outline-none"
        title="截止时间"
      />

      {/* 优先级选择 */}
      <select
        value={priority}
        onChange={(e) => setPriority(e.target.value as Priority)}
        className="rounded-md border border-gray-200 bg-white px-1 py-1 text-2xs text-gray-600 focus:border-primary focus:outline-none"
        title="优先级"
      >
        <option value={Priority.HIGH}>🔴 高</option>
        <option value={Priority.MEDIUM}>🟡 中</option>
        <option value={Priority.LOW}>🟢 低</option>
      </select>

      {/* 添加按钮 */}
      <button
        onClick={handleSubmit}
        disabled={!title.trim()}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-gray-300 focus:outline-none focus:ring-0"
        title="添加任务"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M6 1v10M1 6h10"
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
