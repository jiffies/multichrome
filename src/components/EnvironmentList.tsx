import React from 'react';
import { Table, Button, Tag, Space, Empty, Alert, Tooltip } from 'antd';
import {
    PlayCircleOutlined,
    CloseCircleOutlined,
    DeleteOutlined,
    ReloadOutlined,
    InfoCircleOutlined
} from '@ant-design/icons';
import { ChromeEnvironment } from '../types';
import dayjs from 'dayjs';

interface EnvironmentListProps {
    environments: ChromeEnvironment[];
    loading: boolean;
    error: string | null;
    onLaunch: (id: string) => void;
    onClose: (id: string) => void;
    onDelete: (id: string) => void;
    onRefresh: () => void;
}

const EnvironmentList: React.FC<EnvironmentListProps> = ({
    environments,
    loading,
    error,
    onLaunch,
    onClose,
    onDelete,
    onRefresh
}) => {
    // 如果有错误，显示错误信息
    if (error) {
        return (
            <Alert
                message="错误"
                description={error}
                type="error"
                showIcon
                action={
                    <Button onClick={onRefresh} icon={<ReloadOutlined />}>
                        重试
                    </Button>
                }
            />
        );
    }

    // 如果没有环境，显示空状态
    if (!loading && environments.length === 0) {
        return (
            <Empty
                description="没有Chrome环境"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
                <Button type="primary" onClick={onRefresh} icon={<ReloadOutlined />}>
                    刷新
                </Button>
            </Empty>
        );
    }

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 90,
            render: (id: string) => id.substring(0, 8)
        },
        {
            title: '缓存目录',
            dataIndex: 'dataDir',
            key: 'dataDir',
            width: 120,
            ellipsis: true,
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
            width: 120
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
            ellipsis: true
        },
        {
            title: '标签',
            key: 'tags',
            dataIndex: 'tags',
            width: 200,
            render: (tags: string[]) => (
                <span>
                    {tags.map(tag => (
                        <Tag key={tag}>{tag}</Tag>
                    ))}
                </span>
            )
        },
        {
            title: '代理',
            dataIndex: 'proxy',
            key: 'proxy',
            width: 200,
            render: (proxy?: string) => proxy || '-'
        },
        {
            title: '上次使用',
            dataIndex: 'lastUsed',
            key: 'lastUsed',
            width: 150,
            render: (lastUsed: string) => dayjs(lastUsed).format('YYYY-MM-DD HH:mm')
        },
        {
            title: '操作',
            key: 'action',
            width: 150,
            render: (_, record: ChromeEnvironment) => (
                <Space size="small">
                    {record.isRunning ? (
                        <Button
                            icon={<CloseCircleOutlined />}
                            type="default"
                            onClick={() => onClose(record.id)}
                            size="small"
                        >
                            关闭
                        </Button>
                    ) : (
                        <Button
                            icon={<PlayCircleOutlined />}
                            type="primary"
                            onClick={() => onLaunch(record.id)}
                            size="small"
                        >
                            打开
                        </Button>
                    )}
                    <Button
                        icon={<DeleteOutlined />}
                        danger
                        type="link"
                        onClick={() => onDelete(record.id)}
                        size="small"
                    />
                </Space>
            )
        }
    ];

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">窗口管理</h2>
                <Button
                    type="default"
                    icon={<ReloadOutlined />}
                    onClick={onRefresh}
                >
                    刷新列表
                </Button>
            </div>

            <div className="flex-1 overflow-auto">
                <Table
                    columns={columns}
                    dataSource={environments}
                    rowKey="id"
                    loading={loading}
                    pagination={false}
                    scroll={{ y: 'calc(100vh - 280px)' }}
                />
            </div>
        </div>
    );
};

export default EnvironmentList; 