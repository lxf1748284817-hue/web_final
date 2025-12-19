/**
 * 【模块名称】：本地 IndexedDB 核心数据库模块
 * 【维护人员】：梁德铭
 * 【功能描述】：
 * 1. 自动建模：通过 open() 方法管理数据库生命周期，自动创建 users, classes, courses, plans, scores 五大核心表。
 * 2. 种子数据初始化：实现 seed() 机制，在数据库为空时自动填充 5 类初始角色（含教学管理员）及 6 门演示课程。
 * 3. 静态加盐存储：在数据持久化阶段（seed 阶段）直接集成 SHA256 加盐算法，确保存入的初始密码均为密文。
 * 4. 解耦加固：针对 ReferenceError 进行了架构优化，不依赖外部 security.js 对象，独立运行能力强。
 * 【整合指南】：
 * 1. 引入依赖：本文件必须在 HTML 中紧随 CryptoJS 库之后、在任何业务 JS（如 security.js）之前引入。
 * 2. 数据刷新：若需更改初始用户或课程，修改 rawUsers/defaultCourses 后，需在浏览器清理 IndexedDB 或提升 config.version。
 * 3. 接口调用：全局单例 BaseDB，外部通过 await BaseDB.open() 获取数据库对象实例。
 * 4. 密码规则：初始用户 password 字段由 rawPwd + username(盐) 经 SHA256 计算所得。
 */
const BaseDB = {
    config: {
        name: 'CurriculumDesignDB',
        version: 1
    },

    open() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.config.name, this.config.version);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                console.log("BaseDB: 检测到版本更新，初始化表结构...");

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
     */
    async seed() {
        try {
            // 关键：检查 CryptoJS 是否存在。如果不存在，说明 HTML 里引入顺序错了。
            if (typeof CryptoJS === 'undefined') {
                console.error("BaseDB: 核心加密库 CryptoJS 未加载！请检查 HTML 中脚本引入顺序。");
                return;
            }

            const db = await this.open();
            // 注意：这里用 readwrite 模式
            const tx = db.transaction(['users', 'courses'], 'readwrite');
            
            // 1. 初始化用户
            const userStore = tx.objectStore('users');
            if (await this._getCount(userStore) === 0) {
                
                // 定义原始默认用户数据
                const rawUsers = [
    { id: 'stu_001', username: '2023001', name: '张三', role: 'student', email: 'stu001@school.edu.cn', rawPwd: 'password', isFirstLogin: false },
    { id: 'tea_001', username: 'T001', name: '蔡老师', role: 'teacher', email: 'teacher01@school.edu.cn', rawPwd: 'password', isFirstLogin: false },
    { id: 'stu_002', username: '2023002', name: '李四', role: 'student', email: 'student02@school.edu.cn', rawPwd: 'password', isFirstLogin: true },
    { id: 'sys_001', username: 'admin01', name: '系统管理员', role: 'admin_sys', email: 'admin@school.edu.cn', rawPwd: 'admin123', isFirstLogin: false },
    // 新增：教学管理员 (对应 login.html 中的 admin_edu)
    { id: 'edu_001', username: 'edu01', name: '王秘书', role: 'admin_edu', email: 'wang@school.edu.cn', rawPwd: 'password123', isFirstLogin: false }
];

                rawUsers.forEach(u => {
                    // --- 修复点：直接写逻辑，不调用 SecurityModule ---
                    const salt = u.username; // 使用用户名作为盐，简单且稳定
                    const hashedPassword = CryptoJS.SHA256(u.rawPwd + salt).toString();

                    userStore.add({
                        id: u.id,
                        username: u.username,
                        name: u.name,
                        role: u.role,
                        email: u.email,
                        salt: salt,
                        password: hashedPassword,
                        isFirstLogin: u.isFirstLogin
                    });
                });
                console.log("BaseDB: 用户账户加密存入完成");
            }

            // 2. 初始化课程 (保持 6 门)
            const courseStore = tx.objectStore('courses');
            if (await this._getCount(courseStore) === 0) {
                const defaultCourses = [
                    { id: 'crs_001', code: 'CS101', name: 'Web 前端开发基础', teacher: '蔡老师', credits: 3.0, department: '计算机系', category: '必修课', description: '学习 HTML5, CSS3 技术。', prerequisites: '无' },
                    { id: 'crs_002', code: 'CS102', name: 'Java 程序设计', teacher: '王教授', credits: 3.0, department: '软件工程系', category: '专业课', description: '面向对象编程。', prerequisites: 'C语言' },
                    { id: 'crs_003', code: 'UI201', name: 'UI/UX 交互设计', teacher: '张老师', credits: 2.0, department: '艺术设计系', category: '选修课', description: '研究用户体验。', prerequisites: '无' },
                    { id: 'crs_004', code: 'DB301', name: '数据库系统原理', teacher: '李副教授', credits: 3.0, department: '信息管理系', category: '专业课', description: 'SQL 与事务。', prerequisites: '无' },
                    { id: 'crs_005', code: 'NET401', name: '计算机网络技术', teacher: '赵老师', credits: 2.0, department: '计算机系', category: '专业课', description: 'TCP/IP 协议。', prerequisites: '无' },
                    { id: 'crs_006', code: 'OS501', name: '大学生职业规划', teacher: '孙教授', credits: 1.0, department: '公共课部', category: '公共课', description: '职业规划。', prerequisites: '无' }
                ];
                defaultCourses.forEach(c => courseStore.add(c));
            }

            tx.oncomplete = () => console.log("BaseDB: 演示数据初始化成功");
        } catch (err) {
            console.error("BaseDB: 严重错误", err);
        }
    },

    _getCount(store) {
        return new Promise(r => {
            const req = store.count();
            req.onsuccess = () => r(req.result);
        });
    }
};

// 依然保持 DOMContentLoaded 触发，但由于解耦了 SecurityModule，它现在更安全
document.addEventListener('DOMContentLoaded', () => {
    BaseDB.seed();
});