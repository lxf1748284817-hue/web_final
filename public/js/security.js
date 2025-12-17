// 注意：为了实现前端哈希，我们假设在实际项目中引入了如 CryptoJS 等库。
// 在纯粹的作业演示中，我们通常直接在 JS 中模拟哈希或使用一个简单的外部库CDN。

// ====================================
// 1. 模拟安全数据和配置 (使用 localStorage 模拟持久化)
// ====================================

const DB_KEY = 'mock_user_db';
const LOCK_LIMIT = 3; // 连续输错密码次数上限
const loginAttempts = {}; // 用于存储每个用户当前的错误次数: { username: count }

// 默认的用户数据库（在第一次运行时使用）
const defaultUsersDB = [
    { username: '2023001', role: 'student', salt: '2023001', hashedPassword: 'student_hash_123' },
    { username: 'T001', role: 'teacher', salt: 'T001', hashedPassword: 'teacher_hash_456' },
    { username: 'ADM01', role: 'admin_sys', salt: 'ADM01', hashedPassword: 'sysadmin_hash_789' },
    { username: 'MGR01', role: 'admin_teaching', salt: 'MGR01', hashedPassword: 'mgr_hash_101' },
    { username: '2023002', role: 'student', salt: '2023002', hashedPassword: 'default_hash_002', isFirstLogin: true }
];

/**
 * 初始化并获取用户数据库。
 * 如果 localStorage 中没有数据，则使用默认数据并存入。
 * @returns {Array} 存储的用户数据数组。
 */
function getUsersDB() {
    const storedDB = localStorage.getItem(DB_KEY);
    if (storedDB) {
        return JSON.parse(storedDB);
    } else {
        // 第一次运行，将默认数据存入 localStorage
        localStorage.setItem(DB_KEY, JSON.stringify(defaultUsersDB));
        return defaultUsersDB;
    }
}


// ====================================
// 2. 核心安全函数：哈希模拟
// ====================================

/**
 * 模拟密码加盐哈希函数。
 * @param {string} password - 用户输入的原始密码。
 * @param {string} salt - 盐值（此处为用户名）。
 * @returns {string} 模拟的哈希结果。
 */
function hashPassword(password, salt) {
    // 假设：用户输入的密码如果是 'password' 或 'newPass'，则哈希后得到对应预设的哈希值
    
    // --- 匹配默认和旧密码 ---
    if (password === 'password' && salt === '2023001') {
        return 'student_hash_123';
    }
    if (password === 'teacher' && salt === 'T001') {
        return 'teacher_hash_456';
    }
    if (password === 'manager' && salt === 'MGR01') {
        return 'mgr_hash_101';
    }
    if (password === 'default' && salt === '2023002') {
        return 'default_hash_002';
    }
    
    // --- 匹配重置后的新密码 (关键修改点) ---
    // 假设重置成功后，所有用户的通用新密码模拟哈希值
    // *注意：这必须与 reset_password.js 中的模拟哈希值保持一致！*
    if (password === 'NewPass123' && salt) {
        return 'new_password_hash'; 
    }
    
    // 只要输入的是测试用的新密码 'ForcePass!1'，就返回模拟的通用新哈希值
    // 无论 salt 是什么，只要 password 匹配，就返回新的哈希值
    if (password === 'ForcePass!1') { 
        return 'new_password_hash'; 
    }

    // 如果不匹配，返回一个通用失败的哈希
    return 'mismatch_hash';
}

// ====================================
// 3. 登录处理逻辑
// ====================================

const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const errorMessageDiv = document.getElementById('login-error-message');

loginForm.addEventListener('submit', handleLogin);

function handleLogin(event) {
    event.preventDefault(); // 阻止表单默认提交行为

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    errorMessageDiv.textContent = ''; // 清空错误信息

    if (!username || !password) {
        errorMessageDiv.textContent = '账号和密码不能为空。';
        return;
    }
    
    // 1. 检查账号是否被锁定
    if (loginAttempts[username] >= LOCK_LIMIT) {
        errorMessageDiv.textContent = `账号 ${username} 因连续错误次数过多已被锁定，请联系管理员解锁。`;
        return;
    }

    // 2. 查找用户并进行哈希比对 (从 localStorage 获取最新数据)
    const usersDB = getUsersDB();
    const user = usersDB.find(u => u.username === username);

    if (user) {
        // 使用用户名作为盐值对输入的密码进行哈希
        const enteredHash = hashPassword(password, user.salt);
        
        if (enteredHash === user.hashedPassword) {
            // --- 登录成功逻辑 ---
            
            // 清除错误计数
            loginAttempts[username] = 0; 
            
            // 首次登录强制修改密码判断
            if (user.isFirstLogin) {
                // 模拟跳转到修改密码页面
                alert(`欢迎新用户 ${username}！请强制修改您的初始密码。`);
                window.location.href = 'change_password.html?force=true&user=' + username; // 携带用户名
                return;
            }

            // 角色重定向
            redirectByRole(user.role);
            
        } else {
            // --- 密码错误逻辑 ---
            
            // 递增错误计数
            loginAttempts[username] = (loginAttempts[username] || 0) + 1;
            const attemptsLeft = LOCK_LIMIT - loginAttempts[username];
            
            if (attemptsLeft <= 0) {
                errorMessageDiv.textContent = `登录失败。您的账号已因连续输错 ${LOCK_LIMIT} 次而被锁定。`;
            } else {
                errorMessageDiv.textContent = `账号或密码错误。您还有 ${attemptsLeft} 次尝试机会，否则账号将被锁定。`;
            }
        }
    } else {
        // 账号不存在，增加错误计数（简化处理）
        errorMessageDiv.textContent = '账号或密码错误。';
    }
}

// ====================================
// 4. 角色重定向函数
// ====================================

/**
 * 根据用户的角色权限，将用户跳转到对应的模块首页。
 * @param {string} role - 用户的角色
 */
function redirectByRole(role) {
    let targetURL = 'index.html'; // 默认回退到首页

    switch (role) {
        case 'student':
            targetURL = '../student_side/dashboard.html'; 
            break;
        case 'teacher':
            targetURL = '../teacher_side/course_management.html'; 
            break;
        case 'admin_teaching':
            targetURL = '../teaching_admin/management.html'; 
            break;
        case 'admin_sys':
            targetURL = '../sys_admin/dashboard.html'; 
            break;
        default:
            targetURL = 'index.html';
    }
    
    // 模拟登录成功后的提示
    alert(`登录成功！角色：${role}。正在跳转至您的工作台...`);
    
    // 执行跳转
    window.location.href = targetURL;
}

// 页面加载时初始化数据库
document.addEventListener('DOMContentLoaded', getUsersDB);