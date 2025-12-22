/**
 * 【模块名称】：首页课程展示与筛选模块
 * 【维护人员】：梁德铭
 * 【功能描述】：
 * 1. 实现从 IndexedDB 异步加载课程数据，并具备数据读取失败后的 fallback（备用）展示能力。
 * 2. 动态生成课程卡片，并根据用户登录状态（localStorage）智能切换按钮交互逻辑（选课/查看）。
 * 3. 提供实时搜索、院系过滤及学分筛选的复合查询功能。
 * * 【整合指南】：
 * 1. 依赖库：确保 HTML 中先引入 CryptoJS (若涉及加密) 和 db.js (BaseDB 接口)。
 * 2. DOM 绑定：HTML 必须包含 id 为 'course-list' 的容器，以及搜索/过滤所需的 ID 元素。
 * 3. 数据流：本模块只读。若需增加课程，请在 db.js 的 initialData 或教学管理员模块进行操作。
 * 4. 路径说明：登录后的“立即选修”按钮跳转路径固定为 'student_side/course_selection.html'。
 */
const CourseModule = {
    // 1. 模拟备用数据 (对齐统一数据库)
    fallbackData: [
        { 
            id: 'course_cs101', code: 'CS101', name: '数据结构与算法', 
            teacher: '王老师', credits: 3, department: '计算机系',
            category: '必修课', description: '计算机科学核心课程，学习数据结构和算法设计',
            prerequisites: '无', status: 'published'
        },
        { 
            id: 'course_ma202', code: 'MA202', name: '高等数学', 
            teacher: '李老师', credits: 4, department: '数学系',
            category: '必修课', description: '大学数学基础课程，涵盖微积分和线性代数',
            prerequisites: '无', status: 'published'
        },
        { 
            id: 'course_phy105', code: 'PHY105', name: '大学物理', 
            teacher: '张老师', credits: 3, department: '物理系',
            category: '必修课', description: '物理学基础课程，涵盖力学、电磁学等',
            prerequisites: '无', status: 'published'
        },
        { 
            id: 'course_eng201', code: 'ENG201', name: '大学英语', 
            teacher: '王老师', credits: 2, department: '外语系',
            category: '必修课', description: '英语语言学习课程，提高听说读写能力',
            prerequisites: '无', status: 'published'
        },
        { 
            id: 'course_se301', code: 'SE301', name: '软件工程', 
            teacher: '李老师', credits: 3, department: '软件工程系',
            category: '专业课', description: '软件开发流程和方法论课程',
            prerequisites: '需掌握编程基础', status: 'published'
        }
    ],

    localCache: [],

    getElements() {
        return {
            container: document.getElementById('course-list'),
            searchInput: document.getElementById('course-search-input'),
            searchBtn: document.getElementById('search-btn'),
            filterDept: document.getElementById('filter-department'),
            filterCredit: document.getElementById('filter-credit'),
            clearFilters: document.getElementById('clear-filters')
        };
    },

    // 2. 从 IndexedDB 加载课程
    async loadCourses() {
        try {
        // 使用统一数据库管理器
        if (typeof window.dbManager !== 'undefined') {
            await window.dbManager.init();
            const courses = await window.dbManager.getAll('courses');
            return courses && courses.length > 0 ? courses : this.fallbackData;
        }
            
            // 兼容性获取数据库实例
            const db = window.dbManager ? await window.dbManager.init() : (typeof BaseDB !== 'undefined' ? await BaseDB.open() : await openDB());
            return new Promise((resolve) => {
                const transaction = db.transaction(['courses'], 'readonly');
                const store = transaction.objectStore('courses');
                const request = store.getAll();
                request.onsuccess = () => {
                    const data = request.result;
                    resolve(data && data.length > 0 ? data : this.fallbackData);
                };
                request.onerror = () => resolve(this.fallbackData);
            });
        } catch (err) {
            return this.fallbackData;
        }
    },

    // 3. 生成卡片 HTML (纯文字版)
    createCardHTML(course) {
        // 从 localStorage 获取当前登录状态
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        const isLoggedIn = !!currentUser;
        const isStudent = isLoggedIn && currentUser.role === 'student';

        // 动态逻辑判断 - 统一显示立即选修
        let btnText = "立即选修";
        let btnClass = "btn-primary";
        let btnAction = '';

        if (!isLoggedIn) {
            btnAction = `alert('请先从右上角登录系统后再进行选课。')`;
        } else if (!isStudent) {
            btnAction = `alert('您当前不是学生角色，无法进行选课。')`;
        } else {
            btnAction = `location.href='../student/index.html'`;
        }

        return `
            <article class="course-card">
                <div class="course-header">
                    <span class="category-tag">${course.category || '课程'}</span>
                    <span class="course-id-tag">#${course.code || course.id}</span>
                </div>
                
                <h3>${course.name}</h3>
                
                <p class="course-meta">
                    <span>授课教师：${course.teacher || '待定'}</span>
                    <span>开课院系：${course.department || '待定'}</span>
                    <span>学分：<strong>${parseFloat(course.credits || 0).toFixed(1)}</strong></span>
                </p>
                
                <p class="course-intro">
                    ${course.description || '暂无详细介绍。'}
                </p>
                
                <div class="course-requirements">
                    <strong>选课要求：</strong>${course.prerequisites || '无'}
                </div>
                
                <button class="${btnClass}" onclick="${btnAction}">${btnText}</button>
            </article>
        `;
    },

    // 4. 渲染逻辑
    async render(filterFn = null) {
        const els = this.getElements();
        if (!els.container) return;

        if (this.localCache.length === 0) {
            this.localCache = await this.loadCourses();
            this.setupFilters(); // 只有第一次加载数据时初始化过滤器
        }

        let displayData = filterFn ? this.localCache.filter(filterFn) : this.localCache;
        
        els.container.innerHTML = displayData.length === 0 
            ? '<div class="no-data" style="grid-column: 1/-1; text-align: center; padding: 40px;">未找到符合条件的课程。</div>' 
            : displayData.map(c => this.createCardHTML(c)).join('');
    },

    // 5. 搜索与筛选逻辑
    setupFilters() {
        const els = this.getElements();
        
        // 动态生成学院下拉菜单
        if (els.filterDept) {
            const depts = [...new Set(this.localCache.map(c => c.department).filter(d => d))];
            els.filterDept.innerHTML = '<option value="">所有开课院系</option>';
            depts.forEach(d => {
                const opt = document.createElement('option');
                opt.value = opt.textContent = d;
                els.filterDept.appendChild(opt);
            });
        }

        const triggerSearch = () => {
            const term = els.searchInput.value.toLowerCase().trim();
            const dept = els.filterDept.value;
            const credit = els.filterCredit.value;

            this.render(course => {
                const matchesSearch = course.name.toLowerCase().includes(term) || 
                                     (course.code && course.code.toLowerCase().includes(term));
                const matchesDept = !dept || course.department === dept;
                // 注意：学分比对需处理数值类型
                const matchesCredit = !credit || parseFloat(course.credits) === parseFloat(credit);
                
                return matchesSearch && matchesDept && matchesCredit;
            });
        };

        const clearFilters = () => {
            els.searchInput.value = '';
            els.filterDept.value = '';
            els.filterCredit.value = '';
            triggerSearch();
        };

        // 绑定事件
        els.searchBtn?.addEventListener('click', triggerSearch);
        els.filterDept?.addEventListener('change', triggerSearch);
        els.filterCredit?.addEventListener('change', triggerSearch);
        els.clearFilters?.addEventListener('click', clearFilters);
        
        // 回车搜索支持
        els.searchInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') triggerSearch();
        });
    },

    init() {
        this.render();
    }
};

document.addEventListener('DOMContentLoaded', () => CourseModule.init());