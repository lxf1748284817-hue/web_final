/**
 * 统一数据库管理器
 * 兼容现有代码，提供统一的数据访问接口
 */

import { DATABASE_CONFIG, ID_GENERATOR } from '../config/database.js';

class DatabaseManager {
    constructor() {
        this.db = null;
        this.config = DATABASE_CONFIG;
    }

    /**
     * 初始化数据库
     */
    async init() {
        try {
            if (!window.indexedDB) {
                throw new Error('您的浏览器不支持IndexedDB');
            }

            this.db = await this._openDatabase();
            await this._migrateData();
            await this._seedInitialData();
            
            console.log('✅ 统一数据库初始化成功');
            return this.db;
        } catch (error) {
            console.error('❌ 数据库初始化失败:', error);
            throw error;
        }
    }

    /**
     * 打开数据库连接
     */
    async _openDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.config.name, this.config.version);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                console.log(`📊 数据库升级到版本 ${this.config.version}`);

                // 创建所有表
                this.config.stores.forEach(storeName => {
                    if (!db.objectStoreNames.contains(storeName)) {
                        const store = db.createObjectStore(storeName, { keyPath: 'id' });
                        
                        // 创建索引
                        this._createIndexes(store, storeName);
                    }
                });

                console.log('📋 表结构创建完成');
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('🔗 数据库连接成功');
                resolve(this.db);
            };

            request.onerror = () => {
                console.error('❌ 数据库打开失败:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * 创建索引
     */
    _createIndexes(store, storeName) {
        switch (storeName) {
            case 'users':
                store.createIndex('username', 'username', { unique: true });
                store.createIndex('role', 'role', { unique: false });
                break;
            case 'courses':
                store.createIndex('code', 'code', { unique: true });
                store.createIndex('teacherId', 'teacherId', { unique: false });
                break;
            case 'enrollments':
                store.createIndex('studentId', 'studentId', { unique: false });
                store.createIndex('courseId', 'courseId', { unique: false });
                break;
            case 'scores':
                store.createIndex('studentId', 'studentId', { unique: false });
                store.createIndex('courseId', 'courseId', { unique: false });
                break;
        }
    }

    /**
     * 数据迁移
     */
    async _migrateData() {
        try {
            // 检查是否需要从旧数据迁移
            const needsMigration = await this._checkMigrationNeeded();
            
            if (needsMigration) {
                console.log('🔄 开始数据迁移...');
                await this._performMigration();
                console.log('✅ 数据迁移完成');
            }
        } catch (error) {
            console.error('❌ 数据迁移失败:', error);
            // 不抛出错误，允许系统继续运行
        }
    }

    /**
     * 检查是否需要迁移
     */
    async _checkMigrationNeeded() {
        try {
            // 检查现有数据
            const userCount = await this._getStoreCount('users');
            const courseCount = await this._getStoreCount('courses');
            
            // 如果有数据但版本较低，需要迁移
            return (userCount > 0 || courseCount > 0) && this.config.version > 1;
        } catch (error) {
            return false;
        }
    }

    /**
     * 执行数据迁移
     */
    async _performMigration() {
        // 这里可以实现具体的数据迁移逻辑
        // 暂时留空，后续根据需要添加
        console.log('数据迁移功能待实现');
    }

    /**
     * 初始化种子数据
     */
    async _seedInitialData() {
        const tx = this.db.transaction(['users', 'courses'], 'readwrite');
        
        // 检查并初始化用户数据
        const userStore = tx.objectStore('users');
        const userCount = await this._getStoreCount(userStore);
        
        if (userCount === 0) {
            await this._seedUsers(userStore);
        }

        // 检查并初始化课程数据
        const courseStore = tx.objectStore('courses');
        const courseCount = await this._getStoreCount(courseStore);
        
        if (courseCount === 0) {
            await this._seedCourses(courseStore);
        }

        return new Promise((resolve) => {
            tx.oncomplete = resolve;
            tx.onerror = () => console.error('❌ 种子数据初始化失败');
        });
    }

    /**
     * 初始化用户数据（兼容现有格式）
     */
    async _seedUsers(store) {
        if (typeof CryptoJS === 'undefined') {
            console.warn('⚠️ CryptoJS未加载，跳过密码加密');
            return;
        }

        const defaultUsers = [
            { 
                username: '2023001', 
                name: '张三', 
                role: 'student', 
                email: 'stu001@school.edu.cn', 
                rawPwd: 'password',
                classId: 'cls_2024_01'
            },
            { 
                username: 'T001', 
                name: '蔡老师', 
                role: 'teacher', 
                email: 'teacher01@school.edu.cn', 
                rawPwd: 'password',
                department: '计算机系'
            },
            { 
                username: '2023002', 
                name: '李四', 
                role: 'student', 
                email: 'student02@school.edu.cn', 
                rawPwd: 'password',
                classId: 'cls_2024_01',
                isFirstLogin: true
            },
            { 
                username: 'admin01', 
                name: '系统管理员', 
                role: 'sysadmin', 
                email: 'admin@school.edu.cn', 
                rawPwd: 'admin123'
            },
            { 
                username: 'edu01', 
                name: '王秘书', 
                role: 'admin_edu', 
                email: 'wang@school.edu.cn', 
                rawPwd: 'password123'
            }
        ];

        defaultUsers.forEach((user, index) => {
            const salt = user.username;
            const hashedPassword = CryptoJS.SHA256(user.rawPwd + salt).toString();
            
            store.add({
                id: ID_GENERATOR.user(user.role, index + 1),
                username: user.username,
                password: hashedPassword,
                salt: salt,
                name: user.name,
                role: user.role,
                email: user.email,
                phone: '',
                gender: '',
                birthday: '',
                classId: user.classId || '',
                department: user.department || '',
                title: '',
                avatar: '',
                status: 'active',
                isFirstLogin: user.isFirstLogin || false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        });

        console.log('👤 用户种子数据初始化完成');
    }

    /**
     * 初始化课程数据（兼容现有格式）
     */
    async _seedCourses(store) {
        const defaultCourses = [
            { 
                code: 'CS101', 
                name: 'Web 前端开发基础', 
                teacher: '蔡老师', 
                credits: 3.0, 
                department: '计算机系', 
                category: 'required', 
                description: '学习 HTML5, CSS3 技术。',
                prerequisites: '无'
            },
            { 
                code: 'CS102', 
                name: 'Java 程序设计', 
                teacher: '王教授', 
                credits: 3.0, 
                department: '软件工程系', 
                category: 'required', 
                description: '面向对象编程。',
                prerequisites: 'C语言'
            }
        ];

        defaultCourses.forEach(course => {
            store.add({
                id: ID_GENERATOR.course(course.code),
                code: course.code,
                name: course.name,
                credits: course.credits,
                department: course.department,
                category: course.category,
                description: course.description,
                prerequisites: course.prerequisites,
                teacherId: '',
                status: 'active',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        });

        console.log('📚 课程种子数据初始化完成');
    }

    /**
     * 获取存储中的记录数
     */
    _getStoreCount(store) {
        return new Promise(resolve => {
            const request = store.count();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => resolve(0);
        });
    }

    /**
     * 基础CRUD操作 - 兼容现有代码
     */
    async get(storeName, id) {
        const tx = this.db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAll(storeName, query = null) {
        const tx = this.db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        
        if (query && typeof query === 'object' && query.index) {
            const index = store.index(query.index);
            return new Promise((resolve, reject) => {
                const request = index.getAll(query.value);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } else {
            return new Promise((resolve, reject) => {
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        }
    }

    async add(storeName, data) {
        const tx = this.db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.add(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async update(storeName, data) {
        const tx = this.db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.put(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(storeName, id) {
        const tx = this.db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 兼容性方法 - 支持现有的查询方式
     */
    async openCursor(storeName, callback) {
        const tx = this.db.transaction([storeName], 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.openCursor();
        
        request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                callback(cursor);
            }
        };
        
        request.onerror = () => console.error('游标查询失败:', request.error);
    }

    /**
     * 获取数据库实例
     */
    getDatabase() {
        if (!this.db) {
            throw new Error('数据库未初始化，请先调用 init()');
        }
        return this.db;
    }
}

// 创建单例实例
export const dbManager = new DatabaseManager();

// 向后兼容 - 保持现有的全局变量
window.BaseDB = {
    config: DATABASE_CONFIG,
    open: () => dbManager.init(),
    seed: () => dbManager._seedInitialData()
};

export default dbManager;