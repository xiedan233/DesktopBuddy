import { app } from 'electron';

/**
 * 沙箱/虚拟化环境兼容性修复
 *
 * 必须在主进程最开头执行（早于任何 BrowserWindow / IPC / 服务初始化）。
 *
 * 关键原则：
 * - 必须要「禁用 GPU」以避开无显卡/虚拟机环境下 GLES 上下文创建失败导致的崩溃；
 * - 但「绝不能」再禁用软件光栅化（SwiftShader），否则 Chromium 既没 GPU 又没
 *   软件渲染兜底，窗口虽然能 show() 出来，内容却完全空白（白屏）。
 */

// 禁用 GPU 硬件加速（必须在 app.ready 之前调用）
app.disableHardwareAcceleration();

// 禁用 GPU 相关进程（无显卡/虚拟化环境必需，避免 Failed to create GLES context 崩溃）
app.commandLine.appendSwitch('disable-gpu');

// 禁用 Chromium 渲染器沙箱（虚拟化环境必需）
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-setuid-sandbox');

// 避免 /dev/shm 不足导致的渲染器崩溃（Linux 容器；Windows 无害）
app.commandLine.appendSwitch('disable-dev-shm-usage');

// 启用 SwiftShader 软件光栅化兜底（Chromium 120+/Electron 28 在禁用 GPU 时
// 必须显式开启此开关，否则 WebGL/合成层没有软件渲染兜底，易导致白屏）。
// 注意：绝不能加 --disable-software-rasterizer（历史确认会直接白屏）。
app.commandLine.appendSwitch('enable-unsafe-swiftshader');

// 减少首次启动时的后台行为，降低渲染进程压力（这些不影响画面绘制）
app.commandLine.appendSwitch('no-first-run');
app.commandLine.appendSwitch('disable-default-apps');
app.commandLine.appendSwitch('disable-sync');

console.log('[SandboxFix] GPU/沙箱兼容开关已应用（保留软件光栅化）');
