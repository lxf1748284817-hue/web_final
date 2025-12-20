# 教学管理系统统一重构指南

## 🎯 重构目标

将原本分散的五个模块（公共前端、学生端、教师端、教学管理端、系统管理端）统一管理，解决数据库冲突和功能割裂问题。

## 📁 新项目结构

```
web_final-public-ldm/
├── index.html                     # 统一入口页面
├── config/
│   └── database.js               # 统一数据库配置
├── core/
│   ├── DatabaseManager.js        # 数据库管理器
│   ├── AuthService.js            # 认证服务
│   └── shared/
│       ├── CourseService.js      # 课程服务
│       ├── UserService.js        # 用户服务
│       └── GradeService.js       # 成绩服务
├── modules/
│   ├── public/                   # 公共前端模块
│   ├── student/                  # 学生端模块
│   ├── teacher/                  # 教师端模块
│   └── admin/                    # 管理端模块
└── utils/
    ├── constants.js              # 常量定义
    ├── helpers.js                # 工具函数
    └── validators.js             # 验证器
```

## 🔄 数据库迁移步骤

### 第一步：备份现有数据

```javascript
// 在浏览器控制台执行，备份各模块数据
async function backupLegacyData() {
    const backups = {};
    
    // 备份各模块的数据库
    const dbNames = ['CurriculumDesignDB'];
    
    for (const dbName of dbNames) {
        try {
            const request = indexedDB.open(dbName);
            request.onsuccess = () => {
                const db = request.result;
                const backup = {};
                
                // 遍历所有存储
                for (const storeName of db.objectStoreNames) {
                    const tx = db.transaction(storeName, 'readonly');
                    const store = tx.objectStore(storeName);
                    const getAllRequest = store.getAll();
                    
                    getAllRequest.onsuccess = () => {
                        backup[storeName] = getAllRequest.result;
                    };
                }
                
                backups[dbName] = backup;
                console.log(`${dbName} 备份完成`);
                db.close();
            };
        } catch (error) {
            console.error(`备份 ${dbName} 失败:`, error);
        }
    }
    
    return backups;
}
```

### 第二步：迁移核心数据

需要迁移的主要数据：

1. **用户数据** - 合并各模块的用户表
2. **课程数据** - 统一课程格式
3. **成绩数据** - 合并成绩记录
4. **权限数据** - 统一权限管理

### 第三步：更新各模块代码

#### 1. 更新HTML文件中的脚本引用

```html
<!-- 旧引用方式 -->
<script src="js/db.js"></script>
<script src="js/main.js"></script>

<!-- 新引用方式 -->
<script type="module">
    import { dbManager } from '../../core/DatabaseManager.js';
    import { authService } from '../../core/AuthService.js';
    // ... 其他导入
</script>
```

#### 2. 更新数据库操作代码

```javascript
// 旧方式
const db = await BaseDB.open();
const tx = db.transaction(['users'], 'readwrite');
// ...

// 新方式
import { dbManager } from '../../core/DatabaseManager.js';
const user = await dbManager.get('users', userId);
// ...
```

## 🔧 具体模块修改指南

### 1. 公共前端模块 (public/)

#### 需要修改的文件：
- `public/login.html` - 更新登录逻辑
- `public/js/main.js` - 使用统一数据库
- `public/js/security.js` - 使用AuthService

#### 主要修改点：
```javascript
// 修改登录逻辑
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('user-role').value;
    
    const result = await authService.login(username, password, role);
    
    if (result.success) {
        if (result.isFirstLogin) {
            window.location.href = 'reset_password.html';
        } else {
            // 根据角色跳转
            authService.redirectByRole(role);
        }
    } else {
        document.getElementById('error-message').textContent = result.message;
    }
});
```

### 2. 学生端模块 (student/)

#### 需要修改的文件：
- `student/index.html` - 更新用户信息显示
- `student/js/database.js` - 移除，使用统一数据库
- `student/js/student.js` - 使用共享服务

#### 主要修改点：
```javascript
// 修改用户信息获取
async function updateUserInfo() {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
        document.getElementById('studentName').textContent = currentUser.name;
        document.getElementById('studentId').textContent = `学号：${currentUser.username}`;
    }
}

// 修改课程加载
async function loadCourses() {
    const courses = await dbManager.getAll('courses');
    // ... 渲染逻辑
}

// 修改选课逻辑
async function enrollCourse(courseId) {
    const currentUser = authService.getCurrentUser();
    
    const enrollment = {
        id: ID_GENERATOR.enrollment(currentUser.id, courseId),
        studentId: currentUser.id,
        courseId: courseId,
        semester: '2024-1', // 当前学期
        status: 'enrolled',
        enrolledAt: new Date().toISOString()
    };
    
    await dbManager.add('enrollments', enrollment);
    // ...
}
```

### 3. 教师端模块 (Teacher/)

#### 需要修改的文件：
- `Teacher/HTML/dashboard.html` - 更新数据源
- `Teacher/JS/data.js` - 移除，使用统一数据库
- `Teacher/JS/courses.js` - 使用共享服务

#### 主要修改点：
```javascript
// 修改课程管理
async function loadTeacherCourses() {
    const currentUser = authService.getCurrentUser();
    const courses = await dbManager.getAll('courses', {
        index: 'teacherId',
        value: currentUser.id
    });
    
    // 渲染课程列表
    renderCourseCards(courses);
}

// 修改作业发布
async function createAssignment(courseId, assignmentData) {
    const assignment = {
        id: ID_GENERATOR.assignment(courseId, getNextSequence()),
        courseId: courseId,
        ...assignmentData,
        status: 'draft',
        createdAt: new Date().toISOString()
    };
    
    await dbManager.add('assignments', assignment);
}
```

### 4. 管理端模块 (TMS_System_Admin/)

#### 需要修改的文件：
- `TMS_System_Admin/admin.html` - 更新审计功能
- `TMS_System_Admin/JS/admin.js` - 使用统一数据库

#### 主要修改点：
```javascript
// 修改操作日志
async function loadAuditLogs() {
    const logs = await dbManager.getAll('audit_logs');
    renderAuditLogs(logs);
}

// 修改用户管理
async function loadUsers() {
    const users = await dbManager.getAll('users');
    renderUserTable(users);
}

// 修改数据备份
async function createBackup() {
    const backup = {
        id: ID_GENERATOR.backup(),
        data: await exportAllData(),
        timestamp: new Date().toISOString(),
        createdBy: authService.getCurrentUser().id
    };
    
    await dbManager.add('data_backups', backup);
}
```

## 📋 测试验证清单

### 功能测试
- [ ] 用户登录（所有角色）
- [ ] 学生选课功能
- [ ] 教师课程管理
- [ ] 成绩录入和查看
- [ ] 管理员审计功能
- [ ] 数据备份恢复

### 数据一致性测试
- [ ] 用户数据完整性
- [ ] 课程数据同步
- [ ] 成绩数据准确性
- [ ] 权限控制有效性

### 性能测试
- [ ] 数据库查询速度
- [ ] 页面加载速度
- [ ] 并发操作处理

## 🚀 部署步骤

### 1. 开发环境测试
```bash
# 启动本地服务器（如果需要）
npx serve .
# 或使用Live Server等工具
```

### 2. 数据迁移验证
1. 在浏览器中访问 `index.html`
2. 检查控制台是否有错误
3. 验证数据库初始化成功
4. 测试各模块功能

### 3. 生产环境部署
1. 备份现有数据
2. 更新文件到服务器
3. 验证所有功能正常
4. 监控系统运行状态

## ⚠️ 注意事项

### 数据安全
- ⚠️ **重要**: 在执行迁移前必须完整备份现有数据
- 🔒 确保密码加密算法一致
- 📝 记录所有迁移操作

### 回滚方案
如果迁移失败，可以按以下步骤回滚：

1. 恢复原始数据库文件
2. 恢复HTML文件
3. 清除新的统一数据库
4. 验证系统正常

### 常见问题

#### Q: 迁移后用户无法登录
A: 检查密码加密算法是否一致，确认盐值使用方式正确

#### Q: 数据不显示
A: 检查数据库版本是否正确，确认表结构是否创建成功

#### Q: 权限控制失效
A: 检查角色映射是否正确，确认权限验证逻辑

## 📞 技术支持

如果在迁移过程中遇到问题：

1. 检查浏览器控制台错误信息
2. 验证数据库初始化状态
3. 确认所有模块文件更新正确
4. 必要时恢复到迁移前状态

---

**重构完成后，系统将具备以下优势：**
✅ 统一的数据库管理  
✅ 一致的用户体验  
✅ 完整的数据流转  
✅ 简化的维护工作  
✅ 更好的扩展性