/**
 * 首页课程显示模块 (由 [你的名字] 维护)
 * 对整合者友好：
 * 1. 优先尝试从 IndexedDB 加载数据，失败则降级使用内存数据。
 * 2. 逻辑封装在 CourseModule 命名空间下。
 */
const CourseModule = {
    // 1. 模拟备用数据 (当数据库连接失败或未初始化时使用)
    fallbackData: [
        { id: 'CS101', name: 'Web编程技术', credits: 3.0, department: '计算机学院', teacher: '蔡树彬', intro: '前端实战开发。', requirements: 'C++/Java基础' },
        { id: 'MA202', name: '高等数学 B', credits: 4.0, department: '数学与统计学院', teacher: '李四', intro: '微积分、线性代数。', requirements: '无' }
    ],

    // 缓存从数据库读取的数据，用于前端搜索筛选
    localCache: [],

    // 2. 页面元素获取
    getElements() {
        return {
            container: document.getElementById('course-list'),
            searchInput: document.getElementById('course-search-input'),
            searchBtn: document.getElementById('search-btn'),
            filterDept: document.getElementById('filter-department'),
            filterCredit: document.getElementById('filter-credit')
        };
    },

    // 3. 异步获取课程数据
    async loadCourses() {
        try {
            // 兼容性调用：尝试整合者的全局 openDB 或你的 BaseDB
            const db = typeof openDB === 'function' ? await openDB() : await BaseDB.open();
            
            return new Promise((resolve) => {
                const transaction = db.transaction(['courses'], 'readonly');
                const store = transaction.objectStore('courses');
                const request = store.getAll();

                request.onsuccess = () => {
                    const data = request.result;
                    // 如果数据库里有课程（对齐小组表的 courses 表），就用数据库的
                    resolve(data.length > 0 ? data : this.fallbackData);
                };
                request.onerror = () => resolve(this.fallbackData);
            });
        } catch (err) {
            console.warn("CourseModule: 无法连接数据库，使用备用数据渲染");
            return this.fallbackData;
        }
    },

    // 4. 生成卡片 HTML (逻辑解耦)
    createCardHTML(course) {
        // 从 Session (localStorage) 获取当前用户
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        const isLoggedIn = !!currentUser;
        const isStudent = isLoggedIn && currentUser.role === 'student';

        let btnText = "查看详情";
        let btnClass = "btn-secondary";
        let btnAction = `alert('请先登录后再进行选课。')`;

        if (isStudent) {
            btnText = "立即选修";
            btnClass = "btn-primary";
            btnAction = `location.href='../student_side/course_selection.html'`;
        }

        return `
            <article class="course-card">
                <h3>${course.name} <small>(${course.id})</small></h3>
                <p class="course-meta">
                    <span>学分: ${parseFloat(course.credits || 0).toFixed(1)}</span> | 
                    <span>授课: ${course.teacher || '未知'}</span>
                </p>
                <p class="course-intro">${course.intro || '暂无介绍'}</p>
                <button class="btn ${btnClass}" onclick="${btnAction}">${btnText}</button>
            </article>
        `;
    },

    // 5. 渲染与过滤逻辑
    async render(filterFn = null) {
        const els = this.getElements();
        if (!els.container) return;

        // 第一次加载时获取数据并初始化过滤器
        if (this.localCache.length === 0) {
            this.localCache = await this.loadCourses();
            this.setupFilters();
        }

        let displayData = filterFn ? this.localCache.filter(filterFn) : this.localCache;

        if (displayData.length === 0) {
            els.container.innerHTML = '<p class="no-data">暂无符合条件的课程。</p>';
            return;
        }

        els.container.innerHTML = displayData.map(c => this.createCardHTML(c)).join('');
    },

    // 6. 过滤器初始化
    setupFilters() {
        const els = this.getElements();
        if (!els.filterDept) return;

        // 动态提取部门
        const depts = [...new Set(this.localCache.map(c => c.department))];
        els.filterDept.innerHTML = '<option value="">所有学院</option>';
        depts.forEach(d => {
            const opt = document.createElement('option');
            opt.value = opt.textContent = d;
            els.filterDept.appendChild(opt);
        });

        // 绑定搜索事件
        const triggerSearch = () => {
            const term = els.searchInput.value.toLowerCase().trim();
            const dept = els.filterDept.value;
            const credit = els.filterCredit.value;

            this.render(course => {
                const matchesSearch = course.name.toLowerCase().includes(term) || course.id.toLowerCase().includes(term);
                const matchesDept = !dept || course.department === dept;
                const matchesCredit = !credit || course.credits == credit;
                return matchesSearch && matchesDept && matchesCredit;
            });
        };

        els.searchBtn.addEventListener('click', triggerSearch);
        els.filterDept.addEventListener('change', triggerSearch);
        els.filterCredit.addEventListener('change', triggerSearch);
    },

    // 初始化入口
    init() {
        this.render();
    }
};

// 启动
document.addEventListener('DOMContentLoaded', () => CourseModule.init());