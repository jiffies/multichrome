import React, { useState, useEffect } from 'react';
import { Box, PageLayout, IconButton, Dialog } from '@primer/react';
import { ThreeBarsIcon } from '@primer/octicons-react';

interface ResponsiveLayoutProps {
    header: React.ReactNode;
    sidebar: React.ReactNode;
    content: React.ReactNode;
    sidebarCollapsed?: boolean;
    onToggleSidebar?: () => void;
}

const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
    header,
    sidebar,
    content,
    sidebarCollapsed = false,
    onToggleSidebar
}) => {
    const [isMobile, setIsMobile] = useState(false);
    const [sidebarVisible, setSidebarVisible] = useState(false);

    // 检测屏幕尺寸
    useEffect(() => {
        const checkScreenSize = () => {
            const width = window.innerWidth;
            setIsMobile(width < 768);
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    // 移动端布局
    if (isMobile) {
        return (
            <>
                <Box height="100vh" display="flex" flexDirection="column" width="100vw">
                    <Box
                        as="header"
                        px={3}
                        py={2}
                        backgroundColor="canvas.default"
                        borderBottomWidth={1}
                        borderBottomStyle="solid"
                        borderBottomColor="border.default"
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                    >
                        <IconButton
                            aria-label="打开菜单"
                            icon={ThreeBarsIcon}
                            variant="invisible"
                            onClick={() => setSidebarVisible(true)}
                            sx={{ display: ['block', 'none'] }}
                        />
                        <Box flex={1}>
                            {header}
                        </Box>
                    </Box>
                    
                    <Box flex={1} overflow="hidden">
                        {content}
                    </Box>
                </Box>
                
                <Dialog
                    isOpen={sidebarVisible}
                    onDismiss={() => setSidebarVisible(false)}
                    aria-labelledby="sidebar-title"
                >
                    <Dialog.Header id="sidebar-title">
                        菜单
                    </Dialog.Header>
                    <Box p={0}>
                        {React.cloneElement(sidebar as React.ReactElement, { 
                            collapsed: false 
                        })}
                    </Box>
                </Dialog>
            </>
        );
    }

    // 桌面端布局
    return (
        <PageLayout containerWidth="full" padding="none" sx={{ height: '100vh', width: '100vw', overflow: 'hidden' }}>
            <PageLayout.Header>
                <Box
                    px={3}
                    py={2}
                    display="flex"
                    alignItems="center"
                    backgroundColor="canvas.default"
                    borderBottomWidth={1}
                    borderBottomStyle="solid"
                    borderBottomColor="border.default"
                >
                    <IconButton
                        aria-label={sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
                        icon={ThreeBarsIcon}
                        variant="invisible"
                        onClick={onToggleSidebar}
                        sx={{ mr: 3 }}
                    />
                    {header}
                </Box>
            </PageLayout.Header>

            <PageLayout.Pane 
                position="start" 
                width={sidebarCollapsed ? 60 : 250}
                resizable={!sidebarCollapsed}
                sx={{ height: '100%', transition: 'width 0.2s ease' }}
            >
                {React.cloneElement(sidebar as React.ReactElement, { 
                    collapsed: sidebarCollapsed 
                })}
            </PageLayout.Pane>

            <PageLayout.Content 
                padding="none" 
                sx={{ 
                    flex: 1, 
                    overflow: 'hidden', 
                    height: 'calc(100vh - 60px)',
                    width: `calc(100vw - ${sidebarCollapsed ? 60 : 250}px)`,
                    transition: 'width 0.2s ease'
                }}
            >
                {content}
            </PageLayout.Content>
        </PageLayout>
    );
};

export default ResponsiveLayout;