/**
 * 数据库模块 (由 [梁德铭] 维护)
 * 对整合者友好：所有功能封装在 BaseDB 对象中，避免全局冲突。
 */
const BaseDB = {
    config: {
        name: 'CurriculumDesignDB',
        version: 1
    },

    /**
     * 打开数据库
     * @returns {Promise<IDBDatabase>}
     */
    open() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.config.name, this.config.version);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                console.log("BaseDB: 检测到版本更新，初始化表结构...");

                // 核心表结构 (严格对应小组定义的 5 张表)
                const stores = ['users', 'classes', 'courses', 'plans', 'scores'];
                stores.forEach(storeName => {
                    if (!db.objectStoreNames.contains(storeName)) {
                        db.createObjectStore(storeName, { keyPath: 'id' });
                    }
                });
            };

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject("BaseDB: 无法打开数据库");
        });
    },

    /**
     * 演示数据初始化
     * 整合者注：如果你有更完整的数据脚本，可以停用此函数调用。
     */
    async seed() {
        try {
            const db = await this.open();
            // 开启所有表的读写事务
            const tx = db.transaction(['users', 'classes', 'courses', 'plans', 'scores'], 'readwrite');
            
            // 1. 初始化用户 (包含登录所需的所有安全字段)
            const userStore = tx.objectStore('users');
            const userCount = await this._getCount(userStore);
            if (userCount === 0) {
                const defaultUsers = [
                    { 
                        id: 'stu_001', username: '2023001', name: '张三', role: 'student', 
                        classId: 'cls_001', gender: 'male', phone: '13800008888', 
                        email: 'stu001@school.edu.cn', birthday: '2002-05-20', 
                        region: 'beijing', avatar: '', salt: '2023001', 
                        hashedPassword: 'student_hash_123', isFirstLogin: false 
                    },
                    { 
                        id: 'tea_001', username: 'T001', name: '蔡老师', role: 'teacher', 
                        gender: 'female', phone: '13911112222', email: 'teacher01@school.edu.cn', 
                        birthday: '1985-10-12', region: 'shanghai', avatar: '', 
                        salt: 'T001', hashedPassword: 'teacher_hash_456', isFirstLogin: false 
                    },
                    { 
                    id: 'stu_002', 
                    username: '2023002', 
                    role: 'student', 
                    name: '李四', 
                    email: 'student02@school.edu.cn', 
                    salt: '2023002', 
                    hashedPassword: 'default_hash_002', // 对应密码: default
                    isFirstLogin: true // 关键：触发强制改密逻辑
                }
                ];
                defaultUsers.forEach(u => userStore.add(u));
            }

            // 2. 初始化其他关联表 (仅演示用)
            const classStore = tx.objectStore('classes');
            if (await this._getCount(classStore) === 0) {
                classStore.add({ id: 'cls_001', name: '计算机2101' });
            }

            const courseStore = tx.objectStore('courses');
            if (await this._getCount(courseStore) === 0) {
                courseStore.add({ id: 'crs_001', code: 'MATH001', name: '理论力学', credits: 5, department: '物理系' });
            }

            tx.oncomplete = () => console.log("BaseDB: 演示数据初始化完成");
        } catch (err) {
            console.warn("BaseDB: 数据初始化跳过或失败", err);
        }
    },

    // 内部私有辅助函数
    _getCount(store) {
        return new Promise(r => {
            const req = store.count();
            req.onsuccess = () => r(req.result);
        });
    }
};

/**
 * 自动初始化：仅在当前作为独立开发环境时运行。
 * 整合者可保留此项，只要 users 表有数据，它就不会执行重复写入。
 */
document.addEventListener('DOMContentLoaded', () => {
    BaseDB.seed();
});