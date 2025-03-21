import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import { FolderOutlined } from '@ant-design/icons';

interface SettingsModalProps {
    open: boolean;
    onCancel: () => void;
    onSave: (settings: { dataPath: string }) => Promise<boolean>;
    currentSettings: {
        dataPath: string;
    };
}

const SettingsModal: React.FC<SettingsModalProps> = ({
    open,
    onCancel,
    onSave,
    currentSettings
}) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            form.setFieldsValue({
                dataPath: currentSettings.dataPath
            });
        }
    }, [open, form, currentSettings]);

    const handleSelectFolder = async () => {
        try {
            if (!window.electronAPI || !window.electronAPI.settings) {
                message.error('无法访问系统功能');
                return;
            }
            
            const result = await window.electronAPI.settings.selectFolder();
            if (result && result.canceled === false && result.filePaths.length > 0) {
                form.setFieldsValue({ dataPath: result.filePaths[0] });
            }
        } catch (error) {
            console.error('选择文件夹失败:', error);
            message.error('选择文件夹失败');
        }
    };

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);
            
            const success = await onSave(values);
            if (success) {
                message.success('设置已保存，将在下次启动时生效');
                onCancel();
            }
        } catch (error) {
            console.error('保存设置失败:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="程序设置"
            open={open}
            onCancel={onCancel}
            footer={[
                <Button key="back" onClick={onCancel}>
                    取消
                </Button>,
                <Button 
                    key="submit" 
                    type="primary" 
                    loading={loading} 
                    onClick={handleSave}
                >
                    保存
                </Button>
            ]}
        >
            <Form
                form={form}
                layout="vertical"
                initialValues={currentSettings}
            >
                <Form.Item
                    name="dataPath"
                    label="数据存储位置"
                    rules={[{ required: true, message: '请输入数据存储位置' }]}
                    help="修改后需要重启应用才能生效，数据将被自动迁移到新位置"
                >
                    <Input 
                        placeholder="选择文件夹路径" 
                        addonAfter={
                            <Button 
                                icon={<FolderOutlined />} 
                                onClick={handleSelectFolder}
                                type="text"
                                style={{ border: 'none', padding: 0 }}
                            />
                        }
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default SettingsModal; 