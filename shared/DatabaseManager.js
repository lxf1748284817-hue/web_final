/**
 * 统一数据库管理器
 * 兼容现有代码，提供统一的数据访问接口
 */

// 内联数据库配置
const DATABASE_CONFIG = {
    name: 'CurriculumDesignDB',
    version: 12,
    stores: [
        'users', 'classes', 'courses', 'plans', 'scores',
        'enrollments', 'course_materials', 'assignments', 'assignment_submissions',
        'exams', 'exam_results', 'audit_logs', 'system_settings', 'data_backups'
    ]
};

// 内联ID生成器
const ID_GENERATOR = {
    user: (role, sequence) => `${role}_${String(sequence).padStart(3, '0')}`,
    course: (code) => `crs_${code}`,
    class: (grade, sequence) => `cls_${grade}_${String(sequence).padStart(2, '0')}`,
    plan: (semester, courseCode) => `plan_${semester.replace('-', '_')}_${courseCode}`,
    enrollment: (studentId, planId) => `enroll_${studentId}_${planId}`,
    material: (courseId, type) => `mat_${courseId}_${type}_${Date.now()}`,
    assignment: (courseId, sequence) => `assign_${courseId}_${String(sequence).padStart(3, '0')}`,
    submission: (assignmentId, studentId) => `sub_${assignmentId}_${studentId}`,
    exam: (courseId, sequence) => `exam_${courseId}_${String(sequence).padStart(3, '0')}`,
    examResult: (examId, studentId) => `result_${examId}_${studentId}`,
    score: (studentId, planId) => `score_${studentId}_${planId}`,
    auditLog: (userId, action) => `log_${userId}_${action}_${Date.now()}`,
    backup: () => `backup_${Date.now()}`
};

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
            case 'plans':
                store.createIndex('courseId', 'courseId', { unique: false });
                store.createIndex('teacherId', 'teacherId', { unique: false });
                store.createIndex('semester', 'semester', { unique: false });
                break;
            case 'enrollments':
                store.createIndex('studentId', 'studentId', { unique: false });
                store.createIndex('planId', 'planId', { unique: false });
                store.createIndex('status', 'status', { unique: false });
                store.createIndex('enrollDate', 'enrollDate', { unique: false });
                break;
            case 'course_materials':
                store.createIndex('planId', 'planId', { unique: false });
                store.createIndex('courseId', 'courseId', { unique: false });
                break;
            case 'assignments':
                store.createIndex('planId', 'planId', { unique: false });
                break;
            case 'assignment_submissions':
                store.createIndex('assignmentId', 'assignmentId', { unique: false });
                store.createIndex('studentId', 'studentId', { unique: false });
                break;
            case 'scores':
                store.createIndex('studentId', 'studentId', { unique: false });
                store.createIndex('planId', 'planId', { unique: false });
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
        // 检查是否需要admin模块的完整数据
        const tx = this.db.transaction(['users', 'classes', 'courses', 'plans', 'scores', 'course_materials', 'assignments'], 'readwrite');
        
        const stores = {
            users: tx.objectStore('users'),
            classes: tx.objectStore('classes'),
            courses: tx.objectStore('courses'),
            plans: tx.objectStore('plans'),
            scores: tx.objectStore('scores'),
            course_materials: tx.objectStore('course_materials'),
            assignments: tx.objectStore('assignments')
        };
        
        // 检查各个表的数据
        const counts = await Promise.all(
            Object.entries(stores).map(([name, store]) => this._getStoreCount(store))
        );
        
        const totalData = counts.reduce((sum, count) => sum + count, 0);
        
        if (totalData === 0) {
            console.log('🌱 生成初始测试数据...');
            await this._seedMinimalAdminData(stores);
            // 用正确的用户数据覆盖（包含密码）
            await this._seedUsers(stores.users);
        } else {
            console.log('💾 数据已存在，跳过初始化');
        }

        return new Promise((resolve, reject) => {
            tx.oncomplete = resolve;
            tx.onerror = reject;
        });
    }

    /**
     * admin模块最小测试数据
     */
    async _seedMinimalAdminData(stores) {
        // 1. 班级 (2个)
        await Promise.all([
            stores.classes.add({ id: 'cls_001', name: '计算机1班', major: '计算机科学', enrollmentYear: '2023', studentCount: 3 }),
            stores.classes.add({ id: 'cls_002', name: '软件工程1班', major: '软件工程', enrollmentYear: '2023', studentCount: 2 })
        ]);

        // 2. 用户 (简单数据，会被 _seedUsers 覆盖)
        await Promise.all([
            // 学生
            stores.users.add({ id: 'stu_001', username: 'student1', name: '张三', role: 'student', classId: 'cls_001', phone: '13800138001' }),
            stores.users.add({ id: 'stu_002', username: 'student2', name: '李四', role: 'student', classId: 'cls_001', phone: '13800138002' }),
            stores.users.add({ id: 'stu_003', username: 'student3', name: '王五', role: 'student', classId: 'cls_001', phone: '13800138003' }),
            stores.users.add({ id: 'stu_004', username: 'student4', name: '赵六', role: 'student', classId: 'cls_002', phone: '13800138004' }),
            stores.users.add({ id: 'stu_005', username: 'student5', name: '钱七', role: 'student', classId: 'cls_002', phone: '13800138005' }),
            // 教师
            stores.users.add({ id: 'tea_001', username: 'teacher1', name: '王老师', role: 'teacher', phone: '13900139001' }),
            stores.users.add({ id: 'tea_002', username: 'teacher2', name: '李老师', role: 'teacher', phone: '13900139002' })
        ]);

        // 3. 课程 (5门完整课程数据)
        await Promise.all([
            stores.courses.add({ 
                id: 'course_cs101', 
                code: 'CS101', 
                name: '数据结构与算法', 
                credits: 3, 
                hours: 48, 
                description: '计算机科学核心课程，学习数据结构和算法设计',
                teacher: '王老师',
                department: '计算机系',
                category: 'required',
                prerequisites: '无',
                status: 'published'
            }),
            stores.courses.add({ 
                id: 'course_ma202', 
                code: 'MA202', 
                name: '高等数学', 
                credits: 4, 
                hours: 64, 
                description: '大学数学基础课程，涵盖微积分和线性代数',
                teacher: '李老师',
                department: '数学系',
                category: 'required',
                prerequisites: '无',
                status: 'published'
            }),
            stores.courses.add({ 
                id: 'course_phy105', 
                code: 'PHY105', 
                name: '大学物理', 
                credits: 3, 
                hours: 48, 
                description: '物理学基础课程，涵盖力学、电磁学等',
                teacher: '张老师',
                department: '物理系',
                category: 'required',
                prerequisites: '无',
                status: 'published'
            }),
            stores.courses.add({ 
                id: 'course_eng201', 
                code: 'ENG201', 
                name: '大学英语', 
                credits: 2, 
                hours: 32, 
                description: '英语语言学习课程，提高听说读写能力',
                teacher: '王老师',
                department: '外语系',
                category: 'required',
                prerequisites: '无',
                status: 'published'
            }),
            stores.courses.add({ 
                id: 'course_se301', 
                code: 'SE301', 
                name: '软件工程', 
                credits: 3, 
                hours: 48, 
                description: '软件开发流程和方法论课程',
                teacher: '李老师',
                department: '软件工程系',
                category: 'elective',
                prerequisites: '需掌握编程基础',
                status: 'published'
            })
        ]);

        // 4. 授课计划 (2个)
        await Promise.all([
            stores.plans.add({ id: 'plan_001', courseId: 'course_cs101', teacherId: 'tea_001', semester: '2024-1', classroom: 'A101', schedule: '周一 1-2节', capacity: 50, enrolled: 0 }),
            stores.plans.add({ id: 'plan_002', courseId: 'course_ma202', teacherId: 'tea_002', semester: '2024-1', classroom: '大礼堂', schedule: '周五 7-8节', capacity: 100, enrolled: 0 })
        ]);

        // 5. 成绩 (5条，覆盖不同状态)
        await Promise.all([
            stores.scores.add({ id: 'score_001', coursePlanId: 'plan_001', studentId: 'stu_001', quiz: 85, midterm: 80, final: 88, total: 85, status: 'published' }),
            stores.scores.add({ id: 'score_002', coursePlanId: 'plan_001', studentId: 'stu_002', quiz: 75, midterm: 70, final: 72, total: 72, status: 'published' }),
            stores.scores.add({ id: 'score_003', coursePlanId: 'plan_001', studentId: 'stu_003', quiz: 92, midterm: 88, final: 95, total: 92, status: 'unpublished' }),
            stores.scores.add({ id: 'score_004', coursePlanId: 'plan_002', studentId: 'stu_004', quiz: 65, midterm: 62, final: 68, total: 66, status: 'published' }),
            // 为当前学生添加数据结构与算法课程成绩
            stores.scores.add({ id: 'score_student_001_plan_001', coursePlanId: 'plan_001', studentId: 'student_001', quiz: 90, midterm: 85, final: 92, total: 89, status: 'published' })
        ]);

        // 6. 课程资料 - 为数据结构与算法课程添加资料
        await Promise.all([
            // PDF课件
            stores.course_materials.add({
                id: 'mat_course_cs101_pdf_001',
                courseId: 'course_cs101',
                planId: 'plan_001',
                title: '数据结构与算法导论',
                description: '第一章：数据结构基本概念与算法复杂度分析',
                type: 'pdf',
                fileUrl: 'https://example.com/documents/dsa-intro.pdf',
                fileSize: '2.5MB',
                uploader: '王老师',
                uploadDate: '2024-01-15',
                status: 'published'
            }),
            // 图片资料
            stores.course_materials.add({
                id: 'mat_course_cs101_img_001',
                courseId: 'course_cs101',
                planId: 'plan_001',
                title: '算法流程图示例',
                description: '常见排序算法的流程图示例',
                type: 'image',
                fileUrl: 'https://picsum.photos/800/600',
                fileSize: '150KB',
                uploader: '王老师',
                uploadDate: '2024-01-16',
                status: 'published'
            }),
            // 视频资料
            stores.course_materials.add({
                id: 'mat_course_cs101_video_001',
                courseId: 'course_cs101',
                planId: 'plan_001',
                title: '数据结构实现演示',
                description: '链表、栈、队列等数据结构的代码实现演示',
                type: 'video',
                fileUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
                fileSize: '15.2MB',
                duration: '45:30',
                uploader: '王老师',
                uploadDate: '2024-01-17',
                status: 'published'
            })
        ]);

        // 7. 作业 - 为数据结构与算法课程添加作业
        await Promise.all([
            // 作业1：链表实现
            stores.assignments.add({
                id: 'assign_course_cs101_001',
                courseId: 'course_cs101',
                planId: 'plan_001',
                title: '链表数据结构实现',
                description: '实现单链表的基本操作：创建、插入、删除、查找等',
                type: 'homework',
                deadline: '2024-02-15',
                maxScore: 100,
                requirements: '使用C语言或Java实现，提交源代码和测试用例',
                status: 'active',
                createdBy: '王老师',
                createdAt: '2024-01-20',
                submissionCount: 0
            }),
            // 作业2：排序算法
            stores.assignments.add({
                id: 'assign_course_cs101_002',
                courseId: 'course_cs101',
                planId: 'plan_001',
                title: '排序算法比较',
                description: '实现并比较冒泡排序、快速排序、归并排序的性能',
                type: 'homework',
                deadline: '2025-12-31',
                maxScore: 100,
                requirements: '分析算法时间复杂度，提交实验报告和代码',
                status: 'active',
                createdBy: '王老师',
                createdAt: '2024-01-25',
                submissionCount: 0
            })
        ]);

        console.log('✅ admin模块完整测试数据生成完成');
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

    /**
     * 创建事务 (兼容旧代码)
     */
    transaction(storeNames, mode = 'readonly') {
        return this.db.transaction(storeNames, mode);
    }

    /**
     * 获取对象存储 (兼容旧代码)
     */
    objectStore(storeName, mode = 'readonly') {
        const tx = this.transaction(storeName, mode);
        return tx.objectStore(storeName);
    }
}

// 创建单例实例并暴露到全局
const dbManager = new DatabaseManager();
window.dbManager = dbManager;

// 向后兼容 - 保持现有的全局变量
window.BaseDB = {
    config: DATABASE_CONFIG,
    open: () => dbManager.init(),
    seed: () => dbManager._seedInitialData()
};