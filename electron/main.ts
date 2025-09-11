import { app, BrowserWindow, ipcMain, shell, dialog } from 'electron';
import path from 'path';
import log from 'electron-log';
import { ChromeManager, ChromeEnvironment } from './chromeManager.js';
import { SettingsManager } from './settingsManager.js';
import { fileURLToPath } from 'url';

// ESM兼容性：获取当前文件的目录名
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 设置日志
log.transports.file.level = 'info';
log.info('Application starting...');

// 输出环境变量信息
log.info('Node environment:', process.env.NODE_ENV || 'production');
const isDev = process.env.NODE_ENV === 'development';

log.info('Development mode:', isDev);

// 全局窗口引用
let mainWindow: BrowserWindow | null = null;

// 输入验证函数
function validateString(value: unknown, name: string): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw new Error(`${name} 必须是非空字符串`);
    }
    return value.trim();
}

function validateId(value: unknown): string {
    const id = validateString(value, 'ID');
    // 简单的UUID格式验证
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        throw new Error('无效的ID格式');
    }
    return id;
}

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
            preload: path.join(__dirname, 'preload.cjs'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true, // 启用沙盒模式提升安全性
            webSecurity: true,
            allowRunningInsecureContent: false,
            experimentalFeatures: false,
        },
        icon: path.join(__dirname, '../../assets/icon.png'),
    });

    // 设置安全策略
    mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'Content-Security-Policy': [
                    isDev 
                        ? "default-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:5173 ws://localhost:5173; script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:5173; style-src 'self' 'unsafe-inline' http://localhost:5173;"
                        : "default-src 'self' 'unsafe-inline'; script-src 'self'; style-src 'self' 'unsafe-inline';"
                ]
            }
        });
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
    ipcMain.handle('create-chrome-environment', async (_, name: unknown, groupName: unknown, notes: unknown = '') => {
        try {
            const validName = validateString(name, '环境名称');
            const validGroupName = validateString(groupName, '分组名称');
            const validNotes = typeof notes === 'string' ? notes : '';
            
            return await chromeManager.createEnvironment(validName, validGroupName, validNotes);
        } catch (error) {
            log.error('创建Chrome环境失败:', error);
            throw error;
        }
    });

    // 启动Chrome环境
    ipcMain.handle('launch-chrome-environment', async (_, id: unknown) => {
        try {
            const validId = validateId(id);
            log.info(`收到启动Chrome环境请求，环境ID: ${validId}`);
            return await chromeManager.launchEnvironment(validId);
        } catch (error) {
            log.error('启动Chrome环境失败:', error);
            throw error;
        }
    });

    // 关闭Chrome环境
    ipcMain.handle('close-chrome-environment', async (_, id: unknown) => {
        try {
            const validId = validateId(id);
            return await chromeManager.closeEnvironment(validId);
        } catch (error) {
            log.error('关闭Chrome环境失败:', error);
            throw error;
        }
    });

    // 软删除Chrome环境（移到回收站）
    ipcMain.handle('delete-chrome-environment', async (_, id: unknown) => {
        try {
            const validId = validateId(id);
            return await chromeManager.deleteEnvironment(validId);
        } catch (error) {
            log.error('删除Chrome环境失败:', error);
            throw error;
        }
    });
    
    // 获取回收站中的环境
    ipcMain.handle('get-deleted-environments', async () => {
        try {
            return await chromeManager.getDeletedEnvironments();
        } catch (error) {
            log.error('获取回收站环境失败:', error);
            throw error;
        }
    });
    
    // 从回收站恢复环境
    ipcMain.handle('restore-chrome-environment', async (_, id: unknown) => {
        try {
            const validId = validateId(id);
            return await chromeManager.restoreEnvironment(validId);
        } catch (error) {
            log.error('恢复Chrome环境失败:', error);
            throw error;
        }
    });
    
    // 永久删除环境
    ipcMain.handle('permanently-delete-environment', async (_, id: unknown) => {
        try {
            const validId = validateId(id);
            return await chromeManager.permanentlyDeleteEnvironment(validId);
        } catch (error) {
            log.error('永久删除环境失败:', error);
            throw error;
        }
    });
    
    // 清空回收站
    ipcMain.handle('cleanup-trash', async () => {
        try {
            return await chromeManager.cleanupTrash();
        } catch (error) {
            log.error('清空回收站失败:', error);
            throw error;
        }
    });

    // 更新Chrome环境信息
    ipcMain.handle('update-chrome-environment', async (_, id: unknown, data: unknown) => {
        try {
            const validId = validateId(id);
            
            // 验证更新数据
            if (!data || typeof data !== 'object') {
                throw new Error('更新数据格式无效');
            }
            
            const updateData = data as Record<string, unknown>;
            const validData: Partial<ChromeEnvironment> = {};
            
            if ('name' in updateData) validData.name = validateString(updateData.name, '环境名称');
            if ('groupName' in updateData) validData.groupName = validateString(updateData.groupName, '分组名称');
            if ('notes' in updateData) validData.notes = typeof updateData.notes === 'string' ? updateData.notes : '';
            if ('proxy' in updateData) validData.proxy = typeof updateData.proxy === 'string' ? updateData.proxy : undefined;
            if ('userAgent' in updateData) validData.userAgent = typeof updateData.userAgent === 'string' ? updateData.userAgent : undefined;
            
            return await chromeManager.updateEnvironment(validId, validData);
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
    ipcMain.handle('delete-empty-group', async (_, groupName: unknown) => {
        try {
            const validGroupName = validateString(groupName, '分组名称');
            return await chromeManager.deleteEmptyGroup(validGroupName);
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
    ipcMain.handle('save-settings', async (_, settings: unknown) => {
        try {
            if (!settings || typeof settings !== 'object') {
                throw new Error('设置数据格式无效');
            }
            
            const settingsData = settings as Record<string, unknown>;
            if (!('dataPath' in settingsData) || typeof settingsData.dataPath !== 'string') {
                throw new Error('dataPath 必须是字符串');
            }
            
            const validSettings = { dataPath: settingsData.dataPath };
            return await settingsManager.saveSettings(validSettings);
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