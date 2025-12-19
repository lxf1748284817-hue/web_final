/**
 * 【模块名称】：找回密码与身份预验证模块
 * 【维护人员】：梁德铭
 * 【功能描述】：
 * 1. 双重认证：实现“账号 + 绑定邮箱”的双重匹配校验，只有在 IndexedDB 中完全匹配的用户才能触发后续流程。
 * 2. 模拟验证：集成模拟邮件发送系统（Alert 模拟），生成 4 位随机验证码并具备 60s 重新发送的冷却保护。
 * 3. 流程控制：采用两步走策略（Step 1: 身份核实 -> Step 2: 验证码校对），确保找回过程的安全有序。
 * 4. 路由衔接：验证成功后，通过 URL 参数（?user=...）安全地将用户导向 reset_password.html 进行密码重设。
 * 【整合指南】：
 * 1. 数据库依赖：依赖 BaseDB 接口读取 'users' 对象仓库。
 * 2. DOM 映射：HTML 需包含验证码输入组（默认隐藏）及对应的账号、邮箱、发送按钮等 ID 元素。
 * 3. 安全说明：本模块不直接修改密码，仅负责身份“准入”验证。实际修改逻辑由后续的 reset_password.js 完成。
 */

const ForgotPasswordModule = {
    // 1. 状态管理
    state: {
        currentStep: 1,
        sentVerificationCode: null,
        timerInterval: null,
        countdownSeconds: 60
    },

    // 2. 页面元素获取
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

    // 3. 数据库适配
    async getDB() {
        if (typeof BaseDB !== 'undefined' && typeof BaseDB.open === 'function') {
            return await BaseDB.open();
        }
        throw new Error("ForgotPasswordModule: 数据库接口未就绪");
    },

    /**
     * 查找匹配的用户
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
                    // 安全校对：用户名和邮箱必须双重匹配
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

    // 4. 验证码倒计时逻辑 (保持不变)
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
        alert(`【模拟邮件系统】\n您的身份验证请求已收到。\n验证码：${this.state.sentVerificationCode}\n(请在 5 分钟内完成验证)`);
        this.startCountdown();
    },

    // 5. 核心：流程控制
    async handleSubmit(e) {
        e.preventDefault();
        const { username, email, code, codeGroup, nextBtn, error } = this.els;
        error.textContent = '';

        const usernameVal = username.value.trim();
        const emailVal = email.value.trim();

        if (this.state.currentStep === 1) {
            // 第一步：数据库身份核实
            try {
                const user = await this.findUserByInfo(usernameVal, emailVal);
                if (user) {
                    this.state.currentStep = 2;
                    username.disabled = true;
                    email.disabled = true;
                    if (codeGroup) codeGroup.style.display = 'block';
                    if (nextBtn) nextBtn.textContent = '验证并去重置密码';
                    this.sendCode();
                } else {
                    error.textContent = '账号与绑定邮箱不匹配，请检查后重试。';
                }
            } catch (err) {
                error.textContent = '安全模块加载失败。';
            }
        } else {
            // 第二步：核对验证码并跳转
            if (code.value.trim() === this.state.sentVerificationCode) {
                alert('身份验证成功！');
                
                /**
                 * 【精简重构】：不再前往 change_password.html
                 * 直接导向复用性更高的 reset_password.html
                 * 传递当前验证成功的用户名 usernameVal
                 */
                window.location.href = `reset_password.html?user=${encodeURIComponent(usernameVal)}`;
                
            } else {
                error.textContent = '验证码错误，请重新输入。';
            }
        }
    },

    init() {
        const { form, sendBtn } = this.els;
        if (form) form.addEventListener('submit', (e) => this.handleSubmit(e));
        if (sendBtn) sendBtn.addEventListener('click', () => this.sendCode());
    }
};

document.addEventListener('DOMContentLoaded', () => ForgotPasswordModule.init());