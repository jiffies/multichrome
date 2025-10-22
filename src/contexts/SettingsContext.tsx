import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useErrorHandler } from '../hooks/useErrorHandler';

// 设置类型定义
interface AppSettings {
    dataPath: string;
    globalProxy?: {
        enabled: boolean;
        address: string;
    };
}

// 上下文类型定义
interface SettingsContextType {
    settings: AppSettings;
    loading: boolean;
    actions: {
        loadSettings: () => Promise<void>;
        saveSettings: (settings: AppSettings) => Promise<boolean>;
    };
}

// 创建上下文
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Provider 组件
export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<AppSettings>({ dataPath: '' });
    const [loading, setLoading] = useState<boolean>(true);
    const { handleError } = useErrorHandler();

    // 加载应用设置
    const loadSettings = useCallback(async () => {
        if (!window.electronAPI || !window.electronAPI.settings) {
            handleError(new Error('设置API未正确加载'), '加载设置');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const appSettings = await window.electronAPI.settings.getSettings();
            setSettings(appSettings);
        } catch (err) {
            handleError(err, '加载设置');
        } finally {
            setLoading(false);
        }
    }, [handleError]);

    // 保存应用设置
    const saveSettings = useCallback(async (newSettings: AppSettings): Promise<boolean> => {
        if (!window.electronAPI || !window.electronAPI.settings) {
            handleError(new Error('设置API未正确加载'), '保存设置');
            return false;
        }

        try {
            const success = await window.electronAPI.settings.saveSettings(newSettings);
            if (success) {
                setSettings(newSettings);
            }
            return success;
        } catch (err) {
            handleError(err, '保存设置');
            return false;
        }
    }, [handleError]);

    // 初始化时加载设置
    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    const contextValue: SettingsContextType = {
        settings,
        loading,
        actions: {
            loadSettings,
            saveSettings
        }
    };

    return (
        <SettingsContext.Provider value={contextValue}>
            {children}
        </SettingsContext.Provider>
    );
};

// Hook 来使用设置上下文
export const useSettings = (): SettingsContextType => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};