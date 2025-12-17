/**
 * 密码重置模块 (由 [你的名字] 维护)
 * 对整合者友好：
 * 1. 封装在 ResetPasswordModule 命名空间下。
 * 2. 数据库连接适配 BaseDB 或全局 openDB。
 * 3. 哈希算法逻辑优先尝试调用 AuthModule.hashPassword 以保持全局一致。
 */

const ResetPasswordModule = {
    // 1. 页面元素映射 (Getter 模式)
    get els() {
        return {
            form: document.getElementById('reset-password-form'),
            newInput: document.getElementById('new-password'),
            confirmInput: document.getElementById('confirm-password'),
            errorDiv: document.getElementById('reset-error-message'),
            strength: document.getElementById('password-strength-indicator')
        };
    },

    // 2. 数据库适配接口
    async getDB() {
        if (typeof BaseDB !== 'undefined' && typeof BaseDB.open === 'function') {
            return await BaseDB.open();
        } else if (typeof openDB === 'function') {
            return await openDB();
        }
        throw new Error("ResetPasswordModule: 未找到数据库连接接口");
    },

    /**
     * 核心数据库操作：更新指定用户的密码
     */
    async updatePassword(username, newPassword) {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(['users'], 'readwrite');
            const store = tx.objectStore('users');
            const request = store.openCursor();
            let found = false;

            request.onsuccess = (e) => {
                const cursor = e.target.result;
                if (cursor) {
                    if (cursor.value.username === username) {
                        const userData = cursor.value;
                        
                        // 优先使用全局哈希算法，否则降级使用模拟值
                        const hashFn = (typeof AuthModule !== 'undefined' && AuthModule.hashPassword) 
                                       ? AuthModule.hashPassword 
                                       : (p) => 'new_password_hash';

                        userData.hashedPassword = hashFn(newPassword, userData.salt);
                        
                        // 重置成功后，强制改密标记一律设为 false
                        userData.isFirstLogin = false;

                        const updateReq = cursor.update(userData);
                        updateReq.onsuccess = () => {
                            found = true;
                            resolve(true);
                        };
                    } else {
                        cursor.continue();
                    }
                } else if (!found) {
                    resolve(false);
                }
            };
            request.onerror = () => reject("数据库写操作失败");
        });
    },

    // 3. 密码强度校验逻辑
    checkStrength() {
        const pass = this.els.newInput.value;
        let score = 0;
        if (pass.length >= 8) score++;
        if (/[a-z]/.test(pass)) score++;
        if (/[A-Z]/.test(pass)) score++;
        if (/[0-9]/.test(pass)) score++;
        if (/[!@#$%^&*]/.test(pass)) score++;

        const strengthMap = ['太弱', '弱', '中', '中', '强', '强'];
        const colorMap = ['red', 'red', 'orange', 'orange', 'green', 'green'];

        this.els.strength.textContent = `密码强度：${strengthMap[score]}`;
        this.els.strength.style.color = colorMap[score];
        return score;
    },

    // 4. 事件处理逻辑
    async handleReset(e) {
        e.preventDefault();
        const { newInput, confirmInput, errorDiv } = this.els;
        errorDiv.textContent = '';

        // 获取 URL 中的目标用户
        const params = new URLSearchParams(window.location.search);
        const username = params.get('user');

        if (!username) {
            errorDiv.textContent = '非法请求：未指定重置目标。';
            return;
        }

        // 校验
        if (newInput.value !== confirmInput.value) {
            errorDiv.textContent = '两次输入不一致。';
            return;
        }
        if (this.checkStrength() < 3) {
            errorDiv.textContent = '密码强度不足。';
            return;
        }

        try {
            const success = await this.updatePassword(username, newInput.value);
            if (success) {
                alert('密码重置成功，请重新登录。');
                window.location.href = 'login.html';
            } else {
                errorDiv.textContent = '未找到该用户，重置失败。';
            }
        } catch (err) {
            errorDiv.textContent = '操作异常：' + err;
        }
    },

    // 5. 初始化
    init() {
        const { form, newInput, confirmInput } = this.els;
        if (form) form.addEventListener('submit', (e) => this.handleReset(e));
        if (newInput) newInput.addEventListener('input', () => this.checkStrength());
        if (confirmInput) confirmInput.addEventListener('input', () => this.els.errorDiv.textContent = '');
        
        // 首次加载检查 URL 标记
        const params = new URLSearchParams(window.location.search);
        if (params.get('force') === 'true') {
            console.log("ResetModule: 检测到强制重置模式激活");
        }
    }
};

// 启动模块
document.addEventListener('DOMContentLoaded', () => ResetPasswordModule.init());