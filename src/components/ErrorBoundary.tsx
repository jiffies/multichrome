import React, { Component, ReactNode } from 'react';
import { Box, Button, Heading, Text } from '@primer/react';
import { AlertIcon } from '@primer/octicons-react';
import { handleGlobalError } from '../hooks/useErrorHandler';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // 调用全局错误处理
        handleGlobalError(error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: undefined });
        // 刷新页面
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <Box 
                    display="flex" 
                    alignItems="center" 
                    justifyContent="center" 
                    minHeight="100vh"
                    bg="canvas.subtle"
                    p={6}
                >
                    <Box 
                        textAlign="center" 
                        maxWidth="600px"
                        p={6}
                        bg="canvas.default"
                        borderRadius={2}
                        border="1px solid"
                        borderColor="border.default"
                    >
                        <Box mb={4}>
                            <AlertIcon size={64} color="danger.fg" />
                        </Box>
                        
                        <Heading as="h1" sx={{ fontSize: 4, mb: 3, color: 'danger.fg' }}>
                            应用出现错误
                        </Heading>
                        
                        <Text sx={{ fontSize: 2, mb: 4, color: 'fg.muted' }}>
                            很抱歉，应用遇到了一个问题。请尝试刷新页面。
                        </Text>
                        
                        <Box display="flex" gap={3} justifyContent="center">
                            <Button 
                                variant="primary" 
                                onClick={this.handleRetry}
                            >
                                刷新页面
                            </Button>
                            <Button 
                                variant="outline"
                                onClick={() => {
                                    console.error('错误详情:', this.state.error);
                                    alert(`错误详情: ${this.state.error?.message}`);
                                }}
                            >
                                查看详情
                            </Button>
                        </Box>
                    </Box>
                </Box>
            );
        }

        return this.props.children;
    }
}