import { app, BrowserWindow, ipcMain, shell, dialog } from 'electron';
import path from 'path';
import log from 'electron-log';
import { ChromeManager } from './chromeManager.js';
import { SettingsManager } from './settingsManager.js';
import { fileURLToPath } from 'url';

// ESM兼容性：获取当前文件的目录名
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 设置日志
log.transports.file.level = 'info';
log.info('应用启动');

// 输出环境变量信息
log.info('Node环境:', process.env.NODE_ENV);
const isDev = process.env.NODE_ENV === 'development';

log.info('是否开发模式:', isDev);

// 全局窗口引用
let mainWindow: BrowserWindow | null = null;

// 初始化Chrome管理器
const chromeManager = new ChromeManager();

// 初始化设置管理器
const settingsManager = new SettingsManager();

function createWindow() {
    // 创建主窗口
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: isDev 
                ? path.join(__dirname, 'preload.cjs') // 开发模式下
                : path.join(__dirname, 'preload.cjs'),  // 生产模式下
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false, // 关闭沙盒模式以支持ESM
            additionalArguments: ['--enable-features=ElectronPreloadModules'], // 启用ESM模块支持
        },
        icon: path.join(__dirname, '../../assets/icon.png'),
    });

    // 加载前端页面
    if (isDev) {
        // 开发模式下，加载开发服务器URL
        mainWindow.loadURL('http://localhost:5173');
        // 打开开发工具
        mainWindow.webContents.openDevTools();
    } else {
        // 生产模式下，加载打包后的HTML文件
        mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    // 处理外部链接
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    // 窗口关闭时清空引用
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// 应用准备就绪时创建窗口
app.whenReady().then(() => {
    createWindow();

    // 设置IPC处理程序
    setupIpcHandlers();

    // macOS下点击dock图标时重新创建窗口
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// 所有窗口关闭时退出应用（Windows & Linux）
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// 设置IPC处理程序
function setupIpcHandlers() {
    // 获取所有Chrome环境
    ipcMain.handle('get-chrome-environments', async () => {
        try {
            return await chromeManager.getAllEnvironments();
        } catch (error) {
            log.error('获取Chrome环境失败:', error);
            throw error;
        }
    });

    // 创建新的Chrome环境
    ipcMain.handle('create-chrome-environment', async (_, name: string, groupName: string, notes: string = '') => {
        try {
            return await chromeManager.createEnvironment(name, groupName, notes);
        } catch (error) {
            log.error('创建Chrome环境失败:', error);
            throw error;
        }
    });

    // 启动Chrome环境
    ipcMain.handle('launch-chrome-environment', async (_, id: string) => {
        try {
            console.log(`收到启动Chrome环境请求，环境ID: ${id}`);
            return await chromeManager.launchEnvironment(id);
        } catch (error) {
            log.error('启动Chrome环境失败:', error);
            throw error;
        }
    });

    // 关闭Chrome环境
    ipcMain.handle('close-chrome-environment', async (_, id: string) => {
        try {
            return await chromeManager.closeEnvironment(id);
        } catch (error) {
            log.error('关闭Chrome环境失败:', error);
            throw error;
        }
    });

    // 删除Chrome环境
    ipcMain.handle('delete-chrome-environment', async (_, id: string) => {
        try {
            return await chromeManager.deleteEnvironment(id);
        } catch (error) {
            log.error('删除Chrome环境失败:', error);
            throw error;
        }
    });

    // 更新Chrome环境信息
    ipcMain.handle('update-chrome-environment', async (_, id: string, data: any) => {
        try {
            return await chromeManager.updateEnvironment(id, data);
        } catch (error) {
            log.error('更新Chrome环境失败:', error);
            throw error;
        }
    });
    
    // 获取空分组
    ipcMain.handle('get-empty-groups', async () => {
        try {
            return await chromeManager.getEmptyGroups();
        } catch (error) {
            log.error('获取空分组失败:', error);
            throw error;
        }
    });
    
    // 删除空分组
    ipcMain.handle('delete-empty-group', async (_, groupName: string) => {
        try {
            return await chromeManager.deleteEmptyGroup(groupName);
        } catch (error) {
            log.error('删除空分组失败:', error);
            throw error;
        }
    });

    // 获取应用设置
    ipcMain.handle('get-settings', async () => {
        try {
            return settingsManager.getSettings();
        } catch (error) {
            log.error('获取应用设置失败:', error);
            throw error;
        }
    });
    
    // 保存应用设置
    ipcMain.handle('save-settings', async (_, settings: {dataPath: string}) => {
        try {
            return await settingsManager.saveSettings(settings);
        } catch (error) {
            log.error('保存应用设置失败:', error);
            throw error;
        }
    });
    
    // 选择文件夹
    ipcMain.handle('select-folder', async () => {
        try {
            if (!mainWindow) {
                throw new Error('主窗口未初始化');
            }
            
            const result = await dialog.showOpenDialog(mainWindow, {
                properties: ['openDirectory', 'createDirectory'],
                title: '选择数据存储位置'
            });
            
            return result;
        } catch (error) {
            log.error('选择文件夹失败:', error);
            throw error;
        }
    });
}

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
    log.error('未捕获的异常:', error);
}); 