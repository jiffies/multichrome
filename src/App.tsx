import React, { useState } from 'react';
import { ThemeProvider, BaseStyles, Box } from '@primer/react';
import '@primer/primitives/dist/css/functional/themes/light.css';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import EnvironmentList from './components/EnvironmentList';
import CreateEnvironmentModal from './components/CreateEnvironmentModal';
import SettingsModal from './components/SettingsModal';
import TrashModal from './components/TrashModal';
import ResponsiveLayout from './components/ResponsiveLayout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { EnvironmentProvider, useEnvironment } from './contexts/EnvironmentContext';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { NotificationProvider } from './contexts/NotificationContext';

// 主应用内容组件（使用上下文）
const AppContent: React.FC = () => {
    const { state, actions } = useEnvironment();
    const { settings, actions: settingsActions } = useSettings();
    const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
    const [settingsModalOpen, setSettingsModalOpen] = useState<boolean>(false);
    const [trashModalOpen, setTrashModalOpen] = useState<boolean>(false);



    


    // 创建新环境
    const handleCreateEnvironment = async (name: string, groupName: string, notes: string) => {
        await actions.createEnvironment(name, groupName, notes);
        setCreateModalOpen(false);
    };

    // 启动环境
    const handleLaunchEnvironment = async (id: string) => {
        await actions.launchEnvironment(id);
    };

    // 关闭环境
    const handleCloseEnvironment = async (id: string) => {
        await actions.closeEnvironment(id);
    };

    // 删除环境
    const handleDeleteEnvironment = async (id: string) => {
        await actions.deleteEnvironment(id);
    };
    
    // 删除空分组
    const handleDeleteEmptyGroup = async (groupName: string) => {
        await actions.deleteEmptyGroup(groupName);
    };

    // 过滤环境列表
    const filteredEnvironments = state.currentGroup === '全部'
        ? state.environments
        : state.environments.filter(env => env.groupName === state.currentGroup);

    // 获取所有环境分组
    const groups = ['全部', ...new Set(state.environments.map(env => env.groupName).filter(g => g))];
    
    // 确保有分组可用
    const availableGroups = groups.filter(g => g !== '全部');
    const groupsForModal = availableGroups.length > 0 ? availableGroups : ['默认分组'];

    return (
        <>
            <ResponsiveLayout
                header={
                    <Header onCreateEnvironment={() => setCreateModalOpen(true)} />
                }
                sidebar={
                    <Sidebar
                        groups={groups}
                        currentGroup={state.currentGroup}
                        onSelectGroup={actions.setCurrentGroup}
                        onDeleteGroup={handleDeleteEmptyGroup}
                        emptyGroups={state.emptyGroups}
                        onSettingsClick={() => setSettingsModalOpen(true)}
                        onTrashClick={() => setTrashModalOpen(true)}
                    />
                }
                content={
                    <Box p={3} height="100%" overflow="hidden" display="flex" flexDirection="column">
                        <EnvironmentList
                            environments={filteredEnvironments}
                            loading={state.loading}
                            onLaunch={handleLaunchEnvironment}
                            onClose={handleCloseEnvironment}
                            onDelete={handleDeleteEnvironment}
                            onRefresh={actions.refreshEnvironments}
                        />
                    </Box>
                }
            />

            <CreateEnvironmentModal
                open={createModalOpen}
                onCancel={() => setCreateModalOpen(false)}
                onOk={handleCreateEnvironment}
                groups={groupsForModal}
            />

            <SettingsModal
                open={settingsModalOpen}
                onCancel={() => setSettingsModalOpen(false)}
                onSave={settingsActions.saveSettings}
                currentSettings={settings}
            />

            <TrashModal
                open={trashModalOpen}
                onCancel={() => setTrashModalOpen(false)}
                onEnvironmentRestored={actions.refreshEnvironments}
            />
        </>
    );
};

// 主App组件（提供上下文）
const App: React.FC = () => {
    return (
        <ErrorBoundary>
            <ThemeProvider>
                <BaseStyles sx={{ height: '100%', width: '100%', overflow: 'hidden' }}>
                    <NotificationProvider>
                        <EnvironmentProvider>
                            <SettingsProvider>
                                <AppContent />
                            </SettingsProvider>
                        </EnvironmentProvider>
                    </NotificationProvider>
                </BaseStyles>
            </ThemeProvider>
        </ErrorBoundary>
    );
};

export default App; 