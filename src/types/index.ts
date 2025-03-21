// Chrome环境接口
export interface ChromeEnvironment {
    id: string;
    name: string;
    groupName: string;
    notes: string;
    dataDir: string;
    tags: string[];
    proxy?: string;
    userAgent?: string;
    createdAt: string;
    lastUsed: string;
    isRunning: boolean;
    processId?: number;
}

// 预加载API类型定义
export interface ElectronAPI {
    chromeEnvironments: {
        getAll: () => Promise<ChromeEnvironment[]>;
        create: (name: string, groupName: string, notes: string) => Promise<ChromeEnvironment>;
        launch: (id: string) => Promise<boolean>;
        close: (id: string) => Promise<boolean>;
        delete: (id: string) => Promise<boolean>;
        update: (id: string, data: Partial<ChromeEnvironment>) => Promise<ChromeEnvironment>;
    };
}

// 全局Window类型扩展
declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
} 