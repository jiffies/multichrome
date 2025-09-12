import React, { useState } from 'react';
import { Box, IconButton, Tooltip, Dialog, Button, TreeView } from '@primer/react';
import { 
    AppsIcon, 
    FileDirectoryIcon, 
    TrashIcon, 
    GearIcon, 
    XIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    FoldIcon
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
    onToggleCollapse?: () => void; // 切换折叠状态
}

const Sidebar: React.FC<SidebarProps> = ({ 
    groups, 
    currentGroup, 
    onSelectGroup,
    onDeleteGroup,
    emptyGroups = [],
    onSettingsClick,
    onTrashClick,
    collapsed = false,
    onToggleCollapse
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
            <Box 
                as="aside" 
                height="100%" 
                backgroundColor="canvas.default" 
                display="flex" 
                flexDirection="column"
                width={collapsed ? '60px' : '250px'}
                transition="width 0.2s ease"
                borderRight="1px solid"
                borderColor="border.default"
            >
                {/* 顶部折叠按钮 */}
                <Box p={2} borderBottom="1px solid" borderColor="border.default">
                    <Box display="flex" alignItems="center" justifyContent={collapsed ? 'center' : 'space-between'}>
                        {!collapsed && (
                            <Box fontSize="14px" fontWeight="600" color="fg.default">
                                导航
                            </Box>
                        )}
                        <Tooltip aria-label={collapsed ? '展开侧边栏' : '收起侧边栏'}>
                            <IconButton
                                aria-label={collapsed ? '展开侧边栏' : '收起侧边栏'}
                                icon={collapsed ? ChevronRightIcon : ChevronLeftIcon}
                                variant="invisible"
                                onClick={onToggleCollapse}
                                size="small"
                            />
                        </Tooltip>
                    </Box>
                </Box>

                {/* 主导航区域 */}
                <Box flex="1" overflowY="auto" p={collapsed ? 1 : 2}>
                    {collapsed ? (
                        // 折叠状态的简化视图
                        <Box display="flex" flexDirection="column" sx={{ gap: 1 }}>
                            {groups.filter(g => g !== '全部').map(group => (
                                <Tooltip key={group} aria-label={group} side="right">
                                    <IconButton
                                        aria-label={group}
                                        icon={FileDirectoryIcon}
                                        variant={currentGroup === group ? 'default' : 'invisible'}
                                        onClick={() => onSelectGroup(group)}
                                        size="medium"
                                        sx={{ width: '100%' }}
                                    />
                                </Tooltip>
                            ))}
                        </Box>
                    ) : (
                        // 展开状态的TreeView
                        <TreeView aria-label="分组导航">
                            {groups.filter(g => g !== '全部').length > 0 && (
                                <TreeView.Item 
                                    id="groups" 
                                    defaultExpanded
                                    current={currentGroup === '用户分组'}
                                    onSelect={() => onSelectGroup('用户分组')}
                                >
                                    <TreeView.LeadingVisual>
                                        <FoldIcon />
                                    </TreeView.LeadingVisual>
                                    用户分组
                                    <TreeView.SubTree>
                                        {groups.filter(g => g !== '全部').map(group => (
                                            <TreeView.Item 
                                                key={group}
                                                id={group}
                                                current={currentGroup === group}
                                                onSelect={() => onSelectGroup(group)}
                                            >
                                                <TreeView.LeadingVisual>
                                                    <FileDirectoryIcon />
                                                </TreeView.LeadingVisual>
                                                {group}
                                                {emptyGroups.includes(group) && (
                                                    <TreeView.TrailingVisual>
                                                        <Tooltip aria-label="删除空分组">
                                                            <IconButton
                                                                aria-label={`删除分组 ${group}`}
                                                                icon={XIcon}
                                                                size="small"
                                                                variant="invisible"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setDeleteConfirmOpen(group);
                                                                }}
                                                            />
                                                        </Tooltip>
                                                    </TreeView.TrailingVisual>
                                                )}
                                            </TreeView.Item>
                                        ))}
                                    </TreeView.SubTree>
                                </TreeView.Item>
                            )}
                        </TreeView>
                    )}
                </Box>

                {/* 底部工具栏 */}
                <Box borderTop="1px solid" borderColor="border.default" display="flex" alignItems="center" justifyContent="center" sx={{ minHeight: 'auto', py: 2 }}>
                    <Box display="flex" flexDirection={collapsed ? 'column' : 'row'} sx={{ gap: 1 }} justifyContent="center" alignItems="center">
                        <Tooltip aria-label="回收站" side={collapsed ? 'right' : 'top'}>
                            <IconButton
                                aria-label="回收站"
                                icon={TrashIcon}
                                variant="invisible"
                                onClick={onTrashClick}
                                size="medium"
                            />
                        </Tooltip>
                        <Tooltip aria-label="设置" side={collapsed ? 'right' : 'top'}>
                            <IconButton
                                aria-label="设置"
                                icon={GearIcon}
                                variant="invisible"
                                onClick={onSettingsClick}
                                size="medium"
                            />
                        </Tooltip>
                    </Box>
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
