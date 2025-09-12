import React, { useState } from 'react';
import { Box, Heading, Button, Label, Text, Tooltip, Spinner } from '@primer/react';
import {
    PlayIcon,
    StopIcon,
    TrashIcon,
    SyncIcon,
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
}

const EnvironmentList: React.FC<EnvironmentListProps> = ({
    environments,
    loading,
    onLaunch,
    onClose,
    onDelete,
    onRefresh
}) => {
    const [tableHeight] = useState('calc(100vh - 160px)');

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

    // 渲染单个环境行
    const renderEnvironmentRow = (env: ChromeEnvironment) => (
        <Box key={env.id} 
             display="grid" 
             gridTemplateColumns="80px 100px 180px 120px 200px 250px 200px 180px 130px 160px" 
             gap={2} 
             py={2} 
             px={3} 
             borderBottom="1px solid" 
             borderColor="border.default"
             alignItems="center"
             sx={{ '&:hover': { bg: 'canvas.subtle' } }}
        >
            {/* 状态 */}
            <Label variant={env.isRunning ? 'success' : 'default'} size="small">
                {env.isRunning ? '运行' : '停止'}
            </Label>

            {/* ID */}
            <Text fontSize="12px" fontFamily="mono">{env.id.substring(0, 8)}</Text>

            {/* 缓存目录 */}
            <Tooltip text={env.dataDir}>
                <button style={{ 
                    border: 'none', 
                    background: 'transparent', 
                    padding: 0, 
                    cursor: 'default',
                    textAlign: 'left',
                    width: '100%'
                }}>
                    <Text fontSize="12px" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {env.dataDir.split(/[/\\]/).pop()}
                    </Text>
                </button>
            </Tooltip>

            {/* 分组 */}
            <Text fontSize="12px">{env.groupName}</Text>

            {/* 名称 */}
            <Text fontSize="12px" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {env.name}
            </Text>

            {/* 备注 */}
            <Text fontSize="12px" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {env.notes}
            </Text>

            {/* 标签 */}
            <Box>
                {env.tags.map(tag => (
                    <Label key={tag} size="small" sx={{ mr: 1 }}>{tag}</Label>
                ))}
            </Box>

            {/* 代理 */}
            <Text fontSize="12px" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {env.proxy || '-'}
            </Text>

            {/* 上次使用 */}
            <Text fontSize="12px">{dayjs(env.lastUsed).format('MM-DD HH:mm')}</Text>

            {/* 操作 */}
            <Box display="flex" gap={1}>
                {env.isRunning ? (
                    <Button
                        leadingIcon={StopIcon}
                        variant="outline"
                        size="small"
                        onClick={() => onClose(env.id)}
                    >
                        <Box as="span" sx={{ display: ['none', 'inline'] }}>关闭</Box>
                    </Button>
                ) : (
                    <Button
                        leadingIcon={PlayIcon}
                        variant="primary"
                        size="small"
                        onClick={() => onLaunch(env.id)}
                    >
                        <Box as="span" sx={{ display: ['none', 'inline'] }}>打开</Box>
                    </Button>
                )}
                <Button
                    leadingIcon={TrashIcon}
                    variant="danger"
                    size="small"
                    onClick={() => onDelete(env.id)}
                />
            </Box>
        </Box>
    );

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

            <Box flex={1} border="1px solid" borderColor="border.default" borderRadius={2} overflow="hidden">
                {/* 表头 */}
                <Box 
                    display="grid" 
                    gridTemplateColumns="80px 100px 180px 120px 200px 250px 200px 180px 130px 160px" 
                    gap={2} 
                    py={2} 
                    px={3} 
                    bg="canvas.subtle"
                    borderBottom="1px solid"
                    borderColor="border.default"
                    fontWeight="600"
                >
                    <Text fontSize="12px" color="fg.muted">状态</Text>
                    <Text fontSize="12px" color="fg.muted">ID</Text>
                    <Text fontSize="12px" color="fg.muted">缓存目录</Text>
                    <Text fontSize="12px" color="fg.muted">分组</Text>
                    <Text fontSize="12px" color="fg.muted">名称</Text>
                    <Text fontSize="12px" color="fg.muted">备注</Text>
                    <Text fontSize="12px" color="fg.muted">标签</Text>
                    <Text fontSize="12px" color="fg.muted">代理</Text>
                    <Text fontSize="12px" color="fg.muted">上次使用</Text>
                    <Text fontSize="12px" color="fg.muted">操作</Text>
                </Box>
                
                {/* 表格内容 */}
                <Box 
                    maxHeight={tableHeight} 
                    overflow="auto"
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
                        environments.map(renderEnvironmentRow)
                    )}
                </Box>
            </Box>
        </Box>
    );
};

export default EnvironmentList; 