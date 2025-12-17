// ====================================
// 1. 模拟课程信息库数据 (保持不变)
// ====================================
const allCourses = [
    {
        id: 'CS101',
        name: 'Web编程技术',
        credits: 3.0,
        department: '计算机学院',
        teacher: '蔡树彬',
        intro: '主要采用HTML5+CSS3+JS技术实现前端开发，包含项目实战。',
        requirements: '需掌握C++或Java编程基础。'
    },
    {
        id: 'MA202',
        name: '高等数学 B',
        credits: 4.0,
        department: '数学与统计学院',
        teacher: '李四',
        intro: '微积分、线性代数等基础数学知识的深入学习和应用。',
        requirements: '无。'
    },
    {
        id: 'PH301',
        name: '大学物理',
        credits: 3.0,
        department: '物理学院',
        teacher: '王五',
        intro: '电磁学、光学和热学的基本原理与应用。',
        requirements: '需完成高等数学 B。'
    },
    {
        id: 'EL101',
        name: '大学英语（一）',
        credits: 2.0,
        department: '外国语学院',
        teacher: '赵六',
        intro: '基础听说读写能力的提升。',
        requirements: '无。'
    }
];

// ====================================
// 2. 页面元素获取 (保持不变)
// ====================================
const courseListContainer = document.getElementById('course-list');
const searchInput = document.getElementById('course-search-input');
const searchBtn = document.getElementById('search-btn');
const filterDepartment = document.getElementById('filter-department');
const filterCredit = document.getElementById('filter-credit');

// ====================================
// 3. 课程卡片生成函数 (关键修改点)
// ====================================

/**
 * 根据登录状态和课程数据生成课程卡片 HTML。
 * 解决“选修”按钮多余的问题。
 */
function createCourseCardHTML(course) {
    // 1. 从 localStorage 获取登录状态 (模拟用户中心逻辑)
    // 假设登录后会将用户信息存入 localStorage 的 'currentUser' 键
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    const isLoggedIn = currentUser !== null;
    const isStudent = isLoggedIn && currentUser.role === 'student';

    // 2. 根据状态决定按钮文案和行为
    let btnText = "查看详情";
    let btnAction = `alert('课程 ID: ${course.id}\\n课程名称: ${course.name}\\n\\n${course.intro}\\n\\n提示：请先登录后再进行选课操作。')`;
    let btnClass = "btn-secondary";

    if (isStudent) {
        // 如果是已登录的学生，文案改为“立即选修”，并模拟跳转
        btnText = "立即选修";
        btnClass = "btn-primary";
        btnAction = `alert('正在前往选课系统处理 [${course.name}] 的选修请求...'); window.location.href='../student_side/course_selection.html'`;
    } else if (isLoggedIn) {
        // 如果是已登录的其他角色（如老师、管理员）
        btnText = "查看课程详情";
        btnAction = `alert('您当前的身份是 [${currentUser.role}]，不具备学生选课权限。')`;
    }

    return `
        <article class="course-card">
            <h3>${course.name} <span style="font-size: 0.8em; color: #999;">(${course.id})</span></h3>
            <p class="course-meta">
                <span class="credit-info"><i class="fas fa-certificate"></i> ${course.credits.toFixed(1)} 学分</span> | 
                <span class="teacher-info"><i class="fas fa-user-tie"></i> 授课教师：${course.teacher}</span>
            </p>
            <p class="course-intro">${course.intro}</p>
            <p class="course-requirements">
                <strong>选课要求：</strong> ${course.requirements}
            </p>
            <button class="btn ${btnClass}" onclick="${btnAction}">${btnText}</button>
        </article>
    `;
}

/**
 * 渲染课程列表 (保持不变)
 */
function renderCourses(coursesToRender) {
    if (!courseListContainer) return;
    if (coursesToRender.length === 0) {
        courseListContainer.innerHTML = '<p style="text-align:center; grid-column: 1/-1;">抱歉，没有找到符合条件的课程。</p>';
        return;
    }
    const html = coursesToRender.map(createCourseCardHTML).join('');
    courseListContainer.innerHTML = html;
}

// ====================================
// 4. 搜索与筛选逻辑 (保持不变)
// ====================================

function filterAndSearchCourses() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const selectedDepartment = filterDepartment.value;
    const selectedCredit = filterCredit.value;

    let selectedCreditNumber = selectedCredit !== '' ? parseFloat(selectedCredit) : null;

    const filteredCourses = allCourses.filter(course => {
        const matchesSearch = course.name.toLowerCase().includes(searchTerm) || 
                              course.id.toLowerCase().includes(searchTerm);
        const matchesDepartment = selectedDepartment === '' || course.department === selectedDepartment;
        const matchesCredit = selectedCredit === '' || course.credits === selectedCreditNumber;
        return matchesSearch && matchesDepartment && matchesCredit;
    });

    renderCourses(filteredCourses);
}

// ====================================
// 5. 事件监听器和初始化
// ====================================

function initializeFilters() {
    if (!filterDepartment) return;
    
    const departments = [...new Set(allCourses.map(course => course.department))];
    departments.forEach(dept => {
        const option = document.createElement('option');
        option.value = dept;
        option.textContent = dept;
        filterDepartment.appendChild(option);
    });
    
    searchBtn.addEventListener('click', filterAndSearchCourses);
    searchInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') filterAndSearchCourses();
    });
    filterDepartment.addEventListener('change', filterAndSearchCourses);
    filterCredit.addEventListener('change', filterAndSearchCourses);
}

document.addEventListener('DOMContentLoaded', () => {
    initializeFilters();
    renderCourses(allCourses);
});