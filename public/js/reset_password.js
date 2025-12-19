/**
 * 【模块名称】：密码重置与安全加固模块
 * 【维护人员】：梁德铭
 * 【功能描述】：
 * 1. 动态强度检测：实时监听用户输入，基于长度、大小写、数字及特殊字符四维度计算密码强度，并同步更新 UI 视觉反馈。
 * 2. 身份回溯：通过解析 URL 查询参数（URLSearchParams）识别目标用户，确保重置操作的指向性。
 * 3. 物理更新：在客户端完成 SHA256 加盐哈希计算，并利用 IndexedDB 的 .put() 接口实现密文覆盖存储。
 * 4. 状态闭环：成功修改密码后，自动翻转 isFirstLogin 标记为 false，并强制清除旧登录 Session，导向登录页。
 * 【整合指南】：
 * 1. 参数依赖：必须由 forgot_password.html 或 login.html 跳转而来，且 URL 需携带 ?user=... 参数。
 * 2. 库依赖：必须引入 CryptoJS 用于生成新的哈希密文。
 * 3. 样式绑定：HTML 需提供 id 为 'password-strength-indicator' 的容器以展示强度文字反馈。
 * 4. 逻辑一致性：加盐逻辑必须沿用 (明文 + username) 的规则，以匹配 AuthModule 的校验算法。
 */
const ResetPasswordModule = {
    get els() {
        return {
            form: document.getElementById('reset-password-form'),
            newInput: document.getElementById('new-password'),
            confirmInput: document.getElementById('confirm-password'),
            errorDiv: document.getElementById('reset-error-message'),
            // 获取 HTML 中的文字提示元素
            strengthIndicator: document.getElementById('password-strength-indicator')
        };
    },

    /**
     * 【新增】检测密码强度并更新 UI 文字
     */
    updateStrengthUI() {
        const pwd = this.els.newInput.value;
        const indicator = this.els.strengthIndicator;

        if (!indicator) return;

        if (!pwd) {
            indicator.textContent = '密码强度：未输入';
            indicator.style.color = '#999';
            return;
        }

        let score = 0;
        // 强度规则
        if (pwd.length >= 8) score++;           // 规则1：长度至少8位
        if (/[A-Z]/.test(pwd)) score++;        // 规则2：包含大写字母
        if (/[0-9]/.test(pwd)) score++;        // 规则3：包含数字
        if (/[^A-Za-z0-9]/.test(pwd)) score++; // 规则4：包含特殊字符

        // 根据分数反馈文字和颜色
        if (score <= 1) {
            indicator.textContent = '密码强度：太弱';
            indicator.style.color = '#e74c3c'; // 红色
        } else if (score === 2) {
            indicator.textContent = '密码强度：一般';
            indicator.style.color = '#f1c40f'; // 黄色
        } else if (score === 3) {
            indicator.textContent = '密码强度：良好';
            indicator.style.color = '#3498db'; // 蓝色
        } else {
            indicator.textContent = '密码强度：极强';
            indicator.style.color = '#2ecc71'; // 绿色
        }
    },

    async handleReset(e) {
        e.preventDefault();
        const { newInput, confirmInput, errorDiv } = this.els;
        
        const urlParams = new URLSearchParams(window.location.search);
        const username = urlParams.get('user');

        try {
            if (!username) throw new Error("非法请求：未关联用户");
            if (newInput.value.length < 8) throw new Error("为了安全，新密码长度不能少于 8 位");
            if (newInput.value !== confirmInput.value) throw new Error("两次输入密码不一致");

            const db = await BaseDB.open();
            const tx = db.transaction(['users'], 'readwrite');
            const store = tx.objectStore('users');

            const request = store.getAll();
            request.onsuccess = (event) => {
                const users = event.target.result;
                const user = users.find(u => u.username === username);

                if (!user) {
                    errorDiv.textContent = "用户不存在，请联系管理员。";
                    return;
                }

                const salt = user.salt || user.username; 
                const newHash = CryptoJS.SHA256(newInput.value + salt).toString();

                user.password = newHash;
                user.isFirstLogin = false; 

                const updateRequest = store.put(user);
                
                updateRequest.onsuccess = () => {
                    alert('密码设置成功！请使用新密码重新登录。');
                    localStorage.removeItem('currentUser');
                    window.location.href = 'login.html';
                };
            };

        } catch (err) {
            errorDiv.textContent = err.message;
        }
    },

    init() {
        if (this.els.form) {
            this.els.form.addEventListener('submit', (e) => this.handleReset(e));
        }

        // --- 核心修复：监听新密码输入框的 input 事件 ---
        if (this.els.newInput) {
            this.els.newInput.addEventListener('input', () => {
                this.updateStrengthUI();
            });
        }
    }
};

document.addEventListener('DOMContentLoaded', () => ResetPasswordModule.init());