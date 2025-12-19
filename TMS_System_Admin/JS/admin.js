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
    
    // 检查URL参数
    checkUrlParams();
});

// 检查URL参数
function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const role = urlParams.get('role');
    
    if (role === 'admin') {
        // 教学管理员登录，限制部分功能
        limitAdminPermissions();
    }
}

// 限制教学管理员权限
function limitAdminPermissions() {
    // 隐藏系统管理端专属功能
    const sysAdminOnlyElements = document.querySelectorAll('.sysadmin-only');
    sysAdminOnlyElements.forEach(el => {
        el.style.display = 'none';
    });
    
    // 限制数据备份功能
    document.getElementById('manual-backup-btn').disabled = true;
    document.getElementById('manual-backup-btn').title = '仅系统管理员可执行此操作';
    document.getElementById('manual-backup-btn').style.opacity = '0.6';
    
    // 限制系统设置
    document.getElementById('save-settings-btn').disabled = true;
    document.getElementById('save-settings-btn').title = '仅系统管理员可修改系统设置';
    document.getElementById('save-settings-btn').style.opacity = '0.6';
    
    // 修改页面标题
    document.getElementById('page-title').textContent = '教学管理端';
    document.querySelector('.logo-text').textContent = '教学管理系统 - 管理端';
    
    // 显示权限提示
    setTimeout(() => {
        showMessage('您以教学管理员身份登录，部分系统管理功能受限。', 'info');
    }, 1000);
}

// 检查管理员登录状态
function checkAdminLogin() {
    const userData = sessionStorage.getItem('current_user');
    
    if (!userData) {
        // 未登录，跳转到登录页
        window.location.href = 'index.html';
        return;
    }
    
    try {
        const user = JSON.parse(userData);
        
        // 验证用户角色（系统管理端只允许sysadmin和admin登录）
        if (user.role !== 'sysadmin' && user.role !== 'admin') {
            showMessage('您没有权限访问系统管理端！', 'danger');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
            return;
        }
        
        // 显示用户名
        document.getElementById('admin-username').textContent = user.username;
        document.getElementById('current-user').textContent = user.name;
        document.getElementById('current-role').textContent = getRoleText(user.role);
        
        // 检查会话是否过期
        const loginTime = new Date(user.loginTime);
        const now = new Date();
        const diffInMinutes = (now - loginTime) / (1000 * 60);
        
        // 如果超过60分钟，要求重新登录
        if (diffInMinutes > 60) {
            showMessage('会话已过期，请重新登录！', 'warning');
            setTimeout(() => {
                sessionStorage.removeItem('current_user');
                window.location.href = 'index.html';
            }, 2000);
        }
        
    } catch (error) {
        console.error('解析用户数据时出错:', error);
        window.location.href = 'index.html';
    }
}

// 初始化页面
function initPage() {
    // 设置当前时间
    updateServerTime();
    setInterval(updateServerTime, 1000);
    
    // 设置默认日期
    const today = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    document.getElementById('start-date').value = sevenDaysAgo;
    document.getElementById('end-date').value = today;
    
    // 初始化选项卡
    initTabs();
    
    // 加载系统设置
    loadSystemSettings();
}

// 加载系统设置
function loadSystemSettings() {
    const settings = JSON.parse(localStorage.getItem('system_settings') || '{}');
    
    // 应用设置到表单
    if (settings.systemName) {
        document.getElementById('system-name').value = settings.systemName;
    }
    
    if (settings.maintenanceMode !== undefined) {
        document.getElementById('maintenance-mode').checked = settings.maintenanceMode;
    }
    
    if (settings.sessionTimeout) {
        document.getElementById('session-timeout').value = settings.sessionTimeout;
    }
    
    if (settings.maxLoginAttempts) {
        document.getElementById('max-login-attempts').value = settings.maxLoginAttempts;
    }
    
    if (settings.minPasswordLength) {
        document.getElementById('min-password-length').value = settings.minPasswordLength;
    }
    
    if (settings.passwordComplexity !== undefined) {
        document.getElementById('password-complexity').checked = settings.passwordComplexity;
    }
    
    if (settings.passwordExpiry) {
        document.getElementById('password-expiry').value = settings.passwordExpiry;
    }
    
    if (settings.twoFactorAuth !== undefined) {
        document.getElementById('two-factor-auth').checked = settings.twoFactorAuth;
    }
    
    if (settings.ipWhitelist) {
        document.getElementById('ip-whitelist').value = settings.ipWhitelist;
    }
    
    if (settings.emailNotifications !== undefined) {
        document.getElementById('email-notifications').checked = settings.emailNotifications;
    }
    
    if (settings.smtpServer) {
        document.getElementById('smtp-server').value = settings.smtpServer;
    }
    
    if (settings.notificationEmail) {
        document.getElementById('notification-email').value = settings.notificationEmail;
    }
    
    if (settings.autoBackup !== undefined) {
        document.getElementById('auto-backup').checked = settings.autoBackup;
    }
    
    if (settings.backupFrequency) {
        document.getElementById('backup-frequency').value = settings.backupFrequency;
    }
    
    if (settings.backupTime) {
        document.getElementById('backup-time').value = settings.backupTime;
    }
    
    if (settings.backupRetention) {
        document.getElementById('backup-retention').value = settings.backupRetention;
    }
}

// 更新服务器时间
function updateServerTime() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('zh-CN', { hour12: false });
    const dateStr = now.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
    
    document.getElementById('server-time').textContent = `${dateStr} ${timeStr}`;
}

// 初始化选项卡
function initTabs() {
    // 导航菜单切换
    document.getElementById('nav-logs').addEventListener('click', function(e) {
        e.preventDefault();
        switchSection('logs');
    });
    
    document.getElementById('nav-backup').addEventListener('click', function(e) {
        e.preventDefault();
        switchSection('backup');
    });
    
    document.getElementById('nav-users').addEventListener('click', function(e) {
        e.preventDefault();
        switchSection('users');
    });
    
    document.getElementById('nav-settings').addEventListener('click', function(e) {
        e.preventDefault();
        switchSection('settings');
    });
    
    // 设置选项卡切换
    document.querySelectorAll('.tab-link').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
}

// 切换主内容区域
function switchSection(section) {
    // 更新导航激活状态
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    document.getElementById(`nav-${section}`).classList.add('active');
    
    // 隐藏所有内容区域
    document.getElementById('logs-section').style.display = 'none';
    document.getElementById('backup-section').style.display = 'none';
    document.getElementById('users-section').style.display = 'none';
    document.getElementById('settings-section').style.display = 'none';
    
    // 显示选中的内容区域
    document.getElementById(`${section}-section`).style.display = 'block';
    
    // 更新页面标题
    const titles = {
        'logs': '操作日志审计',
        'backup': '数据备份恢复',
        'users': '用户账户管理',
        'settings': '系统设置'
    };
    
    document.getElementById('page-title').textContent = titles[section];
    
    // 加载对应区域的数据
    switch(section) {
        case 'logs':
            loadLogsData();
            break;
        case 'backup':
            loadBackupData();
            break;
        case 'users':
            loadUsersData();
            break;
        case 'settings':
            loadSettingsData();
            break;
    }
}

// 切换设置选项卡
function switchTab(tabId) {
    // 更新选项卡激活状态
    document.querySelectorAll('.tab-link').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    
    // 隐藏所有选项卡内容
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // 显示选中的选项卡内容
    document.getElementById(`${tabId}-tab`).classList.add('active');
}

// 绑定事件
function bindEvents() {
    // 操作日志相关事件
    document.getElementById('search-logs-btn').addEventListener('click', searchLogs);
    document.getElementById('reset-filters-btn').addEventListener('click', resetLogFilters);
    document.getElementById('export-logs-btn').addEventListener('click', exportLogs);
    document.getElementById('clear-logs-btn').addEventListener('click', clearLogs);
    
    // 数据备份相关事件
    document.getElementById('manual-backup-btn').addEventListener('click', manualBackup);
    document.getElementById('schedule-backup-btn').addEventListener('click', showScheduleModal);
    document.getElementById('restore-backup-btn').addEventListener('click', showRestoreModal);
    document.getElementById('backup-history-btn').addEventListener('click', showBackupHistory);
    document.getElementById('clean-backup-btn').addEventListener('click', cleanBackup);
    
    // 用户管理相关事件
    document.getElementById('add-user-btn').addEventListener('click', showAddUserModal);
    document.getElementById('import-users-btn').addEventListener('click', importUsers);
    document.getElementById('search-users-btn').addEventListener('click', searchUsers);
    
    // 系统设置相关事件
    document.getElementById('save-settings-btn').addEventListener('click', saveSettings);
    
    // 模态框关闭事件
    document.getElementById('close-restore-modal').addEventListener('click', closeRestoreModal);
    document.getElementById('close-schedule-modal').addEventListener('click', closeScheduleModal);
    document.getElementById('close-add-user-modal').addEventListener('click', closeAddUserModal);
    document.getElementById('close-edit-user-modal').addEventListener('click', closeEditUserModal);
    
    document.getElementById('cancel-restore').addEventListener('click', closeRestoreModal);
    document.getElementById('cancel-schedule').addEventListener('click', closeScheduleModal);
    document.getElementById('cancel-add-user').addEventListener('click', closeAddUserModal);
    document.getElementById('cancel-edit-user').addEventListener('click', closeEditUserModal);
    
    // 模态框确认事件
    document.getElementById('confirm-restore').addEventListener('click', confirmRestore);
    document.getElementById('save-schedule').addEventListener('click', saveSchedule);
    document.getElementById('confirm-add-user').addEventListener('click', confirmAddUser);
    document.getElementById('confirm-edit-user').addEventListener('click', confirmEditUser);
    
    // 点击模态框外部关闭
    window.addEventListener('click', function(e) {
        const modals = ['restore-modal', 'schedule-modal', 'add-user-modal', 'edit-user-modal'];
        modals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
}

// 加载初始数据
function loadInitialData() {
    loadLogsData();
    loadBackupData();
    loadUsersData();
    loadSettingsData();
}

// 操作日志数据
const logData = [
    { id: 1, time: '2023-11-01 09:15:23', type: 'login', operator: 'sysadmin', role: '系统管理员', ip: '192.168.1.100', description: '系统管理员登录', result: '成功', details: '登录成功，IP: 192.168.1.100' },
    { id: 2, time: '2023-11-01 10:30:45', type: 'backup', operator: 'sysadmin', role: '系统管理员', ip: '192.168.1.100', description: '执行手动数据备份', result: '成功', details: '备份文件: backup_20231101_103045.zip' },
    { id: 3, time: '2023-10-31 14:05:33', type: 'modify', operator: 'admin01', role: '教学管理员', ip: '192.168.1.150', description: '修改学生成绩信息', result: '成功', details: '修改学生ID: 2021001 的成绩' },
    { id: 4, time: '2023-10-31 22:15:30', type: 'backup', operator: 'system', role: '系统', ip: '127.0.0.1', description: '执行自动数据备份', result: '成功', details: '自动备份任务完成' },
    { id: 5, time: '2023-10-31 15:20:18', type: 'delete', operator: 'sysadmin', role: '系统管理员', ip: '192.168.1.100', description: '删除过期日志记录', result: '成功', details: '删除30天前的日志记录' },
    { id: 6, time: '2023-10-30 11:45:12', type: 'security', operator: 'system', role: '系统', ip: '127.0.0.1', description: '检测到异常登录尝试', result: '警告', details: 'IP: 192.168.1.200 尝试登录失败5次' },
    { id: 7, time: '2023-10-30 16:40:22', type: 'login', operator: 'teacher_zhang', role: '教师', ip: '192.168.1.160', description: '教师账号登录', result: '成功', details: '登录成功，IP: 192.168.1.160' },
    { id: 8, time: '2023-10-30 09:12:45', type: 'restore', operator: 'sysadmin', role: '系统管理员', ip: '192.168.1.100', description: '恢复用户数据表', result: '成功', details: '从备份恢复用户表数据' },
    { id: 9, time: '2023-10-29 22:15:30', type: 'backup', operator: 'system', role: '系统', ip: '127.0.0.1', description: '执行自动数据备份', result: '成功', details: '自动备份任务完成' },
    { id: 10, time: '2023-10-29 13:30:15', type: 'system', operator: 'sysadmin', role: '系统管理员', ip: '192.168.1.100', description: '重启数据库服务', result: '成功', details: '数据库服务重启完成' },
    { id: 11, time: '2023-10-28 17:25:40', type: 'modify', operator: 'admin01', role: '教学管理员', ip: '192.168.1.155', description: '更新课程信息', result: '成功', details: '更新课程ID: CS101 的信息' },
    { id: 12, time: '2023-10-28 22:15:30', type: 'backup', operator: 'system', role: '系统', ip: '127.0.0.1', description: '执行自动数据备份', result: '成功', details: '自动备份任务完成' },
    { id: 13, time: '2023-10-27 08:45:10', type: 'login', operator: 'student_001', role: '学生', ip: '192.168.1.180', description: '学生账号登录', result: '成功', details: '登录成功，IP: 192.168.1.180' },
    { id: 14, time: '2023-10-27 22:15:30', type: 'backup', operator: 'system', role: '系统', ip: '127.0.0.1', description: '执行自动数据备份', result: '成功', details: '自动备份任务完成' },
    { id: 15, time: '2023-10-26 19:30:55', type: 'security', operator: 'system', role: '系统', ip: '127.0.0.1', description: '系统安全检查', result: '成功', details: '安全检查通过，无安全隐患' },
];

// 用户数据（更新为仅管理员用户）
let userData = [
    { id: 1, username: 'sysadmin', fullname: '系统管理员', role: 'sysadmin', status: 'active', lastLogin: '2023-11-01 09:15', registerTime: '2023-01-01', email: 'sysadmin@example.com', phone: '13800000001', gender: 'male', birthday: '1990-01-01', region: '北京' },
    { id: 2, username: 'admin01', fullname: '王管理员', role: 'admin', status: 'active', lastLogin: '2023-10-31 14:05', registerTime: '2023-02-15', email: 'admin01@example.com', phone: '13800000002', gender: 'male', birthday: '1985-03-20', region: '上海' },
    { id: 3, username: 'admin02', fullname: '赵管理员', role: 'admin', status: 'active', lastLogin: '2023-10-27 13:15', registerTime: '2023-04-05', email: 'admin02@example.com', phone: '13800000003', gender: 'female', birthday: '1988-07-15', region: '广州' }
];

// 备份历史数据
const backupHistory = [
    { id: 1, date: '2023-11-01 10:30:45', type: '手动备份', size: '1.25 GB', status: '成功', backupType: '完整备份' },
    { id: 2, date: '2023-10-31 22:15:30', type: '自动备份', size: '1.20 GB', status: '成功', backupType: '完整备份' },
    { id: 3, date: '2023-10-30 22:15:30', type: '自动备份', size: '1.18 GB', status: '成功', backupType: '完整备份' },
    { id: 4, date: '2023-10-29 22:15:30', type: '自动备份', size: '1.22 GB', status: '成功', backupType: '完整备份' },
    { id: 5, date: '2023-10-28 22:15:30', type: '自动备份', size: '1.19 GB', status: '成功', backupType: '完整备份' },
    { id: 6, date: '2023-10-27 22:15:30', type: '自动备份', size: '1.21 GB', status: '成功', backupType: '完整备份' },
    { id: 7, date: '2023-10-26 22:15:30', type: '自动备份', size: '1.17 GB', status: '成功', backupType: '完整备份' },
    { id: 8, date: '2023-10-25 22:15:30', type: '自动备份', size: '1.23 GB', status: '成功', backupType: '完整备份' },
];

// 加载日志数据
function loadLogsData() {
    renderLogsTable(logData);
}

// 渲染日志表格
function renderLogsTable(logs) {
    const tableBody = document.getElementById('logs-table-body');
    tableBody.innerHTML = '';
    
    logs.forEach(log => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${log.time}</td>
            <td><span class="log-type ${log.type}">${getLogTypeText(log.type)}</span></td>
            <td>${log.operator}</td>
            <td>${log.role}</td>
            <td>${log.ip}</td>
            <td>${log.description}</td>
            <td><span class="${log.result === '成功' ? 'success' : log.result === '警告' ? 'warning' : 'danger'}">${log.result}</span></td>
            <td><button class="btn btn-sm btn-secondary" onclick="showLogDetails(${log.id})">详情</button></td>
        `;
        tableBody.appendChild(row);
    });
    
    // 更新摘要
    document.getElementById('logs-summary').textContent = `显示 ${logs.length} 条记录，共 ${logs.length} 条`;
    
    // 渲染分页
    renderLogsPagination(logs.length);
}

// 获取操作类型文本
function getLogTypeText(type) {
    const typeMap = {
        'login': '登录/登出',
        'modify': '数据修改',
        'delete': '数据删除',
        'backup': '数据备份',
        'restore': '数据恢复',
        'security': '安全事件',
        'system': '系统操作'
    };
    return typeMap[type] || type;
}

// 渲染日志分页
function renderLogsPagination(totalItems) {
    const pagination = document.getElementById('logs-pagination');
    pagination.innerHTML = '';
    
    const itemsPerPage = 10;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    // 简单分页示例
    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = i === 1 ? 'page-btn active' : 'page-btn';
        pageBtn.textContent = i;
        pageBtn.addEventListener('click', function() {
            document.querySelectorAll('#logs-pagination .page-btn').forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            // 在实际应用中，这里会加载对应页面的数据
        });
        pagination.appendChild(pageBtn);
    }
}

// 搜索日志
function searchLogs() {
    const typeFilter = document.getElementById('log-type').value;
    const operatorFilter = document.getElementById('operator').value.trim().toLowerCase();
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    
    let filteredLogs = logData;
    
    if (typeFilter !== 'all') {
        filteredLogs = filteredLogs.filter(log => log.type === typeFilter);
    }
    
    if (operatorFilter) {
        filteredLogs = filteredLogs.filter(log => 
            log.operator.toLowerCase().includes(operatorFilter) || 
            log.role.toLowerCase().includes(operatorFilter)
        );
    }
    
    if (startDate) {
        filteredLogs = filteredLogs.filter(log => {
            const logDate = log.time.split(' ')[0];
            return logDate >= startDate;
        });
    }
    
    if (endDate) {
        filteredLogs = filteredLogs.filter(log => {
            const logDate = log.time.split(' ')[0];
            return logDate <= endDate;
        });
    }
    
    renderLogsTable(filteredLogs);
    showMessage(`找到 ${filteredLogs.length} 条日志记录`, 'success');
}

// 重置日志筛选
function resetLogFilters() {
    document.getElementById('log-type').value = 'all';
    document.getElementById('operator').value = '';
    
    // 设置默认日期
    const today = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    document.getElementById('start-date').value = sevenDaysAgo;
    document.getElementById('end-date').value = today;
    
    renderLogsTable(logData);
}

// 导出日志
function exportLogs() {
    showMessage('正在导出日志数据，请稍候...', 'info');
    
    // 模拟导出过程
    setTimeout(() => {
        showMessage('日志数据导出成功！文件: system_logs_20231101.csv', 'success');
        
        // 在实际应用中，这里会触发文件下载
        // 模拟创建一个下载链接
        const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent("时间,操作类型,操作人员,角色,IP地址,操作描述,操作结果\n" +
            logData.map(log => 
                `${log.time},${getLogTypeText(log.type)},${log.operator},${log.role},${log.ip},${log.description},${log.result}`
            ).join("\n"));
        
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", "system_logs.csv");
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        document.body.removeChild(downloadAnchor);
    }, 1500);
}

// 清理日志
function clearLogs() {
    if (confirm('确定要清理30天前的所有日志记录吗？此操作不可恢复！')) {
        showMessage('正在清理旧日志数据...', 'info');
        
        setTimeout(() => {
            showMessage('成功清理30天前的日志记录！', 'success');
        }, 2000);
    }
}

// 显示日志详情
function showLogDetails(logId) {
    const log = logData.find(l => l.id === logId);
    if (log) {
        alert(`日志详情：
时间: ${log.time}
操作类型: ${getLogTypeText(log.type)}
操作人员: ${log.operator} (${log.role})
IP地址: ${log.ip}
操作描述: ${log.description}
操作结果: ${log.result}
详情: ${log.details}`);
    }
}

// 加载备份数据
function loadBackupData() {
    renderBackupStatus();
    renderBackupHistory();
}

// 渲染备份状态
function renderBackupStatus() {
    // 更新最后检查时间
    const now = new Date();
    const timeStr = now.toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' });
    document.getElementById('last-check-time').textContent = `今天 ${timeStr}`;
    
    // 更新数据库大小
    const dbSize = (3.2 + Math.random() * 0.2).toFixed(1);
    const dbProgress = (dbSize / 10 * 100).toFixed(0);
    
    document.getElementById('db-size').textContent = dbSize;
    document.getElementById('db-progress').style.width = `${dbProgress}%`;
    
    // 更新最后备份信息
    const lastBackup = backupHistory[0];
    if (lastBackup) {
        document.getElementById('last-backup-time').textContent = lastBackup.date.split(' ')[0] + ' ' + lastBackup.date.split(' ')[1];
        document.getElementById('last-backup-status').textContent = `${lastBackup.type}${lastBackup.status}`;
    }
}

// 渲染备份历史
function renderBackupHistory() {
    const historyList = document.getElementById('backup-history-list');
    historyList.innerHTML = '';
    
    backupHistory.forEach(backup => {
        const item = document.createElement('div');
        item.className = 'history-item';
        item.innerHTML = `
            <div class="history-info">
                <h4>${backup.type} - ${backup.date}</h4>
                <p>大小: ${backup.size} | 类型: ${backup.backupType} | 状态: <span style="color: ${backup.status === '成功' ? '#28a745' : '#dc3545'}">${backup.status}</span></p>
            </div>
            <div class="history-actions">
                <button class="btn btn-sm btn-secondary" onclick="downloadBackup(${backup.id})">
                    <i class="fas fa-download"></i> 下载
                </button>
                <button class="btn btn-sm btn-success" onclick="restoreThisBackup(${backup.id})">
                    <i class="fas fa-undo"></i> 恢复
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteBackup(${backup.id})">
                    <i class="fas fa-trash-alt"></i> 删除
                </button>
            </div>
        `;
        historyList.appendChild(item);
    });
}

// 手动备份
function manualBackup() {
    const userData = JSON.parse(sessionStorage.getItem('current_user') || '{}');
    if (userData.role === 'admin') {
        showMessage('教学管理员无权执行数据备份操作！', 'danger');
        return;
    }
    
    showMessage('开始执行手动数据备份，请勿关闭页面...', 'info');
    
    // 模拟备份过程
    setTimeout(() => {
        showMessage('数据备份完成！备份文件: backup_' + new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + '.zip', 'success');
        
        // 更新最后备份时间
        const now = new Date();
        const dateStr = now.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
        const timeStr = now.toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        document.getElementById('last-backup-time').textContent = `${dateStr} ${timeStr}`;
        document.getElementById('last-backup-status').textContent = '手动备份成功';
        
        // 记录日志
        const currentUser = JSON.parse(sessionStorage.getItem('current_user') || '{}');
        logData.unshift({
            id: logData.length + 1,
            time: `${dateStr} ${timeStr}`,
            type: 'backup',
            operator: currentUser.username || 'sysadmin',
            role: getRoleText(currentUser.role || 'sysadmin'),
            ip: '192.168.1.100',
            description: '执行手动数据备份',
            result: '成功',
            details: '备份文件: backup_' + new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + '.zip'
        });
    }, 3000);
}

// 显示备份计划模态框
function showScheduleModal() {
    document.getElementById('schedule-modal').style.display = 'flex';
}

// 显示恢复备份模态框
function showRestoreModal() {
    const userData = JSON.parse(sessionStorage.getItem('current_user') || '{}');
    if (userData.role === 'admin') {
        showMessage('教学管理员无权执行数据恢复操作！', 'danger');
        return;
    }
    document.getElementById('restore-modal').style.display = 'flex';
}

// 显示备份历史
function showBackupHistory() {
    // 滚动到备份历史部分
    document.getElementById('backup-history-list').scrollIntoView({ behavior: 'smooth' });
    showMessage('已滚动到备份历史列表', 'info');
}

// 清理旧备份
function cleanBackup() {
    const userData = JSON.parse(sessionStorage.getItem('current_user') || '{}');
    if (userData.role === 'admin') {
        showMessage('教学管理员无权清理备份文件！', 'danger');
        return;
    }
    
    if (confirm('确定要清理30天前的旧备份文件吗？')) {
        showMessage('开始清理旧备份文件...', 'info');
        
        setTimeout(() => {
            showMessage('成功清理30天前的旧备份文件！', 'success');
        }, 2000);
    }
}

// 下载备份
function downloadBackup(backupId) {
    const backup = backupHistory.find(b => b.id === backupId);
    if (backup) {
        showMessage(`开始下载备份文件：${backup.date}`, 'info');
        
        setTimeout(() => {
            showMessage(`备份文件 ${backup.date}.zip 下载完成！`, 'success');
        }, 1500);
    }
}

// 恢复特定备份
function restoreThisBackup(backupId) {
    const userData = JSON.parse(sessionStorage.getItem('current_user') || '{}');
    if (userData.role === 'admin') {
        showMessage('教学管理员无权执行数据恢复操作！', 'danger');
        return;
    }
    
    const backup = backupHistory.find(b => b.id === backupId);
    if (backup) {
        if (confirm(`确定要恢复备份点 ${backup.date} 吗？此操作将覆盖当前数据！`)) {
            showMessage(`开始恢复备份：${backup.date}...`, 'info');
            
            setTimeout(() => {
                showMessage(`备份 ${backup.date} 恢复成功！系统将重新启动。`, 'success');
                
                // 模拟系统重启
                setTimeout(() => {
                    showMessage('系统正在重启，请重新登录...', 'info');
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 2000);
                }, 5000);
            }, 3000);
        }
    }
}

// 删除备份
function deleteBackup(backupId) {
    const userData = JSON.parse(sessionStorage.getItem('current_user') || '{}');
    if (userData.role === 'admin') {
        showMessage('教学管理员无权删除备份文件！', 'danger');
        return;
    }
    
    const backup = backupHistory.find(b => b.id === backupId);
    if (backup) {
        if (confirm(`确定要删除备份点 ${backup.date} 吗？此操作不可恢复！`)) {
            showMessage(`正在删除备份：${backup.date}...`, 'info');
            
            setTimeout(() => {
                showMessage(`备份 ${backup.date} 删除成功！`, 'success');
            }, 1500);
        }
    }
}

// 关闭恢复备份模态框
function closeRestoreModal() {
    document.getElementById('restore-modal').style.display = 'none';
}

// 关闭备份计划模态框
function closeScheduleModal() {
    document.getElementById('schedule-modal').style.display = 'none';
}

// 确认恢复备份
function confirmRestore() {
    const userData = JSON.parse(sessionStorage.getItem('current_user') || '{}');
    if (userData.role === 'admin') {
        showMessage('教学管理员无权执行数据恢复操作！', 'danger');
        closeRestoreModal();
        return;
    }
    
    const selectedBackup = document.getElementById('backup-select').value;
    if (!selectedBackup) {
        showMessage('请选择要恢复的备份点！', 'danger');
        return;
    }
    
    if (confirm('警告：此操作将覆盖当前所有数据，且不可恢复！确定要继续吗？')) {
        showMessage('开始恢复备份，系统将重启...', 'info');
        closeRestoreModal();
        
        setTimeout(() => {
            showMessage('备份恢复完成！系统将在5秒后重启...', 'success');
            
            // 模拟系统重启
            setTimeout(() => {
                showMessage('系统正在重启，请重新登录...', 'info');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            }, 5000);
        }, 2000);
    }
}

// 保存备份计划
function saveSchedule() {
    const userData = JSON.parse(sessionStorage.getItem('current_user') || '{}');
    if (userData.role === 'admin') {
        showMessage('教学管理员无权修改备份计划！', 'danger');
        closeScheduleModal();
        return;
    }
    
    const frequency = document.getElementById('backup-frequency-modal').value;
    const time = document.getElementById('backup-time-modal').value;
    const retention = document.getElementById('retention-policy').value;
    
    const frequencyText = {
        'daily': '每天',
        'weekly': '每周',
        'monthly': '每月'
    }[frequency];
    
    showMessage(`备份计划已保存：${frequencyText}，备份时间：${time}，保留策略：${retention}天`, 'success');
    closeScheduleModal();
}

// 加载用户数据
function loadUsersData() {
    renderUsersTable(userData);
}

// 渲染用户表格
function renderUsersTable(users) {
    const tableBody = document.getElementById('users-table-body');
    tableBody.innerHTML = '';
    
    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.username}</td>
            <td>${user.fullname}</td>
            <td>${getRoleText(user.role)}</td>
            <td><span class="user-status ${user.status}">${getStatusText(user.status)}</span></td>
            <td>${user.lastLogin}</td>
            <td>${user.registerTime}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-secondary" onclick="editUser(${user.id})">编辑</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteUser(${user.id})">删除</button>
                    <button class="btn btn-sm btn-success" onclick="resetPassword(${user.id})">重置密码</button>
                    ${user.status === 'locked' ? 
                        `<button class="btn btn-sm btn-warning" onclick="unlockUser(${user.id})">解锁</button>` : 
                        user.status === 'inactive' ?
                        `<button class="btn btn-sm btn-info" onclick="activateUser(${user.id})">激活</button>` :
                        `<button class="btn btn-sm btn-secondary" onclick="lockUser(${user.id})">锁定</button>`
                    }
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // 更新摘要
    document.getElementById('users-summary').textContent = `显示 ${users.length} 条记录，共 ${users.length} 条`;
    
    // 渲染分页
    renderUsersPagination(users.length);
}

// 获取角色文本
function getRoleText(role) {
    const roleMap = {
        'sysadmin': '系统管理员',
        'admin': '教学管理员'
    };
    return roleMap[role] || role;
}

// 获取状态文本
function getStatusText(status) {
    const statusMap = {
        'active': '活跃',
        'locked': '锁定',
        'inactive': '未激活'
    };
    return statusMap[status] || status;
}

// 渲染用户分页
function renderUsersPagination(totalItems) {
    const pagination = document.getElementById('users-pagination');
    pagination.innerHTML = '';
    
    const itemsPerPage = 10;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = i === 1 ? 'page-btn active' : 'page-btn';
        pageBtn.textContent = i;
        pageBtn.addEventListener('click', function() {
            document.querySelectorAll('#users-pagination .page-btn').forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
        pagination.appendChild(pageBtn);
    }
}

// 显示添加用户模态框
function showAddUserModal() {
    document.getElementById('add-user-modal').style.display = 'flex';
}

// 关闭添加用户模态框
function closeAddUserModal() {
    document.getElementById('add-user-modal').style.display = 'none';
    // 清空表单
    document.getElementById('new-username').value = '';
    document.getElementById('new-fullname').value = '';
    document.getElementById('new-user-role').value = 'admin';
    document.getElementById('new-password').value = '';
    document.getElementById('new-email').value = '';
    document.getElementById('new-phone').value = '';
    document.getElementById('new-gender').value = 'male';
    document.getElementById('new-birthday').value = '';
    document.getElementById('new-region').value = '';
}

// 确认添加用户
function confirmAddUser() {
    const username = document.getElementById('new-username').value.trim();
    const fullname = document.getElementById('new-fullname').value.trim();
    const role = document.getElementById('new-user-role').value;
    const password = document.getElementById('new-password').value;
    const email = document.getElementById('new-email').value.trim();
    const phone = document.getElementById('new-phone').value.trim();
    const gender = document.getElementById('new-gender').value;
    const birthday = document.getElementById('new-birthday').value;
    const region = document.getElementById('new-region').value.trim();
    
    if (!username || !fullname || !password) {
        showMessage('请填写所有必填字段！', 'danger');
        return;
    }
    
    // 检查用户名是否已存在
    if (userData.some(user => user.username === username)) {
        showMessage('用户名已存在！', 'danger');
        return;
    }
    
    // 添加新用户
    const newUser = {
        id: userData.length + 1,
        username: username,
        fullname: fullname,
        role: role,
        status: 'active',
        lastLogin: '从未登录',
        registerTime: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }),
        email: email || `${username}@example.com`,
        phone: phone || '未设置',
        gender: gender || 'male',
        birthday: birthday || '未设置',
        region: region || '未设置'
    };
    
    userData.push(newUser);
    renderUsersTable(userData);
    
    showMessage(`用户 ${username} 添加成功！初始密码已设置。`, 'success');
    closeAddUserModal();
    
    // 记录日志
    const currentUser = JSON.parse(sessionStorage.getItem('current_user') || '{}');
    logData.unshift({
        id: logData.length + 1,
        time: new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        type: 'modify',
        operator: currentUser.username || 'sysadmin',
        role: getRoleText(currentUser.role || 'sysadmin'),
        ip: '192.168.1.100',
        description: `添加新用户: ${username}`,
        result: '成功',
        details: `添加用户: ${fullname} (${username}), 角色: ${getRoleText(role)}`
    });
}

// 导入用户
function importUsers() {
    showMessage('用户批量导入功能正在开发中...', 'info');
}

// 搜索用户
function searchUsers() {
    const typeFilter = document.getElementById('user-type-filter').value;
    const statusFilter = document.getElementById('user-status-filter').value;
    const searchText = document.getElementById('user-search').value.trim().toLowerCase();
    
    let filteredUsers = userData;
    
    if (typeFilter !== 'all') {
        filteredUsers = filteredUsers.filter(user => user.role === typeFilter);
    }
    
    if (statusFilter !== 'all') {
        filteredUsers = filteredUsers.filter(user => user.status === statusFilter);
    }
    
    if (searchText) {
        filteredUsers = filteredUsers.filter(user => 
            user.username.toLowerCase().includes(searchText) || 
            user.fullname.toLowerCase().includes(searchText) ||
            user.id.toString().includes(searchText) ||
            user.email.toLowerCase().includes(searchText) ||
            user.phone.includes(searchText)
        );
    }
    
    renderUsersTable(filteredUsers);
    showMessage(`找到 ${filteredUsers.length} 个用户`, 'success');
}

// 编辑用户
function editUser(userId) {
    const user = userData.find(u => u.id === userId);
    if (user) {
        // 填充编辑表单
        document.getElementById('edit-user-id').value = user.id;
        document.getElementById('edit-username').value = user.username;
        document.getElementById('edit-fullname').value = user.fullname;
        document.getElementById('edit-user-role').value = user.role;
        document.getElementById('edit-email').value = user.email;
        document.getElementById('edit-phone').value = user.phone;
        document.getElementById('edit-gender').value = user.gender;
        document.getElementById('edit-birthday').value = user.birthday;
        document.getElementById('edit-region').value = user.region;
        document.getElementById('edit-status').value = user.status;
        
        // 显示模态框
        document.getElementById('edit-user-modal').style.display = 'flex';
    }
}

// 关闭编辑用户模态框
function closeEditUserModal() {
    document.getElementById('edit-user-modal').style.display = 'none';
}

// 确认编辑用户
function confirmEditUser() {
    const userId = parseInt(document.getElementById('edit-user-id').value);
    const fullname = document.getElementById('edit-fullname').value.trim();
    const role = document.getElementById('edit-user-role').value;
    const email = document.getElementById('edit-email').value.trim();
    const phone = document.getElementById('edit-phone').value.trim();
    const gender = document.getElementById('edit-gender').value;
    const birthday = document.getElementById('edit-birthday').value;
    const region = document.getElementById('edit-region').value.trim();
    const status = document.getElementById('edit-status').value;
    
    if (!fullname) {
        showMessage('请输入用户姓名！', 'danger');
        return;
    }
    
    // 更新用户信息
    const userIndex = userData.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
        // 检查是否尝试修改超级管理员
        if (userData[userIndex].username === 'sysadmin' && userData[userIndex].role === 'sysadmin') {
            if (role !== 'sysadmin') {
                showMessage('不能修改超级管理员的角色！', 'danger');
                return;
            }
            if (status !== 'active') {
                showMessage('不能锁定或停用超级管理员！', 'danger');
                return;
            }
        }
        
        // 保存旧信息用于日志
        const oldUser = { ...userData[userIndex] };
        
        // 更新用户信息
        userData[userIndex].fullname = fullname;
        userData[userIndex].role = role;
        userData[userIndex].email = email;
        userData[userIndex].phone = phone;
        userData[userIndex].gender = gender;
        userData[userIndex].birthday = birthday;
        userData[userIndex].region = region;
        userData[userIndex].status = status;
        
        renderUsersTable(userData);
        showMessage('用户信息更新成功！', 'success');
        closeEditUserModal();
        
        // 记录日志
        const currentUser = JSON.parse(sessionStorage.getItem('current_user') || '{}');
        logData.unshift({
            id: logData.length + 1,
            time: new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            type: 'modify',
            operator: currentUser.username || 'sysadmin',
            role: getRoleText(currentUser.role || 'sysadmin'),
            ip: '192.168.1.100',
            description: `编辑用户信息: ${oldUser.username}`,
            result: '成功',
            details: `修改用户 ${oldUser.fullname} (${oldUser.username}) 的信息`
        });
    }
}

// 删除用户
function deleteUser(userId) {
    const user = userData.find(u => u.id === userId);
    if (user) {
        if (confirm(`确定要删除用户 ${user.username} (${user.fullname}) 吗？此操作不可恢复！`)) {
            if (user.username === 'sysadmin') {
                showMessage('不能删除超级管理员账户！', 'danger');
                return;
            }
            
            // 从数组中删除
            const index = userData.findIndex(u => u.id === userId);
            if (index !== -1) {
                userData.splice(index, 1);
                renderUsersTable(userData);
                showMessage(`用户 ${user.username} 删除成功！`, 'success');
                
                // 记录日志
                const currentUser = JSON.parse(sessionStorage.getItem('current_user') || '{}');
                logData.unshift({
                    id: logData.length + 1,
                    time: new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    type: 'delete',
                    operator: currentUser.username || 'sysadmin',
                    role: getRoleText(currentUser.role || 'sysadmin'),
                    ip: '192.168.1.100',
                    description: `删除用户: ${user.username}`,
                    result: '成功',
                    details: `删除用户: ${user.fullname} (${user.username}), 角色: ${getRoleText(user.role)}`
                });
            }
        }
    }
}

// 重置用户密码
function resetPassword(userId) {
    const user = userData.find(u => u.id === userId);
    if (user) {
        if (confirm(`确定要重置用户 ${user.username} 的密码吗？重置后密码将变为默认密码。`)) {
            showMessage(`用户 ${user.username} 的密码已重置为默认密码！`, 'success');
            
            // 记录日志
            const currentUser = JSON.parse(sessionStorage.getItem('current_user') || '{}');
            logData.unshift({
                id: logData.length + 1,
                time: new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                type: 'modify',
                operator: currentUser.username || 'sysadmin',
                role: getRoleText(currentUser.role || 'sysadmin'),
                ip: '192.168.1.100',
                description: `重置用户密码: ${user.username}`,
                result: '成功',
                details: `重置用户 ${user.fullname} (${user.username}) 的密码`
            });
        }
    }
}

// 解锁用户
function unlockUser(userId) {
    const user = userData.find(u => u.id === userId);
    if (user && user.status === 'locked') {
        if (confirm(`确定要解锁用户 ${user.username} 吗？`)) {
            user.status = 'active';
            renderUsersTable(userData);
            showMessage(`用户 ${user.username} 已解锁！`, 'success');
            
            // 记录日志
            const currentUser = JSON.parse(sessionStorage.getItem('current_user') || '{}');
            logData.unshift({
                id: logData.length + 1,
                time: new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                type: 'modify',
                operator: currentUser.username || 'sysadmin',
                role: getRoleText(currentUser.role || 'sysadmin'),
                ip: '192.168.1.100',
                description: `解锁用户账号: ${user.username}`,
                result: '成功',
                details: `解锁用户 ${user.fullname} (${user.username}) 的账号`
            });
        }
    }
}

// 激活用户
function activateUser(userId) {
    const user = userData.find(u => u.id === userId);
    if (user && user.status === 'inactive') {
        if (confirm(`确定要激活用户 ${user.username} 吗？`)) {
            user.status = 'active';
            renderUsersTable(userData);
            showMessage(`用户 ${user.username} 已激活！`, 'success');
            
            // 记录日志
            const currentUser = JSON.parse(sessionStorage.getItem('current_user') || '{}');
            logData.unshift({
                id: logData.length + 1,
                time: new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                type: 'modify',
                operator: currentUser.username || 'sysadmin',
                role: getRoleText(currentUser.role || 'sysadmin'),
                ip: '192.168.1.100',
                description: `激活用户账号: ${user.username}`,
                result: '成功',
                details: `激活用户 ${user.fullname} (${user.username}) 的账号`
            });
        }
    }
}

// 锁定用户
function lockUser(userId) {
    const user = userData.find(u => u.id === userId);
    if (user && user.status === 'active') {
        if (user.username === 'sysadmin') {
            showMessage('不能锁定超级管理员账户！', 'danger');
            return;
        }
        
        if (confirm(`确定要锁定用户 ${user.username} 吗？锁定后该用户将无法登录。`)) {
            user.status = 'locked';
            renderUsersTable(userData);
            showMessage(`用户 ${user.username} 已锁定！`, 'success');
            
            // 记录日志
            const currentUser = JSON.parse(sessionStorage.getItem('current_user') || '{}');
            logData.unshift({
                id: logData.length + 1,
                time: new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                type: 'modify',
                operator: currentUser.username || 'sysadmin',
                role: getRoleText(currentUser.role || 'sysadmin'),
                ip: '192.168.1.100',
                description: `锁定用户账号: ${user.username}`,
                result: '成功',
                details: `锁定用户 ${user.fullname} (${user.username}) 的账号`
            });
        }
    }
}

// 加载设置数据
function loadSettingsData() {
    // 已经在initPage中调用loadSystemSettings
}

// 保存设置
function saveSettings() {
    const userData = JSON.parse(sessionStorage.getItem('current_user') || '{}');
    if (userData.role === 'admin') {
        showMessage('教学管理员无权修改系统设置！', 'danger');
        return;
    }
    
    // 收集所有设置值
    const settings = {
        systemName: document.getElementById('system-name').value,
        maintenanceMode: document.getElementById('maintenance-mode').checked,
        sessionTimeout: document.getElementById('session-timeout').value,
        maxLoginAttempts: document.getElementById('max-login-attempts').value,
        minPasswordLength: document.getElementById('min-password-length').value,
        passwordComplexity: document.getElementById('password-complexity').checked,
        passwordExpiry: document.getElementById('password-expiry').value,
        twoFactorAuth: document.getElementById('two-factor-auth').checked,
        ipWhitelist: document.getElementById('ip-whitelist').value,
        emailNotifications: document.getElementById('email-notifications').checked,
        smtpServer: document.getElementById('smtp-server').value,
        notificationEmail: document.getElementById('notification-email').value,
        autoBackup: document.getElementById('auto-backup').checked,
        backupFrequency: document.getElementById('backup-frequency').value,
        backupTime: document.getElementById('backup-time').value,
        backupRetention: document.getElementById('backup-retention').value,
        lastModified: new Date().toISOString()
    };
    
    // 保存到本地存储
    localStorage.setItem('system_settings', JSON.stringify(settings));
    
    showMessage('系统设置已保存成功！', 'success');
    
    // 记录日志
    const currentUser = JSON.parse(sessionStorage.getItem('current_user') || '{}');
    logData.unshift({
        id: logData.length + 1,
        time: new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        type: 'system',
        operator: currentUser.username || 'sysadmin',
        role: getRoleText(currentUser.role || 'sysadmin'),
        ip: '192.168.1.100',
        description: '修改系统设置',
        result: '成功',
        details: '更新了系统配置参数'
    });
}

// 显示消息
function showMessage(message, type) {
    // 创建一个消息元素
    const messageEl = document.createElement('div');
    messageEl.className = `alert alert-${type}`;
    messageEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        z-index: 3000;
        max-width: 400px;
        animation: slideIn 0.3s, fadeOut 0.3s 4.7s;
    `;
    
    // 根据类型设置样式
    const styles = {
        'success': { backgroundColor: '#d4edda', color: '#155724', border: '1px solid #c3e6cb' },
        'danger': { backgroundColor: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb' },
        'info': { backgroundColor: '#d1ecf1', color: '#0c5460', border: '1px solid #bee5eb' },
        'warning': { backgroundColor: '#fff3cd', color: '#856404', border: '1px solid #ffeaa7' }
    };
    
    Object.assign(messageEl.style, styles[type]);
    
    // 添加图标
    const icons = {
        'success': 'check-circle',
        'danger': 'exclamation-triangle',
        'info': 'info-circle',
        'warning': 'exclamation-circle'
    };
    
    messageEl.innerHTML = `<i class="fas fa-${icons[type]}"></i> ${message}`;
    
    // 添加到页面
    document.body.appendChild(messageEl);
    
    // 5秒后移除
    setTimeout(() => {
        if (messageEl.parentNode) {
            messageEl.parentNode.removeChild(messageEl);
        }
    }, 5000);
}

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
`;
document.head.appendChild(style);