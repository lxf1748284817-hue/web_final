/**
 * IndexedDB 数据库操作模块
 * 用于管理学生端的所有数据存储和读取
 * 
 * 数据库设计说明：
 * - 使用字符串 ID 以支持多端数据同步
 * - ID 格式：前缀_编号（如 stu_001, crs_CS101, plan_001）
 * - 与教学管理端共用同一套数据结构
 */

const DB_NAME = 'CurriculumDesignDB';  // 统一数据库名称
const DB_VERSION = 11;  // 统一升级至版本 11
let db = null;

// 初始化数据库
async function initDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('数据库打开失败', request.error);
            reject(request.error);
        };

        request.onsuccess = () => {
            db = request.result;
            console.log('数据库打开成功');
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            db = event.target.result;
            console.log('数据库升级中...版本:', event.oldVersion, '->', event.newVersion);

            // 删除旧表（如果存在）
            const storeNames = ['users', 'courses', 'student_courses', 'scores', 'score_details', 
                              'course_materials', 'assignments', 'assignment_submissions', 'student_tasks',
                              'classes', 'plans'];  // 添加缺失的表
            storeNames.forEach(name => {
                if (db.objectStoreNames.contains(name)) {
                    db.deleteObjectStore(name);
                    console.log(`已删除旧表: ${name}`);
                }
            });

            // ==================== 1. 用户表 ====================
            if (!db.objectStoreNames.contains('users')) {
                const userStore = db.createObjectStore('users', { keyPath: 'id' });
                userStore.createIndex('username', 'username', { unique: true });
                userStore.createIndex('studentId', 'studentId', { unique: false });
                userStore.createIndex('role', 'role', { unique: false });
                userStore.createIndex('classId', 'classId', { unique: false });
                console.log('创建用户表');
            }

            // ==================== 2. 班级表 ====================
            if (!db.objectStoreNames.contains('classes')) {
                const classStore = db.createObjectStore('classes', { keyPath: 'id' });
                classStore.createIndex('name', 'name', { unique: true });
                classStore.createIndex('grade', 'grade', { unique: false });
                console.log('创建班级表');
            }

            // ==================== 3. 课程库表（基础课程信息）====================
            if (!db.objectStoreNames.contains('courses')) {
                const courseStore = db.createObjectStore('courses', { keyPath: 'id' });
                courseStore.createIndex('code', 'code', { unique: true });
                courseStore.createIndex('department', 'department', { unique: false });
                console.log('创建课程库表');
            }

            // ==================== 4. 开课计划表（具体排课）====================
            if (!db.objectStoreNames.contains('plans')) {
                const planStore = db.createObjectStore('plans', { keyPath: 'id' });
                planStore.createIndex('courseId', 'courseId', { unique: false });
                planStore.createIndex('teacherId', 'teacherId', { unique: false });
                planStore.createIndex('semester', 'semester', { unique: false });
                planStore.createIndex('classId', 'classId', { unique: false });
                console.log('创建开课计划表');
            }

            // ==================== 5. 学生选课表 ====================
            if (!db.objectStoreNames.contains('student_courses')) {
                const scStore = db.createObjectStore('student_courses', { keyPath: 'id' });
                scStore.createIndex('studentId', 'studentId', { unique: false });
                scStore.createIndex('planId', 'planId', { unique: false });
                scStore.createIndex('studentPlan', ['studentId', 'planId'], { unique: true });
                console.log('创建学生选课表');
            }

            // ==================== 6. 成绩表 ====================
            if (!db.objectStoreNames.contains('scores')) {
                const scoreStore = db.createObjectStore('scores', { keyPath: 'id' });
                scoreStore.createIndex('studentId', 'studentId', { unique: false });
                scoreStore.createIndex('planId', 'planId', { unique: false });
                scoreStore.createIndex('studentPlan', ['studentId', 'planId'], { unique: true });
                console.log('创建成绩表');
            }

            // ==================== 7. 成绩明细表 ====================
            if (!db.objectStoreNames.contains('score_details')) {
                const detailStore = db.createObjectStore('score_details', { keyPath: 'id' });
                detailStore.createIndex('scoreId', 'scoreId', { unique: false });
                console.log('创建成绩明细表');
            }

            // ==================== 8. 课件资料表 ====================
            if (!db.objectStoreNames.contains('course_materials')) {
                const materialStore = db.createObjectStore('course_materials', { keyPath: 'id' });
                materialStore.createIndex('planId', 'planId', { unique: false });
                materialStore.createIndex('type', 'type', { unique: false });
                console.log('创建课件资料表');
            }

            // ==================== 9. 作业表 ====================
            if (!db.objectStoreNames.contains('assignments')) {
                const assignmentStore = db.createObjectStore('assignments', { keyPath: 'id' });
                assignmentStore.createIndex('planId', 'planId', { unique: false });
                assignmentStore.createIndex('deadline', 'deadline', { unique: false });
                console.log('创建作业表');
            }

            // ==================== 10. 作业提交表 ====================
            if (!db.objectStoreNames.contains('assignment_submissions')) {
                const submissionStore = db.createObjectStore('assignment_submissions', { keyPath: 'id' });
                submissionStore.createIndex('assignmentId', 'assignmentId', { unique: false });
                submissionStore.createIndex('studentId', 'studentId', { unique: false });
                submissionStore.createIndex('studentAssignment', ['studentId', 'assignmentId'], { unique: true });
                console.log('创建作业提交表');
            }

            console.log('数据库结构创建完成');
        };
    });
}

// 通用的数据库操作函数
async function dbOperation(storeName, mode, operation) {
    if (!db) {
        await initDatabase();
    }

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], mode);
        const store = transaction.objectStore(storeName);
        const request = operation(store);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// ==================== ID 生成函数 ====================
/**
 * 生成字符串 ID
 * @param {string} prefix - ID 前缀（stu/tea/crs/plan/cls/score/assign等）
 * @param {string} storeName - 存储表名
 * @returns {Promise<string>} - 生成的 ID
 */
async function generateId(prefix, storeName) {
    const allData = await getAllData(storeName);
    
    // 过滤出该前缀的所有 ID
    const existingIds = allData
        .map(item => item.id)
        .filter(id => id && id.startsWith(prefix + '_'));
    
    if (existingIds.length === 0) {
        return `${prefix}_001`;
    }
    
    // 找到最大编号
    let maxNum = 0;
    existingIds.forEach(id => {
        const parts = id.split('_');
        const numStr = parts[parts.length - 1]; // 取最后一部分作为编号
        const num = parseInt(numStr);
        if (!isNaN(num) && num > maxNum) {
            maxNum = num;
        }
    });
    
    // 生成新 ID（补齐3位）
    const newNum = String(maxNum + 1).padStart(3, '0');
    return `${prefix}_${newNum}`;
}

/**
 * 根据业务规则生成特定格式的 ID
 */
const IdGenerator = {
    // 学生 ID: stu_2024001
    async student() {
        const year = new Date().getFullYear();
        const allStudents = await getAllData('users');
        const yearStudents = allStudents.filter(u => 
            u.role === 'student' && u.id && u.id.startsWith(`stu_${year}`)
        );
        const num = String(yearStudents.length + 1).padStart(3, '0');
        return `stu_${year}${num}`;
    },
    
    // 教师 ID: tea_001
    async teacher() {
        return generateId('tea', 'users');
    },
    
    // 课程 ID: crs_代码（如 crs_CS101）
    course(courseCode) {
        return `crs_${courseCode}`;
    },
    
    // 开课计划 ID: plan_学期_课程代码（如 plan_2024_1_CS101）
    plan(semester, courseCode) {
        return `plan_${semester.replace('-', '_')}_${courseCode}`;
    },
    
    // 班级 ID: cls_年级_编号（如 cls_2024_01）
    async classRoom(grade) {
        const allClasses = await getAllData('classes');
        const gradeClasses = allClasses.filter(c => c.grade === grade);
        const num = String(gradeClasses.length + 1).padStart(2, '0');
        return `cls_${grade}_${num}`;
    },
    
    // 成绩 ID: score_学生ID_计划ID
    score(studentId, planId) {
        return `score_${studentId}_${planId}`;
    },
    
    // 作业 ID: assign_计划ID_序号
    async assignment(planId) {
        const allAssignments = await getAllData('assignments');
        const planAssignments = allAssignments.filter(a => a.planId === planId);
        const num = String(planAssignments.length + 1).padStart(2, '0');
        return `assign_${planId}_${num}`;
    },
    
    // 通用 ID（带时间戳）
    generic(prefix) {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 4);
        return `${prefix}_${timestamp}${random}`;
    }
};

// 添加数据
async function addData(storeName, data) {
    return dbOperation(storeName, 'readwrite', (store) => store.add(data));
}

// 获取所有数据
async function getAllData(storeName) {
    return dbOperation(storeName, 'readonly', (store) => store.getAll());
}

// 根据 ID 获取数据
async function getDataById(storeName, id) {
    return dbOperation(storeName, 'readonly', (store) => store.get(id));
}

// 根据索引获取数据
async function getDataByIndex(storeName, indexName, value) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const index = store.index(indexName);
        const request = index.getAll(value);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// 更新数据
async function updateData(storeName, data) {
    return dbOperation(storeName, 'readwrite', (store) => store.put(data));
}

// 删除数据
async function deleteData(storeName, id) {
    return dbOperation(storeName, 'readwrite', (store) => store.delete(id));
}

// 初始化示例数据（仅用于开发测试）
async function initSampleData() {
    try {
        // 简单检查：如果有用户数据就跳过
        const users = await getAllData('users');
        if (users.length > 0) {
            console.log('✅ 数据已存在，跳过初始化');
            return;
        }

        console.log('🔄 开始初始化示例数据...');

        // ==================== 1. 创建班级 ====================
        const class2024 = {
            id: await IdGenerator.classRoom('2024'),
            name: '计算机科学2024级1班',
            grade: '2024',
            department: '计算机学院',
            studentCount: 0,
            createdAt: new Date().toISOString()
        };
        await addData('classes', class2024);
        console.log('班级创建成功:', class2024.id);

        // ==================== 2. 创建用户（学生和教师）====================
        // 创建示例学生（固定ID以便测试）
        const student1 = {
            id: 'stu_2024001',  // ✅ 固定ID，与 student.js 中的 currentStudent.id 一致
            username: 'student001',
            password: '123456',
            name: '张三',
            studentId: '2024150001',
            role: 'student',
            classId: class2024.id,
            gender: '男',
            phone: '13800138001',
            email: 'zhangsan@example.com',
            avatar: '',
            createdAt: new Date().toISOString()
        };
        await addData('users', student1);
        console.log('学生创建成功:', student1.id);

        // 创建示例教师
        const teachers = [
            {
                id: 'tea_001',
                username: 'teacher001',
                password: '123456',
                name: '张教授',
                role: 'teacher',
                department: '计算机学院',
                title: '教授',
                phone: '13900139001',
                email: 'zhangprof@example.com',
                avatar: '',
                createdAt: new Date().toISOString()
            },
            {
                id: 'tea_002',
                username: 'teacher002',
                password: '123456',
                name: '李老师',
                role: 'teacher',
                department: '计算机学院',
                title: '副教授',
                phone: '13900139002',
                email: 'liteacher@example.com',
                avatar: '',
                createdAt: new Date().toISOString()
            },
            {
                id: 'tea_003',
                username: 'teacher003',
                password: '123456',
                name: '王教授',
                role: 'teacher',
                department: '计算机学院',
                title: '教授',
                phone: '13900139003',
                email: 'wangprof@example.com',
                avatar: '',
                createdAt: new Date().toISOString()
            }
        ];

        for (const teacher of teachers) {
            await addData('users', teacher);
            console.log('教师创建成功:', teacher.id);
        }

        // ==================== 3. 创建课程库 ====================
        const coursesData = [
            {
                id: IdGenerator.course('CS101'),
                code: 'CS101',
                name: '数据结构与算法',
                credits: 4,
                department: '计算机学院',
                category: 'required',
                description: '学习常用数据结构和算法设计方法，培养编程能力和算法思维。'
            },
            {
                id: IdGenerator.course('CS102'),
                code: 'CS102',
                name: 'Web前端开发',
                credits: 3,
                department: '计算机学院',
                category: 'elective',
                description: '掌握HTML5、CSS3、JavaScript等前端技术，学习现代Web开发框架。'
            },
            {
                id: IdGenerator.course('CS103'),
                code: 'CS103',
                name: '数据库系统',
                credits: 4,
                department: '计算机学院',
                category: 'required',
                description: '学习数据库原理、SQL语言、数据库设计和管理。'
            },
            {
                id: IdGenerator.course('GE101'),
                code: 'GE101',
                name: '大学英语',
                credits: 2,
                department: '外语学院',
                category: 'general',
                description: '提高英语听说读写能力，为专业学习和国际交流打下基础。'
            }
        ];

        for (const course of coursesData) {
            await addData('courses', course);
            console.log('课程创建成功:', course.id);
        }

        // ==================== 4. 创建开课计划 ====================
        const semester = '2024-1';
        const plansData = [
            {
                id: IdGenerator.plan(semester, 'CS101'),
                courseId: IdGenerator.course('CS101'),
                teacherId: 'tea_001',
                semester: semester,
                classId: class2024.id,
                schedule: '周一 1-2节, 周三 3-4节',
                classroom: '教学楼A101',
                capacity: 120,
                enrolled: 1,  // 已有1名学生
                status: 'active'
            },
            {
                id: IdGenerator.plan(semester, 'CS102'),
                courseId: IdGenerator.course('CS102'),
                teacherId: 'tea_002',
                semester: semester,
                classId: class2024.id,
                schedule: '周二 5-6节, 周四 7-8节',
                classroom: '实验楼B203',
                capacity: 80,
                enrolled: 1,  // 已有1名学生
                status: 'active'
            },
            {
                id: IdGenerator.plan(semester, 'CS103'),
                courseId: IdGenerator.course('CS103'),
                teacherId: 'tea_003',
                semester: semester,
                classId: class2024.id,
                schedule: '周一 3-4节, 周五 1-2节',
                classroom: '教学楼A205',
                capacity: 100,
                enrolled: 0,
                status: 'active'
            }
        ];

        for (const plan of plansData) {
            await addData('plans', plan);
            console.log('开课计划创建成功:', plan.id);
        }

        // ==================== 5. 学生选课 ====================
        const firstPlanId = IdGenerator.plan(semester, 'CS101');
        const secondPlanId = IdGenerator.plan(semester, 'CS102');
        
        // 选课：数据结构与算法
        const enrollment1 = {
            id: `sc_${student1.id}_${firstPlanId}`,
            studentId: student1.id,
            planId: firstPlanId,
            enrollDate: new Date().toISOString().split('T')[0],
            status: 'active'
        };
        await addData('student_courses', enrollment1);
        
        // 选课：Web前端开发
        const enrollment2 = {
            id: `sc_${student1.id}_${secondPlanId}`,
            studentId: student1.id,
            planId: secondPlanId,
            enrollDate: new Date().toISOString().split('T')[0],
            status: 'active'
        };
        await addData('student_courses', enrollment2);
        console.log('选课记录创建成功');

        // ==================== 6. 添加课件资料 ====================
        const materials = [
            {
                id: await IdGenerator.generic('mat'),
                planId: firstPlanId,
                name: '第一章：数据结构概述.pdf',
                type: 'document',
                url: '#',
                size: '2.5MB',
                uploadDate: '2024-09-01',
                description: '课程第一章课件'
            },
            {
                id: await IdGenerator.generic('mat'),
                planId: firstPlanId,
                name: '课程介绍视频',
                type: 'video',
                url: 'https://www.w3schools.com/html/mov_bbb.mp4',
                size: '15.2MB',
                uploadDate: '2024-09-01',
                description: '课程导论视频'
            },
            {
                id: await IdGenerator.generic('mat'),
                planId: firstPlanId,
                name: '算法示意图.png',
                type: 'image',
                url: 'https://picsum.photos/800/600?random=1',
                size: '156KB',
                uploadDate: '2024-09-05',
                description: '常用算法示意图'
            }
        ];

        for (const material of materials) {
            await addData('course_materials', material);
        }
        console.log('课件资料创建成功');

        // ==================== 7. 添加作业 ====================
        // 顺序生成ID，避免并发导致ID重复
        const assignment1 = {
            id: await IdGenerator.assignment(firstPlanId),
            planId: firstPlanId,
            name: '作业1：链表实现',
            description: '使用C++或Java实现单链表的基本操作，包括插入、删除、查找等功能。',
            deadline: '2025-12-10',
            totalScore: 100,
            weight: 15,
            status: 'published',
            createdAt: '2025-12-01'
        };
        await addData('assignments', assignment1);
        
        const assignment2 = {
            id: await IdGenerator.assignment(firstPlanId),
            planId: firstPlanId,
            name: '作业2：二叉树遍历',
            description: '实现二叉树的前序、中序、后序遍历算法。',
            deadline: '2025-12-25',
            totalScore: 100,
            weight: 15,
            status: 'published',
            createdAt: '2025-12-05'
        };
        await addData('assignments', assignment2);
        
        const assignment3 = {
            id: await IdGenerator.assignment(firstPlanId),
            planId: firstPlanId,
            name: '作业3：排序算法实现',
            description: '实现快速排序和归并排序算法，并进行性能比较分析。',
            deadline: '2025-12-30',
            totalScore: 100,
            weight: 20,
            status: 'published',
            createdAt: '2025-12-18'
        };
        await addData('assignments', assignment3);
        console.log('作业创建成功');

        // ==================== 7.2. 为Web前端开发课程添加作业 ====================
        const assignment4 = {
            id: await IdGenerator.assignment(secondPlanId),
            planId: secondPlanId,
            name: '作业1：响应式页面设计',
            description: '使用HTML5和CSS3实现一个响应式个人主页，要求支持PC端和移动端适配。',
            deadline: '2025-12-28',
            totalScore: 100,
            weight: 30,
            status: 'published',
            createdAt: '2025-12-15'
        };
        await addData('assignments', assignment4);
        console.log('Web前端开发作业创建成功');

        // ==================== 8. 添加成绩记录 ====================
        const scoreId = IdGenerator.score(student1.id, firstPlanId);
        const scoreRecord = {
            id: scoreId,
            studentId: student1.id,
            planId: firstPlanId,
            quiz: 85,        // 平时成绩
            midterm: 82,     // 期中成绩
            final: 90,       // 期末成绩
            total: 88,       // 总评成绩
            gpa: 3.8,
            semester: semester,
            updatedAt: new Date().toISOString()
        };
        await addData('scores', scoreRecord);
        console.log('成绩记录创建成功:', scoreId);

        // ==================== 9. 添加成绩明细 ====================
        const scoreDetails = [
            {
                id: await IdGenerator.generic('detail'),
                scoreId: scoreId,
                itemName: '平时出勤',
                weight: 10,
                score: 95,
                status: 'completed',
                submitTime: '2024-11-20'
            },
            {
                id: await IdGenerator.generic('detail'),
                scoreId: scoreId,
                itemName: '作业1',
                weight: 15,
                score: 85,
                status: 'completed',
                submitTime: '2024-12-01'
            },
            {
                id: await IdGenerator.generic('detail'),
                scoreId: scoreId,
                itemName: '作业2',
                weight: 15,
                score: 90,
                status: 'completed',
                submitTime: '2024-12-10'
            },
            {
                id: await IdGenerator.generic('detail'),
                scoreId: scoreId,
                itemName: '期中考试',
                weight: 20,
                score: 82,
                status: 'completed',
                submitTime: '2024-11-15'
            },
            {
                id: await IdGenerator.generic('detail'),
                scoreId: scoreId,
                itemName: '期末考试',
                weight: 40,
                score: 90,
                status: 'completed',
                submitTime: '2024-12-20'
            }
        ];

        for (const detail of scoreDetails) {
            await addData('score_details', detail);
        }
        console.log('成绩明细创建成功');

        console.log('========================================');
        console.log('示例数据初始化完成！');
        console.log('学生账号: student001 / 123456');
        console.log('教师账号: teacher001 / 123456');
        console.log('========================================');
        
    } catch (error) {
        console.error('初始化示例数据失败:', error);
        throw error;
    }
}

// 补全缺失的成绩数据
async function addMissingScores() {
    try {
        const plans = await getAllData('plans');
        const students = await getAllData('users');
        const student = students.find(u => u.role === 'student' && u.id === 'stu_2024001');
        
        if (!student || plans.length === 0) {
            console.error('❌ 无法补全成绩：缺少学生或开课计划数据');
            return;
        }
        
        const firstPlan = plans[0];
        const scoreId = `score_${student.id}_${firstPlan.id}`;
        
        // 添加成绩记录
        const scoreRecord = {
            id: scoreId,
            studentId: student.id,
            planId: firstPlan.id,
            quiz: 85,
            midterm: 82,
            final: 90,
            total: 88,
            gpa: 3.8,
            semester: firstPlan.semester,
            updatedAt: new Date().toISOString()
        };
        await addData('scores', scoreRecord);
        console.log('✅ 成绩记录已补全:', scoreId);
        
        // 添加成绩明细
        const scoreDetails = [
            { itemName: '平时出勤', weight: 10, score: 95 },
            { itemName: '作业1', weight: 15, score: 85 },
            { itemName: '作业2', weight: 15, score: 90 },
            { itemName: '期中考试', weight: 20, score: 82 },
            { itemName: '期末考试', weight: 40, score: 90 }
        ];
        
        for (const detail of scoreDetails) {
            await addData('score_details', {
                id: await IdGenerator.generic('detail'),
                scoreId: scoreId,
                itemName: detail.itemName,
                weight: detail.weight,
                score: detail.score,
                status: 'completed',
                submitTime: new Date().toISOString().split('T')[0]
            });
        }
        console.log('✅ 成绩明细已补全');
        
    } catch (error) {
        console.error('❌ 补全成绩失败:', error);
    }
}

// 页面加载时初始化数据库
window.addEventListener('DOMContentLoaded', async () => {
    try {
        await initDatabase();
        await initSampleData();
    } catch (error) {
        console.error('数据库初始化失败:', error);
    }
});

// 清除所有数据并重新初始化（开发用）
async function resetDatabase() {
    if (!confirm('确定要清除所有数据并重新初始化吗？这将删除所有现有数据！')) {
        return;
    }
    
    try {
        console.log('正在重置数据库...');
        
        // 关闭当前数据库连接
        if (db) {
            db.close();
            db = null;
        }
        
        // 删除数据库
        const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
        
        deleteRequest.onsuccess = async () => {
            console.log('旧数据库已删除');
            
            // 等待一下
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // 重新初始化
            await initDatabase();
            await initSampleData();
            
            alert('数据库已重置！页面将刷新。');
            location.reload();
        };
        
        deleteRequest.onerror = () => {
            console.error('删除数据库失败:', deleteRequest.error);
            alert('重置失败，请手动刷新页面重试');
        };
        
        deleteRequest.onblocked = () => {
            console.warn('数据库删除被阻止，请关闭所有使用该数据库的标签页');
            alert('请关闭所有使用该数据库的标签页后重试');
        };
        
    } catch (error) {
        console.error('重置数据库失败:', error);
        alert('重置失败：' + error.message);
    }
}

// 导出数据（用于备份或迁移）
async function exportData() {
    try {
        const data = {
            version: DB_VERSION,
            exportTime: new Date().toISOString(),
            users: await getAllData('users'),
            classes: await getAllData('classes'),
            courses: await getAllData('courses'),
            plans: await getAllData('plans'),
            student_courses: await getAllData('student_courses'),
            scores: await getAllData('scores'),
            score_details: await getAllData('score_details'),
            course_materials: await getAllData('course_materials'),
            assignments: await getAllData('assignments'),
            assignment_submissions: await getAllData('assignment_submissions')
        };
        
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `database_backup_${Date.now()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        console.log('数据导出成功');
    } catch (error) {
        console.error('导出数据失败:', error);
        alert('导出失败：' + error.message);
    }
}

// 导入数据（从备份文件恢复）
async function importData(jsonData) {
    try {
        const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
        
        console.log('开始导入数据...');
        
        // 导入各个表的数据
        const tables = ['users', 'classes', 'courses', 'plans', 'student_courses', 
                       'scores', 'score_details', 'course_materials', 'assignments', 
                       'assignment_submissions'];
        
        for (const table of tables) {
            if (data[table] && Array.isArray(data[table])) {
                for (const item of data[table]) {
                    try {
                        await addData(table, item);
                    } catch (err) {
                        console.warn(`导入 ${table} 数据失败:`, item, err);
                    }
                }
                console.log(`${table} 表数据导入完成，共 ${data[table].length} 条`);
            }
        }
        
        console.log('数据导入成功');
        alert('数据导入成功！');
    } catch (error) {
        console.error('导入数据失败:', error);
        alert('导入失败：' + error.message);
    }
}

// 将重置和导出函数暴露到全局，方便在控制台调用
window.resetDatabase = resetDatabase;
window.exportData = exportData;
window.importData = importData;

// 暴露 ID 生成器（方便其他模块使用）
window.IdGenerator = IdGenerator;
