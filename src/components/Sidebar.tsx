import React, { useState } from 'react';
import { Box, NavList, IconButton, Tooltip, Dialog, Button } from '@primer/react';
import { 
    AppsIcon, 
    FileDirectoryIcon, 
    TrashIcon, 
    GearIcon, 
    XIcon
} from '@primer/octicons-react';

interface SidebarProps {
    groups: string[];
    currentGroup: string;
    onSelectGroup: (group: string) => void;
    onDeleteGroup?: (group: string) => void;
    emptyGroups: string[]; // 空分组列表
    onSettingsClick?: () => void; // 设置点击回调
    onTrashClick?: () => void; // 回收站点击回调
    collapsed?: boolean; // 是否折叠
}

const Sidebar: React.FC<SidebarProps> = ({ 
    groups, 
    currentGroup, 
    onSelectGroup,
    onDeleteGroup,
    emptyGroups = [],
    onSettingsClick,
    onTrashClick,
    collapsed = false
}) => {
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<string | null>(null);

    const handleDeleteGroup = (groupName: string) => {
        if (onDeleteGroup) {
            onDeleteGroup(groupName);
        }
        setDeleteConfirmOpen(null);
    };

    return (
        <>
            <Box as="aside" height="100%" backgroundColor="canvas.default" display="flex" flexDirection="column">
                {/* 主导航区域 */}
                <Box flex="1" overflowY="auto">
                    <NavList>
                        <NavList.Item 
                            href="#" 
                            aria-current={currentGroup === '全部' ? 'page' : undefined}
                            onClick={(e) => {
                                e.preventDefault();
                                onSelectGroup('全部');
                            }}
                        >
                            <NavList.LeadingVisual>
                                <AppsIcon />
                            </NavList.LeadingVisual>
                            {!collapsed && '全部'}
                        </NavList.Item>

                        {groups
                            .filter(group => group !== '全部')
                            .map(group => (
                                <NavList.Item
                                    key={group}
                                    href="#"
                                    aria-current={currentGroup === group ? 'page' : undefined}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        onSelectGroup(group);
                                    }}
                                >
                                    <NavList.LeadingVisual>
                                        <FileDirectoryIcon />
                                    </NavList.LeadingVisual>
                                    {!collapsed && (
                                        <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                                            <Box>{group}</Box>
                                            {emptyGroups.includes(group) && onDeleteGroup && (
                                                <Tooltip aria-label="删除空分组">
                                                    <IconButton
                                                        aria-label="删除分组"
                                                        icon={XIcon}
                                                        variant="invisible"
                                                        size="small"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setDeleteConfirmOpen(group);
                                                        }}
                                                    />
                                                </Tooltip>
                                            )}
                                        </Box>
                                    )}
                                </NavList.Item>
                            ))
                        }
                    </NavList>
                </Box>

                {/* 底部操作区域 */}
                <Box borderTop="1px solid" borderColor="border.default" pt={2}>
                    <NavList>
                        <NavList.Item 
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                onTrashClick?.();
                            }}
                        >
                            <NavList.LeadingVisual>
                                <TrashIcon />
                            </NavList.LeadingVisual>
                            {!collapsed && '回收站'}
                        </NavList.Item>

                        <NavList.Item 
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                onSettingsClick?.();
                            }}
                        >
                            <NavList.LeadingVisual>
                                <GearIcon />
                            </NavList.LeadingVisual>
                            {!collapsed && '设置'}
                        </NavList.Item>
                    </NavList>
                </Box>
            </Box>

            {deleteConfirmOpen && (
                <Dialog
                    isOpen={true}
                    onDismiss={() => setDeleteConfirmOpen(null)}
                    aria-labelledby="delete-group-title"
                >
                    <Dialog.Header id="delete-group-title">
                        确认删除分组
                    </Dialog.Header>
                    <Box p={3}>
                        确定要删除分组 &quot;{deleteConfirmOpen}&quot; 吗？
                    </Box>
                    <Dialog.Footer>
                        <Box display="flex" justifyContent="flex-end" sx={{ gap: 2 }}>
                            <Button onClick={() => setDeleteConfirmOpen(null)}>
                                取消
                            </Button>
                            <Button 
                                variant="danger"
                                onClick={() => handleDeleteGroup(deleteConfirmOpen)}
                            >
                                删除
                            </Button>
                        </Box>
                    </Dialog.Footer>
                </Dialog>
            )}
        </>
    );
};

export default Sidebar; 
