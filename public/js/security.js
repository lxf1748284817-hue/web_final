/**
 * 【模块名称】：安全中心与用户认证模块
 * 【维护人员】：梁德铭
 * 【功能描述】：
 * 1. 登录鉴权：实现基于 IndexedDB 的异步用户查找，支持账号、密码、角色三重复合校验。
 * 2. 安全加固：采用 SHA256 加盐哈希算法，逻辑与 db.js 严格对齐，确保密文比对的一致性。
 * 3. 访问控制：内置登录尝试限制（默认3次），超过限制将锁定当前会话的登录尝试。
 * 4. 路由分发：根据用户角色（学生/教师/管理员）自动导向对应的后台目录，支持“初次登录强制改密”拦截。
 * 【整合指南】：
 * 1. 依赖库：必须在 HTML 中提前引入 CryptoJS 库（用于哈希计算）。
 * 2. 数据库：依赖 db.js 提供的 BaseDB 全局单例接口。
 * 3. 状态管理：认证成功后，用户信息将以 JSON 字符串形式存入 localStorage['currentUser']。
 * 4. 角色扩展：若新增角色，需同步更新 redirectByRole 方法中的路由映射表。
 */

const AuthModule = {
    config: {
        lockLimit: 3,
        sessionKey: 'currentUser'
    },
    
    // 登录尝试计数器
    _loginAttempts: {},

    /**
     * 基础加密工具函数
     */
    SecurityModule: {
        hashPassword: function(password, salt) {
            if (!password || !salt) return '';
            if (typeof CryptoJS === 'undefined') {
                console.error("CryptoJS 未定义，请检查 HTML 引入顺序");
                return '';
            }
            return CryptoJS.SHA256(password + salt).toString();
        }
    },

    /**
     * 获取数据库实例
     */
    async getDB() {
        if (typeof BaseDB !== 'undefined' && typeof BaseDB.open === 'function') {
            return await BaseDB.open();
        } else {
            throw new Error("未找到 BaseDB 接口");
        }
    },

    /**
     * 核心登录处理
     */
    async handleLogin(event) {
        event.preventDefault();
        const usernameEl = document.getElementById('username');
        const passwordEl = document.getElementById('password');
        const roleEl = document.getElementById('user-role'); // 获取下拉框元素
        const errorEl = document.getElementById('login-error-message');
        
        const username = usernameEl.value.trim();
        const password = passwordEl.value;
        const selectedRole = roleEl ? roleEl.value : ''; // 获取选中的身份值
        
        if (errorEl) errorEl.textContent = '';

        // 验证必填项
        if (!selectedRole) {
            if (errorEl) errorEl.textContent = '请选择登录身份。';
            return;
        }
        if (!username || !password) {
            if (errorEl) errorEl.textContent = '账号和密码不能为空。';
            return;
        }

        if (this._loginAttempts[username] >= this.config.lockLimit) {
            if (errorEl) errorEl.textContent = `账号 ${username} 已被锁定。`;
            return;
        }

        try {
            const db = await this.getDB();
            const transaction = db.transaction(['users'], 'readonly');
            const store = transaction.objectStore('users');
            
            let userFound = false;
            const request = store.openCursor();
            
            request.onsuccess = (e) => {
                const cursor = e.target.result;
                if (cursor) {
                    if (cursor.value.username === username) {
                        userFound = true;
                        // 关键修改：将选中的角色传给验证函数
                        this.performValidation(cursor.value, password, errorEl, selectedRole);
                    } else {
                        cursor.continue();
                    }
                } else if (!userFound) {
                    if (errorEl) errorEl.textContent = '账号或密码错误。';
                }
            };
        } catch (err) {
            console.error("登录异常:", err);
            if (errorEl) errorEl.textContent = '安全验证模块异常。';
        }
    },

    /**
     * 验证逻辑
     */
    performValidation(user, password, errorEl, selectedRole) {
        // --- 核心修改：角色校验 ---
        if (user.role !== selectedRole) {
            if (errorEl) errorEl.textContent = '身份不匹配：该账号不具备所选身份权限。';
            return;
        }

        const salt = user.salt || user.username;
        const enteredHash = this.SecurityModule.hashPassword(password, salt);

        if (enteredHash === user.password) {
            this._loginAttempts[user.username] = 0;
            
            localStorage.setItem(this.config.sessionKey, JSON.stringify({
                id: user.id,
                username: user.username,
                role: user.role,
                name: user.name
            }));

            if (user.isFirstLogin === true || user.isFirstLogin === 'true') {
                alert(`欢迎新用户 ${user.username}！首次登录请重置密码。`);
                window.location.href = 'reset_password.html?user=' + user.username;
                return;
            }

            this.redirectByRole(user.role);
        } else {
            this._loginAttempts[user.username] = (this._loginAttempts[user.username] || 0) + 1;
            const left = this.config.lockLimit - this._loginAttempts[user.username];
            if (errorEl) errorEl.textContent = left <= 0 ? "账号已锁定" : `密码错误，还有 ${left} 次机会。`;
        }
    },

    /**
     * 跳转逻辑
     */
    redirectByRole(role) {
        const routes = {
            'student': '../student/index.html',
            'teacher': '../Teacher/HTML/dashboard.html',
            'admin_edu': '../admin/admin.html',
            'admin_sys': '../TMS_System_Admin/admin.html'
        };
        alert(`登录成功！正在进入系统...`);
        window.location.href = routes[role] || '../index.html';
    },

    init() {
        const form = document.getElementById('login-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleLogin(e));
        }
    }
};

document.addEventListener('DOMContentLoaded', () => AuthModule.init());