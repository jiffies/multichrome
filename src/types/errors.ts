// 错误类型定义
export enum ErrorType {
    VALIDATION = 'VALIDATION',
    NOT_FOUND = 'NOT_FOUND',
    PERMISSION = 'PERMISSION',
    CHROME_PROCESS = 'CHROME_PROCESS',
    FILE_SYSTEM = 'FILE_SYSTEM',
    NETWORK = 'NETWORK',
    UNKNOWN = 'UNKNOWN'
}

export interface AppError {
    type: ErrorType;
    message: string;
    details?: string;
    stack?: string;
}

export class ValidationError extends Error {
    public readonly type = ErrorType.VALIDATION;
    
    constructor(message: string, public details?: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

export class NotFoundError extends Error {
    public readonly type = ErrorType.NOT_FOUND;
    
    constructor(message: string, public details?: string) {
        super(message);
        this.name = 'NotFoundError';
    }
}

export class ChromeProcessError extends Error {
    public readonly type = ErrorType.CHROME_PROCESS;
    
    constructor(message: string, public details?: string) {
        super(message);
        this.name = 'ChromeProcessError';
    }
}

// 错误工具函数
export function createAppError(error: unknown): AppError {
    if (error instanceof ValidationError || 
        error instanceof NotFoundError || 
        error instanceof ChromeProcessError) {
        return {
            type: error.type,
            message: error.message,
            details: error.details,
            stack: error.stack
        };
    }
    
    if (error instanceof Error) {
        return {
            type: ErrorType.UNKNOWN,
            message: error.message,
            stack: error.stack
        };
    }
    
    return {
        type: ErrorType.UNKNOWN,
        message: String(error)
    };
}

// 用户友好的错误消息映射
export const ERROR_MESSAGES: Record<ErrorType, string> = {
    [ErrorType.VALIDATION]: '输入数据格式有误',
    [ErrorType.NOT_FOUND]: '找不到指定的资源',
    [ErrorType.PERMISSION]: '权限不足',
    [ErrorType.CHROME_PROCESS]: 'Chrome进程操作失败',
    [ErrorType.FILE_SYSTEM]: '文件系统操作失败',
    [ErrorType.NETWORK]: '网络连接错误',
    [ErrorType.UNKNOWN]: '未知错误'
};