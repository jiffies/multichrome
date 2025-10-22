# MultiChrome - Chrome多环境管理工具

MultiChrome是一个用于管理多个Chrome浏览器环境的桌面应用程序，支持Windows 10和Windows 11平台。该工具允许用户创建、管理和删除独立的Chrome环境，每个环境都有自己的数据目录，确保环境之间完全隔离。

## 主要功能

- 创建新的Chrome环境（独立的用户数据目录）
- 管理现有Chrome环境（启动、关闭、重命名等）
- 删除不需要的Chrome环境
- 为每个环境设置标签、分组和备注
- 显示环境详细信息（代理设置、数据存储位置等）

## 安装指南

### 开发环境安装

1. **克隆仓库**
   ```bash
   git clone https://github.com/yourusername/multichrome.git
   cd multichrome
   ```

2. **安装依赖**
   ```bash
   npm install
   ```
   
   安装过程中可能会遇到native模块编译问题，特别是`better-sqlite3`模块。如果出现错误，请确保安装了以下前置条件：
   - Node.js 16+ 和 npm 8+
   - Windows环境下需要安装Visual Studio构建工具
   - Python 3.x

3. **开发环境配置**
   - 确保已安装Chrome浏览器
   - 如需修改默认配置，编辑`electron/chromeManager.ts`文件中的相关设置

### 生产环境安装

1. **下载最新版安装包**
   - 从[Releases](https://github.com/yourusername/multichrome/releases)页面下载最新版Windows安装包

2. **运行安装程序**
   - 运行下载的`.exe`安装文件
   - 按照向导指引完成安装
   - 安装程序会自动创建桌面快捷方式

## 使用指南

### 创建新环境

1. 点击界面顶部的"创建新环境"按钮
2. 输入环境名称（如"工作"、"个人"等）
3. 选择或创建分组（可选）
4. 添加环境备注（可选）
5. 点击"创建"按钮

### 管理环境

1. **启动环境**：在环境列表中点击"启动"按钮，将打开一个新的Chrome窗口
2. **关闭环境**：在环境列表中点击"关闭"按钮
3. **查看环境详情**：点击环境卡片查看详细信息
4. **编辑环境**：在环境详情中修改相关信息

### 删除环境

1. 在环境列表中点击"删除"按钮
2. 确认删除操作
3. 系统将删除环境数据及关联文件

### 环境隔离说明

每个Chrome环境完全独立，包括：
- 独立的Cookie和会话数据
- 独立的扩展程序
- 独立的历史记录和书签
- 独立的设置和偏好

## 编译与构建指南

### 开发模式

开发模式提供热重载功能,代码修改后自动刷新:

```bash
# 启动开发服务器(推荐)
npm run dev
```

此命令会同时启动:
- **Vite 开发服务器**: 提供前端热重载
- **Electron 应用**: 自动打开应用窗口

如需单独启动某个部分:

```bash
# 仅启动前端开发服务器
npm run dev:vite

# 仅启动 Electron(需要先构建)
npm run dev:electron
```

### 生产环境启动

#### 方式 1: 直接运行构建后的代码(快速测试)

适用于测试生产版本性能和行为:

```bash
# 1. 构建应用程序
npm run build

# 2. 启动生产版本
npm start
```

**特点:**
- 使用优化后的生产代码
- 无热重载,性能更好
- 适合验证生产环境表现

#### 方式 2: 打包成安装程序(正式发布)

适用于最终用户分发:

```bash
# 1. 构建应用程序
npm run build

# 2. 打包为 Windows 安装程序
npm run package:win
```

**生成文件:**
- 安装包位置: `release` 目录
- 格式: NSIS 安装程序 (`.exe`)
- 支持用户选择安装目录
- 自动创建桌面快捷方式

### 开发模式 vs 生产模式

| 特性 | 开发模式 (`npm run dev`) | 生产模式 (`npm start`) |
|------|------------------------|----------------------|
| 前端热重载 | ✅ Vite 热更新 | ❌ 需要重新构建 |
| 代码压缩 | ❌ 原始代码 | ✅ 压缩优化 |
| DevTools | 自动打开 | 默认关闭 |
| 启动速度 | 较慢 | 更快 |
| 性能 | 未优化 | 优化后更快 |
| 适用场景 | 开发调试 | 测试/发布 |

### 推荐工作流程

**日常开发:**
```bash
npm run dev
```

**测试生产版本:**
```bash
npm run build && npm start
```

**代码检查:**
```bash
# 运行 ESLint 检查
npm run lint

# 自动修复可修复的问题
npm run lint:fix
```

**正式发布:**
```bash
npm run build
npm run package:win
# 在 release 目录找到安装程序进行分发
```

### CI/CD流程

项目支持通过GitHub Actions自动构建：
1. 向主分支推送代码会触发自动构建
2. 标记新版本会自动生成安装包并发布到Releases

## 疑难解答

### 常见问题

1. **无法找到Chrome浏览器**
   - 检查Chrome是否已安装
   - 在应用程序设置中手动指定Chrome可执行文件路径

2. **环境启动失败**
   - 检查Chrome进程是否被其他程序阻止启动
   - 检查数据目录权限

3. **数据目录问题**
   - 默认数据存储在`%APPDATA%/multichrome/environments`目录
   - 确保该目录有足够的磁盘空间和写入权限

### 日志文件

- 应用日志位于：`%APPDATA%/multichrome/logs`
- 日志文件包含详细的错误信息，可用于故障排除

## 技术架构

### 前端技术栈

- Electron：跨平台桌面应用程序框架
- React：用户界面库
- TypeScript：类型安全的JavaScript超集
- Tailwind CSS：实用优先的CSS框架
- Ant Design：企业级UI组件库

### 后端技术栈

- Node.js：运行时环境
- Electron主进程：系统交互和Chrome进程管理
- SQLite：本地数据存储
- node-ipc：进程间通信

### 项目结构

```
multichrome/
├── .github/                  # GitHub相关配置
├── assets/                   # 静态资源（图标、图片等）
├── build/                    # 构建配置和脚本
├── dist/                     # 构建输出目录
├── electron/                 # Electron主进程代码
│   ├── main.ts               # 主进程入口
│   ├── chromeManager.ts      # Chrome环境管理类
│   ├── preload.ts            # 预加载脚本
│   └── tsconfig.json         # TypeScript配置
├── src/                      # 渲染进程代码（React应用）
│   ├── components/           # UI组件
│   ├── types/                # TypeScript类型定义
│   ├── App.tsx               # 应用根组件
│   └── index.tsx             # 渲染进程入口
├── .eslintrc                 # ESLint配置
├── package.json              # 项目依赖和脚本
├── tsconfig.json             # TypeScript配置
└── README.md                 # 项目文档
```

## 系统要求

- Windows 10或Windows 11
- 已安装Chrome浏览器
- 至少4GB RAM
- 500MB可用磁盘空间

## 贡献指南

欢迎贡献代码、报告问题或提出新功能建议。贡献前请先查看现有问题或创建新问题。

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 许可证

MIT License

## 联系方式

如有任何问题或建议，请通过GitHub Issues页面联系我们。 