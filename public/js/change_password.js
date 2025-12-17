// ====================================
// 1. 页面元素与全局状态
// ====================================
const changeForm = document.getElementById('change-password-form');
const oldPasswordGroup = document.getElementById('old-password-group');
const oldPasswordInput = document.getElementById('old-password');
const newPasswordInput = document.getElementById('new-password');
const confirmPasswordInput = document.getElementById('confirm-password');
const errorMessageDiv = document.getElementById('change-error-message');
const strengthIndicator = document.getElementById('password-strength-indicator');
const pageInfoText = document.getElementById('info-text');
const backToLoginLink = document.getElementById('back-to-login');
const changeTitle = document.getElementById('change-title');

// 统一使用的 localStorage 键
const DB_KEY = 'mock_user_db';
let isForceChange = false; // 是否处于强制修改模式
let currentUsername = '';  // 当前正在修改密码的用户

// ====================================
// 2. 辅助函数 (数据管理与哈希模拟)
// ====================================

/**
 * 获取 localStorage 中的用户数据库。
 */
function getUsersDB() {
    return JSON.parse(localStorage.getItem(DB_KEY) || '[]');
}

/**
 * 将更新后的用户数据库存回 localStorage。
 */
function saveUsersDB(db) {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
}

/**
 * 模拟密码加盐哈希函数 (必须与 security.js 中的逻辑保持一致)。
 */
function hashPassword(password, salt) {
    // 假设您在 security.js 中设置的通用哈希值：
    if (password === 'NewPass123' && salt) { 
        return 'new_password_hash'; // 用于测试新密码
    }
    if (password === 'password' && salt === '2023001') {
        return 'student_hash_123';
    }
    // ... 添加其他旧密码匹配 ...
    
    // 如果是首次登录修改，新密码应该匹配 'new_password_hash'
    if (isForceChange) {
        // 强制修改时，任何符合强度要求的新密码都模拟为 'new_password_hash'
        return 'new_password_hash'; 
    }
    
    return 'mismatch_hash';
}

// ====================================
// 3. 密码强度检查 (与 reset_password.js 相同)
// ====================================

function checkPasswordStrength() {
    // ... (强度检查逻辑与 reset_password.js 保持一致) ...
    const password = newPasswordInput.value;
    let score = 0;
    
    const hasLength = password.length >= 8;
    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

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

// ====================================
// 4. 表单提交处理
// ====================================

changeForm.addEventListener('submit', handleChangePassword);
newPasswordInput.addEventListener('input', checkPasswordStrength);

function handleChangePassword(event) {
    event.preventDefault();
    errorMessageDiv.textContent = '';
    
    const oldPassword = oldPasswordInput.value;
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    let usersDB = getUsersDB();
    const userIndex = usersDB.findIndex(u => u.username === currentUsername);

    if (userIndex === -1) {
        errorMessageDiv.textContent = '无法识别当前用户身份，请重新登录。';
        return;
    }
    const user = usersDB[userIndex];
    
    // 1. 旧密码验证 (仅在主动修改模式下)
    if (!isForceChange) {
        const enteredOldHash = hashPassword(oldPassword, user.salt);
        if (enteredOldHash !== user.hashedPassword) {
            errorMessageDiv.textContent = '旧密码输入错误，请重试。';
            return;
        }
    }
    
    // 2. 新密码一致性检查
    if (newPassword !== confirmPassword) {
        errorMessageDiv.textContent = '两次输入的新密码不一致。';
        return;
    }
    
    // 3. 密码强度检查
    const strengthScore = checkPasswordStrength();
    if (strengthScore < 3) {
        errorMessageDiv.textContent = '新密码强度不足，请使用至少8位、包含大小写字母和数字的组合。';
        return;
    }
    
    // 4. 更新数据库 (哈希并存储)
    
    // 模拟新密码哈希 (这里使用与 security.js 约定好的新哈希值)
    const newHashedPassword = hashPassword(newPassword, user.salt);

    // 更新用户的密码哈希值
    usersDB[userIndex].hashedPassword = newHashedPassword;
    
    // 如果是强制修改，清除 'isFirstLogin' 标记
    if (isForceChange) {
        usersDB[userIndex].isFirstLogin = false;
    }
    
    // 保存回 localStorage
    saveUsersDB(usersDB);
    
    // 5. 成功反馈和跳转
    alert('密码修改成功！请使用新密码重新登录。');
    window.location.href = 'login.html'; 
}

// ====================================
// 5. 初始化与模式切换
// ====================================

/**
 * 根据 URL 参数初始化页面，检测是否为强制修改。
 */
function initializePage() {
    const urlParams = new URLSearchParams(window.location.search);
    isForceChange = urlParams.get('force') === 'true';
    currentUsername = urlParams.get('user') || '2023001'; // 默认一个用户进行测试
    
    if (isForceChange) {
        // 强制修改模式
        changeTitle.textContent = '强制修改初始密码';
        pageInfoText.innerHTML = '您正在首次登录，**请务必设置一个符合强度要求的新密码！**';
        
        // 隐藏旧密码字段
        oldPasswordGroup.style.display = 'none';
        oldPasswordInput.removeAttribute('required'); // 移除 HTML 必填属性
        
        // 阻止用户跳过此页面
        backToLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            alert('请先完成密码修改！');
        });
        
    } else {
        // 主动修改模式 (需要旧密码验证)
        oldPasswordInput.setAttribute('required', 'true');
        changeTitle.textContent = '修改账户密码';
        // 假设用户是从工作台跳转过来，无需特殊处理
    }
}

document.addEventListener('DOMContentLoaded', initializePage);