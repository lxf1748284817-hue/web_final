// 系统管理端功能模块
document.addEventListener('DOMContentLoaded', function() {
    // 检查用户是否已登录
    checkAdminLogin();
    
    // 初始化页面
    initPage();
    
    // 绑定事件
    bindEvents();
    
    // 加载初始数据
    loadInitialData();
});

// 检查管理员登录状态
function checkAdminLogin() {
    const userData = sessionStorage.getItem('sysadmin_user');
    
    if (!userData) {
        // 如果没有登录信息，跳转到登录页面
        window.location.href = '../public/login.html?role=admin_sys';
        return;
    }
    
    const user = JSON.parse(userData);
    
    // 显示当前用户信息
    const userNameEl = document.getElementById('current-user');
    const userRoleEl = document.getElementById('current-role');
    
    if (userNameEl) userNameEl.textContent = user.username || '系统管理员';
    if (userRoleEl) userRoleEl.textContent = 'System Admin';
}

// 初始化页面
function initPage() {
    // 显示默认内容
    showSection('dashboard');
    
    // 设置菜单激活状态
    setActiveMenuItem('menu-dashboard');
    
    // 初始化图表和统计数据
    initCharts();
}

// 绑定事件
function bindEvents() {
    // 菜单项点击事件
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('data-target');
            if (targetId) {
                showSection(targetId);
                setActiveMenuItem(this.id);
            }
        });
    });
    
    // 退出登录事件
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('确定要退出登录吗？')) {
                sessionStorage.removeItem('sysadmin_user');
                window.location.href = '../public/login.html?role=admin_sys';
            }
        });
    }
}

// 加载初始数据
async function loadInitialData() {
    try {
        // 加载系统统计数据
        await loadSystemStats();
        
        // 加载操作日志
        await loadOperationLogs();
        
    } catch (error) {
        console.error('加载初始数据失败:', error);
        showAlert('加载数据失败，请刷新页面重试', 'error');
    }
}

// 显示指定内容区域
function showSection(sectionId) {
    // 隐藏所有内容区域
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    // 显示指定区域
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
}

// 设置菜单激活状态
function setActiveMenuItem(menuId) {
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.classList.remove('active');
    });
    
    const targetMenu = document.getElementById(menuId);
    if (targetMenu) {
        targetMenu.classList.add('active');
    }
}

// 加载系统统计数据
async function loadSystemStats() {
    try {
        // 这里应该调用实际的API获取统计数据
        const stats = {
            totalUsers: 1250,
            totalCourses: 85,
            activeUsers: 320,
            systemUptime: '99.8%'
        };
        
        // 更新统计显示
        updateStatsDisplay(stats);
        
    } catch (error) {
        console.error('加载统计数据失败:', error);
    }
}

// 更新统计显示
function updateStatsDisplay(stats) {
    const elements = {
        'stat-total-users': stats.totalUsers,
        'stat-total-courses': stats.totalCourses,
        'stat-active-users': stats.activeUsers,
        'stat-uptime': stats.systemUptime
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
}

// 加载操作日志
async function loadOperationLogs() {
    try {
        // 这里应该调用实际的API获取操作日志
        const logs = [
            {
                id: 1,
                operator: 'admin',
                action: '数据备份',
                target: '系统数据库',
                time: '2023-12-20 10:30:00',
                status: 'success'
            },
            {
                id: 2,
                operator: 'admin',
                action: '用户管理',
                target: '学生账号',
                time: '2023-12-20 09:15:00',
                status: 'success'
            }
        ];
        
        displayLogs(logs);
        
    } catch (error) {
        console.error('加载操作日志失败:', error);
    }
}

// 显示日志
function displayLogs(logs) {
    const logsContainer = document.getElementById('logs-container');
    if (!logsContainer) return;
    
    logsContainer.innerHTML = '';
    
    if (logs.length === 0) {
        logsContainer.innerHTML = '<div class="no-data">暂无操作日志</div>';
        return;
    }
    
    logs.forEach(log => {
        const logItem = createLogItem(log);
        logsContainer.appendChild(logItem);
    });
}

// 创建日志项
function createLogItem(log) {
    const div = document.createElement('div');
    div.className = 'log-item';
    
    const statusClass = log.status === 'success' ? 'success' : 'error';
    
    div.innerHTML = `
        <div class="log-info">
            <div class="log-operator">${log.operator}</div>
            <div class="log-action">${log.action}</div>
            <div class="log-target">${log.target}</div>
            <div class="log-time">${log.time}</div>
        </div>
        <div class="log-status ${statusClass}">
            <i class="fas fa-${log.status === 'success' ? 'check' : 'times'}"></i>
        </div>
    `;
    
    return div;
}

// 初始化图表
function initCharts() {
    // 这里可以初始化各种图表
    // 例如使用Chart.js或其他图表库
    console.log('初始化系统管理图表');
}

// 显示提示信息
function showAlert(message, type = 'info') {
    // 创建提示元素
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    // 添加到页面
    document.body.appendChild(alert);
    
    // 3秒后自动移除
    setTimeout(() => {
        if (alert.parentNode) {
            alert.parentNode.removeChild(alert);
        }
    }, 3000);
}

// 数据备份功能
async function performDataBackup() {
    try {
        showAlert('正在执行数据备份...', 'info');
        
        // 这里应该调用实际的备份API
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        showAlert('数据备份完成！', 'success');
        
        // 记录操作日志
        await logOperation('admin', '数据备份', '系统数据库', 'success');
        
    } catch (error) {
        console.error('数据备份失败:', error);
        showAlert('数据备份失败，请重试', 'error');
        
        await logOperation('admin', '数据备份', '系统数据库', 'error');
    }
}

// 记录操作日志
async function logOperation(operator, action, target, status) {
    try {
        const log = {
            id: Date.now(),
            operator,
            action,
            target,
            time: new Date().toLocaleString(),
            status
        };
        
        // 这里应该调用API保存日志
        console.log('记录操作日志:', log);
        
    } catch (error) {
        console.error('记录操作日志失败:', error);
    }
}