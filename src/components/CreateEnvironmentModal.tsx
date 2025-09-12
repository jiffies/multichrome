import React, { useState } from 'react';
import { Box, FormControl, TextInput, Textarea, Select } from '@primer/react';
import { Dialog } from '@primer/react/experimental';

interface CreateEnvironmentModalProps {
    open: boolean;
    onOk: (name: string, groupName: string, notes: string) => void;
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
        groupName: groups.length > 0 ? groups[0] : '默认分组',
        notes: ''
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
            console.log('表单提交数据:', formData.name, formData.groupName, formData.notes);
            
            await onOk(formData.name, formData.groupName, formData.notes);
            
            // 重置表单
            setFormData({
                name: '',
                groupName: groups.length > 0 ? groups[0] : '默认分组',
                notes: ''
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
            groupName: groups.length > 0 ? groups[0] : '默认分组',
            notes: ''
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
                    <Select
                        placeholder="选择或创建新分组"
                        value={formData.groupName}
                        onChange={(e) => setFormData({...formData, groupName: e.target.value})}
                    >
                        {groups.length > 0 ? (
                            groups.map(group => (
                                <Select.Option key={group} value={group}>
                                    {group}
                                </Select.Option>
                            ))
                        ) : (
                            <Select.Option value="默认分组">
                                默认分组
                            </Select.Option>
                        )}
                    </Select>
                    {errors.groupName && (
                        <FormControl.Validation variant="error">
                            {errors.groupName}
                        </FormControl.Validation>
                    )}
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