// Chrome环境接口
export interface ChromeEnvironment {
    id: string;
    name: string;
    groupName: string;
    notes: string;
    walletAddress?: string; // 钱包地址
    dataDir: string;
    tags: string[];
    proxy?: string;
    proxyLabel?: string; // 代理标签(如"菲律宾"、"美国")
    userAgent?: string;
    createdAt: string;
    lastUsed: string;
    deletedAt?: string; // 软删除时间戳
    isRunning: boolean;
    processId?: number;
}

// 预加载API类型定义
export interface ElectronAPI {
    chromeEnvironments: {
        getAll: () => Promise<ChromeEnvironment[]>;
        create: (name: string, groupName: string, notes: string, walletAddress?: string) => Promise<ChromeEnvironment>;
        launch: (id: string) => Promise<boolean>;
        close: (id: string) => Promise<boolean>;
        delete: (id: string) => Promise<boolean>; // 软删除（移到回收站）
        update: (id: string, data: Partial<ChromeEnvironment>) => Promise<ChromeEnvironment>;
        getEmptyGroups: () => Promise<string[]>;
        deleteEmptyGroup: (groupName: string) => Promise<boolean>;
    };
    trash: {
        getDeletedEnvironments: () => Promise<ChromeEnvironment[]>;
        restore: (id: string) => Promise<boolean>;
        permanentlyDelete: (id: string) => Promise<boolean>;
        cleanup: () => Promise<number>;
    };
    settings: {
        getSettings: () => Promise<{dataPath: string}>;
        saveSettings: (settings: {dataPath: string}) => Promise<boolean>;
        selectFolder: () => Promise<{canceled: boolean, filePaths: string[]}>;
    };
    on: (channel: string, callback: (...args: any[]) => void) => void;
    removeListener: (channel: string, callback: (...args: any[]) => void) => void;
}

// 全局Window类型扩展
declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}

// 导出错误类型
export * from './errors'; 