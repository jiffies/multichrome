import { useCallback } from 'react';
import { message } from '../contexts/NotificationContext';
import { AppError, createAppError, ERROR_MESSAGES } from '../types/errors';

interface UseErrorHandlerReturn {
    handleError: (error: unknown, context?: string) => void;
    showError: (error: AppError, context?: string) => void;
}

export function useErrorHandler(): UseErrorHandlerReturn {
    const handleError = useCallback((error: unknown, context?: string) => {
        const appError = createAppError(error);
        showErrorMessage(appError, context);
        
        // 在开发环境中打印详细错误信息
        if (process.env.NODE_ENV === 'development') {
            console.error(`错误上下文: ${context || '未知'}`, error);
        }
    }, []);
    
    const showError = useCallback((error: AppError, context?: string) => {
        showErrorMessage(error, context);
    }, []);
    
    return { handleError, showError };
}

function showErrorMessage(error: AppError, context?: string) {
    const baseMessage = ERROR_MESSAGES[error.type] || '操作失败';
    const contextPrefix = context ? `${context}: ` : '';
    const displayMessage = error.details || error.message || baseMessage;
    
    message.error(`${contextPrefix}${displayMessage}`, 5000);
}

// React Error Boundary 错误处理
export function handleGlobalError(error: Error, errorInfo: { componentStack: string }) {
    createAppError(error); // 创建错误对象但不需要存储
    
    message.error('应用出现异常，请刷新页面重试', 8000);
    
    // 在开发环境中显示组件栈信息
    if (process.env.NODE_ENV === 'development') {
        console.error('React Error Boundary捕获的错误:', error);
        console.error('组件栈:', errorInfo.componentStack);
    }
}