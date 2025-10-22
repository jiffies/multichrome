import React, { useState, useEffect } from 'react';
import { Box, FormControl, TextInput, Button, Flash } from '@primer/react';
import { Dialog } from '@primer/react/experimental';
import { FileDirectoryIcon } from '@primer/octicons-react';

interface SettingsModalProps {
    open: boolean;
    onCancel: () => void;
    onSave: (settings: {
        dataPath: string;
        globalProxy?: {
            enabled: boolean;
            address: string;
        };
    }) => Promise<boolean>;
    currentSettings: {
        dataPath: string;
        globalProxy?: {
            enabled: boolean;
            address: string;
        };
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
    const [proxyEnabled, setProxyEnabled] = useState(false);
    const [proxyAddress, setProxyAddress] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (open) {
            setDataPath(currentSettings.dataPath || '');
            setProxyEnabled(currentSettings.globalProxy?.enabled || false);
            setProxyAddress(currentSettings.globalProxy?.address || '');
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

            const success = await onSave({
                dataPath,
                globalProxy: {
                    enabled: proxyEnabled,
                    address: proxyAddress.trim()
                }
            });
            if (success) {
                setSuccess('设置已保存');
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
        setProxyEnabled(false);
        setProxyAddress('');
        setError('');
        setSuccess('');
        onCancel();
    };

    return (
        <>
            {open && (
                <Dialog
                    title="程序设置"
                    onClose={handleCancel}
                    footerButtons={[
                        {
                            content: '取消',
                            buttonType: 'default',
                            onClick: handleCancel,
                            disabled: loading
                        },
                        {
                            content: loading ? '保存中...' : '保存',
                            buttonType: 'primary',
                            onClick: handleSave,
                            disabled: loading
                        }
                    ]}
                >
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

            <FormControl sx={{ mt: 4 }}>
                <FormControl.Label>全局代理</FormControl.Label>
                <Box display="flex" alignItems="center" sx={{ gap: 2 }}>
                    <Box
                        width="14px"
                        height="14px"
                        borderRadius="50%"
                        bg={proxyEnabled ? "success.emphasis" : "neutral.muted"}
                        sx={{
                            cursor: 'pointer',
                            flexShrink: 0,
                            transition: 'background-color 0.2s'
                        }}
                        onClick={() => setProxyEnabled(!proxyEnabled)}
                        title={proxyEnabled ? "点击禁用代理" : "点击启用代理"}
                    />
                    <Box flex={1}>
                        <TextInput
                            placeholder="例如: socks5://127.0.0.1:10808"
                            value={proxyAddress}
                            onChange={(e) => setProxyAddress(e.target.value)}
                        />
                    </Box>
                </Box>
                <FormControl.Caption>
                    所有窗口将使用此代理。点击圆圈可启用/禁用代理。
                </FormControl.Caption>
            </FormControl>
                </Dialog>
            )}
        </>
    );
};

export default SettingsModal; 