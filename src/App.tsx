import React, { useState, useEffect } from 'react';
import { ConfigProvider, App as AntApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import EnvironmentList from './components/EnvironmentList';
import CreateEnvironmentModal from './components/CreateEnvironmentModal';
import { ChromeEnvironment } from './types';

const App: React.FC = () => {
    const [environments, setEnvironments] = useState<ChromeEnvironment[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
    const [currentGroup, setCurrentGroup] = useState<string>('全部');

    // 加载环境列表
    const loadEnvironments = async () => {
        try {
            setLoading(true);
            const envs = await window.electronAPI.chromeEnvironments.getAll();
            setEnvironments(envs);
            setError(null);
        } catch (err) {
            setError('加载Chrome环境失败');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // 组件挂载时加载环境
    useEffect(() => {
        loadEnvironments();

        // 定期刷新环境列表(每5秒)
        const interval = setInterval(loadEnvironments, 5000);
        return () => clearInterval(interval);
    }, []);

    // 创建新环境
    const handleCreateEnvironment = async (name: string, groupName: string, notes: string) => {
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
        try {
            await window.electronAPI.chromeEnvironments.launch(id);
            loadEnvironments();
        } catch (err) {
            console.error('启动环境失败:', err);
        }
    };

    // 关闭环境
    const handleCloseEnvironment = async (id: string) => {
        try {
            await window.electronAPI.chromeEnvironments.close(id);
            loadEnvironments();
        } catch (err) {
            console.error('关闭环境失败:', err);
        }
    };

    // 删除环境
    const handleDeleteEnvironment = async (id: string) => {
        try {
            await window.electronAPI.chromeEnvironments.delete(id);
            loadEnvironments();
        } catch (err) {
            console.error('删除环境失败:', err);
        }
    };

    // 过滤环境列表
    const filteredEnvironments = currentGroup === '全部'
        ? environments
        : environments.filter(env => env.groupName === currentGroup);

    // 获取所有环境分组
    const groups = ['全部', ...new Set(environments.map(env => env.groupName))];

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
                        groups={groups.filter(g => g !== '全部')}
                    />
                </div>
            </AntApp>
        </ConfigProvider>
    );
};

export default App; 