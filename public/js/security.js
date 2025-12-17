/**
 * 安全中心模块 (由 [你的名字] 维护)
 * 对整合者友好：
 * 1. 移除了重复的建表逻辑，改为调用外部公共接口。
 * 2. 所有的登录尝试逻辑和验证逻辑封装在 AuthModule 对象中。
 * 3. 演示数据仅在独立调试时降级调用。
 */

const AuthModule = {
    config: {
        lockLimit: 3,
        sessionKey: 'currentUser'
    },
    
    // 登录尝试计数器 (私有，避免全局污染)
    _loginAttempts: {},

    /**
     * 获取数据库实例的兼容方法
     */
    async getDB() {
        // 优先尝试 BaseDB.open() (你定义的友好接口) 
        // 其次尝试 openDB() (整合者可能定义的全局接口)
        if (typeof BaseDB !== 'undefined' && typeof BaseDB.open === 'function') {
            return await BaseDB.open();
        } else if (typeof openDB === 'function') {
            return await openDB();
        } else {
            throw new Error("SecurityModule: 未找到有效的数据库连接接口 (openDB)");
        }
    },

    /**
     * 哈希模拟 (保持不变)
     */
    hashPassword(password, salt) {
        if (password === 'password' && salt === '2023001') return 'student_hash_123';
        if (password === 'default' && salt === '2023002') return 'default_hash_002';
        // 重置后的通用哈希
        if (password === 'NewPass123' || password === 'ForcePass!1') return 'new_password_hash';
        return 'mismatch_hash';
    },

    /**
     * 核心登录验证流程
     */
    async handleLogin(event) {
        event.preventDefault();
        const usernameEl = document.getElementById('username');
        const passwordEl = document.getElementById('password');
        const errorEl = document.getElementById('login-error-message');
        
        const username = usernameEl.value.trim();
        const password = passwordEl.value;
        errorEl.textContent = '';

        if (!username || !password) {
            errorEl.textContent = '账号和密码不能为空。';
            return;
        }

        // 检查锁定状态
        if (this._loginAttempts[username] >= this.config.lockLimit) {
            errorEl.textContent = `账号 ${username} 已被锁定。`;
            return;
        }

        try {
            const db = await this.getDB();
            const transaction = db.transaction(['users'], 'readonly');
            const store = transaction.objectStore('users');
            
            // 查找用户逻辑
            let userFound = false;
            const request = store.openCursor();
            
            request.onsuccess = (e) => {
                const cursor = e.target.result;
                if (cursor) {
                    if (cursor.value.username === username) {
                        userFound = true;
                        this.performValidation(cursor.value, password, errorEl);
                    } else {
                        cursor.continue();
                    }
                } else if (!userFound) {
                    errorEl.textContent = '账号或密码错误。';
                }
            };
        } catch (err) {
            console.error(err);
            errorEl.textContent = '安全验证模块异常。';
        }
    },

    /**
     * 验证用户数据并处理跳转
     */
    performValidation(user, password, errorEl) {
        const enteredHash = this.hashPassword(password, user.salt);

        if (enteredHash === user.hashedPassword) {
            this._loginAttempts[user.username] = 0;
            
            // 存入 Session (对整合者友好：只存必要字段)
            localStorage.setItem(this.config.sessionKey, JSON.stringify({
                id: user.id,
                username: user.username,
                role: user.role,
                name: user.name
            }));

            // 强制改密逻辑判断
            if (user.isFirstLogin) {
                alert(`欢迎新用户 ${user.username}！请强制修改您的初始密码。`);
                window.location.href = 'change_password.html?force=true&user=' + user.username;
                return;
            }

            this.redirectByRole(user.role);
        } else {
            // 错误处理
            this._loginAttempts[user.username] = (this._loginAttempts[user.username] || 0) + 1;
            const left = this.config.lockLimit - this._loginAttempts[user.username];
            errorEl.textContent = left <= 0 ? "账号已锁定" : `密码错误，还有 ${left} 次机会。`;
        }
    },

    /**
     * 跳转分发器
     */
    redirectByRole(role) {
        const routes = {
            'student': '../student_side/dashboard.html',
            'teacher': '../teacher_side/course_management.html',
            'admin_sys': '../sys_admin/dashboard.html'
        };
        alert(`登录成功！正在进入系统...`);
        window.location.href = routes[role] || 'index.html';
    },

    /**
     * 模块初始化
     */
    init() {
        const form = document.getElementById('login-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleLogin(e));
        }
    }
};

// 启动模块
document.addEventListener('DOMContentLoaded', () => AuthModule.init());