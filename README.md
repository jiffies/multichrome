# MultiChrome - Chrome多环境管理工具

MultiChrome是一个用于管理多个Chrome浏览器环境的桌面应用程序，支持Windows 10和Windows 11平台。该工具允许用户创建、管理和删除独立的Chrome环境，每个环境都有自己的数据目录，确保环境之间完全隔离。

## 主要功能

- 创建新的Chrome环境（独立的用户数据目录）
- 管理现有Chrome环境（启动、关闭、重命名等）
- 删除不需要的Chrome环境
- 为每个环境设置标签、分组和备注
- 显示环境详细信息（代理设置、数据存储位置等）

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
│   ├── ipc.ts                # IPC通信处理
│   └── utils/                # 工具函数
├── src/                      # 渲染进程代码（React应用）
│   ├── components/           # UI组件
│   ├── hooks/                # React钩子
│   ├── pages/                # 页面组件
│   ├── store/                # 状态管理
│   ├── types/                # TypeScript类型定义
│   ├── utils/                # 工具函数
│   ├── App.tsx               # 应用根组件
│   └── index.tsx             # 渲染进程入口
├── public/                   # 公共静态文件
├── .eslintrc                 # ESLint配置
├── .prettierrc               # Prettier配置
├── package.json              # 项目依赖和脚本
├── tsconfig.json             # TypeScript配置
└── README.md                 # 项目文档
```

## 工作原理

### Chrome环境管理

1. **环境创建**：
   - 为每个环境创建唯一标识符
   - 在指定位置创建独立的数据目录
   - 保存环境元数据到SQLite数据库

2. **启动环境**：
   - 使用Chrome命令行参数`--user-data-dir`指向特定环境的数据目录
   - 可选添加其他启动参数（代理设置、扩展等）

3. **数据隔离**：
   - 每个环境使用独立的数据目录，包含所有配置、历史记录、Cookie等
   - 环境之间完全隔离，不共享任何数据

### 数据存储

- 使用SQLite数据库存储环境配置和元数据
- 数据结构包括：
  - 环境ID和创建日期
  - 环境名称、分组和标签
  - 数据目录路径
  - 代理设置
  - 启动参数
  - 最后使用时间

## 开发与构建

### 开发环境设置

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 构建应用程序

```bash
# 构建生产版本
npm run build

# 打包为Windows安装程序
npm run package:win
```

## 安全考虑

- 使用成熟的开源库和框架
- 定期更新依赖以修复安全漏洞
- 本地存储敏感数据时使用加密
- 遵循最小权限原则

## 系统要求

- Windows 10或Windows 11
- 已安装Chrome浏览器
- 至少4GB RAM
- 500MB可用磁盘空间

## 许可证

MIT 