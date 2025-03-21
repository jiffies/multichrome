import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import Database from 'better-sqlite3';
import Store from 'electron-store';
import log from 'electron-log';
import { app } from 'electron';
import os from 'os';

// Chrome环境接口
export interface ChromeEnvironment {
    id: string;
    name: string;
    groupName: string;
    notes: string;
    dataDir: string;
    tags: string[];
    proxy?: string;
    userAgent?: string;
    createdAt: string;
    lastUsed: string;
    isRunning: boolean;
    processId?: number;
}

// 表示数据库中存储的原始环境结构
interface DBEnvironment {
    id: string;
    name: string;
    groupName: string;
    notes: string;
    dataDir: string;
    tags: string; // 数据库中是JSON字符串
    proxy?: string;
    userAgent?: string;
    createdAt: string;
    lastUsed: string;
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

    constructor() {
        // 初始化存储目录
        this.environmentsDataDir = path.join(app.getPath('userData'), 'environments');
        console.log(this.environmentsDataDir);
        // 确保目录存在
        if (!fs.existsSync(this.environmentsDataDir)) {
            fs.mkdirSync(this.environmentsDataDir, { recursive: true });
        }

        // 默认Chrome数据目录
        this.defaultChromeDataDir = this.getDefaultChromeDataDir();

        // 初始化数据库
        const dbPath = path.join(app.getPath('userData'), 'chrome-environments.db');
        this.db = new Database(dbPath);

        // 初始化存储
        this.store = new Store({
            name: 'config',
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

        log.info('ChromeManager initialized');
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
        lastUsed TEXT NOT NULL
      );
    `);
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
                    const { execSync } = require('child_process');
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

    // 获取所有Chrome环境
    public async getAllEnvironments(): Promise<ChromeEnvironment[]> {
        try {
            const query = this.db.prepare('SELECT * FROM environments ORDER BY lastUsed DESC');
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

    // 创建新的Chrome环境
    public async createEnvironment(name: string, groupName: string, notes: string = ''): Promise<ChromeEnvironment> {
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
                dataDir,
                tags: [],
                createdAt: now,
                lastUsed: now,
                isRunning: false
            };

            // 保存到数据库
            const stmt = this.db.prepare(`
        INSERT INTO environments 
        (id, name, groupName, notes, dataDir, tags, createdAt, lastUsed) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

            stmt.run(
                env.id,
                env.name,
                env.groupName,
                env.notes,
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
                `--user-data-dir=${env.dataDir}`,
                '--no-first-run',
                '--no-default-browser-check'
            ];

            // 添加代理设置（如果有）
            if (env.proxy) {
                args.push(`--proxy-server=${env.proxy}`);
            }

            // 添加用户代理（如果有）
            if (env.userAgent) {
                args.push(`--user-agent=${env.userAgent}`);
            }

            // 启动Chrome进程
            const chromeProcess = spawn(chromePath, args, {
                detached: true,
                stdio: 'ignore'
            });

            // 存储进程引用
            this.runningProcesses.set(id, chromeProcess);

            // 更新最后使用时间
            this.db.prepare('UPDATE environments SET lastUsed = ? WHERE id = ?')
                .run(new Date().toISOString(), id);

            // 处理进程退出
            chromeProcess.on('exit', () => {
                log.info(`Chrome环境已关闭: ${env.name} (${id})`);
                this.runningProcesses.delete(id);
            });

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

            // 尝试正常关闭进程
            process.kill();
            this.runningProcesses.delete(id);

            log.info(`关闭Chrome环境: ${id}`);
            return true;
        } catch (error) {
            log.error('关闭环境失败:', error);
            throw error;
        }
    }

    // 删除Chrome环境
    public async deleteEnvironment(id: string): Promise<boolean> {
        try {
            // 首先尝试关闭环境（如果正在运行）
            if (this.runningProcesses.has(id)) {
                await this.closeEnvironment(id);
            }

            // 获取环境信息
            const stmt = this.db.prepare('SELECT * FROM environments WHERE id = ?');
            const env = stmt.get(id) as ChromeEnvironment;

            if (!env) {
                log.error(`尝试删除不存在的环境: ${id}`);
                return false;
            }

            // 从数据库中删除环境
            this.db.prepare('DELETE FROM environments WHERE id = ?').run(id);

            // 删除环境数据目录
            if (fs.existsSync(env.dataDir)) {
                fs.rmSync(env.dataDir, { recursive: true, force: true });
            }

            log.info(`删除Chrome环境: ${env.name} (${id})`);
            return true;
        } catch (error) {
            log.error('删除环境失败:', error);
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
} 