// 系统管理端功能模块 - 适配统一认证服务
let currentUser = null;
let currentPage = 1;
const pageSize = 10;

// 等待初始化
async function initSystemAdmin() {
    // 获取当前用户
    try {
        const session = await authService.checkSession();
        if (!session) {
            alert('请先登录！');
            window.location.href = '../public/login.html?role=admin_sys';
            return;
        }
        currentUser = session;
        updateUserInfo(session);
    } catch (error) {
        console.error('获取用户信息失败:', error);
    }

    // 初始化页面
    bindNavEvents();
    initTimeDisplay();
    loadInitialData();

    // 延迟绑定按钮事件，确保 DOM 完全加载
    setTimeout(() => {
        bindBackupButtons();
        bindModalEvents();
    }, 200);
}

// 更新用户信息显示
function updateUserInfo(session) {
    const userNameEl = document.getElementById('current-user');
    const adminUsernameEl = document.getElementById('admin-username');
    const currentRoleEl = document.getElementById('current-role');

    if (userNameEl) userNameEl.textContent = session.name || '系统管理员';
    if (adminUsernameEl) adminUsernameEl.textContent = session.username || 'sysadmin';
    if (currentRoleEl) currentRoleEl.textContent = 'System Admin';
}

// 绑定导航事件
function bindNavEvents() {
    const navLinks = document.querySelectorAll('.nav-link:not(.logout-link)');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.id;
            if (targetId) {
                showSection(targetId);
                setActiveNav(this);
            }
        });
    });

    // 退出登录
    const logoutLink = document.querySelector('.logout-link');
    if (logoutLink) {
        logoutLink.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('确定要退出登录吗？')) {
                authService.logout();
                window.location.href = '../public/login.html';
            }
        });
    }

    // 用户菜单
    const userMenu = document.querySelector('.user-menu');
    if (userMenu) {
        userMenu.addEventListener('click', function() {
            this.querySelector('.dropdown-menu').classList.toggle('show');
        });
    }
}

// 显示指定内容区域
function showSection(targetId) {
    // 隐藏所有卡片
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.style.display = 'none';
    });

    // 显示对应卡片
    let cardId = '';
    switch (targetId) {
        case 'nav-logs':
            cardId = 'logs-section';
            loadOperationLogs();
            break;
        case 'nav-backup':
            cardId = 'backup-section';
            loadBackupHistory();
            break;
        case 'nav-users':
            cardId = 'users-section';
            loadUsers();
            break;
        case 'nav-settings':
            cardId = 'settings-section';
            break;
        default:
            cardId = 'logs-section';
            loadOperationLogs();
    }

    const targetCard = document.getElementById(cardId);
    if (targetCard) {
        targetCard.style.display = 'block';
    }

    // 更新页面标题
    const titles = {
        'nav-logs': '操作日志审计',
        'nav-backup': '数据备份恢复',
        'nav-users': '用户账户管理',
        'nav-settings': '系统设置'
    };
    const pageTitleEl = document.getElementById('page-title');
    if (pageTitleEl && titles[targetId]) {
        pageTitleEl.textContent = titles[targetId];
    }
}

// 设置导航激活状态
function setActiveNav(activeLink) {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
    });
    activeLink.classList.add('active');
}

// 初始化时间显示
function initTimeDisplay() {
    const timeEl = document.getElementById('server-time');
    if (timeEl) {
        updateTime();
        setInterval(updateTime, 1000);
    }

    // 绑定操作日志按钮事件
    bindLogButtons();

    // 绑定用户管理按钮事件
    bindUserButtons();
}

// 绑定操作日志按钮事件
function bindLogButtons() {
    const exportBtn = document.getElementById('export-logs-btn');
    const clearBtn = document.getElementById('clear-logs-btn');
    const searchBtn = document.getElementById('search-logs-btn');
    const resetBtn = document.getElementById('reset-filters-btn');

    if (exportBtn) {
        exportBtn.addEventListener('click', () => alert('导出日志功能开发中...'));
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', async () => {
            if (confirm('确定要清空所有日志吗？此操作不可恢复。')) {
                try {
                    const logs = await dbManager.getAll('audit_logs');
                    for (const log of logs) {
                        await dbManager.delete('audit_logs', log.id);
                    }
                    alert('日志已清空！');
                    loadOperationLogs();
                } catch (error) {
                    console.error('清空日志失败:', error);
                    alert('清空日志失败，请重试');
                }
            }
        });
    }

    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            loadOperationLogs();
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            document.getElementById('start-date').value = '';
            document.getElementById('end-date').value = '';
            document.getElementById('log-type').value = 'all';
            document.getElementById('operator').value = '';
            currentPage = 1;
            loadOperationLogs();
        });
    }
}

// 绑定用户管理按钮事件
function bindUserButtons() {
    const addUserBtn = document.getElementById('add-user-btn');
    const importUsersBtn = document.getElementById('import-users-btn');
    const searchUsersBtn = document.getElementById('search-users-btn');

    if (addUserBtn) {
        addUserBtn.addEventListener('click', () => {
            const modal = document.getElementById('add-user-modal');
            if (modal) modal.style.display = 'block';
        });
    }

    if (importUsersBtn) {
        importUsersBtn.addEventListener('click', () => alert('批量导入功能开发中...'));
    }

    if (searchUsersBtn) {
        searchUsersBtn.addEventListener('click', () => {
            const type = document.getElementById('user-type-filter').value;
            const status = document.getElementById('user-status-filter').value;
            const search = document.getElementById('user-search').value.toLowerCase();
            
            filterUsers(type, status, search);
        });
    }
}

// 过滤用户
async function filterUsers(type, status, search) {
    try {
        let users = await dbManager.getAll('users');
        
        // 按角色过滤
        if (type && type !== 'all') {
            users = users.filter(u => u.role === type);
        }
        
        // 按状态过滤
        if (status && status !== 'all') {
            users = users.filter(u => u.status === status);
        }
        
        // 按搜索词过滤
        if (search) {
            users = users.filter(u => 
                u.username.toLowerCase().includes(search) ||
                u.name.toLowerCase().includes(search) ||
                u.id.toLowerCase().includes(search)
            );
        }
        
        displayUsers(users);
    } catch (error) {
        console.error('过滤用户失败:', error);
        displayUsers([]);
    }
}

// 绑定备份恢复按钮事件
function bindBackupButtons() {
    const manualBackupBtn = document.getElementById('manual-backup-btn');
    const scheduleBackupBtn = document.getElementById('schedule-backup-btn');
    const restoreBackupBtn = document.getElementById('restore-backup-btn');
    const backupHistoryBtn = document.getElementById('backup-history-btn');
    const cleanBackupBtn = document.getElementById('clean-backup-btn');
    const saveSettingsBtn = document.getElementById('save-settings-btn');

    if (manualBackupBtn) {
        manualBackupBtn.addEventListener('click', async () => {
            try {
                alert('正在执行数据备份...');
                // 模拟备份
                await new Promise(resolve => setTimeout(resolve, 1500));
                alert('数据备份完成！');
                loadBackupHistory();
            } catch (error) {
                console.error('备份失败:', error);
                alert('备份失败，请重试');
            }
        });
    }

    if (scheduleBackupBtn) {
        scheduleBackupBtn.addEventListener('click', () => {
            const modal = document.getElementById('schedule-modal');
            if (modal) modal.style.display = 'block';
        });
    }

    if (restoreBackupBtn) {
        restoreBackupBtn.addEventListener('click', () => {
            const modal = document.getElementById('restore-modal');
            if (modal) modal.style.display = 'block';
        });
    }

    if (backupHistoryBtn) {
        backupHistoryBtn.addEventListener('click', () => alert('备份历史功能开发中...'));
    }

    if (cleanBackupBtn) {
        cleanBackupBtn.addEventListener('click', () => {
            if (confirm('确定要清理旧备份吗？')) {
                alert('清理旧备份功能开发中...');
            }
        });
    }

    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', () => {
            alert('系统设置已保存！');
        });
    }
}

// 绑定模态框事件
function bindModalEvents() {
    // 关闭模态框的 X 按钮
    const closeButtons = document.querySelectorAll('.close-btn');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) modal.style.display = 'none';
        });
    });

    // 取出按钮
    const cancelButtons = document.querySelectorAll('[id^="cancel-"]');
    cancelButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) modal.style.display = 'none';
        });
    });

    // 点击模态框外部关闭
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });

    // 初始化标签切换
    setupTabSwitching();
}

// 设置标签切换
function setupTabSwitching() {
    const tabLinks = document.querySelectorAll('.tab-link');
    tabLinks.forEach(link => {
        link.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');

            // 移除所有激活状态
            tabLinks.forEach(l => l.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

            // 激活当前标签
            this.classList.add('active');
            const tabContent = document.getElementById(tabName + '-tab');
            if (tabContent) tabContent.classList.add('active');
        });
    });
}

function updateTime() {
    const timeEl = document.getElementById('server-time');
    if (timeEl) {
        const now = new Date();
        timeEl.textContent = now.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }
}

// 加载初始数据
async function loadInitialData() {
    try {
        await loadOperationLogs();
    } catch (error) {
        console.error('加载初始数据失败:', error);
    }
}

// 加载操作日志
async function loadOperationLogs() {
    try {
        const logs = await dbManager.getAll('audit_logs');
        displayLogs(logs);
    } catch (error) {
        console.error('加载操作日志失败:', error);
        displayLogs([]);
    }
}

// 显示日志
function displayLogs(logs) {
    const tbody = document.getElementById('logs-table-body');
    const summaryEl = document.getElementById('logs-summary');

    if (!tbody) return;

    tbody.innerHTML = '';

    if (logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">暂无操作日志</td></tr>';
        if (summaryEl) summaryEl.textContent = '显示 0 条记录，共 0 条';
        return;
    }

    // 按时间倒序
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // 分页
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const pageLogs = logs.slice(start, end);

    pageLogs.forEach(log => {
        const row = createLogRow(log);
        tbody.appendChild(row);
    });

    // 更新摘要
    if (summaryEl) {
        summaryEl.textContent = `显示 ${pageLogs.length} 条记录，共 ${logs.length} 条`;
    }

    // 更新分页
    updatePagination(logs.length, 'logs-pagination');
}

// 创建日志行
function createLogRow(log) {
    const row = document.createElement('tr');

    const typeLabels = {
        'login': '登录/登出',
        'modify': '数据修改',
        'delete': '数据删除',
        'backup': '数据备份',
        'restore': '数据恢复',
        'security': '安全事件',
        'system': '系统操作'
    };

    const time = log.timestamp ? new Date(log.timestamp).toLocaleString('zh-CN') : '-';

    row.innerHTML = `
        <td>${time}</td>
        <td><span class="badge ${getActionTypeClass(log.action)}">${typeLabels[log.action] || log.action}</span></td>
        <td>${getUserName(log.userId)}</td>
        <td>${getUserRoleName(log.userId)}</td>
        <td>${log.ip || '-'}</td>
        <td>${log.details || '-'}</td>
        <td><span class="status-badge">成功</span></td>
        <td><button class="btn-detail" onclick="showLogDetail('${log.id}')">查看</button></td>
    `;

    return row;
}

function getActionTypeClass(action) {
    const classes = {
        'login': 'badge-info',
        'modify': 'badge-warning',
        'delete': 'badge-danger',
        'backup': 'badge-success',
        'restore': 'badge-primary',
        'security': 'badge-danger',
        'system': 'badge-secondary'
    };
    return classes[action] || 'badge-secondary';
}

async function getUserName(userId) {
    try {
        const user = await dbManager.get('users', userId);
        return user ? user.name : userId;
    } catch (error) {
        return userId;
    }
}

async function getUserRoleName(userId) {
    try {
        const user = await dbManager.get('users', userId);
        if (user) {
            return authService.getRoleDisplayName(user.role);
        }
        return '-';
    } catch (error) {
        return '-';
    }
}

// 更新分页
function updatePagination(total, paginationId) {
    const paginationEl = document.getElementById(paginationId);
    if (!paginationEl) return;

    const totalPages = Math.ceil(total / pageSize);

    paginationEl.innerHTML = '';

    // 上一页
    const prevBtn = createPageButton('«', () => {
        if (currentPage > 1) {
            currentPage--;
            loadOperationLogs();
        }
    }, currentPage === 1);

    paginationEl.appendChild(prevBtn);

    // 页码
    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = createPageButton(i, () => {
            currentPage = i;
            loadOperationLogs();
        }, i === currentPage);
        paginationEl.appendChild(pageBtn);
    }

    // 下一页
    const nextBtn = createPageButton('»', () => {
        if (currentPage < totalPages) {
            currentPage++;
            loadOperationLogs();
        }
    }, currentPage === totalPages);

    paginationEl.appendChild(nextBtn);
}

function createPageButton(text, onClick, disabled) {
    const btn = document.createElement('button');
    btn.className = 'page-btn';
    btn.textContent = text;
    btn.disabled = disabled;

    if (disabled) {
        btn.classList.add('disabled');
    }

    if (!disabled) {
        btn.addEventListener('click', onClick);
    }

    return btn;
}

// 加载用户列表
async function loadUsers() {
    try {
        const users = await dbManager.getAll('users');
        displayUsers(users);
    } catch (error) {
        console.error('加载用户列表失败:', error);
        displayUsers([]);
    }
}

// 显示用户
function displayUsers(users) {
    const tbody = document.getElementById('users-table-body');
    const summaryEl = document.getElementById('users-summary');

    if (!tbody) return;

    tbody.innerHTML = '';

    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">暂无用户数据</td></tr>';
        if (summaryEl) summaryEl.textContent = '显示 0 条记录，共 0 条';
        return;
    }

    users.forEach(user => {
        const row = createUserRow(user);
        tbody.appendChild(row);
    });

    if (summaryEl) {
        summaryEl.textContent = `显示 ${users.length} 条记录，共 ${users.length} 条`;
    }
}

// 创建用户行
function createUserRow(user) {
    const row = document.createElement('tr');

    const statusClass = user.status === 'active' ? 'status-active' : 'status-inactive';
    const statusText = user.status === 'active' ? '活跃' : user.status;

    row.innerHTML = `
        <td>${user.id}</td>
        <td>${user.username}</td>
        <td>${user.name}</td>
        <td><span class="badge">${authService.getRoleDisplayName(user.role)}</span></td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        <td>${user.lastLogin || '-'}</td>
        <td>${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</td>
        <td>
            <button class="btn-edit" onclick="editUser('${user.id}')">编辑</button>
            <button class="btn-delete" onclick="deleteUser('${user.id}')">删除</button>
        </td>
    `;

    return row;
}

// 加载备份历史
function loadBackupHistory() {
    const historyList = document.getElementById('backup-history-list');
    if (!historyList) return;

    // 示例数据
    const backups = [
        { id: 'backup-1', date: '2023-12-20 22:15', type: '完整备份', size: '3.2GB', status: '成功' },
        { id: 'backup-2', date: '2023-12-19 22:15', type: '完整备份', size: '3.1GB', status: '成功' },
        { id: 'backup-3', date: '2023-12-18 22:15', type: '完整备份', size: '3.1GB', status: '成功' }
    ];

    historyList.innerHTML = backups.map(backup => `
        <div class="backup-item">
            <div class="backup-info">
                <div class="backup-date">${backup.date}</div>
                <div class="backup-type">${backup.type}</div>
                <div class="backup-size">${backup.size}</div>
            </div>
            <div class="backup-status status-success">${backup.status}</div>
        </div>
    `).join('');
}

// 显示日志详情
function showLogDetail(logId) {
    alert('日志详情功能开发中...\n日志ID: ' + logId);
}

// 编辑用户
function editUser(userId) {
    alert('编辑用户功能开发中...\n用户ID: ' + userId);
}

// 删除用户
async function deleteUser(userId) {
    if (!confirm('确定要删除该用户吗？此操作不可恢复。')) {
        return;
    }

    try {
        await dbManager.delete('users', userId);
        alert('用户删除成功！');
        loadUsers();
    } catch (error) {
        console.error('删除用户失败:', error);
        alert('删除用户失败，请重试');
    }
}

// 注意：初始化在 admin.html 中调用，这里不使用 DOMContentLoaded
// 因为脚本是动态加载的，DOMContentLoaded 事件已经过去
