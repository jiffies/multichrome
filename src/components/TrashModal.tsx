import React, { useState, useEffect, useCallback } from 'react';
import { Box, Button, Label, Text, Spinner, ActionMenu, ActionList } from '@primer/react';
import { Dialog } from '@primer/react/experimental';
import {
    ReplyIcon,
    TrashIcon,
    SyncIcon,
    XCircleIcon
} from '@primer/octicons-react';
import { ChromeEnvironment } from '../types';
import { useErrorHandler } from '../hooks/useErrorHandler';
import dayjs from 'dayjs';

interface TrashModalProps {
    open: boolean;
    onCancel: () => void;
    onEnvironmentRestored?: () => void;
}

const TrashModal: React.FC<TrashModalProps> = ({
    open,
    onCancel,
    onEnvironmentRestored
}) => {
    const [deletedEnvironments, setDeletedEnvironments] = useState<ChromeEnvironment[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const { handleError } = useErrorHandler();

    // 加载已删除的环境
    const loadDeletedEnvironments = useCallback(async () => {
        if (!window.electronAPI || !window.electronAPI.trash) {
            handleError(new Error('回收站API未正确加载'), '加载回收站');
            return;
        }
        
        try {
            setLoading(true);
            const envs = await window.electronAPI.trash.getDeletedEnvironments();
            setDeletedEnvironments(envs);
        } catch (err) {
            handleError(err, '加载回收站');
        } finally {
            setLoading(false);
        }
    }, [handleError]);

    // 恢复环境
    const handleRestore = async (id: string, name: string) => {
        if (!window.electronAPI || !window.electronAPI.trash) {
            handleError(new Error('回收站API未正确加载'), '恢复环境');
            return;
        }
        
        try {
            const success = await window.electronAPI.trash.restore(id);
            if (success) {
                // 使用我们的通知系统
                window.dispatchEvent(new CustomEvent('show-notification', {
                    detail: { type: 'success', message: `环境 "${name}" 已恢复` }
                }));
                loadDeletedEnvironments();
                onEnvironmentRestored?.();
            }
        } catch (err) {
            handleError(err, `恢复环境 "${name}"`);
        }
    };

    // 永久删除环境
    const handlePermanentlyDelete = async (id: string, name: string) => {
        if (!window.electronAPI || !window.electronAPI.trash) {
            handleError(new Error('回收站API未正确加载'), '永久删除环境');
            return;
        }
        
        try {
            const success = await window.electronAPI.trash.permanentlyDelete(id);
            if (success) {
                window.dispatchEvent(new CustomEvent('show-notification', {
                    detail: { type: 'success', message: `环境 "${name}" 已永久删除` }
                }));
                loadDeletedEnvironments();
            }
        } catch (err) {
            handleError(err, `永久删除环境 "${name}"`);
        }
    };

    // 清空回收站
    const handleCleanup = async () => {
        if (!window.electronAPI || !window.electronAPI.trash) {
            handleError(new Error('回收站API未正确加载'), '清空回收站');
            return;
        }
        
        try {
            const count = await window.electronAPI.trash.cleanup();
            window.dispatchEvent(new CustomEvent('show-notification', {
                detail: { type: 'success', message: `已清理 ${count} 个过期环境` }
            }));
            loadDeletedEnvironments();
        } catch (err) {
            handleError(err, '清空回收站');
        }
    };

    // 当模态框打开时加载数据
    useEffect(() => {
        if (open) {
            loadDeletedEnvironments();
        }
    }, [open, loadDeletedEnvironments]);

    // 渲染单个已删除环境行
    const renderDeletedEnvironmentRow = (env: ChromeEnvironment, index: number) => {
        const days = env.deletedAt ? dayjs().diff(dayjs(env.deletedAt), 'days') : 0;
        const isExpiring = days >= 25;
        
        return (
            <Box key={env.id} 
                 display="grid" 
                 gridTemplateColumns="1fr 120px 160px 120px 2fr 180px" 
                 gap={4} 
                 py={4} 
                 px={4} 
                 alignItems="center"
                 sx={{ 
                     '&:hover': { bg: 'canvas.subtle' },
                     borderBottom: index < deletedEnvironments.length - 1 ? '1px solid' : 'none',
                     borderColor: 'border.muted'
                 }}
            >
                {/* 名称 */}
                <Text fontSize="14px" fontWeight="600">{env.name}</Text>

                {/* 分组 */}
                <Label 
                    variant="primary" 
                    size="small"
                    sx={{
                        maxWidth: 'fit-content',
                        display: 'inline-block'
                    }}
                >
                    {env.groupName}
                </Label>

                {/* 删除时间 */}
                <Text fontSize="12px" color="fg.muted">
                    {env.deletedAt ? dayjs(env.deletedAt).format('MM-DD HH:mm') : '-'}
                </Text>

                {/* 删除时长 */}
                <Text 
                    fontSize="12px" 
                    color={isExpiring ? 'danger.fg' : 'fg.muted'}
                    fontWeight={isExpiring ? '600' : '400'}
                >
                    {env.deletedAt ? `${days} 天前${isExpiring ? ' (即将过期)' : ''}` : '-'}
                </Text>

                {/* 备注 */}
                <Text fontSize="12px" color="fg.muted" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {env.notes || '-'}
                </Text>

                {/* 操作 */}
                <Box display="flex" gap={2}>
                    <Button
                        variant="primary"
                        size="small"
                        leadingIcon={ReplyIcon}
                        onClick={() => handleRestore(env.id, env.name)}
                    >
                        恢复
                    </Button>
                    <ActionMenu>
                        <ActionMenu.Anchor>
                            <Button
                                variant="danger"
                                size="small"
                                leadingIcon={TrashIcon}
                            >
                                永久删除
                            </Button>
                        </ActionMenu.Anchor>
                        <ActionMenu.Overlay>
                            <ActionList>
                                <ActionList.Item
                                    variant="danger"
                                    onSelect={() => {
                                        if (confirm(`确定要永久删除环境"${env.name}"吗？此操作不可恢复。`)) {
                                            handlePermanentlyDelete(env.id, env.name);
                                        }
                                    }}
                                >
                                    <ActionList.LeadingVisual>
                                        <TrashIcon />
                                    </ActionList.LeadingVisual>
                                    确认永久删除
                                </ActionList.Item>
                            </ActionList>
                        </ActionMenu.Overlay>
                    </ActionMenu>
                </Box>
            </Box>
        );
    };

    return (
        <>
            {open && (
                <Dialog
                    title="回收站"
                    onClose={onCancel}
                    sx={{ width: '80%', maxWidth: '1200px', minWidth: '800px' }}
                    footerButtons={[
                        {
                            content: '刷新',
                            buttonType: 'default',
                            leadingIcon: SyncIcon,
                            onClick: loadDeletedEnvironments
                        },
                        {
                            content: '清空回收站',
                            buttonType: 'danger',
                            leadingIcon: XCircleIcon,
                            onClick: () => {
                                if (confirm('将永久删除所有超过30天的环境，此操作不可恢复。确定要继续吗？')) {
                                    handleCleanup();
                                }
                            }
                        },
                        {
                            content: '关闭',
                            buttonType: 'default',
                            onClick: onCancel
                        }
                    ]}
                >
                    {deletedEnvironments.length === 0 && !loading ? (
                        <Box 
                            display="flex" 
                            flexDirection="column" 
                            alignItems="center" 
                            justifyContent="center" 
                            py={8}
                            textAlign="center"
                        >
                            <TrashIcon size={64} color="fg.muted" />
                            <Text sx={{ mt: 3, fontSize: 2, color: 'fg.muted' }}>
                                回收站为空
                            </Text>
                        </Box>
                    ) : (
                        <Box borderRadius={2} overflow="hidden">
                            {/* 表头 */}
                            <Box 
                                display="grid" 
                                gridTemplateColumns="1fr 120px 160px 120px 2fr 180px" 
                                gap={4} 
                                py={4} 
                                px={4} 
                                bg="canvas.subtle"
                                fontWeight="600"
                            >
                                <Text fontSize="12px" color="fg.muted">名称</Text>
                                <Text fontSize="12px" color="fg.muted">分组</Text>
                                <Text fontSize="12px" color="fg.muted">删除时间</Text>
                                <Text fontSize="12px" color="fg.muted">删除时长</Text>
                                <Text fontSize="12px" color="fg.muted">备注</Text>
                                <Text fontSize="12px" color="fg.muted">操作</Text>
                            </Box>
                            
                            {/* 表格内容 */}
                            <Box 
                                maxHeight="400px" 
                                overflow="auto"
                                bg="canvas.default"
                                sx={{
                                    '&::-webkit-scrollbar': {
                                        width: '8px',
                                        height: '8px',
                                    },
                                    '&::-webkit-scrollbar-track': {
                                        background: 'canvas.default',
                                    },
                                    '&::-webkit-scrollbar-thumb': {
                                        background: 'neutral.emphasis',
                                        borderRadius: '4px',
                                    },
                                }}
                            >
                                {loading ? (
                                    <Box display="flex" justifyContent="center" alignItems="center" py={8}>
                                        <Spinner size="medium" />
                                        <Text ml={2} color="fg.muted">加载中...</Text>
                                    </Box>
                                ) : (
                                    deletedEnvironments.map((env, index) => renderDeletedEnvironmentRow(env, index))
                                )}
                            </Box>
                            
                            {/* 分页信息 */}
                            {!loading && deletedEnvironments.length > 0 && (
                                <Box 
                                    py={3} 
                                    px={4} 
                                    bg="canvas.subtle"
                                >
                                    <Text fontSize="12px" color="fg.muted">
                                        共 {deletedEnvironments.length} 项
                                    </Text>
                                </Box>
                            )}
                        </Box>
                    )}
                </Dialog>
            )}
        </>
    );
};

export default TrashModal;