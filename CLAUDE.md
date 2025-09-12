# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

MultiChrome 是一个基于 Electron + React + TypeScript 的桌面应用程序，用于管理多个独立的 Chrome 浏览器环境。每个环境都有独立的用户数据目录，确保完全隔离。

**主要特性：**
- 🔐 完全隔离的 Chrome 环境，支持不同的用户配置
- 🗂️ 环境分组管理，支持标签和备注
- 🗑️ 回收站功能，支持环境的软删除和恢复
- ⚙️ 可配置的数据存储路径
- 📱 响应式界面设计，支持不同屏幕尺寸
- 🎨 采用 Primer React 设计系统

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
- **React 前端** (`src/`): 用户界面，使用 Primer React 设计系统
- **回收站管理器**: 处理环境的软删除、恢复和永久删除功能
- **响应式布局**: 支持不同屏幕尺寸的自适应界面

### 数据流
1. React 组件通过 `window.electronAPI` 调用预加载脚本暴露的方法
2. 预加载脚本通过 IPC 与主进程通信
3. 主进程调用相应的管理器类处理业务逻辑
4. 使用 SQLite 数据库存储环境配置信息

### 关键数据结构
- **ChromeEnvironment** (`src/types/index.ts`): 定义 Chrome 环境的数据结构，包含：
  - 基础信息：ID、名称、分组、备注
  - 配置信息：数据目录、代理、用户代理
  - 元数据：标签、创建时间、最后使用时间
  - 状态信息：运行状态、进程ID、删除时间戳
- **ElectronAPI** (`src/types/index.ts`): 定义预加载脚本暴露给渲染进程的 API 接口
- **错误类型** (`src/types/errors.ts`): 统一的错误处理类型定义

### IPC 通信模式
主进程通过 `ipcMain.handle()` 注册处理程序，渲染进程通过预加载脚本调用，所有异步操作都返回 Promise。主要的 IPC 频道包括：

**环境管理:**
- `get-chrome-environments`: 获取所有环境
- `create-chrome-environment`: 创建新环境  
- `launch-chrome-environment`: 启动环境
- `close-chrome-environment`: 关闭环境
- `update-chrome-environment`: 更新环境信息
- `delete-chrome-environment`: 软删除环境（移到回收站）
- `get-empty-groups`: 获取空分组
- `delete-empty-group`: 删除空分组

**回收站管理:**
- `get-deleted-environments`: 获取已删除的环境
- `restore-environment`: 从回收站恢复环境
- `permanently-delete-environment`: 永久删除环境
- `cleanup-trash`: 清理回收站

**设置管理:**
- `get-settings`: 获取应用设置
- `save-settings`: 保存应用设置
- `select-folder`: 选择文件夹对话框

## 开发注意事项

### Chrome 进程管理
Chrome 环境通过独立的用户数据目录启动，每个环境都是完全隔离的 Chrome 实例。系统通过 PID 跟踪运行状态。

### 跨平台考虑
当前主要针对 Windows 平台，PowerShell 命令在构建脚本中用于文件操作和环境变量设置。

### 数据存储
- **SQLite 数据库**: 存储环境配置信息，支持软删除机制
- **用户数据目录**: 默认位于 `%APPDATA%/multichrome/environments`，可通过设置自定义
- **应用设置**: 通过 electron-store 管理，支持数据路径配置
- **日志文件**: electron-log 记录应用运行日志

### 错误处理
- **统一错误处理**: 使用 `useErrorHandler` Hook 和 `ErrorBoundary` 组件
- **错误分类**: 定义了多种错误类型（网络、文件系统、验证等）
- **日志记录**: 通过 electron-log 记录详细错误信息
- **用户反馈**: 友好的错误提示和恢复建议

### 新增功能

#### UI/UX 改进
- **Primer React 设计系统**: 迁移到 GitHub 官方设计系统
- **响应式布局**: 支持超宽屏和不同尺寸设备
- **通知系统**: 统一的消息通知管理
- **设置面板**: 可配置数据存储路径

#### 环境管理增强
- **软删除机制**: 环境删除后进入回收站，可恢复
- **标签系统**: 支持为环境添加多个标签
- **分组管理**: 改进的分组显示和管理
- **运行状态**: 实时显示环境运行状态

#### 开发工具
- **错误边界**: React 错误边界保护应用稳定性
- **Context 管理**: 统一的状态管理（环境、设置、通知）
- **TypeScript**: 完整的类型定义和错误处理