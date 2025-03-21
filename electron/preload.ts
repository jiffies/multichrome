import { contextBridge, ipcRenderer } from 'electron';

// 暴露给渲染进程的安全API
contextBridge.exposeInMainWorld('electronAPI', {
    // Chrome环境管理API
    chromeEnvironments: {
        // 获取所有环境
        getAll: () => ipcRenderer.invoke('get-chrome-environments'),

        // 创建新环境
        create: (name: string, groupName: string, notes: string) =>
            ipcRenderer.invoke('create-chrome-environment', name, groupName, notes),

        // 启动环境
        launch: (id: string) => ipcRenderer.invoke('launch-chrome-environment', id),

        // 关闭环境
        close: (id: string) => ipcRenderer.invoke('close-chrome-environment', id),

        // 删除环境
        delete: (id: string) => ipcRenderer.invoke('delete-chrome-environment', id),

        // 更新环境
        update: (id: string, data: any) => ipcRenderer.invoke('update-chrome-environment', id, data),
    },
}); 