import path from 'path';
import fs from 'fs';
import Store from 'electron-store';
import log from 'electron-log';
import { app } from 'electron';

// 应用设置接口
export interface AppSettings {
    dataPath: string;
    globalProxy?: {
        enabled: boolean;
        address: string;
    };
    startupUrl?: string;
}

// 设置管理器类
export class SettingsManager {
    private store: Store<AppSettings>;
    
    constructor() {
        // 初始化存储
        this.store = new Store<AppSettings>({
            name: 'app-settings',
            schema: {
                dataPath: {
                    type: 'string',
                    default: app.getPath('userData')
                },
                globalProxy: {
                    type: 'object',
                    properties: {
                        enabled: {
                            type: 'boolean',
                            default: false
                        },
                        address: {
                            type: 'string',
                            default: ''
                        }
                    },
                    default: {
                        enabled: false,
                        address: ''
                    }
                },
                startupUrl: {
                    type: 'string',
                    default: ''
                }
            }
        });
        
        log.info('SettingsManager initialized');
    }
    
    // 获取应用设置
    public getSettings(): AppSettings {
        try {
            return {
                dataPath: this.store.get('dataPath'),
                globalProxy: this.store.get('globalProxy'),
                startupUrl: this.store.get('startupUrl')
            };
        } catch (error) {
            log.error('获取设置失败:', error);
            // 返回默认设置
            return {
                dataPath: app.getPath('userData'),
                globalProxy: {
                    enabled: false,
                    address: ''
                },
                startupUrl: ''
            };
        }
    }
    
    // 保存应用设置
    public async saveSettings(settings: AppSettings): Promise<boolean> {
        try {
            // 验证路径是否有效
            if (!settings.dataPath || !this.isValidPath(settings.dataPath)) {
                log.error('无效的路径:', settings.dataPath);
                return false;
            }
            
            // 确保文件夹存在
            if (!fs.existsSync(settings.dataPath)) {
                fs.mkdirSync(settings.dataPath, { recursive: true });
            }
            
            // 检查文件夹是否可写
            try {
                const testFile = path.join(settings.dataPath, '.write-test');
                fs.writeFileSync(testFile, 'test');
                fs.unlinkSync(testFile);
            } catch (error) {
                log.error('路径不可写:', error);
                return false;
            }
            
            // 保存设置
            this.store.set('dataPath', settings.dataPath);

            // 保存全局代理设置
            if (settings.globalProxy !== undefined) {
                this.store.set('globalProxy', settings.globalProxy);
            }

            // 保存启动页设置
            if (settings.startupUrl !== undefined) {
                this.store.set('startupUrl', settings.startupUrl);
            }
            
            // 如果数据路径已更改，需要迁移数据
            const currentDataPath = app.getPath('userData');
            if (settings.dataPath !== currentDataPath) {
                log.info(`数据路径已更改: ${currentDataPath} -> ${settings.dataPath}`);
                // 迁移数据的逻辑会在应用重启后由ChromeManager处理
            }
            
            log.info('设置已保存:', settings);
            return true;
        } catch (error) {
            log.error('保存设置失败:', error);
            return false;
        }
    }
    
    // 检查路径是否有效
    private isValidPath(pathStr: string): boolean {
        try {
            // 检查路径是否绝对路径
            if (!path.isAbsolute(pathStr)) {
                log.error('路径不是绝对路径:', pathStr);
                return false;
            }
            
            // 检查路径是否包含非法字符 - Windows平台的特殊检查
            if (process.platform === 'win32') {
                // Windows盘符规则特殊处理
                const pathParts = pathStr.split(path.sep).filter(Boolean);
                
                // 检查路径组成部分是否有非法字符
                const invalidChars = /[<>"|?*]/;  // 移除了冒号检查，因为盘符需要用到
                
                // 只检查每个路径段中是否有非法字符
                for (const part of pathParts) {
                    if (invalidChars.test(part)) {
                        log.error('路径包含非法字符:', part);
                        return false;
                    }
                }
                
                // 检查第一个部分是否是有效的Windows盘符(例如"C:"或"D:")
                const drivePattern = /^[A-Za-z]:$/;
                if (pathParts.length > 0 && !drivePattern.test(pathParts[0])) {
                    if (!pathStr.startsWith('\\\\')) { // 允许网络路径 (UNC)
                        log.error('Windows路径必须以有效的盘符开头:', pathParts[0]);
                        return false;
                    }
                }
            }
            
            return true;
        } catch (error) {
            log.error('验证路径失败:', error);
            return false;
        }
    }
} 