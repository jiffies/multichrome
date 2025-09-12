import React, { createContext, useContext, useState, useCallback } from 'react';
import { Flash } from '@primer/react';
import { CheckIcon, XIcon, AlertIcon, InfoIcon } from '@primer/octicons-react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface Notification {
    id: string;
    type: NotificationType;
    message: string;
    duration?: number;
}

interface NotificationContextType {
    notifications: Notification[];
    showNotification: (type: NotificationType, message: string, duration?: number) => void;
    removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

const getFlashVariant = (type: NotificationType) => {
    switch (type) {
        case 'success': return 'success';
        case 'error': return 'danger';
        case 'warning': return 'warning';
        case 'info': 
        default: return 'default';
    }
};

const getIcon = (type: NotificationType) => {
    switch (type) {
        case 'success': return CheckIcon;
        case 'error': return XIcon;
        case 'warning': return AlertIcon;
        case 'info':
        default: return InfoIcon;
    }
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const removeNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const showNotification = useCallback((type: NotificationType, message: string, duration = 5000) => {
        const id = Math.random().toString(36).substr(2, 9);
        const notification: Notification = { id, type, message, duration };
        
        setNotifications(prev => [...prev, notification]);
        
        if (duration > 0) {
            setTimeout(() => {
                removeNotification(id);
            }, duration);
        }
    }, [removeNotification]);

    // 监听全局通知事件
    React.useEffect(() => {
        const handleGlobalNotification = (event: CustomEvent) => {
            const { type, message, duration } = event.detail;
            showNotification(type, message, duration);
        };

        window.addEventListener('show-notification', handleGlobalNotification as EventListener);
        
        return () => {
            window.removeEventListener('show-notification', handleGlobalNotification as EventListener);
        };
    }, [showNotification]);

    return (
        <NotificationContext.Provider value={{ notifications, showNotification, removeNotification }}>
            {children}
            
            {/* 通知容器 */}
            {notifications.length > 0 && (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    maxWidth: '400px'
                }}>
                    {notifications.map(notification => {
                        const Icon = getIcon(notification.type);
                        return (
                            <Flash
                                key={notification.id}
                                variant={getFlashVariant(notification.type)}
                                sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center',
                                    cursor: 'pointer'
                                }}
                                onClick={() => removeNotification(notification.id)}
                            >
                                <Icon size={16} style={{ marginRight: '8px', flexShrink: 0 }} />
                                {notification.message}
                            </Flash>
                        );
                    })}
                </div>
            )}
        </NotificationContext.Provider>
    );
};

// 简化的API，模仿antd的message
export const message = {
    success: (content: string, duration?: number) => {
        // 这个会在组件外部调用，需要全局状态
        window.dispatchEvent(new CustomEvent('show-notification', {
            detail: { type: 'success', message: content, duration }
        }));
    },
    error: (content: string, duration?: number) => {
        window.dispatchEvent(new CustomEvent('show-notification', {
            detail: { type: 'error', message: content, duration }
        }));
    },
    warning: (content: string, duration?: number) => {
        window.dispatchEvent(new CustomEvent('show-notification', {
            detail: { type: 'warning', message: content, duration }
        }));
    },
    info: (content: string, duration?: number) => {
        window.dispatchEvent(new CustomEvent('show-notification', {
            detail: { type: 'info', message: content, duration }
        }));
    }
};