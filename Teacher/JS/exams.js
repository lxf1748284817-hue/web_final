// 考试管理功能 (IndexedDB 版)
let courses = [];
let homeworkAssignments = [];
let examAssignments = [];
let submissions = [];

// 导出初始化函数
window.initExamsPage = initPage;

async function initPage() {
    try {
        // 等待courseManager可用
        let retries = 0;
        while (!window.courseManager && retries < 10) {
            await new Promise(resolve => setTimeout(resolve, 100));
            retries++;
        }
        
        if (!window.courseManager) {
            throw new Error('courseManager未初始化');
        }
        
        // 从IndexedDB加载课程数据
        courses = await window.courseManager.getPublishedCourses();
        // 从IndexedDB加载作业、考试和提交数据
        homeworkAssignments = await window.gradesManager.getHomeworkAssignments();
        examAssignments = await window.gradesManager.getExamAssignments();
        submissions = await window.gradesManager.getSubmissions();
        
        initCourseSelects();
        renderHomeworkList();
        renderExamList();
        renderGradingList();
        bindEvents();
        
        // 监听课程数据更新事件
        window.addEventListener('courseDataUpdated', async function() {
            courses = await window.courseManager.getPublishedCourses();
            initCourseSelects();
        });
    } catch (error) {
        console.error('初始化页面失败:', error);
        showNotification('页面初始化失败，请刷新页面重试', 'error');
    }
}

// 绑定事件
function bindEvents() {
    // 标签页切换
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            this.classList.add('active');
            document.getElementById(this.dataset.tab).classList.add('active');
        });
    });
    
    // 作业表单提交
    document.getElementById('homeworkForm').addEventListener('submit', function(e) {
        e.preventDefault();
        createHomework();
    });
    
    // 考试表单提交
    document.getElementById('examForm').addEventListener('submit', function(e) {
        e.preventDefault();
        createExam();
    });
    
    // 关闭模态框
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
}

// 初始化课程选择框
function initCourseSelects() {
    const hwCourseSelect = document.getElementById('hwCourse');
    const examCourseSelect = document.getElementById('examCourse');
    
    // 清空现有选项
    if (hwCourseSelect) hwCourseSelect.innerHTML = '<option value="">选择课程</option>';
    if (examCourseSelect) examCourseSelect.innerHTML = '<option value="">选择课程</option>';
    
    // 添加动态课程选项
    courses.forEach(course => {
        const option = document.createElement('option');
        option.value = course.id;
        option.textContent = `${course.name} (${course.code})`;
        if (hwCourseSelect) hwCourseSelect.appendChild(option.cloneNode(true));
        if (examCourseSelect) examCourseSelect.appendChild(option);
    });
}

// 创建作业
async function createHomework() {
    try {
        console.log('📝 开始创建作业...');
        
        const title = document.getElementById('hwTitle').value;
        const courseId = document.getElementById('hwCourse').value;
        const description = document.getElementById('hwDescription').value;
        const deadline = document.getElementById('hwDeadline').value;
        
        console.log('📋 收集到的作业数据:', { title, courseId, description, deadline });
        
        const courseName = courses.find(c => c.id == courseId)?.name || '';
        
        const homework = {
            id: Date.now(),
            title: title,
            courseId: courseId,
            courseName: courseName,
            description: description,
            deadline: deadline,
            createTime: new Date().toLocaleString(),
            submissions: 0,
            graded: 0
        };
        
        console.log('💾 准备保存的作业数据:', homework);
        
        homeworkAssignments.push(homework);
        
        // 保存到IndexedDB
        console.log('🔄 调用数据库保存作业...');
        await window.gradesManager.saveHomeworkAssignment(homework);
        console.log('✅ 作业保存完成');
        
        // 重置表单
        document.getElementById('homeworkForm').reset();
        renderHomeworkList();
        
        // 模拟添加学生提交记录（实际应由学生端提交）
        addMockSubmission(homework.id, 'homework');
        
        console.log('🎉 作业创建流程完成');
    } catch (error) {
        console.error('❌ 创建作业失败:', error);
    }
}

// 创建考试
async function createExam() {
    const title = document.getElementById('examTitle').value;
    const courseId = document.getElementById('examCourse').value;
    const description = document.getElementById('examDescription').value;
    const startTime = document.getElementById('examStart').value;
    const endTime = document.getElementById('examEnd').value;
    const duration = document.getElementById('examDuration').value;
    
    const courseName = courses.find(c => c.id == courseId)?.name || '';
    
    const exam = {
        id: Date.now(),
        title: title,
        courseId: courseId,
        courseName: courseName,
        description: description,
        startTime: startTime,
        endTime: endTime,
        duration: duration,
        createTime: new Date().toLocaleString(),
        submissions: 0,
        graded: 0
    };
    
    examAssignments.push(exam);
    
    // 保存到IndexedDB
    await window.gradesManager.saveExamAssignment(exam);
    
    // 重置表单
    document.getElementById('examForm').reset();
    renderExamList();
    
    // 模拟添加学生提交记录（实际应由学生端提交）
    addMockSubmission(exam.id, 'exam');
}

// 模拟学生提交
async function addMockSubmission(assignmentId, type) {
    const mockStudents = [
        { id: 1001, name: '张三', studentId: '20240001' },
        { id: 1002, name: '李四', studentId: '20240002' },
        { id: 1003, name: '王五', studentId: '20240003' },
        { id: 1004, name: '赵六', studentId: '20240004' },
        { id: 1005, name: '钱七', studentId: '20240005' }
    ];
    
    for (const student of mockStudents) {
        const submission = {
            id: Date.now() + Math.random(),
            assignmentId: assignmentId,
            assignmentType: type,
            studentId: student.studentId, // 使用学号而不是ID
            studentName: student.name,
            submitTime: new Date().toLocaleString('zh-CN'),
            status: '已提交',
            score: null,
            comment: '',
            graded: false
        };
        
        submissions.push(submission);
        // 保存到IndexedDB
        await window.gradesManager.saveSubmission(submission);
    }
}

// 渲染作业列表
function renderHomeworkList() {
    const list = document.getElementById('homeworkList');
    list.innerHTML = '';
    
    homeworkAssignments.forEach(hw => {
        const item = document.createElement('div');
        item.className = 'assignment-item';
        item.innerHTML = `
            <div class="assignment-header">
                <div class="assignment-title">${hw.title}</div>
                <span class="assignment-status">
                    已提交: ${hw.submissions} | 已批改: ${hw.graded}
                </span>
            </div>
            <div class="assignment-meta">
                <span>课程: ${hw.courseName}</span>
                <span>截止时间: ${formatDateTime(hw.deadline)}</span>
                <span>发布时间: ${hw.createTime}</span>
            </div>
            <div class="assignment-description">${hw.description}</div>
            <div class="assignment-actions">
                <button onclick="viewSubmissions(${hw.id}, 'homework')">查看提交</button>
                <button onclick="gradeAssignment(${hw.id}, 'homework')">批改</button>
                <button onclick="deleteAssignment(${hw.id}, 'homework')">删除</button>
            </div>
        `;
        list.appendChild(item);
    });
}

// 渲染考试列表
function renderExamList() {
    const list = document.getElementById('examList');
    list.innerHTML = '';
    
    examAssignments.forEach(exam => {
        const item = document.createElement('div');
        item.className = 'assignment-item';
        item.innerHTML = `
            <div class="assignment-header">
                <div class="assignment-title">${exam.title}</div>
                <span class="assignment-status">
                    已提交: ${exam.submissions} | 已批改: ${exam.graded}
                </span>
            </div>
            <div class="assignment-meta">
                <span>课程: ${exam.courseName}</span>
                <span>开始时间: ${formatDateTime(exam.startTime)}</span>
                <span>结束时间: ${formatDateTime(exam.endTime)}</span>
                <span>时长: ${exam.duration}分钟</span>
            </div>
            <div class="assignment-description">${exam.description}</div>
            <div class="assignment-actions">
                <button onclick="viewSubmissions(${exam.id}, 'exam')">查看提交</button>
                <button onclick="gradeAssignment(${exam.id}, 'exam')">批改</button>
                <button onclick="deleteAssignment(${exam.id}, 'exam')">删除</button>
            </div>
        `;
        list.appendChild(item);
    });
}

// 渲染批改列表
function renderGradingList() {
    const list = document.getElementById('gradingList');
    list.innerHTML = '';
    
    // 获取未批改的提交
    const ungradedSubmissions = submissions.filter(s => !s.graded);
    
    if (ungradedSubmissions.length === 0) {
        list.innerHTML = '<p class="no-items">暂无待批改作业</p>';
        return;
    }
    
    ungradedSubmissions.forEach(sub => {
        const assignment = sub.assignmentType === 'homework' 
            ? homeworkAssignments.find(h => h.id === sub.assignmentId)
            : examAssignments.find(e => e.id === sub.assignmentId);
        
        if (!assignment) return;
        
        const item = document.createElement('div');
        item.className = 'grading-item';
        item.onclick = () => openGradingModal(sub.id);
        item.innerHTML = `
            <div class="assignment-title">${assignment.title}</div>
            <div class="assignment-meta">
                <span>学生: ${sub.studentName}</span>
                <span>提交时间: ${sub.submitTime}</span>
                <span>类型: ${sub.assignmentType === 'homework' ? '作业' : '考试'}</span>
            </div>
            <div>状态: <span style="color:#e74c3c">待批改</span></div>
        `;
        list.appendChild(item);
    });
}

// 打开批改模态框
function openGradingModal(submissionId) {
    const submission = submissions.find(s => s.id === submissionId);
    if (!submission) return;
    
    const assignment = submission.assignmentType === 'homework'
        ? homeworkAssignments.find(h => h.id === submission.assignmentId)
        : examAssignments.find(e => e.id === submission.assignmentId);
    
    const modal = document.getElementById('gradingModal');
    
    // 根据提交类型更新标题
    const modalTitle = modal.querySelector('h3');
    const assignmentType = submission.assignmentType === 'homework' ? '作业' : '考试';
    modalTitle.innerHTML = `<i class="fas fa-check-circle"></i> 批改${assignmentType}`;
    
    // 更新学生信息
    document.getElementById('studentName').textContent = submission.studentName;
    document.getElementById('studentId').textContent = submission.studentId || '未知';
    document.getElementById('studentClass').textContent = getStudentClass(submission.studentId) || '未知';
    document.getElementById('submitTime').textContent = submission.submitTime;
    
    // 更新作业/考试信息
    if (assignment) {
        document.getElementById('assignmentTitle').textContent = assignment.title;
        document.getElementById('courseName').textContent = assignment.courseName;
        
        // 根据类型设置不同的时间标签
        const deadlineLabel = submission.assignmentType === 'homework' ? '截止时间:' : '考试时间:';
        document.querySelector('.assignment-details .info-row:nth-child(3) label').textContent = deadlineLabel;
        
        if (submission.assignmentType === 'homework') {
            document.getElementById('deadline').textContent = assignment.deadline ? formatDateTime(assignment.deadline) : '无截止日期';
        } else {
            const examTime = `${formatDateTime(assignment.startTime)} - ${formatDateTime(assignment.endTime)}`;
            document.getElementById('deadline').textContent = examTime || '无时间限制';
        }
        
        document.getElementById('maxScore').textContent = assignment.maxScore || 100 + ' 分';
    }
    
    // 更新文件区域标题
    const filesSectionTitle = document.querySelector('.homework-files-section h4');
    const assignmentTypeText = submission.assignmentType === 'homework' ? '作业' : '考试';
    filesSectionTitle.innerHTML = `<i class="fas fa-file-alt"></i> ${assignmentTypeText}文件`;
    
    // 更新无文件提示
    const noFilesText = document.querySelector('#noFiles p');
    noFilesText.textContent = `该学生未上传${assignmentTypeText}文件`;
    
    // 更新作业文件
    updateHomeworkFiles(submission, assignment);
    
    // 清空评分表单
    document.getElementById('gradeScore').value = '';
    document.getElementById('gradeComment').value = '';
    
    // 显示模态框
    modal.style.display = 'flex';
    modal.dataset.submissionId = submissionId;
    
    // 绑定模态框事件
    bindModalEvents();
}

// 获取学生班级信息（模拟数据）
function getStudentClass(studentId) {
    const classMap = {
        '20240001': '计算机科学1班',
        '20240002': '计算机科学1班',
        '20240003': '计算机科学2班',
        '20240004': '计算机科学2班',
        '20240005': '软件工程1班'
    };
    return classMap[studentId] || '未知班级';
}

// 更新作业文件显示
function updateHomeworkFiles(submission, assignment) {
    const filesContainer = document.getElementById('homeworkFiles');
    const noFilesElement = document.getElementById('noFiles');
    
    filesContainer.innerHTML = '';
    
    // 模拟学生提交的作业文件（实际应用中应从数据库获取）
    const mockFiles = generateMockHomeworkFiles(submission, assignment);
    
    if (mockFiles.length === 0) {
        noFilesElement.style.display = 'block';
        return;
    }
    
    noFilesElement.style.display = 'none';
    
    mockFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <div class="file-icon">
                <i class="${getFileIcon(file.type)}"></i>
            </div>
            <div class="file-info">
                <div class="file-name">${file.name}</div>
                <div class="file-size">${formatFileSize(file.size)}</div>
            </div>
            <button class="btn-download-file" data-file-index="${index}">
                <i class="fas fa-download"></i> 下载
            </button>
        `;
        
        // 绑定下载事件
        const downloadBtn = fileItem.querySelector('.btn-download-file');
        downloadBtn.addEventListener('click', function() {
            downloadHomeworkFile(file);
        });
        
        filesContainer.appendChild(fileItem);
    });
}

// 生成模拟的作业/考试文件数据
function generateMockHomeworkFiles(submission, assignment) {
    if (!assignment) return [];
    
    const fileTypes = ['doc', 'pdf', 'zip', 'txt'];
    const fileExtensions = {
        'doc': '.docx',
        'pdf': '.pdf',
        'zip': '.zip',
        'txt': '.txt'
    };
    
    const randomType = fileTypes[Math.floor(Math.random() * fileTypes.length)];
    const assignmentType = submission.assignmentType === 'homework' ? '作业' : '考试';
    const fileName = `${assignment.title}_${submission.studentName}_${assignmentType}${fileExtensions[randomType]}`;
    
    return [{
        name: fileName,
        type: randomType,
        size: Math.floor(Math.random() * 5 * 1024 * 1024) + 100 * 1024, // 100KB - 5MB
        content: generateFileContent(assignment, submission)
    }];
}

// 获取文件图标
function getFileIcon(fileType) {
    const icons = {
        'doc': 'fas fa-file-word',
        'pdf': 'fas fa-file-pdf',
        'zip': 'fas fa-file-archive',
        'txt': 'fas fa-file-alt'
    };
    return icons[fileType] || 'fas fa-file';
}

// 生成文件内容
function generateFileContent(assignment, submission) {
    const timestamp = new Date().toLocaleString('zh-CN');
    const assignmentType = submission.assignmentType === 'homework' ? '作业' : '考试';
    const assignmentTypeText = submission.assignmentType === 'homework' ? '作业' : '考试';
    
    return `${assignmentType}提交内容

学生: ${submission.studentName}
学号: ${submission.studentId}
${assignmentType}: ${assignment.title}
课程: ${assignment.courseName}
提交时间: ${submission.submitTime}

--- ${assignmentType}内容 ---

这是${submission.studentName}提交的${assignmentTypeText}内容。
${assignmentTypeText}要求: ${assignment.description}

${generateRandomHomeworkContent(assignmentTypeText)}

--- ${assignmentType}内容结束 ---

生成时间: ${timestamp}`;
}

// 生成随机作业/考试内容
function generateRandomHomeworkContent(assignmentType) {
    const homeworkContents = [
        '本作业完成了所有要求的算法实现，包括排序、查找等基本操作。代码结构清晰，注释完整。',
        '报告详细分析了数据库设计原理，包含了ER图、关系模式等完整内容。',
        '网络协议分析实验完成，包含了数据包捕获、协议解析和结果分析。',
        '程序实现了所有功能模块，测试用例覆盖全面，性能良好。',
        '论文综述了相关领域的研究进展，提出了创新性的观点和解决方案。'
    ];
    
    const examContents = [
        '本次考试完成了所有题目，涵盖了基础知识、应用能力和综合分析的多个方面。',
        '试卷答案详细，逻辑清晰，体现了对课程内容的深入理解和掌握。',
        '考试过程中严格遵守时间安排，答题规范，书写工整。',
        '所有试题均按要求完成，答案准确，解题步骤清晰。',
        '考试表现良好，展示了扎实的理论基础和实践应用能力。'
    ];
    
    const contents = assignmentType === '作业' ? homeworkContents : examContents;
    return contents[Math.floor(Math.random() * contents.length)];
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 下载作业文件
function downloadHomeworkFile(file) {
    try {
        // 创建Blob对象
        const blob = new Blob([file.content], { type: getMimeType(file.type) });
        const url = URL.createObjectURL(blob);
        
        // 创建下载链接
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        
        // 清理资源
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
        
        showNotification(`开始下载: ${file.name}`, 'success');
        
    } catch (error) {
        console.error('文件下载失败:', error);
        showNotification(`下载失败: ${file.name}`, 'error');
    }
}

// 获取MIME类型
function getMimeType(fileType) {
    const mimeTypes = {
        'doc': 'application/msword',
        'pdf': 'application/pdf',
        'zip': 'application/zip',
        'txt': 'text/plain'
    };
    return mimeTypes[fileType] || 'text/plain';
}

// 绑定模态框事件
function bindModalEvents() {
    // 关闭按钮
    const closeBtn = document.querySelector('.close-modal');
    const cancelBtn = document.getElementById('cancelGrading');
    const submitBtn = document.getElementById('submitGrade');
    
    if (closeBtn) {
        closeBtn.onclick = closeGradingModal;
    }
    
    if (cancelBtn) {
        cancelBtn.onclick = closeGradingModal;
    }
    
    if (submitBtn) {
        submitBtn.onclick = submitGrade;
    }
    
    // 点击模态框外部关闭
    const modal = document.getElementById('gradingModal');
    modal.onclick = function(e) {
        if (e.target === modal) {
            closeGradingModal();
        }
    };
    
    // ESC键关闭
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeGradingModal();
        }
    });
    
    // 添加拖拽和调节大小功能
    initModalDragAndResize();
}

// 初始化模态框拖拽和调节大小功能
function initModalDragAndResize() {
    const modal = document.getElementById('gradingModal');
    const modalContent = modal.querySelector('.modal-content');
    const modalHeader = modal.querySelector('.modal-header.draggable');
    const resizeHandle = modal.querySelector('.resize-handle');
    
    if (!modalHeader || !resizeHandle) return;
    
    let isDragging = false;
    let isResizing = false;
    let startX, startY, startWidth, startHeight, startLeft, startTop;
    
    // 拖拽功能
    modalHeader.addEventListener('mousedown', function(e) {
        if (e.target.classList.contains('close-modal') || 
            e.target.classList.contains('resize-handle') ||
            e.target.closest('.close-modal') ||
            e.target.closest('.resize-handle')) {
            return;
        }
        
        isDragging = true;
        modalContent.classList.add('dragging');
        startX = e.clientX;
        startY = e.clientY;
        startLeft = parseInt(getComputedStyle(modalContent).left) || 0;
        startTop = parseInt(getComputedStyle(modalContent).top) || 0;
        
        document.addEventListener('mousemove', onDrag);
        document.addEventListener('mouseup', stopDrag);
    });
    
    function onDrag(e) {
        if (!isDragging) return;
        
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        
        const newLeft = startLeft + dx;
        const newTop = startTop + dy;
        
        // 限制在视窗范围内
        const maxLeft = window.innerWidth - modalContent.offsetWidth;
        const maxTop = window.innerHeight - modalContent.offsetHeight;
        
        modalContent.style.left = Math.max(0, Math.min(newLeft, maxLeft)) + 'px';
        modalContent.style.top = Math.max(0, Math.min(newTop, maxTop)) + 'px';
        modalContent.style.position = 'fixed';
        modalContent.style.margin = '0';
    }
    
    function stopDrag() {
        isDragging = false;
        modalContent.classList.remove('dragging');
        document.removeEventListener('mousemove', onDrag);
        document.removeEventListener('mouseup', stopDrag);
    }
    
    // 调节大小功能
    resizeHandle.addEventListener('mousedown', function(e) {
        e.preventDefault();
        isResizing = true;
        modalContent.classList.add('resizing');
        startX = e.clientX;
        startY = e.clientY;
        startWidth = parseInt(getComputedStyle(modalContent).width);
        startHeight = parseInt(getComputedStyle(modalContent).height);
        
        document.addEventListener('mousemove', onResize);
        document.addEventListener('mouseup', stopResize);
    });
    
    function onResize(e) {
        if (!isResizing) return;
        
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        
        const newWidth = Math.max(500, startWidth + dx); // 最小宽度500px
        const newHeight = Math.max(400, startHeight + dy); // 最小高度400px
        
        // 限制最大尺寸
        const maxWidth = window.innerWidth - 40;
        const maxHeight = window.innerHeight - 40;
        
        modalContent.style.width = Math.min(newWidth, maxWidth) + 'px';
        modalContent.style.height = Math.min(newHeight, maxHeight) + 'px';
        modalContent.style.maxWidth = 'none';
        modalContent.style.maxHeight = 'none';
    }
    
    function stopResize() {
        isResizing = false;
        modalContent.classList.remove('resizing');
        document.removeEventListener('mousemove', onResize);
        document.removeEventListener('mouseup', stopResize);
    }
}

// 关闭批改模态框
function closeGradingModal() {
    const modal = document.getElementById('gradingModal');
    modal.style.display = 'none';
}

// 提交批改
async function submitGrade() {
    const modal = document.getElementById('gradingModal');
    const submissionId = modal.dataset.submissionId;
    const score = document.getElementById('gradeScore').value;
    const comment = document.getElementById('gradeComment').value;
    
    if (!score) {
        showNotification('请填写分数', 'warning');
        document.getElementById('gradeScore').focus();
        return;
    }
    
    if (score < 0 || score > 100) {
        showNotification('分数必须在0-100之间', 'warning');
        document.getElementById('gradeScore').focus();
        return;
    }
    
    const submission = submissions.find(s => s.id == submissionId);
    if (submission) {
        submission.score = parseInt(score);
        submission.comment = comment;
        submission.graded = true;
        submission.gradeTime = new Date().toLocaleString('zh-CN');
        
        // 更新作业/考试的批改数量
        let assignmentToUpdate = null;
        if (submission.assignmentType === 'homework') {
            assignmentToUpdate = homeworkAssignments.find(h => h.id === submission.assignmentId);
            if (assignmentToUpdate) assignmentToUpdate.graded++;
        } else {
            assignmentToUpdate = examAssignments.find(e => e.id === submission.assignmentId);
            if (assignmentToUpdate) assignmentToUpdate.graded++;
        }
        
        try {
            // 保存到IndexedDB
            await window.gradesManager.saveSubmission(submission);
            if (assignmentToUpdate) {
                if (submission.assignmentType === 'homework') {
                    await window.gradesManager.saveHomeworkAssignment(assignmentToUpdate);
                } else {
                    await window.gradesManager.saveExamAssignment(assignmentToUpdate);
                }
            }
            
            closeGradingModal();
            showNotification(`批改完成！${submission.studentName} 得分: ${score}分`, 'success');
            
            // 刷新列表
            renderGradingList();
            renderHomeworkList();
            renderExamList();
            
        } catch (error) {
            console.error('保存批改结果失败:', error);
            showNotification('批改保存失败，请重试', 'error');
        }
    }
}

// 查看提交情况
function viewSubmissions(assignmentId, type) {
    const assignmentSubmissions = submissions.filter(s => 
        s.assignmentId === assignmentId && s.assignmentType === type
    );
    
    let message = `提交情况 (共${assignmentSubmissions.length}人):\n\n`;
    assignmentSubmissions.forEach(sub => {
        message += `${sub.studentName}: ${sub.status} ${sub.graded ? `(已批改: ${sub.score}分)` : '(未批改)'}\n`;
    });
    
    alert(message);
}

// 批改作业/考试
function gradeAssignment(assignmentId, type) {
    const ungradedSubmissions = submissions.filter(s => 
        s.assignmentId === assignmentId && 
        s.assignmentType === type && 
        !s.graded
    );
    
    if (ungradedSubmissions.length === 0) {
        alert('所有提交都已批改完成');
        return;
    }
    
    // 切换到批改标签页
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    document.querySelector('.tab-btn[data-tab="grading"]').classList.add('active');
    document.getElementById('grading').classList.add('active');
    
    // 滚动到顶部
    window.scrollTo(0, 0);
}

// 删除作业/考试
async function deleteAssignment(assignmentId, type) {
    if (!confirm('确定要删除吗？')) return;
    
    try {
        if (type === 'homework') {
            homeworkAssignments = homeworkAssignments.filter(h => h.id !== assignmentId);
            // 从IndexedDB中删除该作业
            await window.gradesManager.deleteHomeworkAssignment(assignmentId);
            renderHomeworkList();
        } else {
            examAssignments = examAssignments.filter(e => e.id !== assignmentId);
            // 从IndexedDB中删除该考试
            await window.gradesManager.deleteExamAssignment(assignmentId);
            renderExamList();
        }
        
        // 删除相关提交记录
        submissions = submissions.filter(s => s.assignmentId !== assignmentId);
        // 从IndexedDB中删除相关提交记录
        await window.gradesManager.deleteSubmissionsByAssignment(assignmentId);
        renderGradingList();
        
        showNotification('删除成功', 'success');
    } catch (error) {
        console.error('删除作业/考试失败:', error);
        showNotification('删除失败，请重试', 'error');
    }
}

// 格式化日期时间
function formatDateTime(dateTimeStr) {
    if (!dateTimeStr) return '';
    const date = new Date(dateTimeStr);
    return date.toLocaleString('zh-CN');
}

// 显示通知
function showNotification(message, type = 'info') {
    // 移除现有通知
    document.querySelectorAll('.notification').forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button class="close-notification">&times;</button>
    `;
    
    // 添加样式
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        z-index: 2000;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        justify-content: space-between;
        animation: slideIn 0.3s ease-out;
    `;
    
    // 根据类型设置背景色
    const bgColors = {
        'success': '#27ae60',
        'error': '#e74c3c',
        'warning': '#f39c12',
        'info': '#3498db'
    };
    notification.style.backgroundColor = bgColors[type] || '#3498db';
    
    document.body.appendChild(notification);
    
    // 关闭按钮事件
    notification.querySelector('.close-notification').addEventListener('click', function() {
        notification.remove();
    });
    
    // 自动消失
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
    
    // 添加动画样式
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            .close-notification {
                background: none;
                border: none;
                color: white;
                font-size: 1.2rem;
                cursor: pointer;
                margin-left: 10px;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
        `;
        document.head.appendChild(style);
    }
}