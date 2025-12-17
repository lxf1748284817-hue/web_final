// ====================================
// 1. 模拟数据和状态
// ====================================

// 模拟数据库中存储的用户账号和绑定邮箱 (通常由后端维护)
const userEmailsDB = [
    { username: '2023001', email: 'stu001@school.edu.cn' },
    { username: 'T001', email: 'teacher01@school.edu.cn' },
    { username: 'ADM01', email: 'admin@school.edu.cn' },
];

// 模拟验证码和计时器状态
let currentStep = 1;
let sentVerificationCode = null; // 模拟服务器发送的验证码
let timerInterval = null;
const COUNTDOWN_SECONDS = 60;

// ====================================
// 2. 页面元素获取
// ====================================
const form = document.getElementById('forgot-password-form');
const usernameInput = document.getElementById('reset-username');
const emailInput = document.getElementById('reset-email');
const codeGroup = document.getElementById('verification-code-group');
const codeInput = document.getElementById('verification-code');
const sendCodeBtn = document.getElementById('send-code-btn');
const nextStepBtn = document.getElementById('next-step-btn');
const errorMessageDiv = document.getElementById('reset-error-message');

// ====================================
// 3. 事件监听器
// ====================================
form.addEventListener('submit', handleFormSubmit);
sendCodeBtn.addEventListener('click', sendVerificationCode);

// ====================================
// 4. 核心逻辑函数
// ====================================

/**
 * 启动发送验证码按钮的倒计时。
 */
function startCountdown() {
    let secondsLeft = COUNTDOWN_SECONDS;
    sendCodeBtn.disabled = true;
    sendCodeBtn.textContent = `重新发送 (${secondsLeft}s)`;
    
    timerInterval = setInterval(() => {
        secondsLeft--;
        if (secondsLeft <= 0) {
            clearInterval(timerInterval);
            sendCodeBtn.disabled = false;
            sendCodeBtn.textContent = '发送验证码';
        } else {
            sendCodeBtn.textContent = `重新发送 (${secondsLeft}s)`;
        }
    }, 1000);
}

/**
 * 模拟发送验证码到用户邮箱 (必做功能实现)
 */
function sendVerificationCode() {
    // 阻止重复发送
    if (sendCodeBtn.disabled) return;
    
    // 模拟生成一个4位随机验证码
    sentVerificationCode = Math.floor(1000 + Math.random() * 9000).toString();
    
    // 模拟发送邮件成功提示
    alert(`【邮件已发送】请检查您绑定的邮箱。模拟验证码为：${sentVerificationCode} (请勿泄露)`);
    
    // 开始倒计时
    startCountdown();
}

/**
 * 处理表单提交 (身份验证 或 验证码验证)
 */
function handleFormSubmit(event) {
    event.preventDefault();
    errorMessageDiv.textContent = '';
    
    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();

    if (currentStep === 1) {
        // 第一步：验证账号和邮箱
        
        const user = userEmailsDB.find(u => u.username === username && u.email === email);
        
        if (user) {
            // 验证成功，进入第二步
            currentStep = 2;
            
            // 禁用账号和邮箱输入框，防止用户修改
            usernameInput.disabled = true;
            emailInput.disabled = true;
            
            // 显示验证码输入框和发送按钮
            codeGroup.style.display = 'block';
            
            // 更新按钮文本和功能
            nextStepBtn.textContent = '验证并重置密码';
            
            // 自动触发一次验证码发送，以提高用户体验
            sendVerificationCode();
            
        } else {
            errorMessageDiv.textContent = '账号与绑定邮箱不匹配，请核对信息。';
        }
        
    } else if (currentStep === 2) {
        // 第二步：验证验证码
        const enteredCode = codeInput.value.trim();
        
        if (!enteredCode) {
            errorMessageDiv.textContent = '请输入您收到的邮箱验证码。';
            return;
        }

        if (enteredCode === sentVerificationCode) {
            // 验证码匹配成功，模拟跳转到最终的密码重置页面
            alert('验证成功！即将跳转到密码重置页面。');
            window.location.href = 'reset_password.html?token=valid'; // token模拟验证通过
            
        } else {
            errorMessageDiv.textContent = '验证码输入错误，请重试或重新发送。';
        }
    }
}