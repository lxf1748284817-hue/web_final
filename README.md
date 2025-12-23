# TMS 培训管理系统

## 项目结构

```
web_final-public-ldm/
├── index.html                           # 入口页面
├── README.md                           # 项目说明文档
├── start-server.bat                     # 本地服务器启动脚本
├── public/                             # 公共页面（登录、注册、角色选择）
│   ├── index.html                     # 主页
│   ├── login.html                     # 登录页
│   ├── forgot_password.html            # 忘记密码页
│   ├── reset_password.html             # 重置密码页
│   ├── css/
│   │   └── style.css                # 公共样式表
│   └── js/
│       ├── main.js                   # 主逻辑
│       ├── forgot_password.js          # 忘记密码逻辑
│       └── reset_password.js           # 重置密码逻辑
├── admin/                              # 管理员模块
│   ├── admin.html                      # 管理员主页面
│   └── js/
│       └── admin.js                   # 管理员逻辑
├── student/                            # 学生模块
│   ├── index.html                      # 学生端主页
│   ├── test.html                      # 测试页面
│   ├── css/
│   │   └── student.css                # 学生端样式表
│   └── js/
│       ├── api.js                     # API接口
│       └── student.js                 # 学生端主逻辑
├── Teacher/                            # 教师模块
│   ├── HTML/
│   │   ├── dashboard.html             # 仪表板页面
│   │   ├── courses.html              # 课程管理页面
│   │   ├── course-content.html        # 课程内容管理页面
│   │   ├── grades.html               # 成绩管理页面
│   │   └── exams.html               # 作业与考试管理页面
│   ├── CSS/
│   │   ├── dashboard.css             # 仪表板样式
│   │   ├── courses.css              # 课程管理样式
│   │   ├── course-content.css        # 课程内容样式
│   │   ├── grades.css               # 成绩管理样式
│   │   ├── exams.css                # 作业考试样式
│   │   └── responsive.css           # 响应式样式
│   └── JS/
│       ├── db-init.js               # 数据库初始化
│       ├── dashboard.js             # 仪表板逻辑
│       ├── courses.js              # 课程管理逻辑
│       ├── course-content.js        # 课程内容逻辑
│       ├── grades.js               # 成绩管理逻辑
│       └── exams.js                # 作业考试逻辑
├── TMS_System_Admin/                    # 系统管理员模块
│   ├── admin.html                      # 系统管理主页面
│   ├── CSS/
│   │   └── admin.css                # 系统管理样式
│   └── JS/
│       └── admin.js                   # 系统管理逻辑
├── shared/                             # 共享资源（认证服务等）
│   ├── DatabaseManager.js               # 统一数据库管理器
│   └── AuthService.js                  # 统一认证服务
├── config/                             # 配置文件（API配置）
│   └── database.js                    # 数据库配置
└── utils/                              # 工具函数
    └── Constants.js                   # 常量定义
```

## 用户角色

| 角色 | 目录 | 权限 |
|------|------|------|
| 管理员 | admin/ | 培训管理、课程管理、资源管理 |
| 教师 | Teacher/ | 课程教学、学生管理、成绩录入 |
| 学生 | student/ | 课程学习、作业提交、成绩查询 |
| 系统管理员 | TMS_System_Admin/ | 用户管理、角色分配、系统配置 |

## 快速启动

1. 双击 `start-server.bat` 启动本地服务器
2. 访问 `http://localhost:8080`
3. 在登录页选择角色并登录
