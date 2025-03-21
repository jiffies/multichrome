import React, { useState, useEffect } from 'react';
import { ConfigProvider, App as AntApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import EnvironmentList from './components/EnvironmentList';
import CreateEnvironmentModal from './components/CreateEnvironmentModal';
import SettingsModal from './components/SettingsModal';
import { ChromeEnvironment } from './types';

const App: React.FC = () => {
    const [environments, setEnvironments] = useState<ChromeEnvironment[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
    const [currentGroup, setCurrentGroup] = useState<string>('全部');
    const [emptyGroups, setEmptyGroups] = useState<string[]>([]);
    const [settingsModalOpen, setSettingsModalOpen] = useState<boolean>(false);
    const [appSettings, setAppSettings] = useState<{dataPath: string}>({dataPath: ''});

    // 加载应用设置
    const loadSettings = async () => {
        if (!window.electronAPI || !window.electronAPI.settings) {
            console.error('Electron API未正确加载');
            return;
        }
        
        try {
            const settings = await window.electronAPI.settings.getSettings();
            setAppSettings(settings);
        } catch (err) {
            console.error('加载设置失败:', err);
        }
    };

    // 保存应用设置
    const saveSettings = async (settings: {dataPath: string}): Promise<boolean> => {
        if (!window.electronAPI || !window.electronAPI.settings) {
            console.error('Electron API未正确加载');
            return false;
        }
        
        try {
            const success = await window.electronAPI.settings.saveSettings(settings);
            if (success) {
                setAppSettings(settings);
            }
            return success;
        } catch (err) {
            console.error('保存设置失败:', err);
            return false;
        }
    };

    // 加载环境列表
    const loadEnvironments = async () => {
        if (!window.electronAPI || !window.electronAPI.chromeEnvironments) {
            console.error('Electron API未正确加载');
            setError('Electron API未正确加载，请重启应用');
            setLoading(false);
            return;
        }
        
        try {
            setLoading(true);
            const envs = await window.electronAPI.chromeEnvironments.getAll();
            setEnvironments(envs);
            setError(null);
            
            // 同时加载空分组
            loadEmptyGroups();
        } catch (err) {
            setError('加载Chrome环境失败');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    
    // 加载空分组
    const loadEmptyGroups = async () => {
        if (!window.electronAPI || !window.electronAPI.chromeEnvironments) {
            console.error('Electron API未正确加载');
            return;
        }
        
        try {
            const emptyGroupsList = await window.electronAPI.chromeEnvironments.getEmptyGroups();
            setEmptyGroups(emptyGroupsList);
        } catch (err) {
            console.error('加载空分组失败:', err);
        }
    };

    // 组件挂载时加载环境
    useEffect(() => {
        // 确保electronAPI存在后再加载环境
        if (window.electronAPI && window.electronAPI.chromeEnvironments) {
            loadEnvironments();
            loadSettings();

            // 定期刷新环境列表(每5秒)
            const interval = setInterval(loadEnvironments, 5000);
            return () => clearInterval(interval);
        } else {
            console.error('Electron API未正确加载');
            setError('Electron API未正确加载，请重启应用');
            setLoading(false);
        }
    }, []);

    // 创建新环境
    const handleCreateEnvironment = async (name: string, groupName: string, notes: string) => {
        if (!window.electronAPI || !window.electronAPI.chromeEnvironments) {
            console.error('Electron API未正确加载');
            return;
        }
        
        try {
            await window.electronAPI.chromeEnvironments.create(name, groupName, notes);
            loadEnvironments();
            setCreateModalOpen(false);
        } catch (err) {
            console.error('创建环境失败:', err);
        }
    };

    // 启动环境
    const handleLaunchEnvironment = async (id: string) => {
        if (!window.electronAPI || !window.electronAPI.chromeEnvironments) {
            console.error('Electron API未正确加载');
            return;
        }
        
        try {
            await window.electronAPI.chromeEnvironments.launch(id);
            loadEnvironments();
        } catch (err) {
            console.error('启动环境失败:', err);
        }
    };

    // 关闭环境
    const handleCloseEnvironment = async (id: string) => {
        if (!window.electronAPI || !window.electronAPI.chromeEnvironments) {
            console.error('Electron API未正确加载');
            return;
        }
        
        try {
            await window.electronAPI.chromeEnvironments.close(id);
            loadEnvironments();
        } catch (err) {
            console.error('关闭环境失败:', err);
        }
    };

    // 删除环境
    const handleDeleteEnvironment = async (id: string) => {
        if (!window.electronAPI || !window.electronAPI.chromeEnvironments) {
            console.error('Electron API未正确加载');
            return;
        }
        
        try {
            await window.electronAPI.chromeEnvironments.delete(id);
            loadEnvironments();
        } catch (err) {
            console.error('删除环境失败:', err);
        }
    };
    
    // 删除空分组
    const handleDeleteEmptyGroup = async (groupName: string) => {
        if (!window.electronAPI || !window.electronAPI.chromeEnvironments) {
            console.error('Electron API未正确加载');
            return;
        }
        
        try {
            const success = await window.electronAPI.chromeEnvironments.deleteEmptyGroup(groupName);
            if (success) {
                // 如果当前选中的是被删除的分组，则切换到"全部"
                if (currentGroup === groupName) {
                    setCurrentGroup('全部');
                }
                // 重新加载环境和分组
                loadEnvironments();
            }
        } catch (err) {
            console.error('删除分组失败:', err);
        }
    };

    // 过滤环境列表
    const filteredEnvironments = currentGroup === '全部'
        ? environments
        : environments.filter(env => env.groupName === currentGroup);

    // 获取所有环境分组
    const groups = ['全部', ...new Set(environments.map(env => env.groupName).filter(g => g))];
    
    // 确保有分组可用
    const availableGroups = groups.filter(g => g !== '全部');
    const groupsForModal = availableGroups.length > 0 ? availableGroups : ['默认分组'];

    return (
        <ConfigProvider locale={zhCN}>
            <AntApp>
                <div className="flex flex-col h-full">
                    <Header
                        onCreateEnvironment={() => setCreateModalOpen(true)}
                    />

                    <div className="flex flex-1 overflow-hidden">
                        <Sidebar
                            groups={groups}
                            currentGroup={currentGroup}
                            onSelectGroup={setCurrentGroup}
                            onDeleteGroup={handleDeleteEmptyGroup}
                            emptyGroups={emptyGroups}
                            onSettingsClick={() => setSettingsModalOpen(true)}
                        />

                        <main className="flex-1 overflow-auto p-4">
                            <EnvironmentList
                                environments={filteredEnvironments}
                                loading={loading}
                                error={error}
                                onLaunch={handleLaunchEnvironment}
                                onClose={handleCloseEnvironment}
                                onDelete={handleDeleteEnvironment}
                                onRefresh={loadEnvironments}
                            />
                        </main>
                    </div>

                    <CreateEnvironmentModal
                        open={createModalOpen}
                        onCancel={() => setCreateModalOpen(false)}
                        onOk={handleCreateEnvironment}
                        groups={groupsForModal}
                    />

                    <SettingsModal
                        open={settingsModalOpen}
                        onCancel={() => setSettingsModalOpen(false)}
                        onSave={saveSettings}
                        currentSettings={appSettings}
                    />
                </div>
            </AntApp>
        </ConfigProvider>
    );
};

export default App; 