import WebSocket from 'ws';
import log from 'electron-log';
import http from 'http';

// CDP 连接信息
interface CDPConnection {
    ws: WebSocket;
    debugUrl: string;
    debugPort: number;
    envId: string;
    browserPID: number | null;
    connected: boolean;
    reconnectAttempts: number;
    reconnectTimer: NodeJS.Timeout | null;
    onDisconnect: () => void;
}

// CDP 管理器类
export class CDPManager {
    private connections: Map<string, CDPConnection> = new Map();
    private readonly MAX_RECONNECT_ATTEMPTS = 3; // 最大重连次数
    private readonly RECONNECT_DELAY = 2000; // 重连延迟 2秒

    /**
     * 获取 WebSocket 调试 URL
     */
    private async getBrowserWebSocketUrl(port: number): Promise<string | null> {
        return new Promise((resolve) => {
            // 使用 127.0.0.1 而不是 localhost，避免 IPv6 问题
            const req = http.get(`http://127.0.0.1:${port}/json/version`, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        const wsUrl = json.webSocketDebuggerUrl;
                        if (wsUrl) {
                            resolve(wsUrl);
                        } else {
                            resolve(null);
                        }
                    } catch (error) {
                        resolve(null);
                    }
                });
            });

            req.on('error', () => {
                resolve(null);
            });

            req.setTimeout(3000, () => {
                req.destroy();
                resolve(null);
            });
        });
    }

    /**
     * 尝试重连 CDP
     */
    private async attemptReconnect(envId: string, debugPort: number, onDisconnect: () => void): Promise<void> {
        const connection = this.connections.get(envId);
        if (!connection) {
            return;
        }

        // 检查是否超过最大重连次数
        if (connection.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
            this.connections.delete(envId);
            onDisconnect();
            return;
        }

        connection.reconnectAttempts++;

        // 检查浏览器是否仍在运行
        const wsUrl = await this.getBrowserWebSocketUrl(debugPort);
        if (!wsUrl) {
            this.connections.delete(envId);
            onDisconnect();
            return;
        }

        // 创建新的 WebSocket 连接
        this.createWebSocketConnection(envId, debugPort, wsUrl, onDisconnect);
    }

    /**
     * 创建 WebSocket 连接
     */
    private createWebSocketConnection(envId: string, debugPort: number, wsUrl: string, onDisconnect: () => void): void {
        const ws = new WebSocket(wsUrl);

        // 获取或创建连接对象
        let connection = this.connections.get(envId);
        if (!connection) {
            connection = {
                ws,
                debugUrl: wsUrl,
                debugPort,
                envId,
                browserPID: null,
                connected: false,
                reconnectAttempts: 0,
                reconnectTimer: null,
                onDisconnect
            };
            this.connections.set(envId, connection);
        } else {
            // 更新现有连接
            connection.ws = ws;
            connection.debugUrl = wsUrl;
        }

        // WebSocket 连接成功
        ws.on('open', () => {
            connection!.connected = true;
            connection!.reconnectAttempts = 0; // 重置重连计数
        });

        // WebSocket 消息
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                // 处理事件
                if (message.method) {
                    this.handleCDPEvent(envId, message.method);
                }
            } catch (error) {
                // 忽略解析错误
            }
        });

        // WebSocket 关闭
        ws.on('close', () => {
            if (!connection) return;

            connection.connected = false;

            // 清理之前的重连定时器
            if (connection.reconnectTimer) {
                clearTimeout(connection.reconnectTimer);
            }

            // 尝试重连
            connection.reconnectTimer = setTimeout(() => {
                this.attemptReconnect(envId, debugPort, onDisconnect);
            }, this.RECONNECT_DELAY);
        });

        // WebSocket 错误
        ws.on('error', () => {
            // 错误后会触发 close 事件，在那里处理重连
        });
    }

    /**
     * 连接到 Chrome CDP
     */
    public async connect(envId: string, debugPort: number, onDisconnect: () => void): Promise<boolean> {
        try {
            // 获取 WebSocket URL
            const wsUrl = await this.getBrowserWebSocketUrl(debugPort);
            if (!wsUrl) {
                return false;
            }

            // 创建 WebSocket 连接
            this.createWebSocketConnection(envId, debugPort, wsUrl, onDisconnect);
            return true;

        } catch (error) {
            return false;
        }
    }

    /**
     * 处理 CDP 事件
     */
    private handleCDPEvent(envId: string, method: string): void {
        // 仅记录关键事件
        if (method === 'Inspector.targetCrashed') {
            log.warn(`浏览器崩溃: ${envId.substring(0, 8)}`);
        }
    }

    /**
     * 断开 CDP 连接
     */
    public disconnect(envId: string): void {
        const connection = this.connections.get(envId);
        if (connection) {
            // 清理重连定时器
            if (connection.reconnectTimer) {
                clearTimeout(connection.reconnectTimer);
                connection.reconnectTimer = null;
            }

            try {
                connection.ws.close();
            } catch (error) {
                // 忽略关闭错误
            }
            this.connections.delete(envId);
        }
    }

    /**
     * 检查连接状态
     */
    public isConnected(envId: string): boolean {
        const connection = this.connections.get(envId);
        return connection ? connection.connected : false;
    }

    /**
     * 清理所有连接
     */
    public cleanup(): void {
        for (const connection of this.connections.values()) {
            // 清理重连定时器
            if (connection.reconnectTimer) {
                clearTimeout(connection.reconnectTimer);
            }

            try {
                connection.ws.close();
            } catch (error) {
                // 忽略关闭错误
            }
        }
        this.connections.clear();
    }
}
