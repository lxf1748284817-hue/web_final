// ====================================
// 1. 页面元素获取
// ====================================
const resetForm = document.getElementById('reset-password-form');
const newPasswordInput = document.getElementById('new-password');
const confirmPasswordInput = document.getElementById('confirm-password');
const errorMessageDiv = document.getElementById('reset-error-message');
const strengthIndicator = document.getElementById('password-strength-indicator');

// 定义 localStorage 键 (必须与 security.js 保持一致)
const DB_KEY = 'mock_user_db'; 

// ====================================
// 2. 事件监听器
// ====================================
resetForm.addEventListener('submit', handlePasswordReset);
newPasswordInput.addEventListener('input', checkPasswordStrength); 
confirmPasswordInput.addEventListener('input', clearErrorMessage); 

// ====================================
// 3. 核心安全逻辑：密码强度检查 (保持不变)
// ====================================

/**
 * 实时检查并显示新密码的强度。
 */
function checkPasswordStrength() {
    const password = newPasswordInput.value;
    let score = 0;
    
    // 强度规则 (至少满足以下3项)
    const hasLength = password.length >= 8;
    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    // 计分
    if (hasLength) score++;
    if (hasLowerCase) score++;
    if (hasUpperCase) score++;
    if (hasNumber) score++;
    if (hasSpecial) score++;
    
    let strengthText = '弱';
    let strengthColor = 'red';

    if (score >= 4) {
        strengthText = '强';
        strengthColor = 'green';
    } else if (score >= 3) {
        strengthText = '中';
        strengthColor = 'orange';
    }

    strengthIndicator.textContent = `密码强度：${strengthText}`;
    strengthIndicator.style.color = strengthColor;
    
    return score;
}

/**
 * 处理密码重置表单提交 (新增了对 localStorage 的更新逻辑)
 */
function handlePasswordReset(event) {
    event.preventDefault();
    errorMessageDiv.textContent = '';
    
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // 1. 前端验证 (一致性和强度)
    if (newPassword !== confirmPassword) {
        errorMessageDiv.textContent = '两次输入的密码不一致，请重新检查。';
        return;
    }

    const strengthScore = checkPasswordStrength();
    if (strengthScore < 3) {
        errorMessageDiv.textContent = '密码强度不足，请使用至少8位、包含大小写字母和数字的组合。';
        return;
    }

    // 2. 身份令牌检查 (确保流程合法)
    const urlParams = new URLSearchParams(window.location.search);
    const isValidProcess = urlParams.get('token') === 'valid' || urlParams.get('force') === 'true';

    if (!isValidProcess) {
         errorMessageDiv.textContent = '安全验证失败，请从正确的“忘记密码”或“首次登录”流程进入此页面。';
         return;
    }
    
    // ===================================================================
    // 3. 模拟密码更新到 localStorage (解决无法登录的核心问题)
    // ===================================================================

    // 在实际项目中，token/force 参数会携带用户名或其他身份标识
    // 这里我们先硬编码一个目标用户进行演示：
    const targetUsername = '2023001'; 
    const SIMULATED_NEW_HASH = 'new_password_hash'; // 必须与 security.js 中的模拟哈希匹配！

    let usersDB = JSON.parse(localStorage.getItem(DB_KEY) || '[]');
    const userIndex = usersDB.findIndex(u => u.username === targetUsername);

    if (userIndex !== -1) {
        // 更新哈希值 (使用模拟的通用新哈希值)
        usersDB[userIndex].hashedPassword = SIMULATED_NEW_HASH;
        
        // 如果是从强制修改流程过来的，标记用户已修改密码
        if (urlParams.get('force') === 'true') {
            usersDB[userIndex].isFirstLogin = false;
        }

        // 存回 localStorage (模拟持久化)
        localStorage.setItem(DB_KEY, JSON.stringify(usersDB));
        
        // 4. 提交成功和跳转
        alert('密码已成功重置！请使用新密码登录。');
        window.location.href = 'login.html'; 
        
    } else {
        errorMessageDiv.textContent = '无法找到用户数据，重置失败。';
        // 此时仍然跳转回登录页，保证流程不中断
        setTimeout(() => { window.location.href = 'login.html'; }, 3000);
    }
}

/**
 * 清除错误消息，用于用户开始输入新密码时。
 */
function clearErrorMessage() {
    errorMessageDiv.textContent = '';
}

// 初始化时检查 URL，如果是强制修改密码（来自 security.js）则给出提示 (保持不变)
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('force') === 'true') {
        alert('【系统提示】这是您的首次登录，请强制修改初始默认密码！');
    }
});