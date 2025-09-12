import React, { useState } from 'react';
import { Box, Heading, Button, Label, Text, Spinner, TextInput } from '@primer/react';
import {
    PlayIcon,
    StopIcon,
    TrashIcon,
    SyncIcon,
    CheckIcon,
    XIcon
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
    const [tableHeight] = useState('calc(100vh - 160px)');
    const [editingNameId, setEditingNameId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
    const [editingNotes, setEditingNotes] = useState('');

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

    // 如果没有环境，显示空状态
    if (!loading && environments.length === 0) {
        return (
            <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                    <Heading as="h2" sx={{ fontSize: 3 }}>窗口管理</Heading>
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
                        点击右上角的&quot;新建窗口&quot;按钮创建你的第一个Chrome环境
                    </Text>
                    <Button variant="primary" leadingIcon={SyncIcon} onClick={onRefresh}>
                        刷新
                    </Button>
                </Box>
            </Box>
        );
    }


    return (
        <Box height="100%" display="flex" flexDirection="column">
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Heading as="h2" sx={{ fontSize: 3 }}>窗口管理</Heading>
                <Button
                    variant="outline"
                    leadingIcon={SyncIcon}
                    onClick={onRefresh}
                >
                    刷新列表
                </Button>
            </Box>

            <Box flex={1} borderRadius={2} overflow="hidden">
                {/* 表头 */}
                <Box 
                    display="grid" 
                    gridTemplateColumns="130px 140px 100px 150px 1fr 160px 160px 200px" 
                    gap={4} 
                    py={4} 
                    px={4} 
                    bg="canvas.subtle"
                    fontWeight="600"
                    alignItems="center"
                    sx={{ minHeight: '52px' }}
                >
                    <Text fontSize="12px" color="fg.muted" fontWeight="600">状态</Text>
                    <Text fontSize="12px" color="fg.muted" fontWeight="600">ID</Text>
                    <Text fontSize="12px" color="fg.muted" fontWeight="600">分组</Text>
                    <Text fontSize="12px" color="fg.muted" fontWeight="600">名称</Text>
                    <Text fontSize="12px" color="fg.muted" fontWeight="600">备注</Text>
                    <Text fontSize="12px" color="fg.muted" fontWeight="600">创建时间</Text>
                    <Text fontSize="12px" color="fg.muted" fontWeight="600">上次使用</Text>
                    <Text fontSize="12px" color="fg.muted" fontWeight="600" textAlign="right">操作</Text>
                </Box>
                
                {/* 表格内容 */}
                <Box 
                    maxHeight={tableHeight} 
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
                        environments.map((env, index) => (
                            <Box key={env.id} 
                                 display="grid" 
                                 gridTemplateColumns="130px 140px 100px 150px 1fr 160px 160px 200px" 
                                 gap={4} 
                                 py={4} 
                                 px={4} 
                                 alignItems="center"
                                 sx={{ 
                                     '&:hover': { bg: 'canvas.subtle' },
                                     minHeight: '52px',
                                     borderBottom: index < environments.length - 1 ? '1px solid' : 'none',
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