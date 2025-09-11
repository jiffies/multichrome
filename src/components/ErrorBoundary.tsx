import React, { Component, ReactNode } from 'react';
import { Result, Button } from 'antd';
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
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <Result
                        status="error"
                        title="应用出现错误"
                        subTitle="很抱歉，应用遇到了一个问题。请尝试刷新页面。"
                        extra={[
                            <Button type="primary" key="retry" onClick={this.handleRetry}>
                                刷新页面
                            </Button>,
                            <Button 
                                key="details" 
                                onClick={() => {
                                    console.error('错误详情:', this.state.error);
                                    alert(`错误详情: ${this.state.error?.message}`);
                                }}
                            >
                                查看详情
                            </Button>
                        ]}
                    />
                </div>
            );
        }

        return this.props.children;
    }
}