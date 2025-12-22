# TMS 培训管理系统

## 项目结构

```
WEB_FINAL-PUBLIC-LDM/
├── public/          # 公共页面（登录、注册、角色选择）
├── admin/           # 管理员模块
├── student/         # 学生模块
├── Teacher/         # 教师模块
├── TMS_System_Admin/ # 系统管理员模块
├── shared/          # 共享资源（认证服务等）
├── config/          # 配置文件（API配置）
├── utils/           # 工具函数
└── index.html       # 入口页面
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
