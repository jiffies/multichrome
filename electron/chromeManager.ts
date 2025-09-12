import { spawn, ChildProcess, execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import Database from 'better-sqlite3';
import Store from 'electron-store';
import log from 'electron-log';
import { app, BrowserWindow } from 'electron';
import os from 'os';
import { SettingsManager } from './settingsManager.js';

// Chrome环境接口
export interface ChromeEnvironment {
    id: string;
    name: string;
    groupName: string;
    notes: string;
    walletAddress?: string; // 钱包地址
    dataDir: string;
    tags: string[];
    proxy?: string;
    userAgent?: string;
    createdAt: string;
    lastUsed: string;
    deletedAt?: string; // 软删除时间戳
    isRunning: boolean;
    processId?: number;
}

// 表示数据库中存储的原始环境结构
interface DBEnvironment {
    id: string;
    name: string;
    groupName: string;
    notes: string;
    walletAddress?: string; // 钱包地址
    dataDir: string;
    tags: string; // 数据库中是JSON字符串
    proxy?: string;
    userAgent?: string;
    createdAt: string;
    lastUsed: string;
    deletedAt?: string;
}

// Chrome管理器类
export class ChromeManager {
    private db: Database.Database;
    private store: Store<{
        chromeExecutablePath: unknown;
    }>;
    private runningProcesses: Map<string, ChildProcess>;
    private defaultChromeDataDir: string;
    private environmentsDataDir: string;
    private settingsManager: SettingsManager;
    private appDataPath: string;
    private statusCheckInterval: NodeJS.Timeout | null = null;
    private mainWindow: BrowserWindow | null = null;

    constructor() {
        // 初始化设置管理器
        this.settingsManager = new SettingsManager();
        
        // 获取应用数据路径
        this.appDataPath = this.settingsManager.getSettings().dataPath || app.getPath('userData');
        log.info(`App data path: ${this.appDataPath}`);
        
        // 初始化存储目录
        this.environmentsDataDir = path.join(this.appDataPath, 'environments');
        console.log(`Environment data directory: ${this.environmentsDataDir}`);
        
        // 确保目录存在
        if (!fs.existsSync(this.environmentsDataDir)) {
            fs.mkdirSync(this.environmentsDataDir, { recursive: true });
        }

        // 默认Chrome数据目录
        this.defaultChromeDataDir = this.getDefaultChromeDataDir();

        // 初始化数据库
        const dbPath = path.join(this.appDataPath, 'chrome-environments.db');
        this.db = new Database(dbPath);

        // 初始化存储
        this.store = new Store({
            name: 'config',
            cwd: this.appDataPath,
            schema: {
                chromeExecutablePath: {
                    type: 'string',
                    default: this.findChromeExecutable()
                }
            }
        });

        // 初始化运行进程Map
        this.runningProcesses = new Map();

        // 初始化数据库表
        this.initDatabase();

        // 启动状态检查定时器
        this.startStatusMonitoring();

        log.info('ChromeManager initialized');
    }

    // 设置主窗口引用
    public setMainWindow(window: BrowserWindow): void {
        this.mainWindow = window;
    }

    // 启动状态监控
    private startStatusMonitoring(): void {
        // 每5秒检查一次进程状态
        this.statusCheckInterval = setInterval(() => {
            this.checkProcessStatus();
        }, 5000);
    }

    // 检查进程状态
    private async checkProcessStatus(): Promise<void> {
        try {
            let statusChanged = false;
            const idsToRemove: string[] = [];

            log.debug(`检查进程状态: 当前运行中进程数量=${this.runningProcesses.size}`);

            // 检查每个运行中的进程
            for (const [id, processInfo] of this.runningProcesses.entries()) {
                const dataDir = (processInfo as any).dataDir;
                if (!dataDir) continue;

                // 使用PowerShell命令直接检查进程是否存在
                const isRunning = await this.checkChromeProcessByDataDir(dataDir);
                
                if (!isRunning) {
                    idsToRemove.push(id);
                    statusChanged = true;
                    log.info(`检测到Chrome环境进程已结束: ID=${id}, DataDir=${dataDir}`);
                } else {
                    log.debug(`Chrome进程正在运行: ID=${id}, DataDir=${dataDir}`);
                }
            }

            // 移除已结束的进程
            idsToRemove.forEach(id => {
                this.runningProcesses.delete(id);
            });

            // 如果状态发生变化，通知前端
            if (statusChanged && this.mainWindow && !this.mainWindow.isDestroyed()) {
                log.info(`进程状态发生变化，通知前端更新: 变化数量=${idsToRemove.length}`);
                this.mainWindow.webContents.send('chrome-status-changed');
            }
        } catch (error) {
            log.error('检查进程状态失败:', error);
        }
    }

    // 检查进程是否还在运行
    private isProcessRunning(process: ChildProcess): boolean {
        // 进程已被杀死
        if (process.killed) {
            return false;
        }

        // 进程已退出
        if (process.exitCode !== null) {
            return false;
        }

        // 没有PID说明进程异常
        if (!process.pid) {
            return false;
        }

        // 尝试发送0信号来检查进程是否存在（跨平台方法）
        try {
            // 发送0信号不会真正杀死进程，只是检查进程是否存在
            process.kill(0);
            return true;
        } catch (error) {
            // 如果抛出异常，说明进程不存在
            return false;
        }
    }

    // 停止状态监控
    public stopStatusMonitoring(): void {
        if (this.statusCheckInterval) {
            clearInterval(this.statusCheckInterval);
            this.statusCheckInterval = null;
        }
    }

    // 初始化数据库表
    private initDatabase(): void {
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS environments (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        groupName TEXT NOT NULL,
        notes TEXT,
        dataDir TEXT NOT NULL,
        tags TEXT,
        proxy TEXT,
        userAgent TEXT,
        createdAt TEXT NOT NULL,
        lastUsed TEXT NOT NULL,
        deletedAt TEXT
      );
    `);
        
        // 检查是否需要迁移现有数据
        this.migrateDatabase();
    }
    
    // 数据库迁移
    private migrateDatabase(): void {
        try {
            // 检查表结构信息
            const tableInfo = this.db.prepare("PRAGMA table_info(environments)").all() as Array<{name: string}>;
            
            // 检查 deletedAt 列是否存在
            const hasDeletedAt = tableInfo.some(column => column.name === 'deletedAt');
            if (!hasDeletedAt) {
                this.db.exec('ALTER TABLE environments ADD COLUMN deletedAt TEXT');
                log.info('数据库已迁移：添加 deletedAt 列');
            }
            
            // 检查 walletAddress 列是否存在
            const hasWalletAddress = tableInfo.some(column => column.name === 'walletAddress');
            if (!hasWalletAddress) {
                this.db.exec('ALTER TABLE environments ADD COLUMN walletAddress TEXT');
                log.info('数据库已迁移：添加 walletAddress 列');
            }
        } catch (error) {
            log.error('数据库迁移失败:', error);
        }
    }

    // 获取默认Chrome数据目录
    private getDefaultChromeDataDir(): string {
        switch (process.platform) {
            case 'win32':
                return path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'User Data');
            case 'darwin':
                return path.join(os.homedir(), 'Library', 'Application Support', 'Google', 'Chrome');
            case 'linux':
                return path.join(os.homedir(), '.config', 'google-chrome');
            default:
                return '';
        }
    }

    // 查找Chrome可执行文件路径
    private findChromeExecutable(): string {
        if (process.platform === 'win32') {
            // Windows平台常见Chrome安装路径
            const commonPaths = [
                path.join('C:', 'Program Files', 'Google', 'Chrome', 'Application', 'chrome.exe'),
                path.join('C:', 'Program Files (x86)', 'Google', 'Chrome', 'Application', 'chrome.exe'),
                path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe')
            ];

            for (const chromePath of commonPaths) {
                if (fs.existsSync(chromePath)) {
                    return chromePath;
                }
            }
        } else if (process.platform === 'darwin') {
            return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
        } else if (process.platform === 'linux') {
            // Linux平台尝试查找chrome或google-chrome
            const possibleNames = ['google-chrome', 'chrome', 'chromium-browser', 'chromium'];
            for (const name of possibleNames) {
                try {
                    // 尝试使用which命令查找可执行文件路径
                    const chromePath = execSync(`which ${name}`).toString().trim();
                    if (chromePath) {
                        return chromePath;
                    }
                } catch (error) {
                    // 忽略错误，继续尝试下一个可能的名称
                }
            }
        }

        // 未找到Chrome，返回空字符串
        log.warn('未找到Chrome可执行文件');
        return '';
    }

    // 获取所有Chrome环境（排除已删除的）
    public async getAllEnvironments(): Promise<ChromeEnvironment[]> {
        try {
            const query = this.db.prepare('SELECT * FROM environments WHERE deletedAt IS NULL ORDER BY lastUsed DESC');
            const dbEnvironments = query.all() as DBEnvironment[];

            // 转换为应用使用的结构
            return dbEnvironments.map(dbEnv => ({
                ...dbEnv,
                tags: dbEnv.tags ? JSON.parse(dbEnv.tags) as string[] : [],
                isRunning: this.runningProcesses.has(dbEnv.id)
            }));
        } catch (error) {
            log.error('获取所有环境失败:', error);
            throw error;
        }
    }
    
    // 获取回收站中的环境
    public async getDeletedEnvironments(): Promise<ChromeEnvironment[]> {
        try {
            const query = this.db.prepare('SELECT * FROM environments WHERE deletedAt IS NOT NULL ORDER BY deletedAt DESC');
            const dbEnvironments = query.all() as DBEnvironment[];

            // 转换为应用使用的结构
            return dbEnvironments.map(dbEnv => ({
                ...dbEnv,
                tags: dbEnv.tags ? JSON.parse(dbEnv.tags) as string[] : [],
                isRunning: false // 已删除的环境不应该在运行
            }));
        } catch (error) {
            log.error('获取已删除环境失败:', error);
            throw error;
        }
    }

    // 创建新的Chrome环境
    public async createEnvironment(name: string, groupName: string, notes: string = '', walletAddress?: string): Promise<ChromeEnvironment> {
        try {
            // 生成唯一ID
            const id = uuidv4();

            // 创建环境数据目录
            const envId = id.substring(0, 8);
            const dataDir = path.join(this.environmentsDataDir, envId);

            // 确保目录存在
            fs.mkdirSync(dataDir, { recursive: true });

            // 创建日期
            const now = new Date().toISOString();

            // 创建环境记录
            const env: ChromeEnvironment = {
                id,
                name,
                groupName,
                notes,
                walletAddress,
                dataDir,
                tags: [],
                createdAt: now,
                lastUsed: now,
                isRunning: false
            };

            // 保存到数据库
            const stmt = this.db.prepare(`
        INSERT INTO environments 
        (id, name, groupName, notes, walletAddress, dataDir, tags, createdAt, lastUsed) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

            stmt.run(
                env.id,
                env.name,
                env.groupName,
                env.notes,
                env.walletAddress,
                env.dataDir,
                JSON.stringify(env.tags),
                env.createdAt,
                env.lastUsed
            );

            log.info(`创建新环境: ${name} (${id})`);
            return env;
        } catch (error) {
            log.error('创建环境失败:', error);
            throw error;
        }
    }

    // 启动Chrome环境
    public async launchEnvironment(id: string): Promise<boolean> {
        try {
            // 检查环境是否存在
            const stmt = this.db.prepare('SELECT * FROM environments WHERE id = ?');
            const env = stmt.get(id) as ChromeEnvironment;

            if (!env) {
                log.error(`环境未找到: ${id}`);
                throw new Error(`环境未找到: ${id}`);
            }

            // 检查是否已经在运行
            if (this.runningProcesses.has(id)) {
                log.info(`环境已在运行: ${env.name} (${id})`);
                return true;
            }

            // 获取Chrome可执行文件路径
            const chromePath = this.store.get('chromeExecutablePath') as string;

            if (!chromePath || !fs.existsSync(chromePath)) {
                log.error('Chrome可执行文件未找到');
                throw new Error('Chrome可执行文件未找到');
            }

            // 准备启动参数
            const args = [
                `--user-data-dir=${env.dataDir}`,// 指定用户数据目录，每个环境独立
                '--no-first-run',              // 禁用首次运行向导
                '--no-default-browser-check'   // 禁用默认浏览器检查
            ];

            // 添加代理设置（如果有）
            if (env.proxy) {
                args.push(`--proxy-server=${env.proxy}`);
            }

            // 添加用户代理（如果有）
            if (env.userAgent) {
                args.push(`--user-agent=${env.userAgent}`);
            }

            // 打印完整的启动命令和参数
            console.log(`执行Chrome启动命令: ${chromePath} ${args.join(' ')}`);

            // Windows平台的Chrome启动配置
            const spawnOptions = process.platform === 'win32' ? {
                detached: false,  // Windows下不分离进程
                stdio: 'ignore' as const,
                windowsHide: false  // 允许显示Chrome窗口
            } : {
                detached: true,
                stdio: 'ignore' as const
            };

            // 启动Chrome进程
            const chromeProcess = spawn(chromePath, args, spawnOptions);

            // 更新最后使用时间
            this.db.prepare('UPDATE environments SET lastUsed = ? WHERE id = ?')
                .run(new Date().toISOString(), id);

            log.info(`Chrome启动命令已执行，环境=${env.name} (${id})`);
            
            // 简单记录启动请求（不跟踪启动进程PID）
            this.runningProcesses.set(id, { 
                pid: 0, // 占位符，实际PID由定时检查获得
                dataDir: env.dataDir 
            } as any);

            log.info(`启动Chrome环境: ${env.name} (${id})`);
            return true;
        } catch (error) {
            log.error('启动环境失败:', error);
            throw error;
        }
    }

    // 关闭Chrome环境
    public async closeEnvironment(id: string): Promise<boolean> {
        try {
            const process = this.runningProcesses.get(id);

            if (!process) {
                log.warn(`尝试关闭未运行的环境: ${id}`);
                return false;
            }

            log.info(`开始关闭Chrome环境: ID=${id}, PID=${process.pid}`);

            // 尝试正常关闭进程
            if (process.pid) {
                process.kill('SIGTERM'); // 使用SIGTERM信号正常关闭
                
                // 等待一段时间后强制关闭
                setTimeout(() => {
                    if (this.runningProcesses.has(id) && !process.killed) {
                        log.warn(`进程未正常关闭，强制杀死: ID=${id}, PID=${process.pid}`);
                        process.kill('SIGKILL');
                    }
                }, 3000);
            }

            this.runningProcesses.delete(id);

            log.info(`Chrome环境关闭请求已发送: ID=${id}, PID=${process.pid}`);
            return true;
        } catch (error) {
            log.error('关闭环境失败:', error);
            throw error;
        }
    }

    // 软删除Chrome环境（移到回收站）
    public async deleteEnvironment(id: string): Promise<boolean> {
        try {
            // 首先尝试关闭环境（如果正在运行）
            if (this.runningProcesses.has(id)) {
                await this.closeEnvironment(id);
            }

            // 获取环境信息
            const stmt = this.db.prepare('SELECT * FROM environments WHERE id = ? AND deletedAt IS NULL');
            const env = stmt.get(id) as ChromeEnvironment;

            if (!env) {
                log.error(`尝试删除不存在或已删除的环境: ${id}`);
                return false;
            }

            // 软删除：设置 deletedAt 时间戳
            const deletedAt = new Date().toISOString();
            this.db.prepare('UPDATE environments SET deletedAt = ? WHERE id = ?').run(deletedAt, id);

            log.info(`软删除Chrome环境: ${env.name} (${id})`);
            return true;
        } catch (error) {
            log.error('软删除环境失败:', error);
            throw error;
        }
    }
    
    // 从回收站恢复环境
    public async restoreEnvironment(id: string): Promise<boolean> {
        try {
            // 获取已删除环境信息
            const stmt = this.db.prepare('SELECT * FROM environments WHERE id = ? AND deletedAt IS NOT NULL');
            const env = stmt.get(id) as ChromeEnvironment;

            if (!env) {
                log.error(`尝试恢复不存在或未删除的环境: ${id}`);
                return false;
            }

            // 恢复：移除 deletedAt 时间戳
            this.db.prepare('UPDATE environments SET deletedAt = NULL WHERE id = ?').run(id);

            log.info(`恢复Chrome环境: ${env.name} (${id})`);
            return true;
        } catch (error) {
            log.error('恢复环境失败:', error);
            throw error;
        }
    }
    
    // 永久删除环境（从回收站彻底删除）
    public async permanentlyDeleteEnvironment(id: string): Promise<boolean> {
        try {
            // 获取已删除环境信息
            const stmt = this.db.prepare('SELECT * FROM environments WHERE id = ? AND deletedAt IS NOT NULL');
            const env = stmt.get(id) as DBEnvironment;

            if (!env) {
                log.error(`尝试永久删除不存在或未删除的环境: ${id}`);
                return false;
            }

            // 从数据库中彻底删除环境
            this.db.prepare('DELETE FROM environments WHERE id = ?').run(id);

            // 删除环境数据目录
            if (fs.existsSync(env.dataDir)) {
                fs.rmSync(env.dataDir, { recursive: true, force: true });
            }

            log.info(`永久删除Chrome环境: ${env.name} (${id})`);
            return true;
        } catch (error) {
            log.error('永久删除环境失败:', error);
            throw error;
        }
    }
    
    // 清空回收站（删除超过30天的环境）
    public async cleanupTrash(): Promise<number> {
        try {
            // 计算30天前的时间戳
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const cutoffDate = thirtyDaysAgo.toISOString();

            // 获取需要清理的环境
            const stmt = this.db.prepare('SELECT * FROM environments WHERE deletedAt IS NOT NULL AND deletedAt < ?');
            const envs = stmt.all(cutoffDate) as DBEnvironment[];

            let cleanedCount = 0;
            for (const env of envs) {
                // 删除数据目录
                if (fs.existsSync(env.dataDir)) {
                    fs.rmSync(env.dataDir, { recursive: true, force: true });
                }
                cleanedCount++;
            }

            // 从数据库中删除这些环境
            this.db.prepare('DELETE FROM environments WHERE deletedAt IS NOT NULL AND deletedAt < ?').run(cutoffDate);

            log.info(`清理回收站: 删除了 ${cleanedCount} 个过期环境`);
            return cleanedCount;
        } catch (error) {
            log.error('清理回收站失败:', error);
            throw error;
        }
    }

    // 更新Chrome环境信息
    public async updateEnvironment(id: string, data: Partial<ChromeEnvironment>): Promise<ChromeEnvironment> {
        try {
            // 获取当前环境信息
            const stmt = this.db.prepare('SELECT * FROM environments WHERE id = ?');
            const env = stmt.get(id) as DBEnvironment;

            if (!env) {
                log.error(`尝试更新不存在的环境: ${id}`);
                throw new Error(`环境未找到: ${id}`);
            }

            // 准备更新数据
            const updateData: Partial<ChromeEnvironment> = { ...data };

            // 不允许更新某些字段
            delete updateData.id;
            delete updateData.dataDir;
            delete updateData.createdAt;

            // 构建更新SQL
            const updates: string[] = [];
            const params: any[] = [];

            Object.entries(updateData).forEach(([key, value]) => {
                // 特殊处理tags字段
                if (key === 'tags' && Array.isArray(value)) {
                    updates.push(`${key} = ?`);
                    params.push(JSON.stringify(value));
                } else if (key !== 'isRunning' && key !== 'processId') { // 跳过运行状态字段
                    updates.push(`${key} = ?`);
                    params.push(value);
                }
            });

            // 如果没有要更新的字段，直接返回当前环境
            if (updates.length === 0) {
                return {
                    ...env,
                    tags: env.tags ? JSON.parse(env.tags) : [],
                    isRunning: this.runningProcesses.has(id)
                };
            }

            // 执行更新
            const updateSql = `UPDATE environments SET ${updates.join(', ')} WHERE id = ?`;
            params.push(id);

            this.db.prepare(updateSql).run(...params);

            // 获取更新后的环境
            const updatedEnv = this.db.prepare('SELECT * FROM environments WHERE id = ?').get(id) as DBEnvironment;

            log.info(`更新Chrome环境: ${updatedEnv.name} (${id})`);

            return {
                ...updatedEnv,
                tags: updatedEnv.tags ? JSON.parse(updatedEnv.tags) : [],
                isRunning: this.runningProcesses.has(id)
            };
        } catch (error) {
            log.error('更新环境失败:', error);
            throw error;
        }
    }

    // 删除空分组
    public async deleteEmptyGroup(groupName: string): Promise<boolean> {
        // 首先检查该分组是否为空
        const stmt = this.db.prepare('SELECT COUNT(*) as count FROM environments WHERE groupName = ?');
        const result = stmt.get(groupName) as { count: number };
        
        if (result.count > 0) {
            // 分组不为空，不能删除
            return false;
        }
        
        // 分组为空，可以删除
        // 实际上，由于分组只是环境的一个属性，而不是单独的表，
        // 所以删除空分组只需要确保没有环境使用这个分组名即可
        return true;
    }

    // 获取所有空分组
    public async getEmptyGroups(): Promise<string[]> {
        // 获取所有使用中的分组
        const usedGroupsStmt = this.db.prepare('SELECT DISTINCT groupName FROM environments');
        const usedGroups = usedGroupsStmt.all() as { groupName: string }[];
        
        // 获取所有不同的分组名称
        const allGroupsStmt = this.db.prepare('SELECT DISTINCT groupName FROM environments');
        const allGroups = allGroupsStmt.all() as { groupName: string }[];
        
        // 找出哪些分组是空的（没有环境使用）
        const allGroupNames = allGroups.map(g => g.groupName);
        const nonEmptyGroups = new Set(usedGroups.map(g => g.groupName));
        
        // 返回空分组列表
        return allGroupNames.filter(group => {
            const count = this.db.prepare('SELECT COUNT(*) as count FROM environments WHERE groupName = ?')
                .get(group) as { count: number };
            return count.count === 0;
        });
    }

    // 简单检查Chrome进程是否存在
    private async checkChromeProcessByDataDir(dataDir: string): Promise<boolean> {
        try {
            if (process.platform === 'win32') {
                const normalizedDataDir = dataDir.replace(/\\/g, '\\');
                const command = `powershell "Get-WmiObject -Class Win32_Process -Filter \\"Name='chrome.exe'\\" | Where-Object { $_.CommandLine -like '*${normalizedDataDir}*' } | Select-Object ProcessId | Format-Table -HideTableHeaders"`;
                
                const output = execSync(command, { 
                    encoding: 'utf8', 
                    timeout: 5000,
                    windowsHide: true
                });
                
                // 检查是否有PID输出
                const lines = output.split('\n').map(line => line.trim()).filter(line => line && !isNaN(Number(line)));
                return lines.length > 0;
            }
            return false;
        } catch (error) {
            log.debug(`检查Chrome进程失败: ${dataDir}`, error);
            return false;
        }
    }

} 