import React from 'react';
import { Menu } from 'antd';
import { FolderOutlined, AppstoreOutlined } from '@ant-design/icons';

interface SidebarProps {
    groups: string[];
    currentGroup: string;
    onSelectGroup: (group: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ groups, currentGroup, onSelectGroup }) => {
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
                            label: group,
                            onClick: () => onSelectGroup(group)
                        }))
                ]}
            />
        </aside>
    );
};

export default Sidebar; 
