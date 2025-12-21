/**
 * 统一认证服务
 * 兼容现有代码，提供统一的登录和权限管理
 */

// 内联角色配置
const USER_ROLES = {
    STUDENT: 'student',
    TEACHER: 'teacher', 
    ADMIN_EDU: 'admin_edu',
    ADMIN_SYS: 'sysadmin',
    GUEST: 'guest'
};

const ROLE_DISPLAY_NAMES = {
    [USER_ROLES.STUDENT]: '学生',
    [USER_ROLES.TEACHER]: '教师',
    [USER_ROLES.ADMIN_EDU]: '教学管理员',
    [USER_ROLES.ADMIN_SYS]: '系统管理员',
    [USER_ROLES.GUEST]: '游客'
};

const ROUTES = {
    STUDENT: './student/index.html',
    TEACHER: './Teacher/HTML/dashboard.html',
    ADMIN_EDU: './admin/admin.html',
    ADMIN_SYS: './TMS_System_Admin/admin.html'
};

class AuthService {
    constructor() {
        this.currentUser = null;
        this.config = {
            lockLimit: 3,
            sessionKey: 'currentUser',
            tokenExpiry: 24 * 60 * 60 * 1000 // 24小时
        };
        this.loginAttempts = {};
    }

    /**
     * 用户登录 - 兼容现有登录逻辑
     */
    async login(username, password, role) {
        try {
            // 验证输入
            if (!username || !password || !role) {
                throw new Error('用户名、密码和角色不能为空');
            }

            // 检查登录尝试次数
            if (this.loginAttempts[username] >= this.config.lockLimit) {
                throw new Error(`账号 ${username} 已被锁定，请稍后重试`);
            }

            // 查找用户
            const user = await this._findUser(username);
            if (!user) {
                this._recordFailedAttempt(username);
                throw new Error('用户名或密码错误');
            }

            // 验证角色
            if (user.role !== role) {
                throw new Error('身份不匹配：该账号不具备所选身份权限');
            }

            // 验证账号状态
            if (user.status === 'locked') {
                throw new Error('账号已被锁定，请联系管理员');
            }
            if (user.status === 'inactive') {
                throw new Error('账号未激活，请联系管理员');
            }

            // 验证密码
            const isValidPassword = await this._verifyPassword(password, user);
            if (!isValidPassword) {
                this._recordFailedAttempt(username);
                throw new Error('用户名或密码错误');
            }

            // 清除登录尝试记录
            delete this.loginAttempts[username];

            // 创建会话
            const session = this._createSession(user);
            this.currentUser = user;

            // 记录登录日志
            this._logActivity(user.id, 'login', 'user_login');

            // 检查是否首次登录
            if (user.isFirstLogin) {
                return {
                    success: true,
                    user: session,
                    isFirstLogin: true,
                    message: '首次登录，请重置密码'
                };
            }

            return {
                success: true,
                user: session,
                isFirstLogin: false,
                message: '登录成功'
            };

        } catch (error) {
            console.error('❌ 登录失败:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * 查找用户
     */
    async _findUser(username) {
        try {
            const db = window.dbManager.getDatabase();
            const tx = db.transaction(['users'], 'readonly');
            const store = tx.objectStore('users');
            const index = store.index('username');
            
            return new Promise((resolve, reject) => {
                const request = index.get(username);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('❌ 查找用户失败:', error);
            return null;
        }
    }

    /**
     * 验证密码 - 兼容现有加密方式
     */
    async _verifyPassword(password, user) {
        if (typeof CryptoJS === 'undefined') {
            console.error('❌ CryptoJS未加载');
            return false;
        }

        const salt = user.salt || user.username;
        const hashedPassword = CryptoJS.SHA256(password + salt).toString();
        return hashedPassword === user.password;
    }

    /**
     * 记录登录失败
     */
    _recordFailedAttempt(username) {
        this.loginAttempts[username] = (this.loginAttempts[username] || 0) + 1;
        const remaining = this.config.lockLimit - this.loginAttempts[username];
        if (remaining <= 0) {
            console.warn(`⚠️ 账号 ${username} 已被锁定`);
        }
    }

    /**
     * 创建会话
     */
    _createSession(user) {
        const session = {
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
            email: user.email,
            avatar: user.avatar,
            loginTime: new Date().toISOString(),
            expiresAt: new Date(Date.now() + this.config.tokenExpiry).toISOString()
        };

        // 保存到localStorage（兼容现有方式）
        localStorage.setItem(this.config.sessionKey, JSON.stringify(session));
        
        return session;
    }

    /**
     * 登出
     */
    logout() {
        // 记录日志
        if (this.currentUser) {
            this._logActivity(this.currentUser.id, 'logout', 'user_logout');
        }

        // 清除会话
        localStorage.removeItem(this.config.sessionKey);
        this.currentUser = null;
        
        return { success: true, message: '已退出登录' };
    }

    /**
     * 检查当前会话
     */
    checkSession() {
        try {
            const sessionData = localStorage.getItem(this.config.sessionKey);
            if (!sessionData) {
                return null;
            }

            const session = JSON.parse(sessionData);
            
            // 验证会话数据完整性
            if (!session || !session.id || !session.username || !session.role) {
                console.warn('⚠️ 会话数据不完整，清除会话');
                this.logout();
                return null;
            }
            
            // 检查会话是否过期
            if (new Date() > new Date(session.expiresAt)) {
                this.logout();
                return null;
            }

            // 更新当前用户
            if (!this.currentUser || this.currentUser.id !== session.id) {
                if (session.id) {
                    this._loadCurrentUser(session.id);
                } else {
                    console.warn('⚠️ 会话数据缺少用户ID，清除会话');
                    this.logout();
                    return null;
                }
            }

            return session;
        } catch (error) {
            console.error('❌ 检查会话失败:', error);
            return null;
        }
    }

    /**
     * 加载当前用户信息
     */
    async _loadCurrentUser(userId) {
        try {
            const user = await window.dbManager.get('users', userId);
            this.currentUser = user;
        } catch (error) {
            console.error('❌ 加载用户信息失败:', error);
        }
    }

    /**
     * 根据角色跳转到对应页面
     */
    redirectByRole(role) {
        const route = ROUTES[role];
        if (route) {
            alert(`登录成功！正在进入${ROLE_DISPLAY_NAMES[role]}端...`);
            window.location.href = route;
        } else {
            console.error('❌ 未知角色:', role);
        }
    }

    /**
     * 权限检查
     */
    hasPermission(requiredRole) {
        if (!this.currentUser) {
            return false;
        }

        const roleHierarchy = {
            'student': 1,
            'teacher': 2,
            'admin_edu': 3,
            'sysadmin': 4
        };

        const userLevel = roleHierarchy[this.currentUser.role] || 0;
        const requiredLevel = roleHierarchy[requiredRole] || 0;

        return userLevel >= requiredLevel;
    }

    /**
     * 重置密码
     */
    async resetPassword(username, newPassword) {
        try {
            if (!username || !newPassword) {
                throw new Error('用户名和新密码不能为空');
            }

            if (newPassword.length < 8) {
                throw new Error('新密码长度不能少于8位');
            }

            const user = await this._findUser(username);
            if (!user) {
                throw new Error('用户不存在');
            }

            // 加密新密码
            const salt = user.salt || user.username;
            const hashedPassword = CryptoJS.SHA256(newPassword + salt).toString();

            // 更新密码
            user.password = hashedPassword;
            user.isFirstLogin = false;
            user.updatedAt = new Date().toISOString();

            await window.dbManager.update('users', user);
            this._logActivity(user.id, 'password_reset', 'reset_password');

            return { success: true, message: '密码重置成功' };

        } catch (error) {
            console.error('❌ 密码重置失败:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * 忘记密码验证
     */
    async forgotPassword(username, email, verificationCode = null) {
        try {
            const user = await this._findUser(username);
            if (!user) {
                throw new Error('用户不存在');
            }

            if (user.email !== email) {
                throw new Error('邮箱与账号不匹配');
            }

            // 简化验证码检查（生产环境需要真实邮件验证）
            if (verificationCode && verificationCode !== '1234') {
                throw new Error('验证码错误');
            }

            return {
                success: true,
                user: {
                    id: user.id,
                    username: user.username,
                    name: user.name
                },
                message: '身份验证成功'
            };

        } catch (error) {
            console.error('❌ 忘记密码验证失败:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * 记录活动日志
     */
    _logActivity(userId, action, target, details = null) {
        try {
            const logEntry = {
                id: `log_${userId}_${action}_${Date.now()}`,
                userId,
                action,
                target,
                details: details ? JSON.stringify(details) : '',
                ip: '', // 可以从request中获取
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString()
            };

            window.dbManager.add('audit_logs', logEntry);
        } catch (error) {
            console.error('❌ 记录活动日志失败:', error);
        }
    }

    /**
     * 获取当前用户
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * 获取角色显示名称
     */
    getRoleDisplayName(role) {
        return ROLE_DISPLAY_NAMES[role] || role;
    }

    /**
     * 初始化认证服务
     */
    async init() {
        const session = this.checkSession();
        if (session) {
            console.log(`✅ 用户会话有效: ${session.name} (${this.getRoleDisplayName(session.role)})`);
        }
    }
}

// 创建单例实例并暴露到全局
const authService = new AuthService();
window.authService = authService;

// 向后兼容 - 保持现有的全局变量
window.AuthModule = {
    SecurityModule: {
        hashPassword: (password, salt) => {
            if (typeof CryptoJS !== 'undefined') {
                return CryptoJS.SHA256(password + salt).toString();
            }
            return '';
        }
    }
};