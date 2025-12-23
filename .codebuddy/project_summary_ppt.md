# TMS 教学管理系统 - 项目总结

---

## 第1页：首页 - 成员信息

### 小组成员

| 姓名 | 学号 | 专业 | 角色 |
|:----:|:----:|:----:|:----:|
| [成员1] | [学号1] | [专业1] | [角色1] |
| [成员2] | [学号2] | [专业2] | [角色2] |
| [成员3] | [学号3] | [专业3] | [角色3] |
| [成员4] | [学号4] | [专业4] | [角色4] |
| [成员5] | [学号5] | [专业5] | [角色5] |

**项目名称**：TMS 教学管理系统（Teaching Management System）  
**开发周期**：[开发周期]  
**指导教师**：[指导教师]

---

## 第2页：项目概述

### 项目背景
面向高校教学场景，为教师、学生、管理员提供完整的课程管理与教学辅助工具，实现教学过程数字化。

### 技术架构
```
┌─────────────────────────────────────────┐
│              前端应用层                   │
│  HTML5 + CSS3 + Vanilla JavaScript      │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│          数据持久层                       │
│         IndexedDB (浏览器本地数据库)      │
└─────────────────────────────────────────┘
```

### 系统组成
- **公共模块**：登录、注册、角色选择
- **学生端**：课程学习、作业提交、成绩查询
- **教师端**：课程管理、作业考试、成绩批改
- **管理员端**：审核管理、用户管理
- **系统管理员端**：系统配置

---

## 第3页：核心功能概览

### 学生端功能
- 📚 我的课程：查看课程、进入学习
- 📝 作业提交：上传作业文件、查看批改结果
- 📊 成绩中心：课程成绩、总评成绩、GPA查询

### 教师端功能
- 📋 课程管理：创建课程、发布开课计划
- ✏️ 作业考试：创建作业/考试、管理题目
- ✔️ 成绩批改：在线批改、评分评语、提交反馈
- 📈 成绩管理：录入成绩、成绩统计分析

### 管理员功能
- ✅ 课程审核：审核教师发布的课程
- 👤 教师认证：教师资格审核
- 🔐 用户管理：用户信息管理、权限控制

---

## 第4页：成员分工和工作量

| 成员 | 模块/功能 | 工作量比例 |
|:----:|:----------|:----------:|
| [成员1] | [负责模块1] | [XX]% |
| [成员2] | [负责模块2] | [XX]% |
| [成员3] | [负责模块3] | [XX]% |
| [成员4] | [负责模块4] | [XX]% |
| [成员5] | [负责模块5] | [XX]% |

**总工作量**：100%

---

## 第5页：项目特色（小组自评）

### ✨ 核心亮点

#### 1. 完整的教学闭环
- 从课程创建 → 学生选课 → 作业提交 → 教师批改 → 成绩查询，形成完整教学链路
- 支持作业和考试两种类型，批改流程完善

#### 2. 统一的数据库设计
- `DatabaseManager.js` 实现统一的IndexedDB管理
- 支持多表关联：用户、课程、选课、作业、成绩等9张核心表
- 数据一致性保障，支持批量操作和事务处理

#### 3. 模块化架构
- 清晰的目录结构：public / student / Teacher / admin / shared
- 共享服务复用：`AuthService`（认证）、`GradesManager`（成绩管理）
- 降低耦合度，便于维护和扩展

#### 4. 零依赖纯前端实现
- 不依赖任何框架（React/Vue等）
- 使用原生JavaScript实现复杂交互逻辑
- IndexedDB替代后端数据库，实现完全本地化

#### 5. 用户体验优化
- 响应式设计，适配多种屏幕尺寸
- 实时反馈：作业提交状态、批改进度
- 直观的数据可视化：成绩统计图表

---

## 第6页：功能列表

### 核心功能矩阵

| 模块 | 功能点 | 特点 |
|:-----|:-------|:-----|
| 公共 | 用户注册/登录 | 支持三种角色选择 |
| 公共 | 密码重置 | 邮箱验证 |
| 学生 | 课程浏览 | 卡片式展示 |
| 学生 | 作业提交 | 文件上传、状态跟踪 |
| 学生 | 成绩查询 | 多维度统计 |
| 教师 | 课程创建 | 完整信息配置 |
| 教师 | 作业/考试发布 | 类型区分、题目设置 |
| 教师 | 在线批改 | 评分+评语 |
| 教师 | 成绩录入 | 多项成绩、自动计算 |
| 管理员 | 审核流程 | 待办提醒 |
| 系统管理员 | 系统配置 | 全局参数管理 |

### 特色功能
- **智能批改提醒**：待批改任务自动汇总
- **成绩自动计算**：平时+期中+期末→总评
- **提交记录追溯**：完整的提交历史和批改时间

---

## 第7页：性能与兼容性

### 安全性

#### ✅ 密码加密存储（模拟哈希）
```javascript
// shared/AuthService.js:162
const hashedPassword = CryptoJS.SHA256(password + salt).toString();
```

#### ✅ 角色权限控制
```javascript
// shared/AuthService.js:308-324
hasPermission(requiredRole) {
    const roleHierarchy = {
        'student': 1,
        'teacher': 2,
        'admin_edu': 3,
        'sysadmin': 4
    };
    return roleHierarchy[this.currentUser.role] >= roleHierarchy[requiredRole];
}
```

#### ✅ 会话管理（Token机制）
```javascript
// shared/AuthService.js:188-207
_createSession(user) {
    const session = {
        id: user.id,
        username: user.username,
        role: user.role,
        expiresAt: new Date(Date.now() + this.config.tokenExpiry).toISOString()
    };
    localStorage.setItem('currentUser', JSON.stringify(session));
    return session;
}
```

#### ✅ 输入验证（前端校验）
```javascript
// utils/Constants.js:218-240
const VALIDATION_RULES = {
    PASSWORD: {
        MIN_LENGTH: 8,
        PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/
    },
    EMAIL: { PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }
};
```

### 兼容性

#### ✅ 支持现代浏览器（Chrome/Edge/Firefox/Safari）
```javascript
// shared/DatabaseManager.js:45-46
if (!window.indexedDB) {
    throw new Error('您的浏览器不支持IndexedDB');
}
```

#### ✅ IndexedDB支持
```javascript
// shared/DatabaseManager.js:64-96
async _openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(this.config.name, this.config.version);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            // 创建表和索引
        };
        request.onsuccess = () => resolve(request.result);
    });
}
```

#### ✅ 响应式设计（手机/平板/桌面）
```css
/* Teacher/CSS/responsive.css:52-81 */
@media (max-width: 768px) {
    .course-cards { grid-template-columns: 1fr; }
    .modal-content { width: 95%; }
    .form-actions { flex-direction: column; }
}
@media (max-width: 1024px) {
    .container { flex-direction: column; }
    .sidebar { width: 100%; }
}
```

### 性能优化

#### ✅ 数据库索引优化（多表索引）
```javascript
// shared/DatabaseManager.js:101-138
_createIndexes(store, storeName) {
    switch (storeName) {
        case 'users':
            store.createIndex('username', 'username', { unique: true });
            store.createIndex('role', 'role', { unique: false });
            break;
        case 'enrollments':
            store.createIndex('studentId', 'studentId', { unique: false });
            store.createIndex('planId', 'planId', { unique: false });
            break;
    }
}
```

#### ✅ 前端缓存机制
```javascript
// public/js/main.js:49, 63-87
localCache: [],
async loadCourses() {
    // 先从缓存获取
    if (this.localCache.length > 0) return this.localCache;
    // 从IndexedDB加载
    const courses = await window.dbManager.getAll('courses');
    this.localCache = courses;
    return courses;
}
```

#### ✅ 按需加载（模块拆分）
```javascript
// 各页面独立初始化
// student/index.html 加载 student.js
// Teacher/HTML/dashboard.html 加载 dashboard.js
// admin/admin.html 加载 admin.js
document.addEventListener('DOMContentLoaded', () => CourseModule.init());
```

#### ✅ 异步操作避免阻塞
```javascript
// shared/DatabaseManager.js:561-581, 583-613
async get(storeName, id) {
    const tx = this.db.transaction(storeName, 'readonly');
    return new Promise((resolve) => {
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result);
    });
}
async getAll(storeName) {
    const courses = await Promise.all([
        this.getAll('users'),
        this.getAll('courses')
    ]);
}
```

---

## 第8页：交互设计亮点

### 用户友好的交互设计

#### 1. 模态框交互
- 批改作业：弹出批改窗口，实时显示学生提交内容
- 信息确认：重要操作二次确认

#### 2. 状态可视化
- 🟢 已提交 / 🟡 待批改 / 🔴 未提交
- 批改进度条显示

#### 3. 实时反馈
- 作业提交成功提示
- 批改完成通知
- 数据保存确认

#### 4. 导航体验
- 侧边栏菜单导航（支持快速跳转各功能模块）
- Tab页切换（课程内容、作业、成绩）

#### 5. 表单优化
- 必填项标识
- 实时输入校验
- 友好的错误提示

---

## 第9页：总结与展望

### 项目成果
- ✅ 完成了4个用户角色的完整功能模块
- ✅ 实现了教学管理全流程的数字化
- ✅ 建立了可扩展的前端架构
- ✅ 代码结构清晰，便于维护

### 技术收获
- 熟练掌握IndexedDB数据库开发
- 深入理解模块化前端架构设计
- 提升了原生JavaScript开发能力
- 掌握了复杂业务逻辑的实现方法

### 未来改进方向
- 🔗 对接后端API，实现真正的多用户系统
- 📱 增强移动端体验
- 📊 引入数据可视化图表库
- 🔐 加强安全性和数据加密
- ⚡ 性能优化和缓存策略改进

---

## 结束页

感谢聆听！

**TMS 教学管理系统**
*让教学管理更简单*

---

[团队Logo]
