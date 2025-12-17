/**
 * 找回密码模块 (由 [你的名字] 维护)
 * 对整合者友好：
 * 1. 封装在 ForgotPasswordModule 命名空间下。
 * 2. 数据库连接适配 BaseDB 或全局 openDB。
 * 3. 业务逻辑（步骤切换、验证码模拟）独立于 UI 操作。
 */

const ForgotPasswordModule = {
    // 1. 状态管理
    state: {
        currentStep: 1,
        sentVerificationCode: null,
        timerInterval: null,
        countdownSeconds: 60
    },

    // 2. 页面元素获取 (使用 Getter 确保动态获取)
    get els() {
        return {
            form: document.getElementById('forgot-password-form'),
            username: document.getElementById('reset-username'),
            email: document.getElementById('reset-email'),
            codeGroup: document.getElementById('verification-code-group'),
            code: document.getElementById('verification-code'),
            sendBtn: document.getElementById('send-code-btn'),
            nextBtn: document.getElementById('next-step-btn'),
            error: document.getElementById('reset-error-message')
        };
    },

    // 3. 数据库适配接口
    async getDB() {
        if (typeof BaseDB !== 'undefined' && typeof BaseDB.open === 'function') {
            return await BaseDB.open();
        } else if (typeof openDB === 'function') {
            return await openDB();
        }
        throw new Error("ForgotPasswordModule: 数据库接口未就绪");
    },

    /**
     * 在数据库中查找匹配的用户
     */
    async findUserByInfo(username, email) {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(['users'], 'readonly');
            const store = tx.objectStore('users');
            const request = store.openCursor();
            
            request.onsuccess = (e) => {
                const cursor = e.target.result;
                if (cursor) {
                    // 字段必须对齐小组文档：username 和 email
                    if (cursor.value.username === username && cursor.value.email === email) {
                        resolve(cursor.value);
                    } else {
                        cursor.continue();
                    }
                } else {
                    resolve(null);
                }
            };
            request.onerror = () => reject("查询失败");
        });
    },

    // 4. 辅助功能：验证码与倒计时
    startCountdown() {
        let left = this.state.countdownSeconds;
        const btn = this.els.sendBtn;
        btn.disabled = true;
        
        this.state.timerInterval = setInterval(() => {
            left--;
            if (left <= 0) {
                clearInterval(this.state.timerInterval);
                btn.disabled = false;
                btn.textContent = '发送验证码';
            } else {
                btn.textContent = `重新发送 (${left}s)`;
            }
        }, 1000);
    },

    sendCode() {
        if (this.els.sendBtn.disabled) return;
        this.state.sentVerificationCode = Math.floor(1000 + Math.random() * 9000).toString();
        // 模拟邮件行为
        alert(`【模拟邮件系统】\n验证码已发送至您的绑定邮箱。\n验证码：${this.state.sentVerificationCode}`);
        this.startCountdown();
    },

    // 5. 核心：表单流程控制
    async handleSubmit(e) {
        e.preventDefault();
        const { username, email, code, codeGroup, nextBtn, error } = this.els;
        error.textContent = '';

        const usernameVal = username.value.trim();
        const emailVal = email.value.trim();

        if (this.state.currentStep === 1) {
            // 第一步：验证身份
            try {
                const user = await this.findUserByInfo(usernameVal, emailVal);
                if (user) {
                    this.state.currentStep = 2;
                    username.disabled = true;
                    email.disabled = true;
                    codeGroup.style.display = 'block';
                    nextBtn.textContent = '验证并跳转';
                    this.sendCode();
                } else {
                    error.textContent = '账号或邮箱输入错误，请重试。';
                }
            } catch (err) {
                error.textContent = '系统繁忙，请稍后再试。';
            }
        } else {
            // 第二步：核对验证码
            if (code.value.trim() === this.state.sentVerificationCode) {
                alert('身份验证成功！');
                // 跳转到重置密码页，传递用户名
                window.location.href = `change_password.html?user=${usernameVal}&force=true`;
            } else {
                error.textContent = '验证码不正确。';
            }
        }
    },

    // 6. 初始化
    init() {
        const { form, sendBtn } = this.els;
        if (form) form.addEventListener('submit', (e) => this.handleSubmit(e));
        if (sendBtn) sendBtn.addEventListener('click', () => this.sendCode());
    }
};

// 启动
document.addEventListener('DOMContentLoaded', () => ForgotPasswordModule.init());