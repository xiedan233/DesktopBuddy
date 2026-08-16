# DesktopBuddy · 桌面悬浮熊秘书

> 一款桌面悬浮待办应用：用「自嘲熊」宠物角色 + 超强催促提醒，治一治你的拖延症。
> 纯本地存储，无需联网；任务完成度实时驱动熊的表情与状态。

---

## ✨ 功能特性

- 🐻 **自嘲熊宠物角色**：根据任务完成进度（0% → 100%）切换 10 种状态（睡觉 / 醒醒 / 起步 / 忙碌 / 工作中 / 过半 / 快好了 / 冲刺 / 庆祝 / 逾期慌乱），每种状态对应一张 GIF。
- ⏰ **超强催促提醒**：可配置提醒频率与文案，逾期任务触发「慌乱」状态与系统通知，专治拖延。
- 🪟 **桌面悬浮窗**：320×420 紧凑窗口，浅色主题，可置顶 / 最小化到托盘。
- 💾 **纯本地存储**：任务与配置保存在用户目录 `userData/tasks.json`，不上传任何云端。
- 🚀 **开机自启**：可选随系统启动（auto-launch）。

## 🧱 技术栈

| 层 | 技术 |
| --- | --- |
| 桌面壳 | Electron 28 |
| 前端 | React 18 + TypeScript 5 |
| 构建 | electron-vite 2 + Vite 5 |
| 样式 | Tailwind CSS 3 |
| 存储 | 本地 JSON（`electron-store` 思路） |

## 📦 环境要求

- Node.js ≥ 18
- npm ≥ 9

## 🚀 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 本地开发（Electron + Vite HMR）
npm run dev

# 3. 类型检查
npm run typecheck

# 4. 打包 Windows 安装包（输出到 release/）
npm run build:win
```

> 说明：本项目使用国内 npm 镜像（`electron_mirror` / `registry` 已在 `.npmrc` 配置），海外网络可删除或注释 `.npmrc` 中对应行恢复官方源。

## 📁 目录结构

```
DesktopBuddy/
├── electron/
│   ├── main/            # 主进程：窗口 / IPC / 托盘 / 自启
│   ├── preload/         # 预加载脚本（上下文隔离）
│   └── services/        # 通知、提醒调度、本地存储
├── src/                 # React 渲染进程
│   ├── components/      # PetArea / TaskList / TaskInput / TitleBar ...
│   ├── hooks/           # useTasks / usePetState
│   ├── store/           # TaskContext / ConfigContext
│   ├── utils/           # pet-states / task-utils
│   └── main.tsx / App.tsx
├── public/pet-gifs/     # 运行时使用的 10 张宠物状态 GIF
├── resources/           # 应用图标
├── index.html
├── electron.vite.config.ts
├── vite.renderer.config.ts
└── package.json
```

## ⚠️ 关于表情包素材

`self-deprecating-bear-emotes/`（168 张自嘲熊 GIF，约 130MB）是原始素材库，**未纳入本仓库**（已在 `.gitignore` 中排除）。
应用运行时仅依赖 `public/pet-gifs/` 中的 10 张 GIF。如需完整素材，请单独管理或接入 Git LFS。

## 🔒 安全说明

- 仓库已通过 `.gitignore` 排除 `node_modules/`、构建产物、日志与 `.env*`。
- 当前源码不含任何 API 密钥 / 数据库密码 / 私钥等敏感信息；如后续接入外部服务，请统一使用 `.env` + `process.env` 方式，并将 `.env` 加入忽略列表。

## 📄 许可证

[MIT](./LICENSE) © 2026 DesktopBuddy Team
