import React, { useState, useEffect } from 'react';
import { Modal, Table, Button, Space, Empty, Popconfirm, Tag, message } from 'antd';
import {
    RollbackOutlined,
    DeleteOutlined,
    ClearOutlined,
    ReloadOutlined
} from '@ant-design/icons';
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
    const loadDeletedEnvironments = async () => {
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
    };

    // 恢复环境
    const handleRestore = async (id: string, name: string) => {
        if (!window.electronAPI || !window.electronAPI.trash) {
            handleError(new Error('回收站API未正确加载'), '恢复环境');
            return;
        }
        
        try {
            const success = await window.electronAPI.trash.restore(id);
            if (success) {
                message.success(`环境 "${name}" 已恢复`);
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
                message.success(`环境 "${name}" 已永久删除`);
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
            message.success(`已清理 ${count} 个过期环境`);
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
    }, [open]);

    const columns = [
        {
            title: '名称',
            dataIndex: 'name',
            key: 'name',
            width: '20%',
            minWidth: 150,
        },
        {
            title: '分组',
            dataIndex: 'groupName',
            key: 'groupName',
            width: '12%',
            minWidth: 100,
            render: (groupName: string) => (
                <Tag color="blue">{groupName}</Tag>
            ),
        },
        {
            title: '删除时间',
            dataIndex: 'deletedAt',
            key: 'deletedAt',
            width: '18%',
            minWidth: 160,
            render: (deletedAt?: string) => {
                if (!deletedAt) return '-';
                return dayjs(deletedAt).format('YYYY-MM-DD HH:mm');
            },
        },
        {
            title: '删除时长',
            key: 'deleteAge',
            width: '15%',
            minWidth: 120,
            render: (_: unknown, record: ChromeEnvironment) => {
                if (!record.deletedAt) return '-';
                const days = dayjs().diff(dayjs(record.deletedAt), 'days');
                const isExpiring = days >= 25; // 30天后自动删除，25天时警告
                return (
                    <Tag color={isExpiring ? 'red' : 'default'}>
                        {days} 天前
                        {isExpiring && ' (即将过期)'}
                    </Tag>
                );
            },
        },
        {
            title: '备注',
            dataIndex: 'notes',
            key: 'notes',
            ellipsis: true,
            // 不设置宽度，让它自动填充剩余空间
        },
        {
            title: '操作',
            key: 'actions',
            width: 180,
            fixed: 'right' as const,
            render: (_: unknown, record: ChromeEnvironment) => (
                <Space size="small">
                    <Button
                        type="primary"
                        size="small"
                        icon={<RollbackOutlined />}
                        onClick={() => handleRestore(record.id, record.name)}
                    >
                        恢复
                    </Button>
                    <Popconfirm
                        title="永久删除环境"
                        description="此操作不可恢复，确定要永久删除这个环境吗？"
                        onConfirm={() => handlePermanentlyDelete(record.id, record.name)}
                        okText="确定"
                        cancelText="取消"
                        okType="danger"
                    >
                        <Button
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                        >
                            永久删除
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <Modal
            title="回收站"
            open={open}
            onCancel={onCancel}
            width="80%"
            style={{ maxWidth: '1200px', minWidth: '800px' }}
            footer={[
                <Button key="refresh" icon={<ReloadOutlined />} onClick={loadDeletedEnvironments}>
                    刷新
                </Button>,
                <Popconfirm
                    key="cleanup"
                    title="清空回收站"
                    description="将永久删除所有超过30天的环境，此操作不可恢复。"
                    onConfirm={handleCleanup}
                    okText="确定"
                    cancelText="取消"
                    okType="danger"
                >
                    <Button danger icon={<ClearOutlined />}>
                        清空回收站
                    </Button>
                </Popconfirm>,
                <Button key="close" onClick={onCancel}>
                    关闭
                </Button>,
            ]}
        >
            {deletedEnvironments.length === 0 && !loading ? (
                <Empty
                    description="回收站为空"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
            ) : (
                <Table
                    columns={columns}
                    dataSource={deletedEnvironments}
                    rowKey="id"
                    loading={loading}
                    scroll={{ x: 800 }}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: false,
                        showQuickJumper: true,
                        showTotal: (total) => `共 ${total} 项`,
                    }}
                />
            )}
        </Modal>
    );
};

export default TrashModal;