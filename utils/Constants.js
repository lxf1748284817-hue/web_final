/**
 * 系统常量定义
 */

// 用户角色
export const USER_ROLES = {
    STUDENT: 'student',
    TEACHER: 'teacher',
    ADMIN_EDU: 'admin_edu',
    ADMIN_SYS: 'sysadmin',
    GUEST: 'guest'
};

// 角色显示名称
export const ROLE_DISPLAY_NAMES = {
    [USER_ROLES.STUDENT]: '学生',
    [USER_ROLES.TEACHER]: '教师',
    [USER_ROLES.ADMIN_EDU]: '教学管理员',
    [USER_ROLES.ADMIN_SYS]: '系统管理员',
    [USER_ROLES.GUEST]: '游客'
};

// 课程类别
export const COURSE_CATEGORIES = {
    REQUIRED: 'required',
    ELECTIVE: 'elective',
    GENERAL: 'general'
};

// 课程类别显示名称
export const COURSE_CATEGORY_NAMES = {
    [COURSE_CATEGORIES.REQUIRED]: '必修课',
    [COURSE_CATEGORIES.ELECTIVE]: '选修课',
    [COURSE_CATEGORIES.GENERAL]: '通识课'
};

// 课程状态
export const COURSE_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    DRAFT: 'draft'
};

// 用户状态
export const USER_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    LOCKED: 'locked'
};

// 选课状态
export const ENROLLMENT_STATUS = {
    ENROLLED: 'enrolled',
    COMPLETED: 'completed',
    DROPPED: 'dropped',
    PENDING: 'pending'
};

// 作业状态
export const ASSIGNMENT_STATUS = {
    DRAFT: 'draft',
    PUBLISHED: 'published',
    CLOSED: 'closed'
};

// 提交状态
export const SUBMISSION_STATUS = {
    SUBMITTED: 'submitted',
    GRADED: 'graded',
    LATE: 'late',
    PENDING: 'pending'
};

// 考试状态
export const EXAM_STATUS = {
    DRAFT: 'draft',
    PUBLISHED: 'published',
    IN_PROGRESS: 'in_progress',
    FINISHED: 'finished'
};

// 成绩状态
export const SCORE_STATUS = {
    PENDING: 'pending',
    PUBLISHED: 'published',
    LOCKED: 'locked'
};

// 页面路由配置
export const ROUTES = {
    HOME: '/index.html',
    LOGIN: '/public/login.html',
    FORGOT_PASSWORD: '/public/forgot_password.html',
    RESET_PASSWORD: '/public/reset_password.html',
    
    // 各模块入口
    STUDENT_DASHBOARD: '/student/index.html',
    TEACHER_DASHBOARD: '/Teacher/HTML/dashboard.html',
    ADMIN_DASHBOARD: '/TMS_System_Admin/index.html'
};

// 学期配置
export const SEMESTERS = {
    CURRENT: '2024-1',
    LIST: [
        { value: '2024-1', label: '2024-2025学年第一学期' },
        { value: '2024-2', label: '2024-2025学年第二学期' },
        { value: '2023-1', label: '2023-2024学年第一学期' },
        { value: '2023-2', label: '2023-2024学年第二学期' }
    ]
};

// 成绩等级和绩点对应
export const GRADE_TO_GPA = {
    'A': 4.0,
    'A-': 3.7,
    'B+': 3.3,
    'B': 3.0,
    'B-': 2.7,
    'C+': 2.3,
    'C': 2.0,
    'C-': 1.7,
    'D+': 1.3,
    'D': 1.0,
    'F': 0.0
};

// 百分制成绩等级
export const SCORE_TO_GRADE = {
    '90-100': 'A',
    '85-89': 'A-',
    '82-84': 'B+',
    '78-81': 'B',
    '75-77': 'B-',
    '72-74': 'C+',
    '68-71': 'C',
    '64-67': 'C-',
    '60-63': 'D+',
    '56-59': 'D',
    '0-55': 'F'
};

// 文件类型限制
export const FILE_TYPES = {
    DOCUMENTS: ['.pdf', '.doc', '.docx', '.txt'],
    IMAGES: ['.jpg', '.jpeg', '.png', '.gif', '.bmp'],
    VIDEOS: ['.mp4', '.avi', '.mov', '.wmv', '.flv'],
    AUDIO: ['.mp3', '.wav', '.ogg', '.aac'],
    ARCHIVES: ['.zip', '.rar', '.7z', '.tar', '.gz']
};

// 文件大小限制（字节）
export const FILE_SIZE_LIMITS = {
    DOCUMENT: 10 * 1024 * 1024,     // 10MB
    IMAGE: 5 * 1024 * 1024,         // 5MB
    VIDEO: 100 * 1024 * 1024,       // 100MB
    AUDIO: 20 * 1024 * 1024,        // 20MB
    ARCHIVE: 50 * 1024 * 1024       // 50MB
};

// 系统设置默认值
export const DEFAULT_SETTINGS = {
    MAINTENANCE_MODE: false,
    ALLOW_REGISTRATION: false,
    MAX_LOGIN_ATTEMPTS: 3,
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24小时
    BACKUP_INTERVAL: 24 * 60 * 60 * 1000, // 24小时
    MAX_UPLOAD_SIZE: 100 * 1024 * 1024    // 100MB
};

// 操作类型（用于审计日志）
export const AUDIT_ACTIONS = {
    LOGIN: 'login',
    LOGOUT: 'logout',
    PASSWORD_CHANGE: 'password_change',
    PASSWORD_RESET: 'password_reset',
    USER_CREATE: 'user_create',
    USER_UPDATE: 'user_update',
    USER_DELETE: 'user_delete',
    COURSE_CREATE: 'course_create',
    COURSE_UPDATE: 'course_update',
    COURSE_DELETE: 'course_delete',
    ASSIGNMENT_CREATE: 'assignment_create',
    ASSIGNMENT_UPDATE: 'assignment_update',
    ASSIGNMENT_DELETE: 'assignment_delete',
    SCORE_CREATE: 'score_create',
    SCORE_UPDATE: 'score_update',
    SCORE_PUBLISH: 'score_publish',
    BACKUP_CREATE: 'backup_create',
    BACKUP_RESTORE: 'backup_restore',
    SYSTEM_SETTING_UPDATE: 'system_setting_update'
};

// 通知类型
export const NOTIFICATION_TYPES = {
    INFO: 'info',
    SUCCESS: 'success',
    WARNING: 'warning',
    ERROR: 'error'
};

// 分页配置
export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100
};

// 时间格式
export const DATE_FORMATS = {
    DATE: 'YYYY-MM-DD',
    DATETIME: 'YYYY-MM-DD HH:mm:ss',
    TIME: 'HH:mm:ss',
    DISPLAY_DATE: 'YYYY年MM月DD日',
    DISPLAY_DATETIME: 'YYYY年MM月DD日 HH:mm'
};

// 验证规则
export const VALIDATION_RULES = {
    USERNAME: {
        MIN_LENGTH: 3,
        MAX_LENGTH: 20,
        PATTERN: /^[a-zA-Z0-9_]+$/
    },
    PASSWORD: {
        MIN_LENGTH: 8,
        MAX_LENGTH: 50,
        PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/
    },
    EMAIL: {
        PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    PHONE: {
        PATTERN: /^1[3-9]\d{9}$/
    },
    STUDENT_ID: {
        PATTERN: /^\d{10,12}$/
    },
    COURSE_CODE: {
        PATTERN: /^[A-Z]{2,4}\d{3}$/
    }
};

// 系统消息
export const MESSAGES = {
    LOGIN_SUCCESS: '登录成功！',
    LOGIN_FAILED: '登录失败，请检查用户名和密码',
    ACCOUNT_LOCKED: '账号已被锁定，请联系管理员',
    PASSWORD_CHANGED: '密码修改成功',
    PASSWORD_RESET_SUCCESS: '密码重置成功',
    OPERATION_SUCCESS: '操作成功',
    OPERATION_FAILED: '操作失败',
    NETWORK_ERROR: '网络错误，请稍后重试',
    PERMISSION_DENIED: '权限不足',
    DATA_NOT_FOUND: '数据不存在',
    SERVER_ERROR: '服务器错误'
};

// 系统信息
export const SYSTEM_INFO = {
    NAME: '成绩管理教学平台',
    VERSION: '2.0.0',
    AUTHOR: 'Web编程开发团队',
    COPYRIGHT: '© 2025 成绩管理教学平台. All Rights Reserved.'
};