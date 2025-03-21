import React, { useState } from 'react';
import { Modal, Form, Input, Select, Button } from 'antd';

const { Option } = Select;
const { TextArea } = Input;

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
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    // 提交表单
    const handleSubmit = async () => {
        try {
            setLoading(true);
            const values = await form.validateFields();
            
            // 处理groupName，mode="tags"会返回数组，取第一个值作为分组名
            const groupName = Array.isArray(values.groupName) 
                ? values.groupName[0] 
                : values.groupName || '默认分组';  // 如果没有选择，使用默认分组
            
            console.log('表单提交数据:', values.name, groupName, values.notes || '');
            
            onOk(values.name, groupName, values.notes || '');
            form.resetFields();
        } catch (error) {
            console.error('表单验证失败:', error);
        } finally {
            setLoading(false);
        }
    };

    // 取消
    const handleCancel = () => {
        form.resetFields();
        onCancel();
    };

    return (
        <Modal
            title="创建新的Chrome环境"
            open={open}
            onCancel={handleCancel}
            footer={[
                <Button key="cancel" onClick={handleCancel}>
                    取消
                </Button>,
                <Button
                    key="submit"
                    type="primary"
                    loading={loading}
                    onClick={handleSubmit}
                >
                    创建
                </Button>
            ]}
        >
            <Form
                form={form}
                layout="vertical"
                initialValues={{ groupName: groups.length > 0 ? groups[0] : '默认分组' }}
            >
                <Form.Item
                    name="name"
                    label="环境名称"
                    rules={[{ required: true, message: '请输入环境名称' }]}
                >
                    <Input placeholder="例如: 工作、个人、测试等" />
                </Form.Item>

                <Form.Item
                    name="groupName"
                    label="分组"
                    rules={[{ required: true, message: '请选择或输入分组' }]}
                >
                    <Select
                        placeholder="选择或创建新分组"
                        allowClear
                        showSearch
                        optionFilterProp="children"
                        mode="tags"  // 允许创建新的选项
                    >
                        {groups.length > 0 ? (
                            groups.map(group => (
                                <Option key={group} value={group}>
                                    {group}
                                </Option>
                            ))
                        ) : (
                            <Option key="默认分组" value="默认分组">
                                默认分组
                            </Option>
                        )}
                    </Select>
                </Form.Item>

                <Form.Item
                    name="notes"
                    label="备注"
                >
                    <TextArea
                        rows={3}
                        placeholder="可选的备注信息"
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default CreateEnvironmentModal; 