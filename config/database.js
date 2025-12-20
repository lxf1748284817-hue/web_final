/**
 * 统一数据库配置
 * 兼容现有模块，最小化改动
 */

export const DATABASE_CONFIG = {
    name: 'CurriculumDesignDB',  // 保持原数据库名，避免冲突
    version: 12,                  // 版本升级，触发数据库迁移
    stores: [
        'users',           // 用户表（统一所有角色）
        'classes',         // 班级表
        'courses',         // 课程表
        'plans',           // 培养方案/开课计划
        'scores',          // 成绩表
        'enrollments',     // 选课记录
        'course_materials', // 课程资料
        'assignments',     // 作业表
        'submissions',     // 作业提交
        'exams',           // 考试表
        'exam_results',    // 考试结果
        'audit_logs',      // 操作日志
        'system_settings', // 系统设置
        'data_backups'     // 数据备份
    ]
};

/**
 * 统一ID生成器
 * 保持与现有ID格式兼容
 */
export const ID_GENERATOR = {
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

/**
 * 角色定义
 */
export const USER_ROLES = {
    STUDENT: 'student',
    TEACHER: 'teacher', 
    ADMIN_EDU: 'admin_edu',
    ADMIN_SYS: 'sysadmin',
    GUEST: 'guest'
};

/**
 * 角色显示名称
 */
export const ROLE_DISPLAY_NAMES = {
    [USER_ROLES.STUDENT]: '学生',
    [USER_ROLES.TEACHER]: '教师',
    [USER_ROLES.ADMIN_EDU]: '教学管理员',
    [USER_ROLES.ADMIN_SYS]: '系统管理员',
    [USER_ROLES.GUEST]: '游客'
};

/**
 * 页面路由配置
 */
export const ROUTES = {
    STUDENT: './student/index.html',
    TEACHER: './Teacher/HTML/dashboard.html',
    ADMIN_EDU: './admin/admin.html',
    ADMIN_SYS: './TMS_System_Admin/admin.html'
};