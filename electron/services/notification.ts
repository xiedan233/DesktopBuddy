import { Notification, BrowserWindow } from 'electron';
import type { Task, UrgentTaskInfo } from '@shared/types/index';
import {
  NUDGE_CHEER,
  NUDGE_NUDGE,
  NUDGE_HARSH,
  DEADLINE_CHEER,
  DEADLINE_NUDGE,
  DEADLINE_HARSH,
  OVERDUE_CHEER,
  OVERDUE_NUDGE,
  OVERDUE_HARSH,
  pickByTone,
  formatMessage,
} from '@shared/data/messages';

/**
 * NotificationService - 通知服务
 * 负责 Windows Toast 通知发送、声音播放、点击恢复窗口
 */
export class NotificationService {
  private mainWindow: BrowserWindow | null = null;

  /**
   * 设置主窗口引用（用于通知点击恢复窗口）
   */
  setMainWindow(window: BrowserWindow | null): void {
    this.mainWindow = window;
  }

  /**
   * 发送周期催促通知
   *
   * 语气按 5:3:2（鼓励 : 督促 : 狠话）随机抽取，整体以鼓励为主。
   *
   * @param tasks 未完成任务列表
   * @param completedCount 已完成任务数（保留参数，当前文案统一以未完成数 {count} 表达）
   */
  sendNudge(tasks: Task[], completedCount: number): void {
    if (tasks.length === 0) {
      return;
    }

    // 三类语气池按 5:3:2 抽选，{count} 统一取未完成任务数
    const message: string = formatMessage(
      pickByTone(NUDGE_CHEER, NUDGE_NUDGE, NUDGE_HARSH),
      { count: tasks.length },
    );

    const notification = new Notification({
      title: 'DesktopBuddy 提醒',
      body: message,
      silent: false,
    });

    notification.on('click', () => {
      this.showMainWindow();
    });

    notification.show();
  }

  /**
   * 发送截止警告通知（多任务合并）
   * @param urgentTasks 紧急任务列表
   */
  sendDeadlineWarning(urgentTasks: UrgentTaskInfo[]): void {
    if (urgentTasks.length === 0) {
      return;
    }

    // 按紧急程度排序（minutesLeft 升序）
    const sorted = [...urgentTasks].sort(
      (a, b) => a.minutesLeft - b.minutesLeft,
    );

    const title =
      sorted.length === 1
        ? `⚠️ 任务即将截止：${sorted[0].task.title}`
        : `⚠️ ${sorted.length} 个任务即将截止！`;

    // 每条 urgent 独立按 5:3:2 抽选语气（每条含 {title}/{label} 占位符）
    // 注意：正文使用 item.label（"1小时"/"30分钟"/"10分钟"）描述剩余时间，
    // 而非具体分钟数，避免「同一级别每分钟都弹一次」造成重复的感知。
    const bodyLines = sorted.map((item) => {
      return formatMessage(
        pickByTone(DEADLINE_CHEER, DEADLINE_NUDGE, DEADLINE_HARSH),
        {
          title: item.task.title,
          label: item.label,
        },
      );
    });

    // 单条显示完整文案，多条只显示前几条避免过长
    const body =
      sorted.length === 1
        ? bodyLines[0]
        : `${bodyLines.slice(0, 2).join('\n')}${bodyLines.length > 2 ? '\n…' : ''}`;

    const notification = new Notification({
      title,
      body,
      silent: false,
    });

    notification.on('click', () => {
      this.showMainWindow();
    });

    notification.show();
  }

  /**
   * 发送逾期警告通知（多任务合并）
   * @param overdueTasks 已逾期任务列表
   */
  sendOverdue(overdueTasks: Task[]): void {
    if (overdueTasks.length === 0) {
      return;
    }

    const title =
      overdueTasks.length === 1
        ? `🔥 任务已逾期：${overdueTasks[0].title}`
        : `🔥 ${overdueTasks.length} 个任务已逾期！熊急死了！`;

    // 每条逾期任务独立按 5:3:2 抽选语气（每条含 {title} 占位符）
    const bodyLines = overdueTasks.map((task) => {
      return formatMessage(
        pickByTone(OVERDUE_CHEER, OVERDUE_NUDGE, OVERDUE_HARSH),
        { title: task.title },
      );
    });

    // 单条显示完整文案，多条只显示前几条避免过长
    const body =
      overdueTasks.length === 1
        ? bodyLines[0]
        : `${bodyLines.slice(0, 2).join('\n')}${bodyLines.length > 2 ? '\n…' : ''}`;

    const notification = new Notification({
      title,
      body,
      silent: false,
    });

    notification.on('click', () => {
      this.showMainWindow();
    });

    notification.show();
  }

  /**
   * 播放通知声音
   */
  playSound(): void {
    // Electron Notification 默认会播放系统声音
    // 此处保留方法供扩展使用
    const notification = new Notification({
      title: '',
      body: '',
      silent: false,
    });
    notification.show();
  }

  /**
   * 显示并聚焦主窗口
   */
  private showMainWindow(): void {
    if (this.mainWindow) {
      if (this.mainWindow.isMinimized() || !this.mainWindow.isVisible()) {
        this.mainWindow.show();
      }
      this.mainWindow.focus();
    }
  }
}
