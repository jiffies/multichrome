import React, { useState } from 'react';
import { Box, Heading, Button, Label, Text, Spinner, TextInput, Select } from '@primer/react';
import {
    PlayIcon,
    StopIcon,
    TrashIcon,
    SyncIcon,
    CheckIcon,
    XIcon,
    SortDescIcon,
    SortAscIcon
} from '@primer/octicons-react';
import { ChromeEnvironment } from '../types';
import dayjs from 'dayjs';

interface EnvironmentListProps {
    environments: ChromeEnvironment[];
    loading: boolean;
    onLaunch: (id: string) => void;
    onClose: (id: string) => void;
    onDelete: (id: string) => void;
    onRefresh: () => void;
    onUpdateEnvironment?: (id: string, data: Partial<ChromeEnvironment>) => void;
}

const EnvironmentList: React.FC<EnvironmentListProps> = ({
    environments,
    loading,
    onLaunch,
    onClose,
    onDelete,
    onRefresh,
    onUpdateEnvironment
}) => {
    const [editingNameId, setEditingNameId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
    const [editingNotes, setEditingNotes] = useState('');
    const [editingWalletId, setEditingWalletId] = useState<string | null>(null);
    const [editingWallet, setEditingWallet] = useState('');
    const [editingProxyId, setEditingProxyId] = useState<string | null>(null);
    const [editingProxy, setEditingProxy] = useState('');
    const [editingProxyLabel, setEditingProxyLabel] = useState('');
    const [sortBy, setSortBy] = useState<'lastUsed' | 'createdAt'>('lastUsed');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // 开始编辑名称
    const handleStartEditName = (id: string, currentName: string) => {
        setEditingNameId(id);
        setEditingName(currentName);
    };

    // 保存名称
    const handleSaveName = async (id: string) => {
        if (editingName.trim() && editingName.trim() !== environments.find(env => env.id === id)?.name) {
            if (onUpdateEnvironment) {
                await onUpdateEnvironment(id, { name: editingName.trim() });
            }
        }
        setEditingNameId(null);
        setEditingName('');
    };

    // 取消编辑名称
    const handleCancelEditName = () => {
        setEditingNameId(null);
        setEditingName('');
    };

    // 开始编辑备注
    const handleStartEditNotes = (id: string, currentNotes: string) => {
        setEditingNotesId(id);
        setEditingNotes(currentNotes || '');
    };

    // 保存备注
    const handleSaveNotes = async (id: string) => {
        const trimmedNotes = editingNotes.trim();
        const currentNotes = environments.find(env => env.id === id)?.notes || '';
        if (trimmedNotes !== currentNotes) {
            if (onUpdateEnvironment) {
                await onUpdateEnvironment(id, { notes: trimmedNotes });
            }
        }
        setEditingNotesId(null);
        setEditingNotes('');
    };

    // 取消编辑备注
    const handleCancelEditNotes = () => {
        setEditingNotesId(null);
        setEditingNotes('');
    };

    // 开始编辑钱包地址
    const handleStartEditWallet = (id: string, currentWallet: string) => {
        setEditingWalletId(id);
        setEditingWallet(currentWallet || '');
    };

    // 保存钱包地址
    const handleSaveWallet = async (id: string) => {
        const trimmedWallet = editingWallet.trim();
        const currentWallet = environments.find(env => env.id === id)?.walletAddress || '';
        if (trimmedWallet !== currentWallet) {
            if (onUpdateEnvironment) {
                await onUpdateEnvironment(id, { walletAddress: trimmedWallet });
            }
        }
        setEditingWalletId(null);
        setEditingWallet('');
    };

    // 取消编辑钱包地址
    const handleCancelEditWallet = () => {
        setEditingWalletId(null);
        setEditingWallet('');
    };

    // 开始编辑代理
    const handleStartEditProxy = (id: string, currentProxy: string, currentProxyLabel: string) => {
        setEditingProxyId(id);
        setEditingProxy(currentProxy || '');
        setEditingProxyLabel(currentProxyLabel || '');
    };

    // 保存代理
    const handleSaveProxy = async (id: string) => {
        const trimmedProxy = editingProxy.trim();
        const trimmedProxyLabel = editingProxyLabel.trim();
        const env = environments.find(env => env.id === id);
        const currentProxy = env?.proxy || '';
        const currentProxyLabel = env?.proxyLabel || '';

        if (trimmedProxy !== currentProxy || trimmedProxyLabel !== currentProxyLabel) {
            if (onUpdateEnvironment) {
                // 同时保存代理地址和标签
                const updateData: Partial<ChromeEnvironment> = {
                    proxy: trimmedProxy || undefined,
                    proxyLabel: trimmedProxyLabel || undefined
                };
                await onUpdateEnvironment(id, updateData);
            }
        }
        setEditingProxyId(null);
        setEditingProxy('');
        setEditingProxyLabel('');
    };

    // 取消编辑代理
    const handleCancelEditProxy = () => {
        setEditingProxyId(null);
        setEditingProxy('');
        setEditingProxyLabel('');
    };

    // 格式化钱包地址显示（前6后6位）
    const formatWalletAddress = (address: string | undefined): string => {
        if (!address || address.length <= 12) return address || '';
        return `${address.slice(0, 6)}...${address.slice(-6)}`;
    };

    // 计算运行中的进程数
    const getRunningProcessCounts = () => {
        const runningEnvs = environments.filter(env => env.isRunning);
        const total = runningEnvs.length;
        
        // 按分组统计
        const groupCounts: Record<string, number> = {};
        runningEnvs.forEach(env => {
            groupCounts[env.groupName] = (groupCounts[env.groupName] || 0) + 1;
        });
        
        return { total, groupCounts };
    };

    const { total: totalRunning, groupCounts } = getRunningProcessCounts();

    // 排序环境列表
    const sortedEnvironments = [...environments].sort((a, b) => {
        let comparison = 0;
        
        if (sortBy === 'lastUsed') {
            const aTime = new Date(a.lastUsed).getTime();
            const bTime = new Date(b.lastUsed).getTime();
            comparison = bTime - aTime; // 默认倒序（最新的在前）
        } else if (sortBy === 'createdAt') {
            const aTime = new Date(a.createdAt).getTime();
            const bTime = new Date(b.createdAt).getTime();
            comparison = bTime - aTime; // 默认倒序（最新的在前）
        }
        
        return sortOrder === 'desc' ? comparison : -comparison;
    });

    // 处理排序变化
    const handleSortChange = (field: 'lastUsed' | 'createdAt') => {
        if (sortBy === field) {
            // 如果点击的是当前排序字段，切换排序顺序
            setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
        } else {
            // 如果点击的是不同字段，设置新字段并默认为倒序
            setSortBy(field);
            setSortOrder('desc');
        }
    };

    // 如果没有环境，显示空状态
    if (!loading && environments.length === 0) {
        return (
            <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                    <Box display="flex" alignItems="center" gap={2}>
                        <Heading as="h2" sx={{ fontSize: 3 }}>环境管理</Heading>
                        <Text sx={{ fontSize: 2, color: 'success.fg', fontWeight: '600' }}>
                            ({totalRunning}个运行中)
                        </Text>
                    </Box>
                    <Button
                        variant="outline"
                        leadingIcon={SyncIcon}
                        onClick={onRefresh}
                    >
                        刷新列表
                    </Button>
                </Box>
                <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    py={8}
                    textAlign="center"
                >
                    <Box mb={4}>
                        <PlayIcon size={56} />
                    </Box>
                    <Heading as="h3" sx={{ fontSize: 2, mb: 2 }}>没有Chrome环境</Heading>
                    <Text sx={{ mb: 4, color: 'fg.muted' }}>
                        点击右上角的&quot;新建环境&quot;按钮创建你的第一个Chrome环境
                    </Text>
                    <Button variant="primary" leadingIcon={SyncIcon} onClick={onRefresh}>
                        刷新
                    </Button>
                </Box>
            </Box>
        );
    }


    return (
        <Box height="100%" display="flex" flexDirection="column" style={{ minHeight: 0 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Box display="flex" alignItems="center" gap={2}>
                    <Heading as="h2" sx={{ fontSize: 3 }}>环境管理</Heading>
                    <Text sx={{ fontSize: 2, color: 'success.fg', fontWeight: '600' }}>
                        ({totalRunning}个运行中)
                    </Text>
                </Box>
                <Button
                    variant="outline"
                    leadingIcon={SyncIcon}
                    onClick={onRefresh}
                >
                    刷新列表
                </Button>
            </Box>

            <Box borderRadius={2} display="flex" flexDirection="column" style={{ flex: '1 1 0', minHeight: 0, overflow: 'hidden' }}>
                {/* 表头 */}
                <Box
                    display="grid"
                    gridTemplateColumns="80px 120px 80px 140px 120px 150px 2fr 140px 140px 180px"
                    gap={2}
                    py={4}
                    px={4}
                    bg="canvas.subtle"
                    fontWeight="600"
                    alignItems="center"
                    style={{ minHeight: '52px', flexShrink: 0 }}
                >
                    <Text fontSize="12px" color="fg.muted" fontWeight="600">状态</Text>
                    <Text fontSize="12px" color="fg.muted" fontWeight="600">ID</Text>
                    <Text fontSize="12px" color="fg.muted" fontWeight="600">分组</Text>
                    <Text fontSize="12px" color="fg.muted" fontWeight="600">名称</Text>
                    <Text fontSize="12px" color="fg.muted" fontWeight="600">钱包地址</Text>
                    <Text fontSize="12px" color="fg.muted" fontWeight="600">代理地址</Text>
                    <Text fontSize="12px" color="fg.muted" fontWeight="600">备注</Text>
                    <Box display="flex" alignItems="center" gap={1} sx={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSortChange('createdAt')}>
                        <Text fontSize="12px" color="fg.muted" fontWeight="600">创建时间</Text>
                        {sortBy === 'createdAt' && (
                            sortOrder === 'desc' ? <SortDescIcon size={12} /> : <SortAscIcon size={12} />
                        )}
                    </Box>
                    <Box display="flex" alignItems="center" gap={1} sx={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSortChange('lastUsed')}>
                        <Text fontSize="12px" color="fg.muted" fontWeight="600">上次使用</Text>
                        {sortBy === 'lastUsed' && (
                            sortOrder === 'desc' ? <SortDescIcon size={12} /> : <SortAscIcon size={12} />
                        )}
                    </Box>
                    <Text fontSize="12px" color="fg.muted" fontWeight="600" textAlign="right">操作</Text>
                </Box>

                {/* 表格内容 */}
                <Box
                    bg="canvas.default"
                    style={{ flex: '1 1 0', minHeight: 0, overflow: 'auto' }}
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
                        sortedEnvironments.map((env, index) => (
                            <Box key={env.id}
                                 display="grid"
                                 gridTemplateColumns="80px 120px 80px 140px 120px 150px 2fr 140px 140px 180px"
                                 gap={2}
                                 py={4}
                                 px={4}
                                 alignItems="center"
                                 sx={{
                                     '&:hover': { bg: 'canvas.subtle' },
                                     minHeight: '52px',
                                     borderBottom: index < sortedEnvironments.length - 1 ? '1px solid' : 'none',
                                     borderColor: 'border.muted'
                                 }}
                            >
                                {/* 状态 */}
                                <Box display="flex" alignItems="center" width="100%">
                                    <Box 
                                        width="8px" 
                                        height="8px" 
                                        borderRadius="50%" 
                                        bg={env.isRunning ? 'success.emphasis' : 'neutral.muted'}
                                        mr={2}
                                        flexShrink={0}
                                    />
                                    <Text fontSize="12px" color={env.isRunning ? 'success.fg' : 'fg.muted'} sx={{ flexShrink: 0 }}>
                                        {env.isRunning ? '运行中' : '已停止'}
                                    </Text>
                                </Box>
                                
                                {/* ID */}
                                <Text fontSize="12px" fontFamily="mono" color="fg.muted" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {env.id.substring(0, 8)}
                                </Text>
                                
                                {/* 分组 */}
                                <Box display="flex" alignItems="center">
                                    <Label 
                                        variant="accent" 
                                        size="small"
                                        sx={{ 
                                            maxWidth: 'fit-content',
                                            display: 'inline-flex',
                                            alignItems: 'center'
                                        }}
                                    >
                                        {env.groupName}
                                    </Label>
                                </Box>
                                
                                {/* 名称 */}
                                {editingNameId === env.id ? (
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <TextInput
                                            value={editingName}
                                            onChange={(e) => setEditingName(e.target.value)}
                                            size="small"
                                            sx={{ fontSize: '14px' }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleSaveName(env.id);
                                                } else if (e.key === 'Escape') {
                                                    handleCancelEditName();
                                                }
                                            }}
                                            onBlur={() => {
                                                // 延迟执行，让点击事件先执行
                                                setTimeout(() => {
                                                    if (editingNameId === env.id) {
                                                        handleCancelEditName();
                                                    }
                                                }, 100);
                                            }}
                                            autoFocus
                                        />
                                        <Button
                                            size="small"
                                            variant="invisible"
                                            leadingIcon={CheckIcon}
                                            onMouseDown={() => handleSaveName(env.id)}
                                            sx={{ p: 1 }}
                                        />
                                        <Button
                                            size="small"
                                            variant="invisible"
                                            leadingIcon={XIcon}
                                            onClick={handleCancelEditName}
                                            sx={{ p: 1 }}
                                        />
                                    </Box>
                                ) : (
                                    <Text 
                                        fontSize="14px" 
                                        fontWeight="500" 
                                        sx={{ 
                                            overflow: 'hidden', 
                                            textOverflow: 'ellipsis', 
                                            whiteSpace: 'nowrap',
                                            cursor: 'pointer',
                                            '&:hover': { textDecoration: 'underline' }
                                        }}
                                        onClick={() => handleStartEditName(env.id, env.name)}
                                    >
                                        {env.name}
                                    </Text>
                                )}
                                
                                {/* 钱包地址 */}
                                {editingWalletId === env.id ? (
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <TextInput
                                            value={editingWallet}
                                            onChange={(e) => setEditingWallet(e.target.value)}
                                            size="small"
                                            sx={{ fontSize: '12px' }}
                                            placeholder="输入钱包地址"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleSaveWallet(env.id);
                                                } else if (e.key === 'Escape') {
                                                    handleCancelEditWallet();
                                                }
                                            }}
                                            onBlur={() => {
                                                // 延迟执行，让点击事件先执行
                                                setTimeout(() => {
                                                    if (editingWalletId === env.id) {
                                                        handleCancelEditWallet();
                                                    }
                                                }, 100);
                                            }}
                                            autoFocus
                                        />
                                        <Button
                                            size="small"
                                            variant="invisible"
                                            leadingIcon={CheckIcon}
                                            onMouseDown={() => handleSaveWallet(env.id)}
                                            sx={{ p: 1 }}
                                        />
                                        <Button
                                            size="small"
                                            variant="invisible"
                                            leadingIcon={XIcon}
                                            onClick={handleCancelEditWallet}
                                            sx={{ p: 1 }}
                                        />
                                    </Box>
                                ) : (
                                    <Text 
                                        fontSize="12px" 
                                        fontFamily="mono"
                                        color="fg.muted" 
                                        sx={{ 
                                            overflow: 'hidden', 
                                            textOverflow: 'ellipsis', 
                                            whiteSpace: 'nowrap',
                                            cursor: 'pointer',
                                            '&:hover': { textDecoration: 'underline' }
                                        }}
                                        onClick={() => handleStartEditWallet(env.id, env.walletAddress || '')}
                                        title={env.walletAddress || ''}
                                    >
                                        {formatWalletAddress(env.walletAddress) || '-'}
                                    </Text>
                                )}

                                {/* 代理地址 */}
                                {editingProxyId === env.id ? (
                                    <Box display="flex" flexDirection="column" gap={1}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <TextInput
                                                value={editingProxyLabel}
                                                onChange={(e) => setEditingProxyLabel(e.target.value)}
                                                size="small"
                                                sx={{ fontSize: '12px', flex: 1 }}
                                                placeholder="标签(可选,如:菲律宾)"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        handleSaveProxy(env.id);
                                                    } else if (e.key === 'Escape') {
                                                        handleCancelEditProxy();
                                                    }
                                                }}
                                            />
                                            <Button
                                                size="small"
                                                variant="invisible"
                                                leadingIcon={CheckIcon}
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    handleSaveProxy(env.id);
                                                }}
                                                sx={{ p: 1 }}
                                            />
                                            <Button
                                                size="small"
                                                variant="invisible"
                                                leadingIcon={XIcon}
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    handleCancelEditProxy();
                                                }}
                                                sx={{ p: 1 }}
                                            />
                                        </Box>
                                        <TextInput
                                            value={editingProxy}
                                            onChange={(e) => setEditingProxy(e.target.value)}
                                            size="small"
                                            sx={{ fontSize: '12px' }}
                                            placeholder="代理地址(如: 127.0.0.1:10808)"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleSaveProxy(env.id);
                                                } else if (e.key === 'Escape') {
                                                    handleCancelEditProxy();
                                                }
                                            }}
                                            autoFocus
                                        />
                                    </Box>
                                ) : (
                                    <Box
                                        display="flex"
                                        flexDirection="column"
                                        sx={{
                                            overflow: 'hidden',
                                            cursor: 'pointer',
                                            '&:hover': { textDecoration: 'underline' }
                                        }}
                                        onClick={() => {
                                            console.log('点击代理单元格, env:', env);
                                            handleStartEditProxy(env.id, env.proxy || '', env.proxyLabel || '');
                                        }}
                                    >
                                        {env.proxyLabel && (
                                            <Text
                                                fontSize="11px"
                                                color="accent.fg"
                                                sx={{
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}
                                            >
                                                ({env.proxyLabel})
                                            </Text>
                                        )}
                                        <Text
                                            fontSize="12px"
                                            fontFamily="mono"
                                            color="fg.muted"
                                            sx={{
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}
                                            title={env.proxy || '(全局)'}
                                        >
                                            {env.proxy || '(全局)'}
                                        </Text>
                                    </Box>
                                )}

                                {/* 备注 */}
                                {editingNotesId === env.id ? (
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <TextInput
                                            value={editingNotes}
                                            onChange={(e) => setEditingNotes(e.target.value)}
                                            size="small"
                                            sx={{ fontSize: '12px' }}
                                            placeholder="输入备注"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleSaveNotes(env.id);
                                                } else if (e.key === 'Escape') {
                                                    handleCancelEditNotes();
                                                }
                                            }}
                                            onBlur={() => {
                                                // 延迟执行，让点击事件先执行
                                                setTimeout(() => {
                                                    if (editingNotesId === env.id) {
                                                        handleCancelEditNotes();
                                                    }
                                                }, 100);
                                            }}
                                            autoFocus
                                        />
                                        <Button
                                            size="small"
                                            variant="invisible"
                                            leadingIcon={CheckIcon}
                                            onMouseDown={() => handleSaveNotes(env.id)}
                                            sx={{ p: 1 }}
                                        />
                                        <Button
                                            size="small"
                                            variant="invisible"
                                            leadingIcon={XIcon}
                                            onClick={handleCancelEditNotes}
                                            sx={{ p: 1 }}
                                        />
                                    </Box>
                                ) : (
                                    <Text 
                                        fontSize="12px" 
                                        color="fg.muted" 
                                        sx={{ 
                                            overflow: 'hidden', 
                                            textOverflow: 'ellipsis', 
                                            whiteSpace: 'nowrap',
                                            cursor: 'pointer',
                                            '&:hover': { textDecoration: 'underline' }
                                        }}
                                        onClick={() => handleStartEditNotes(env.id, env.notes || '')}
                                    >
                                        {env.notes || '-'}
                                    </Text>
                                )}
                                
                                {/* 创建时间 */}
                                <Text fontSize="12px" color="fg.muted">
                                    {env.createdAt ? dayjs(env.createdAt).format('MM-DD HH:mm') : '-'}
                                </Text>
                                
                                {/* 上次使用 */}
                                <Text fontSize="12px" color="fg.muted">
                                    {dayjs(env.lastUsed).format('MM-DD HH:mm')}
                                </Text>
                                
                                {/* 操作 */}
                                <Box display="flex" gap={2} justifyContent="flex-end" alignItems="center">
                                    {env.isRunning ? (
                                        <Button
                                            leadingIcon={StopIcon}
                                            variant="outline"
                                            size="small"
                                            onClick={() => onClose(env.id)}
                                        >
                                            关闭
                                        </Button>
                                    ) : (
                                        <Button
                                            leadingIcon={PlayIcon}
                                            variant="primary"
                                            size="small"
                                            onClick={() => onLaunch(env.id)}
                                        >
                                            打开
                                        </Button>
                                    )}
                                    <Button
                                        leadingIcon={TrashIcon}
                                        variant="danger"
                                        size="small"
                                        onClick={() => onDelete(env.id)}
                                    >
                                        删除
                                    </Button>
                                </Box>
                            </Box>
                        ))
                    )}
                </Box>
            </Box>
        </Box>
    );
};

export default EnvironmentList; 