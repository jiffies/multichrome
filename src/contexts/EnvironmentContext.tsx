import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { ChromeEnvironment } from '../types';
import { useErrorHandler } from '../hooks/useErrorHandler';

// 状态类型定义
interface EnvironmentState {
    environments: ChromeEnvironment[];
    loading: boolean;
    currentGroup: string;
    emptyGroups: string[];
}

// 动作类型定义
type EnvironmentAction =
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ENVIRONMENTS'; payload: ChromeEnvironment[] }
    | { type: 'SET_CURRENT_GROUP'; payload: string }
    | { type: 'SET_EMPTY_GROUPS'; payload: string[] }
    | { type: 'UPDATE_ENVIRONMENT'; payload: ChromeEnvironment }
    | { type: 'REMOVE_ENVIRONMENT'; payload: string }
    | { type: 'ADD_ENVIRONMENT'; payload: ChromeEnvironment };

// 初始状态
const initialState: EnvironmentState = {
    environments: [],
    loading: true,
    currentGroup: '全部',
    emptyGroups: []
};

// Reducer
function environmentReducer(state: EnvironmentState, action: EnvironmentAction): EnvironmentState {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        case 'SET_ENVIRONMENTS':
            return { ...state, environments: action.payload };
        case 'SET_CURRENT_GROUP':
            return { ...state, currentGroup: action.payload };
        case 'SET_EMPTY_GROUPS':
            return { ...state, emptyGroups: action.payload };
        case 'UPDATE_ENVIRONMENT':
            return {
                ...state,
                environments: state.environments.map(env =>
                    env.id === action.payload.id ? action.payload : env
                )
            };
        case 'REMOVE_ENVIRONMENT':
            return {
                ...state,
                environments: state.environments.filter(env => env.id !== action.payload)
            };
        case 'ADD_ENVIRONMENT':
            return {
                ...state,
                environments: [action.payload, ...state.environments]
            };
        default:
            return state;
    }
}

// 上下文类型定义
interface EnvironmentContextType {
    state: EnvironmentState;
    actions: {
        loadEnvironments: () => Promise<void>;
        loadEmptyGroups: () => Promise<void>;
        createEnvironment: (name: string, groupName: string, notes: string) => Promise<void>;
        launchEnvironment: (id: string) => Promise<void>;
        closeEnvironment: (id: string) => Promise<void>;
        deleteEnvironment: (id: string) => Promise<void>;
        deleteEmptyGroup: (groupName: string) => Promise<void>;
        setCurrentGroup: (group: string) => void;
        refreshEnvironments: () => Promise<void>;
    };
}

// 创建上下文
const EnvironmentContext = createContext<EnvironmentContextType | undefined>(undefined);

// Provider 组件
export const EnvironmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(environmentReducer, initialState);
    const { handleError } = useErrorHandler();

    // 加载环境列表
    const loadEnvironments = useCallback(async () => {
        if (!window.electronAPI || !window.electronAPI.chromeEnvironments) {
            handleError(new Error('Electron API未正确加载'), '加载环境列表');
            dispatch({ type: 'SET_LOADING', payload: false });
            return;
        }

        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const envs = await window.electronAPI.chromeEnvironments.getAll();
            dispatch({ type: 'SET_ENVIRONMENTS', payload: envs });
        } catch (err) {
            handleError(err, '加载Chrome环境');
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [handleError]);

    // 加载空分组
    const loadEmptyGroups = useCallback(async () => {
        if (!window.electronAPI || !window.electronAPI.chromeEnvironments) {
            handleError(new Error('Electron API未正确加载'), '加载空分组');
            return;
        }

        try {
            const emptyGroupsList = await window.electronAPI.chromeEnvironments.getEmptyGroups();
            dispatch({ type: 'SET_EMPTY_GROUPS', payload: emptyGroupsList });
        } catch (err) {
            handleError(err, '加载空分组');
        }
    }, [handleError]);

    // 创建新环境
    const createEnvironment = useCallback(async (name: string, groupName: string, notes: string) => {
        if (!window.electronAPI || !window.electronAPI.chromeEnvironments) {
            handleError(new Error('Electron API未正确加载'), '创建环境');
            return;
        }

        try {
            const newEnv = await window.electronAPI.chromeEnvironments.create(name, groupName, notes);
            dispatch({ type: 'ADD_ENVIRONMENT', payload: newEnv });
            // 重新加载空分组（因为可能创建了新分组）
            loadEmptyGroups();
        } catch (err) {
            handleError(err, '创建环境');
        }
    }, [handleError, loadEmptyGroups]);

    // 启动环境
    const launchEnvironment = useCallback(async (id: string) => {
        if (!window.electronAPI || !window.electronAPI.chromeEnvironments) {
            handleError(new Error('Electron API未正确加载'), '启动环境');
            return;
        }

        try {
            await window.electronAPI.chromeEnvironments.launch(id);
            // 乐观更新：立即更新运行状态
            const updatedEnv = state.environments.find(env => env.id === id);
            if (updatedEnv) {
                dispatch({ 
                    type: 'UPDATE_ENVIRONMENT', 
                    payload: { ...updatedEnv, isRunning: true } 
                });
            }
            // 短暂延迟后刷新状态以确保准确性
            setTimeout(loadEnvironments, 1000);
        } catch (err) {
            handleError(err, '启动环境');
            // 如果失败，刷新状态以恢复正确状态
            loadEnvironments();
        }
    }, [handleError, loadEnvironments, state.environments]);

    // 关闭环境
    const closeEnvironment = useCallback(async (id: string) => {
        if (!window.electronAPI || !window.electronAPI.chromeEnvironments) {
            handleError(new Error('Electron API未正确加载'), '关闭环境');
            return;
        }

        try {
            await window.electronAPI.chromeEnvironments.close(id);
            // 乐观更新：立即更新运行状态
            const updatedEnv = state.environments.find(env => env.id === id);
            if (updatedEnv) {
                dispatch({ 
                    type: 'UPDATE_ENVIRONMENT', 
                    payload: { ...updatedEnv, isRunning: false } 
                });
            }
        } catch (err) {
            handleError(err, '关闭环境');
            // 如果失败，刷新状态以恢复正确状态
            loadEnvironments();
        }
    }, [handleError, loadEnvironments, state.environments]);

    // 删除环境
    const deleteEnvironment = useCallback(async (id: string) => {
        if (!window.electronAPI || !window.electronAPI.chromeEnvironments) {
            handleError(new Error('Electron API未正确加载'), '删除环境');
            return;
        }

        try {
            await window.electronAPI.chromeEnvironments.delete(id);
            dispatch({ type: 'REMOVE_ENVIRONMENT', payload: id });
            // 重新加载空分组（因为可能产生了空分组）
            loadEmptyGroups();
        } catch (err) {
            handleError(err, '删除环境');
        }
    }, [handleError, loadEmptyGroups]);

    // 删除空分组
    const deleteEmptyGroup = useCallback(async (groupName: string) => {
        if (!window.electronAPI || !window.electronAPI.chromeEnvironments) {
            handleError(new Error('Electron API未正确加载'), '删除分组');
            return;
        }

        try {
            const success = await window.electronAPI.chromeEnvironments.deleteEmptyGroup(groupName);
            if (success) {
                // 如果当前选中的是被删除的分组，则切换到"全部"
                if (state.currentGroup === groupName) {
                    dispatch({ type: 'SET_CURRENT_GROUP', payload: '全部' });
                }
                // 重新加载空分组
                loadEmptyGroups();
            }
        } catch (err) {
            handleError(err, '删除分组');
        }
    }, [handleError, loadEmptyGroups, state.currentGroup]);

    // 设置当前分组
    const setCurrentGroup = useCallback((group: string) => {
        dispatch({ type: 'SET_CURRENT_GROUP', payload: group });
    }, []);

    // 刷新环境（手动刷新）
    const refreshEnvironments = useCallback(async () => {
        await Promise.all([loadEnvironments(), loadEmptyGroups()]);
    }, [loadEnvironments, loadEmptyGroups]);

    // 初始化时加载数据
    useEffect(() => {
        if (window.electronAPI && window.electronAPI.chromeEnvironments) {
            loadEnvironments();
            loadEmptyGroups();
        } else {
            handleError(new Error('Electron API未正确加载，请重启应用'), '初始化应用');
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [loadEnvironments, loadEmptyGroups, handleError]);

    const contextValue: EnvironmentContextType = {
        state,
        actions: {
            loadEnvironments,
            loadEmptyGroups,
            createEnvironment,
            launchEnvironment,
            closeEnvironment,
            deleteEnvironment,
            deleteEmptyGroup,
            setCurrentGroup,
            refreshEnvironments
        }
    };

    return (
        <EnvironmentContext.Provider value={contextValue}>
            {children}
        </EnvironmentContext.Provider>
    );
};

// Hook 来使用环境上下文
export const useEnvironment = (): EnvironmentContextType => {
    const context = useContext(EnvironmentContext);
    if (context === undefined) {
        throw new Error('useEnvironment must be used within an EnvironmentProvider');
    }
    return context;
};