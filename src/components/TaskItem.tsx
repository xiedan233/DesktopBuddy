import { useState, useEffect, useCallback, useRef, type KeyboardEvent } from 'react';
import type { Task } from '../types';
import { Priority } from '../types';
import {
  PRIORITY_LABELS,
  formatDeadline,
  isUrgent,
  isOverdue,
  getUrgencyLabel,
  deadlineInputToIso,
  isoToDeadlineInput,
} from '../utils/task-utils';

/** 编辑态任务名 textarea 最大高度（px），超出后内部滚动 */
const MAX_EDIT_TEXTAREA_HEIGHT = 96;

/** TaskItem 组件的 Props 类型 */
export interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Task>) => Promise<void>;
}

/**
 * TaskItem - 任务行组件
 * 第一行：勾选框 + 优先级标识 + 任务名（可自动换行）
 * 第二行：截止时间 + 紧急标记 + 操作按钮（右对齐，hover 显示编辑/删除）
 * 点击编辑进入内联编辑表单
 */
export default function TaskItem({
  task,
  onToggle,
  onDelete,
  onUpdate,
}: TaskItemProps): JSX.Element {
  const priorityInfo = PRIORITY_LABELS[task.priority];
  const deadlineText = formatDeadline(task.deadline);
  const urgent = isUrgent(task);
  const overdue = isOverdue(task);
  const urgencyLabel = getUrgencyLabel(task);

  // 编辑态相关状态
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editTitle, setEditTitle] = useState<string>(task.title);
  const [editPriority, setEditPriority] = useState<Priority>(task.priority);
  const [editDeadline, setEditDeadline] = useState<string>(
    isoToDeadlineInput(task.deadline),
  );
  const [saving, setSaving] = useState<boolean>(false);
  // 编辑态下的非阻塞错误提示（替代原生 alert，避免无边框窗口关弹窗后丢失焦点）
  const [editError, setEditError] = useState<string | null>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  /** 根据内容自动调整编辑态 textarea 高度 */
  const autoResizeEdit = useCallback((): void => {
    const el = editTextareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const nextHeight = Math.min(el.scrollHeight, MAX_EDIT_TEXTAREA_HEIGHT);
    el.style.height = `${nextHeight}px`;
  }, []);

  // 进入编辑态或编辑内容变化时重新计算高度
  useEffect(() => {
    if (isEditing) autoResizeEdit();
  }, [isEditing, editTitle, autoResizeEdit]);

  /** 进入编辑态：用当前任务数据初始化表单 */
  const startEdit = useCallback((): void => {
    setEditTitle(task.title);
    setEditPriority(task.priority);
    setEditDeadline(isoToDeadlineInput(task.deadline));
    setIsEditing(true);
  }, [task.title, task.priority, task.deadline]);

  /** 取消编辑 */
  const cancelEdit = useCallback((): void => {
    setIsEditing(false);
  }, []);

  /** 保存编辑 */
  const saveEdit = useCallback(async (): Promise<void> => {
    const trimmedTitle = editTitle.trim();
    if (!trimmedTitle) return;

    const deadlineISO = deadlineInputToIso(editDeadline);

    setSaving(true);
    try {
      await onUpdate(task.id, {
        title: trimmedTitle,
        priority: editPriority,
        deadline: deadlineISO,
      });
      setIsEditing(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : '更新任务失败';
      // 撞名或其他错误：用应用内红条提示，保留编辑态与焦点，不用原生 alert
      setEditError(
        message === 'DUPLICATE_TITLE'
          ? '已存在相同名称的任务，请换一个名字'
          : `更新任务失败：${message}`,
      );
    } finally {
      setSaving(false);
    }
  }, [editTitle, editPriority, editDeadline, onUpdate, task.id]);

  // 编辑态错误提示 4 秒后自动消失
  useEffect(() => {
    if (!editError) return;
    const timer = setTimeout(() => setEditError(null), 4000);
    return () => clearTimeout(timer);
  }, [editError]);

  /** 编辑态下回车保存、Esc 取消；Shift+Enter 换行 */
  const handleEditKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        saveEdit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelEdit();
      }
    },
    [saveEdit, cancelEdit],
  );

  // ===== 编辑态：内联表单 =====
  if (isEditing) {
    return (
      <div className="rounded-lg border border-primary/40 bg-primary/5 px-2.5 py-2">
        <textarea
          ref={editTextareaRef}
          value={editTitle}
          rows={1}
          autoFocus
          onChange={(e) => {
            setEditTitle(e.target.value);
            if (editError) setEditError(null);
          }}
          onKeyDown={handleEditKeyDown}
          maxLength={100}
          className="min-h-[28px] max-h-[96px] w-full resize-none overflow-y-auto rounded-md border border-gray-200 bg-white px-2 py-1 text-xs leading-tight text-gray-700 focus:border-primary focus:outline-none"
          placeholder="任务名称"
        />
        {editError && (
          <p className="mt-1 text-[11px] leading-tight text-red-500">{editError}</p>
        )}
        <div className="mt-1.5 flex items-center gap-1.5">
          <input
            type="datetime-local"
            value={editDeadline}
            onChange={(e) => setEditDeadline(e.target.value)}
            onKeyDown={handleEditKeyDown}
            className="min-w-0 flex-1 rounded-md border border-gray-200 bg-white px-1 py-1 text-2xs text-gray-600 focus:border-primary focus:outline-none"
            title="截止时间"
          />
          <select
            value={editPriority}
            onChange={(e) => setEditPriority(e.target.value as Priority)}
            className="rounded-md border border-gray-200 bg-white px-1 py-1 text-2xs text-gray-600 focus:border-primary focus:outline-none"
            title="优先级"
          >
            <option value={Priority.HIGH}>🔴 高</option>
            <option value={Priority.MEDIUM}>🟡 中</option>
            <option value={Priority.LOW}>🟢 低</option>
          </select>
        </div>
        <div className="mt-1.5 flex items-center justify-end gap-1.5">
          <button
            onClick={cancelEdit}
            disabled={saving}
            className="flex h-6 items-center rounded-md border border-gray-200 bg-white px-2 text-2xs text-gray-500 transition-colors hover:bg-gray-50 disabled:opacity-50 focus:outline-none focus:ring-0"
            title="取消"
          >
            取消
          </button>
          <button
            onClick={saveEdit}
            disabled={saving || !editTitle.trim()}
            className="flex h-6 items-center rounded-md bg-primary px-2 text-2xs text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-gray-300 focus:outline-none focus:ring-0"
            title="保存"
          >
            保存
          </button>
        </div>
      </div>
    );
  }

  // ===== 普通态：自适应一行 / 两行 =====
  // 外层 flex-wrap：任务名短时，勾选框 + 圆点 + 任务名 + 操作区全部一行；
  // 任务名长时，任务名占满整行（flex-1），操作区被 wrap 推到下一行并由 ml-auto 右对齐。
  return (
    <div
      className={`group rounded-lg px-2.5 py-2 transition-colors hover:bg-gray-50 ${
        task.completed ? 'opacity-50' : ''
      }`}
    >
      <div className="flex flex-wrap items-start gap-x-2 gap-y-1">
        {/* 勾选框 */}
        <button
          onClick={() => onToggle(task.id)}
          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors ${
            task.completed
              ? 'border-primary bg-primary text-white'
              : 'border-gray-300 hover:border-primary'
          }`}
          title={task.completed ? '标记为未完成' : '标记为已完成'}
        >
          {task.completed && (
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path
                d="M1 4l2 2 4-5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>

        {/* 优先级圆点 */}
        <span
          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${priorityInfo.dot}`}
          title={`优先级：${priorityInfo.label}`}
        />

        {/* 任务名容器：flex-1 占满剩余空间，min-w 保证长文本被迫整行时仍可读且不塌陷 */}
        <div className="min-w-[8rem] flex-1">
          <p
            className={`break-words whitespace-normal leading-tight text-xs ${
              task.completed
                ? 'text-gray-400 line-through'
                : 'text-gray-700'
            }`}
          >
            {task.title}
          </p>
        </div>

        {/* 操作区：截止时间 + 紧急标签 + 编辑/删除按钮。
            shrink-0 不被压缩；ml-auto 在换行时把操作区推到下一行最右侧（右对齐）。 */}
        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          {deadlineText && (
            <>
              <span
                className={`text-2xs ${
                  overdue
                    ? 'font-medium text-red-500'
                    : urgent
                      ? 'font-medium text-orange-500'
                      : 'text-gray-400'
                }`}
              >
                📅 {deadlineText}
              </span>
              {urgencyLabel && (
                <span
                  className={`rounded px-1 text-2xs ${
                    overdue
                      ? 'bg-red-100 text-red-600'
                      : 'bg-orange-100 text-orange-600'
                  }`}
                >
                  {urgencyLabel}
                </span>
              )}
            </>
          )}

          {/* 操作按钮（hover 时显示）：编辑 + 删除 */}
          <div className="flex shrink-0 items-center gap-1 opacity-0 transition-all group-hover:opacity-100">
            <button
              onClick={startEdit}
              className="flex h-4 w-4 items-center justify-center rounded text-gray-300 hover:bg-primary/10 hover:text-primary"
              title="编辑任务"
            >
              <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                <path
                  d="M8 1.5l2.5 2.5L4 10.5 1.5 8zM7 2.5L9.5 5"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              onClick={() => onDelete(task.id)}
              className="flex h-4 w-4 items-center justify-center rounded text-gray-300 hover:bg-red-100 hover:text-red-500"
              title="删除任务"
            >
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                <path
                  d="M1 1l6 6M7 1L1 7"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
