# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

MultiChrome 是一个基于 Electron + React + TypeScript 的桌面应用程序，用于管理多个独立的 Chrome 浏览器环境。每个环境都有独立的用户数据目录，确保完全隔离。

## 常用命令

### 开发
```bash
# 启动开发服务器（同时启动 Vite 和 Electron）
npm run dev

# 仅启动前端开发服务器
npm run dev:vite

# 仅启动 Electron（需要先构建）
npm run dev:electron
```

### 构建
```bash
# 构建完整应用程序
npm run build

# 仅构建前端（Vite）
npm run build:vite

# 仅构建 Electron 主进程
npm run build:electron

# 打包为 Windows 安装程序
npm run package:win
```

### 代码检查
```bash
# 运行 ESLint 检查
npm run lint

# 运行 ESLint 并自动修复
npm run lint:fix
```

## 架构概览

### 核心组件架构
- **Electron 主进程** (`electron/main.ts`): 应用程序入口，管理窗口和 IPC 通信
- **Chrome 管理器** (`electron/chromeManager.ts`): 负责 Chrome 环境的创建、启动、关闭和管理
- **设置管理器** (`electron/settingsManager.ts`): 处理应用程序设置的存储和读取
- **React 前端** (`src/`): 用户界面，使用 Ant Design 组件库

### 数据流
1. React 组件通过 `window.electronAPI` 调用预加载脚本暴露的方法
2. 预加载脚本通过 IPC 与主进程通信
3. 主进程调用相应的管理器类处理业务逻辑
4. 使用 SQLite 数据库存储环境配置信息

### 关键数据结构
- **ChromeEnvironment** (`src/types/index.ts`): 定义 Chrome 环境的数据结构，包含 ID、名称、分组、数据目录等信息
- **ElectronAPI** (`src/types/index.ts`): 定义预加载脚本暴露给渲染进程的 API 接口

### IPC 通信模式
主进程通过 `ipcMain.handle()` 注册处理程序，渲染进程通过预加载脚本调用，所有异步操作都返回 Promise。主要的 IPC 频道包括：
- `get-chrome-environments`: 获取所有环境
- `create-chrome-environment`: 创建新环境  
- `launch-chrome-environment`: 启动环境
- `close-chrome-environment`: 关闭环境
- `delete-chrome-environment`: 删除环境

## 开发注意事项

### Chrome 进程管理
Chrome 环境通过独立的用户数据目录启动，每个环境都是完全隔离的 Chrome 实例。系统通过 PID 跟踪运行状态。

### 跨平台考虑
当前主要针对 Windows 平台，PowerShell 命令在构建脚本中用于文件操作和环境变量设置。

### 数据存储
- 环境配置存储在 SQLite 数据库中
- 用户数据目录默认位于 `%APPDATA%/multichrome/environments`
- 应用设置通过 electron-store 管理

### 错误处理
所有异步操作都包含完整的错误处理，错误信息通过 electron-log 记录到日志文件中。