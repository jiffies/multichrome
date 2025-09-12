import React, { useState } from 'react';
import { Box, FormControl, TextInput, Textarea, Select } from '@primer/react';
import { Dialog } from '@primer/react/experimental';

interface CreateEnvironmentModalProps {
    open: boolean;
    onOk: (name: string, groupName: string, notes: string, walletAddress?: string) => void;
    onCancel: () => void;
    groups: string[];
}

const CreateEnvironmentModal: React.FC<CreateEnvironmentModalProps> = ({
    open,
    onOk,
    onCancel,
    groups
}) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        groupName: '',
        notes: '',
        walletAddress: ''
    });
    const [errors, setErrors] = useState<{[key: string]: string}>({});

    // 验证表单
    const validateForm = () => {
        const newErrors: {[key: string]: string} = {};
        
        if (!formData.name.trim()) {
            newErrors.name = '请输入环境名称';
        }
        
        if (!formData.groupName.trim()) {
            newErrors.groupName = '请选择或输入分组';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // 提交表单
    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);
            console.log('表单提交数据:', formData.name, formData.groupName, formData.notes, formData.walletAddress);
            
            await onOk(formData.name, formData.groupName, formData.notes, formData.walletAddress);
            
            // 重置表单
            setFormData({
                name: '',
                groupName: '',
                notes: '',
                walletAddress: ''
            });
            setErrors({});
        } catch (error) {
            console.error('提交失败:', error);
        } finally {
            setLoading(false);
        }
    };

    // 取消
    const handleCancel = () => {
        setFormData({
            name: '',
            groupName: '',
            notes: '',
            walletAddress: ''
        });
        setErrors({});
        onCancel();
    };

    return (
        <>
            {open && (
                <Dialog
                    title="创建新的Chrome环境"
                    onClose={handleCancel}
                    footerButtons={[
                        {
                            content: '取消',
                            buttonType: 'default',
                            onClick: handleCancel,
                            disabled: loading
                        },
                        {
                            content: loading ? '创建中...' : '创建',
                            buttonType: 'primary',
                            onClick: handleSubmit,
                            disabled: loading
                        }
                    ]}
                >
            <Box as="form" display="flex" flexDirection="column" sx={{ gap: 3 }}>
                <FormControl required>
                    <FormControl.Label>环境名称</FormControl.Label>
                    <TextInput
                        placeholder="例如: 工作、个人、测试等"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                    {errors.name && (
                        <FormControl.Validation variant="error">
                            {errors.name}
                        </FormControl.Validation>
                    )}
                </FormControl>

                <FormControl required>
                    <FormControl.Label>分组</FormControl.Label>
                    <TextInput
                        placeholder="输入分组名称，如不存在将自动创建"
                        value={formData.groupName}
                        onChange={(e) => setFormData({...formData, groupName: e.target.value})}
                        list="group-suggestions"
                    />
                    <datalist id="group-suggestions">
                        {groups.map(group => (
                            <option key={group} value={group} />
                        ))}
                    </datalist>
                    {errors.groupName && (
                        <FormControl.Validation variant="error">
                            {errors.groupName}
                        </FormControl.Validation>
                    )}
                </FormControl>

                <FormControl>
                    <FormControl.Label>钱包地址</FormControl.Label>
                    <TextInput
                        placeholder="可选的钱包地址，例如: 0x1234...abcd"
                        value={formData.walletAddress}
                        onChange={(e) => setFormData({...formData, walletAddress: e.target.value})}
                    />
                </FormControl>

                <FormControl>
                    <FormControl.Label>备注</FormControl.Label>
                    <Textarea
                        placeholder="可选的备注信息"
                        rows={3}
                        value={formData.notes}
                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    />
                </FormControl>
                </Box>
                </Dialog>
            )}
        </>
    );
};

export default CreateEnvironmentModal; 