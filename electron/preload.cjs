const { contextBridge, ipcRenderer } = require("electron");

try {
    // 暴露给渲染进程的安全API
    contextBridge.exposeInMainWorld("electronAPI", {
        // Chrome环境管理API
        chromeEnvironments: {
            // 获取所有环境
            getAll: () => ipcRenderer.invoke("get-chrome-environments"),

            // 创建新环境
            create: (name, groupName, notes) =>
                ipcRenderer.invoke(
                    "create-chrome-environment",
                    name,
                    groupName,
                    notes
                ),

            // 启动环境
            launch: (id) => ipcRenderer.invoke("launch-chrome-environment", id),

            // 关闭环境
            close: (id) => ipcRenderer.invoke("close-chrome-environment", id),

            // 软删除环境（移到回收站）
            delete: (id) => ipcRenderer.invoke("delete-chrome-environment", id),

            // 更新环境
            update: (id, data) =>
                ipcRenderer.invoke("update-chrome-environment", id, data),

            // 获取空分组
            getEmptyGroups: () => ipcRenderer.invoke("get-empty-groups"),

            // 删除空分组
            deleteEmptyGroup: (groupName) =>
                ipcRenderer.invoke("delete-empty-group", groupName),
        },
        
        // 回收站管理API
        trash: {
            // 获取回收站中的环境
            getDeletedEnvironments: () => ipcRenderer.invoke("get-deleted-environments"),
            
            // 从回收站恢复环境
            restore: (id) => ipcRenderer.invoke("restore-chrome-environment", id),
            
            // 永久删除环境
            permanentlyDelete: (id) => ipcRenderer.invoke("permanently-delete-environment", id),
            
            // 清空回收站
            cleanup: () => ipcRenderer.invoke("cleanup-trash"),
        },
        // 设置API
        settings: {
            // 获取应用设置
            getSettings: () => ipcRenderer.invoke("get-settings"),

            // 保存应用设置
            saveSettings: (settings) =>
                ipcRenderer.invoke("save-settings", settings),

            // 选择文件夹
            selectFolder: () => ipcRenderer.invoke("select-folder"),
        },

        // 事件监听API
        on: (channel, callback) => {
            const validChannels = ['chrome-status-changed'];
            if (validChannels.includes(channel)) {
                ipcRenderer.on(channel, callback);
            }
        },

        removeListener: (channel, callback) => {
            const validChannels = ['chrome-status-changed'];
            if (validChannels.includes(channel)) {
                ipcRenderer.removeListener(channel, callback);
            }
        },
    });

    console.log("预加载脚本成功执行，electronAPI已注入");
} catch (error) {
    console.error("预加载脚本执行失败:", error);
}
