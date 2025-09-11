import React from 'react';
import { Table, Tooltip } from 'antd';
import { Box, Heading, Button, Label, Text } from '@primer/react';
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
                        点击右上角的"新建窗口"按钮创建你的第一个Chrome环境
                    </Text>
                    <Button variant="primary" leadingIcon={SyncIcon} onClick={onRefresh}>
                        刷新
                    </Button>
                </Box>
            </Box>
        );
    }

    const columns = [
        {
            title: '状态',
            key: 'status',
            width: 80,
            render: (_: any, record: ChromeEnvironment) => (
                <Label variant={record.isRunning ? 'success' : 'default'}>
                    {record.isRunning ? '运行' : '停止'}
                </Label>
            )
        },
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 90,
            responsive: ['lg'] as const,
            render: (id: string) => id.substring(0, 8)
        },
        {
            title: '缓存目录',
            dataIndex: 'dataDir',
            key: 'dataDir',
            width: 120,
            ellipsis: true,
            responsive: ['xl'] as const,
            render: (dataDir: string) => (
                <Tooltip title={dataDir}>
                    <span>{dataDir.split('/').pop()}</span>
                </Tooltip>
            )
        },
        {
            title: '分组',
            dataIndex: 'groupName',
            key: 'groupName',
            width: 120,
            responsive: ['sm'] as const
        },
        {
            title: '名称',
            dataIndex: 'name',
            key: 'name'
        },
        {
            title: '备注',
            dataIndex: 'notes',
            key: 'notes',
            ellipsis: true,
            responsive: ['md'] as const
        },
        {
            title: '标签',
            key: 'tags',
            dataIndex: 'tags',
            width: 200,
            responsive: ['lg'] as const,
            render: (tags: string[]) => (
                <Box>
                    {tags.map(tag => (
                        <Label key={tag} sx={{ mr: 1 }}>{tag}</Label>
                    ))}
                </Box>
            )
        },
        {
            title: '代理',
            dataIndex: 'proxy',
            key: 'proxy',
            width: 200,
            responsive: ['xl'] as const,
            render: (proxy?: string) => proxy || '-'
        },
        {
            title: '上次使用',
            dataIndex: 'lastUsed',
            key: 'lastUsed',
            width: 150,
            responsive: ['lg'] as const,
            render: (lastUsed: string) => dayjs(lastUsed).format('MM-DD HH:mm')
        },
        {
            title: '操作',
            key: 'action',
            width: 150,
            render: (_: any, record: ChromeEnvironment) => (
                <Box display="flex" sx={{ gap: 1 }}>
                    {record.isRunning ? (
                        <Button
                            leadingIcon={StopIcon}
                            variant="outline"
                            size="small"
                            onClick={() => onClose(record.id)}
                        >
                            <Box as="span" sx={{ display: ['none', 'inline'] }}>关闭</Box>
                        </Button>
                    ) : (
                        <Button
                            leadingIcon={PlayIcon}
                            variant="primary"
                            size="small"
                            onClick={() => onLaunch(record.id)}
                        >
                            <Box as="span" sx={{ display: ['none', 'inline'] }}>打开</Box>
                        </Button>
                    )}
                    <Button
                        leadingIcon={TrashIcon}
                        variant="danger"
                        size="small"
                        onClick={() => onDelete(record.id)}
                    />
                </Box>
            )
        }
    ];

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

            <Box flex={1} overflow="auto">
                <Table
                    columns={columns}
                    dataSource={environments}
                    rowKey="id"
                    loading={loading}
                    pagination={false}
                    scroll={{ y: 'calc(100vh - 280px)' }}
                />
            </Box>
        </Box>
    );
};

export default EnvironmentList; 