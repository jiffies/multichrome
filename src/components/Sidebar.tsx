import React from 'react';
import { Menu, Button, Tooltip, Popconfirm } from 'antd';
import { FolderOutlined, AppstoreOutlined, DeleteOutlined, SettingOutlined } from '@ant-design/icons';

interface SidebarProps {
    groups: string[];
    currentGroup: string;
    onSelectGroup: (group: string) => void;
    onDeleteGroup?: (group: string) => void;
    emptyGroups: string[]; // 空分组列表
    onSettingsClick?: () => void; // 设置点击回调
}

const Sidebar: React.FC<SidebarProps> = ({ 
    groups, 
    currentGroup, 
    onSelectGroup,
    onDeleteGroup,
    emptyGroups = [],
    onSettingsClick
}) => {
    return (
        <aside className="w-48 bg-white border-r border-gray-200">
            <Menu
                mode="inline"
                selectedKeys={[currentGroup]}
                style={{ height: '100%', borderRight: 0 }}
                items={[
                    {
                        key: '全部',
                        icon: <AppstoreOutlined />,
                        label: '全部',
                        onClick: () => onSelectGroup('全部')
                    },
                    ...groups
                        .filter(group => group !== '全部')
                        .map(group => ({
                            key: group,
                            icon: <FolderOutlined />,
                            label: (
                                <div className="flex justify-between items-center w-full">
                                    <span>{group}</span>
                                    {emptyGroups.includes(group) && onDeleteGroup && (
                                        <Popconfirm
                                            title="确定要删除此分组吗？"
                                            onConfirm={(e) => {
                                                e?.stopPropagation();
                                                onDeleteGroup(group);
                                            }}
                                            okText="是"
                                            cancelText="否"
                                        >
                                            <Tooltip title="删除空分组">
                                                <Button
                                                    type="text"
                                                    size="small"
                                                    icon={<DeleteOutlined />}
                                                    className="opacity-60 hover:opacity-100"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </Tooltip>
                                        </Popconfirm>
                                    )}
                                </div>
                            ),
                            onClick: () => onSelectGroup(group)
                        })),
                    {
                        key: '设置',
                        icon: <SettingOutlined />,
                        label: '设置',
                        onClick: onSettingsClick
                    }
                ]}
            />
        </aside>
    );
};

export default Sidebar; 
