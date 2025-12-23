// dashboard.js - 完整更新

// 全局函数，供 dashboard.html 调用
window.showLoadingState = function() {
    const courseCardsContainer = document.getElementById('dashboard-course-cards');
    
    if (courseCardsContainer) {
        courseCardsContainer.innerHTML = `
            <div class="loading-courses">
                <div class="spinner"></div>
                <p>正在加载课程数据...</p>
            </div>
        `;
    }
};

window.updateWelcomeMessage = function(courseCount, pendingGrading, upcomingExams) {
    const welcomeMessage = document.querySelector('.welcome-card p');
    if (welcomeMessage) {
        // 保持欢迎消息为空，只显示统计卡片
        welcomeMessage.textContent = '';
    }
};

window.updateCourseOverview = async function(courses) {
    const courseCardsContainer = document.getElementById('dashboard-course-cards');
    if (!courseCardsContainer) return;
    
    // 过滤出已发布的课程
    const publishedCourses = courses.filter(course => course.status === 'published' || course.status === 'active');
    
    // 清空容器
    courseCardsContainer.innerHTML = '';
    
    // 如果没有已发布的课程
    if (publishedCourses.length === 0) {
        courseCardsContainer.innerHTML = `
            <div class="no-courses-message">
                <i class="fas fa-book-open"></i>
                <h3>暂无已发布的课程</h3>
                <p>请前往"课程管理"创建并发布您的第一门课程</p>
                <a href="courses.html" class="btn-primary">前往课程管理</a>
            </div>
        `;
        return;
    }
    
    // 显示所有已发布的课程
    for (const course of publishedCourses) {
        const courseCard = await window.createCourseCard(course);
        courseCardsContainer.appendChild(courseCard);
    }
};

window.createCourseCard = async function(course) {
    // 从数据库获取真实的作业和考试数量
    let homeworkCount = 0;
    let examCount = 0;
    
    try {
        if (window.gradesManager) {
            const homeworkAssignments = await window.gradesManager.getHomeworkAssignments();
            const examAssignments = await window.gradesManager.getExamAssignments();
            homeworkCount = homeworkAssignments.filter(hw => hw.courseId === course.id).length;
            examCount = examAssignments.filter(exam => exam.courseId === course.id).length;
        }
    } catch (error) {
        console.warn('获取作业考试数据失败:', error);
    }
    
    const assignmentCount = homeworkCount + examCount;
    const studentCount = Math.floor(Math.random() * 30) + 20;
    
    // 根据课程状态确定徽章样式
    let statusClass = '';
    let statusText = '';
    
    switch (course.status) {
        case 'published':
            statusClass = 'published';
            statusText = '已发布';
            break;
        case 'draft':
            statusClass = 'draft';
            statusText = '草稿';
            break;
        case 'archived':
            statusClass = 'archived';
            statusText = '已归档';
            break;
        default:
            statusClass = 'draft';
            statusText = '草稿';
    }
    
    const card = document.createElement('div');
    card.className = 'course-card';
    card.dataset.courseId = course.id;
    
    card.innerHTML = `
        <div class="course-header">
            <h3>${course.name}</h3>
            <span class="course-status ${statusClass}">${statusText}</span>
        </div>
        <p class="course-code">${course.code} · ${course.class || '未设置班级'}</p>
        <div class="course-stats">
            <div class="course-stat">
                <i class="fas fa-user-graduate"></i>
                <span>${studentCount} 名学生</span>
            </div>
            <div class="course-stat">
                <i class="fas fa-file-alt"></i>
                <span>${assignmentCount} 个作业</span>
            </div>
        </div>
        <div class="course-actions">
            <a href="courses.html?edit=${course.id}" class="btn-course">管理课程</a>
            <a href="grades.html?course=${course.id}" class="btn-course secondary">录入成绩</a>
        </div>
    `;
    
    return card;
};

window.loadDashboardData = async function() {
    window.showLoadingState();
    try {
        // 直接从数据库获取课程数据
        const courses = await window.dbManager.getAll('courses');
        
        // 更新欢迎区域的统计数据（不再需要作业和考试数据参数）
        await window.updateWelcomeStats(courses);
        
        // 更新课程概览
        window.updateCourseOverview(courses);
    } catch (error) {
        console.error('加载Dashboard数据失败:', error);
        window.updateWelcomeStats([]);
        window.updateCourseOverview([]);
    }
};

window.updateWelcomeStats = async function(courses) {
    // 获取当前教师 ID
    let teacherId = null;
    let session = null;
    if (window.authService) {
        session = await window.authService.checkSession();
        teacherId = session?.id;
    }

    if (!teacherId) {
        document.getElementById('active-course-count').textContent = '0';
        document.getElementById('total-students').textContent = '0';
        document.getElementById('pending-tasks').textContent = '0';
        return;
    }


    // 1. 进行中的课程：plans.teacherId = teacherId，且关联的课程存在
    const plans = await window.dbManager.getAll('plans');
    const teacherPlans = plans.filter(p => p.teacherId === teacherId);
    const planCourseIds = teacherPlans.map(p => p.courseId);
    const teacherCourses = courses.filter(c => planCourseIds.includes(c.id));
    const publishedCourses = teacherCourses.filter(course => course.status === 'published' || course.status === 'active');
    const activeCourseCount = publishedCourses.length;


    // 2. 学生总数：enrollments 中 planId 在 teacherPlans 里的学生去重
    const enrollments = await window.dbManager.getAll('enrollments');
    const teacherEnrollments = enrollments.filter(e => teacherPlans.some(p => p.id === e.planId));
    const uniqueStudentIds = [...new Set(teacherEnrollments.map(e => e.studentId))];
    const totalStudents = uniqueStudentIds.length;


    // 3. 待完成任务：未批改的作业 + 未批改的考试
    const assignments = await window.dbManager.getAll('assignments');
    const teacherAssignments = assignments.filter(a => teacherPlans.some(p => p.id === a.planId));
    const homeworkList = teacherAssignments.filter(a => a.type === 'homework');
    const examList = teacherAssignments.filter(a => a.type === 'exam');

    const submissions = await window.dbManager.getAll('assignment_submissions');
    console.log('[DEBUG] all submissions:', submissions);
    let ungradedHomeworkCount = 0;
    for (const hw of homeworkList) {
        const subs = submissions.filter(s => s.assignmentId === hw.id);
        if (subs.length > 0) ungradedHomeworkCount++;
    }
    let ungradedExamCount = 0;
    for (const exam of examList) {
        const subs = submissions.filter(s => s.assignmentId === exam.id);
        if (subs.length > 0)             ungradedExamCount++;
    }
    const pendingTasks = ungradedHomeworkCount + ungradedExamCount;

    // 更新 DOM
    const activeCourseCountEl = document.getElementById('active-course-count');
    const totalStudentsEl = document.getElementById('total-students');
    const pendingTasksEl = document.getElementById('pending-tasks');

    if (activeCourseCountEl) activeCourseCountEl.textContent = activeCourseCount;
    if (totalStudentsEl) totalStudentsEl.textContent = totalStudents;
    if (pendingTasksEl) pendingTasksEl.textContent = pendingTasks;

    window.updateWelcomeMessage(activeCourseCount, pendingTasks, ungradedHomeworkCount, ungradedExamCount);
};

// 更新用户信息
function updateUserInfo() {
    const session = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (session) {
        const userNameEl = document.querySelector('.user-info h4');
        const userDeptEl = document.querySelector('.user-info p');
        if (userNameEl) userNameEl.textContent = session.name || '教师';
        if (userDeptEl) userDeptEl.textContent = session.department || '未设置院系';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // 更新用户信息
    updateUserInfo();
    
    // 初始化页面
    initDashboard();
    
    function initDashboard() {
        // 加载课程数据
        window.loadDashboardData();
        
        // 设置事件监听器
        setupEventListeners();
    }
    
    function setupEventListeners() {
        // 刷新按钮（如果需要）
        const refreshBtn = document.getElementById('refresh-dashboard');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', function() {
                window.loadDashboardData();
                showNotification('数据已刷新！', 'success');
            });
        }
        
        // 监听storage事件（当其他页面修改了数据时）
        window.addEventListener('storage', function(e) {
            if (e.key === 'teacherCourses' || e.key === 'teacherTodos') {
                window.loadDashboardData();
                showNotification('检测到数据更新，已刷新页面内容。', 'info');
            }
        });
        
        // 监听自定义事件（在同一页面内触发）
        window.addEventListener('courseDataUpdated', function() {
            window.loadDashboardData();
        });
    }
    
    function showNotification(message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button class="close-notification">&times;</button>
        `;
        
        // 添加到页面
        document.body.appendChild(notification);
        
        // 添加关闭按钮事件
        notification.querySelector('.close-notification').addEventListener('click', function() {
            notification.remove();
        });
        
        // 自动移除通知
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
    
    // 添加通知样式（如果尚未添加）
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: space-between;
                min-width: 300px;
                max-width: 400px;
                animation: slideIn 0.3s ease;
                color: white;
            }
            .notification.success {
                background-color: #27ae60;
            }
            .notification.info {
                background-color: #3498db;
            }
            .notification.warning {
                background-color: #f39c12;
            }
            .notification.error {
                background-color: #e74c3c;
            }
            .close-notification {
                background: none;
                border: none;
                color: white;
                font-size: 1.5rem;
                cursor: pointer;
                line-height: 1;
                margin-left: 15px;
            }
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }
});