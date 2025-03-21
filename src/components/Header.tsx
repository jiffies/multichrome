import React from 'react';
import { Button, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const { Title } = Typography;

interface HeaderProps {
    onCreateEnvironment: () => void;
}

const Header: React.FC<HeaderProps> = ({ onCreateEnvironment }) => {
    return (
        <header className="flex items-center justify-between px-6 py-4 bg-white shadow-sm">
            <div className="flex items-center">
                <Title level={4} style={{ margin: 0 }}>
                    MultiChrome - Chrome多环境管理
                </Title>
            </div>

            <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={onCreateEnvironment}
            >
                新建窗口
            </Button>
        </header>
    );
};

export default Header; 