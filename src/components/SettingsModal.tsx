import React, { useState, useEffect } from 'react';
import { Dialog, Box, FormControl, TextInput, Button, Text, Flash } from '@primer/react';
import { FileDirectoryIcon } from '@primer/octicons-react';

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
    const [loading, setLoading] = useState(false);
    const [dataPath, setDataPath] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (open) {
            setDataPath(currentSettings.dataPath || '');
            setError('');
            setSuccess('');
        }
    }, [open, currentSettings]);

    const handleSelectFolder = async () => {
        try {
            if (!window.electronAPI || !window.electronAPI.settings) {
                setError('无法访问系统功能');
                return;
            }
            
            const result = await window.electronAPI.settings.selectFolder();
            if (result && result.canceled === false && result.filePaths.length > 0) {
                setDataPath(result.filePaths[0]);
                setError('');
            }
        } catch (error) {
            console.error('选择文件夹失败:', error);
            setError('选择文件夹失败');
        }
    };

    const handleSave = async () => {
        if (!dataPath.trim()) {
            setError('请输入数据存储位置');
            return;
        }

        try {
            setLoading(true);
            setError('');
            
            const success = await onSave({ dataPath });
            if (success) {
                setSuccess('设置已保存，将在下次启动时生效');
                setTimeout(() => {
                    onCancel();
                }, 1500);
            }
        } catch (error) {
            console.error('保存设置失败:', error);
            setError('保存设置失败');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setDataPath('');
        setError('');
        setSuccess('');
        onCancel();
    };

    if (!open) return null;

    return (
        <Dialog
            isOpen={open}
            onDismiss={handleCancel}
            aria-labelledby="settings-title"
        >
            <Dialog.Header id="settings-title">
                程序设置
            </Dialog.Header>
            
            <Box p={3}>
                {error && (
                    <Flash variant="danger" sx={{ mb: 3 }}>
                        {error}
                    </Flash>
                )}
                
                {success && (
                    <Flash variant="success" sx={{ mb: 3 }}>
                        {success}
                    </Flash>
                )}

                <FormControl required>
                    <FormControl.Label>数据存储位置</FormControl.Label>
                    <Box display="flex" alignItems="center" sx={{ gap: 2 }}>
                        <Box flex={1}>
                            <TextInput
                                placeholder="选择文件夹路径"
                                value={dataPath}
                                onChange={(e) => setDataPath(e.target.value)}
                            />
                        </Box>
                        <Button
                            leadingIcon={FileDirectoryIcon}
                            onClick={handleSelectFolder}
                            variant="outline"
                        >
                            浏览
                        </Button>
                    </Box>
                    <FormControl.Caption>
                        修改后需要重启应用才能生效，数据将被自动迁移到新位置
                    </FormControl.Caption>
                </FormControl>
            </Box>

            <Dialog.Footer>
                <Dialog.Buttons>
                    <Button 
                        variant="primary" 
                        onClick={handleSave}
                        loading={loading}
                        disabled={loading}
                    >
                        保存
                    </Button>
                    <Button 
                        onClick={handleCancel}
                        disabled={loading}
                    >
                        取消
                    </Button>
                </Dialog.Buttons>
            </Dialog.Footer>
        </Dialog>
    );
};

export default SettingsModal; 