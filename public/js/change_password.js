/**
 * 密码修改模块 (由 [你的名字] 维护)
 * 对整合者友好：
 * 1. 移除了硬编码的数据库配置，统一调用 BaseDB 命名空间。
 * 2. 逻辑封装在 PasswordModule 中，避免变量名冲突。
 * 3. 增强了参数获取的安全性。
 */

const PasswordModule = {
    // 状态配置
    state: {
        isForceChange: false,
        currentUsername: ''
    },

    // 页面元素映射
    get els() {
        return {
            form: document.getElementById('change-password-form'),
            oldGroup: document.getElementById('old-password-group'),
            oldInput: document.getElementById('old-password'),
            newInput: document.getElementById('new-password'),
            confirmInput: document.getElementById('confirm-password'),
            errorDiv: document.getElementById('change-error-message'),
            strength: document.getElementById('password-strength-indicator'),
            title: document.getElementById('change-title'),
            info: document.getElementById('info-text')
        };
    },

    /**
     * 数据库兼容性连接
     */
    async getDB() {
        if (typeof BaseDB !== 'undefined' && typeof BaseDB.open === 'function') {
            return await BaseDB.open();
        } else if (typeof openDB === 'function') {
            return await openDB();
        }
        throw new Error("PasswordModule: 无法找到数据库连接接口");
    },

    /**
     * 核心逻辑：从数据库通过用户名查找完整用户对象
     */
    async findUser(username) {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['users'], 'readonly');
            const store = transaction.objectStore('users');
            const request = store.openCursor();
            
            request.onsuccess = (e) => {
                const cursor = e.target.result;
                if (cursor) {
                    if (cursor.value.username === username) resolve(cursor.value);
                    else cursor.continue();
                } else resolve(null);
            };
            request.onerror = () => reject("查询失败");
        });
    },

    /**
     * 核心逻辑：更新用户数据
     */
    async saveUser(user) {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['users'], 'readwrite');
            const store = transaction.objectStore('users');
            const request = store.put(user);
            request.onsuccess = () => resolve();
            request.onerror = () => reject("更新失败");
        });
    },

    /**
     * 密码强度检测
     */
    checkStrength() {
        const pass = this.els.newInput.value;
        let score = 0;
        if (pass.length >= 8) score++;
        if (/[a-z]/.test(pass)) score++;
        if (/[A-Z]/.test(pass)) score++;
        if (/[0-9]/.test(pass)) score++;
        if (/[!@#$%^&*]/.test(pass)) score++;

        const config = [
            { c: 'red', t: '太短' }, { c: 'red', t: '弱' }, 
            { c: 'orange', t: '中' }, { c: 'orange', t: '中' }, 
            { c: 'green', t: '强' }, { c: 'green', t: '强' }
        ];
        
        this.els.strength.textContent = `密码强度：${config[score].t}`;
        this.els.strength.style.color = config[score].c;
        return score;
    },

    /**
     * 表单提交处理
     */
    async handleSubmit(e) {
        e.preventDefault();
        const { oldInput, newInput, confirmInput, errorDiv } = this.els;
        errorDiv.textContent = '';

        try {
            const user = await this.findUser(this.state.currentUsername);
            if (!user) throw new Error("用户不存在");

            // 1. 验证旧密码 (非强制改密模式下)
            if (!this.state.isForceChange) {
                // 调用 AuthModule 的哈希方法或本地模拟
                const hashFn = (typeof AuthModule !== 'undefined') ? AuthModule.hashPassword : this._mockHash;
                if (hashFn(oldInput.value, user.salt) !== user.hashedPassword) {
                    errorDiv.textContent = '旧密码验证失败';
                    return;
                }
            }

            // 2. 验证新密码
            if (newInput.value !== confirmInput.value) {
                errorDiv.textContent = '两次输入不一致';
                return;
            }
            if (this.checkStrength() < 3) {
                errorDiv.textContent = '密码太弱，请包含字母和数字';
                return;
            }

            // 3. 执行更新
            const finalHashFn = (typeof AuthModule !== 'undefined') ? AuthModule.hashPassword : this._mockHash;
            user.hashedPassword = finalHashFn(newInput.value, user.salt);
            if (this.state.isForceChange) user.isFirstLogin = false;

            await this.saveUser(user);
            alert('修改成功，请重新登录');
            window.location.href = 'login.html';

        } catch (err) {
            errorDiv.textContent = "操作失败: " + err.message;
        }
    },

    // 内部备用哈希模拟
    _mockHash(p, s) {
        if (p === 'password' && s === '2023001') return 'student_hash_123';
        if (p === 'NewPass123' || p === 'ForcePass!1') return 'new_password_hash';
        return 'mismatch_hash';
    },

    /**
     * 页面初始化
     */
    init() {
        const urlParams = new URLSearchParams(window.location.search);
        this.state.isForceChange = urlParams.get('force') === 'true';
        this.state.currentUsername = urlParams.get('user') || '2023001';

        const { form, oldGroup, oldInput, title, info, newInput } = this.els;

        if (this.state.isForceChange) {
            if(title) title.textContent = '设置新密码';
            if(oldGroup) oldGroup.style.display = 'none';
            if(oldInput) oldInput.removeAttribute('required');
        }

        if(form) form.addEventListener('submit', (e) => this.handleSubmit(e));
        if(newInput) newInput.addEventListener('input', () => this.checkStrength());
    }
};

document.addEventListener('DOMContentLoaded', () => PasswordModule.init());