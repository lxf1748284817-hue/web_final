// 课程管理功能 (IndexedDB 兼容版)
document.addEventListener('DOMContentLoaded', function() {
    // 初始化课程数据
    let courses = [];
    let currentEditCourseId = null;
    
    // DOM元素
    const coursesList = document.querySelector('.courses-list');
    const emptyState = document.getElementById('emptyState');
    const addCourseBtn = document.getElementById('addCourseBtn');
    const createFirstCourseBtn = document.getElementById('createFirstCourseBtn');
    const courseDetailModal = document.getElementById('courseDetailModal');
    const coursePreviewModal = document.getElementById('coursePreviewModal');
    const courseForm = document.getElementById('courseForm');
    const filterTabs = document.querySelectorAll('.filter-tab');
    const courseSearch = document.getElementById('courseSearch');
    const closeModalBtns = document.querySelectorAll('.close-modal');
    const previewCourseBtn = document.getElementById('previewCourseBtn');
    const saveDraftBtn = document.getElementById('saveDraftBtn');
    const publishCourseBtn = document.getElementById('publishCourseBtn');
    const descCharCount = document.getElementById('descCharCount');
    const courseDescription = document.getElementById('courseDescription');
    
    // 图片上传相关
    const bannerUploadArea = document.getElementById('bannerUploadArea');
    const bannerImageInput = document.getElementById('bannerImage');
    const bannerPreview = document.getElementById('bannerPreview');
    const galleryUploadArea = document.getElementById('galleryUploadArea');
    const galleryImagesInput = document.getElementById('galleryImages');
    const galleryPreview = document.getElementById('galleryPreview');
    
    // 模态框关闭函数
    function closeAllModals() {
        courseDetailModal.classList.remove('active');
        coursePreviewModal.classList.remove('active');
    }
    
    function closePreviewModal() {
        coursePreviewModal.classList.remove('active');
    }
    
    let bannerImage = null;
    let galleryImages = [];
    
    // 初始化页面
    initPage();
    
    async function initPage() {
        try {
            // 确保统一数据库管理器已初始化
            if (!window.dbManager) {
                console.warn('数据库管理器未初始化，等待加载完成');
                setTimeout(initPage, 100);
                return;
            }
            
            // 初始化数据库
            await window.dbManager.init();
            
            // 从统一数据库加载课程数据
            courses = await window.dbManager.getAll('courses');
            console.log('从IndexedDB加载课程数据:', courses.length, '门课程');
            
            // 如果本地没有课程数据，显示空状态，但不触发数据重置
            if (courses.length === 0) {
                console.log('IndexedDB中无课程数据，显示空状态');
                // 不触发数据重新初始化，避免丢失用户数据
                // 用户可以通过点击"创建第一门课程"按钮来开始添加课程
            }
            
            // 渲染课程列表
            await renderCourses(courses);
            
            // 更新空状态显示
            updateEmptyState();
            
            // 设置事件监听器
            setupEventListeners();
            
            // 设置图片上传功能
            setupImageUpload();
            
            // 设置拖拽排序
            setupDragAndDrop();
            
    // 监听数据更新事件（仅在其他页面修改数据时刷新）
    window.addEventListener('courseDataUpdated', function(event) {
        console.log('检测到课程数据更新事件');
        // 只有在事件来自其他页面时才重新加载数据
        if (event.detail && event.detail.source !== 'courses') {
            window.dbManager.getAll('courses').then(updatedCourses => {
                courses = updatedCourses;
                
                // 根据当前筛选条件重新渲染
                const activeFilter = document.querySelector('.filter-tab.active')?.dataset.filter || 'all';
                const searchTerm = document.getElementById('courseSearch')?.value.trim().toLowerCase() || '';
                
                filterCourses(activeFilter, searchTerm);
                updateEmptyState();
            });
        }
    });
            
    // 监听页面可见性变化，确保数据同步
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            console.log('页面重新可见，刷新课程数据');
            window.dbManager.getAll('courses').then(updatedCourses => {
                courses = updatedCourses;
                renderCourses(courses);
                updateEmptyState();
            });
        }
    });
            
            // 监听页面关闭前保存数据
            window.addEventListener('beforeunload', function() {
                console.log('页面即将关闭，确保数据已保存');
            });
            
        } catch (error) {
            console.error('初始化页面失败:', error);
            showNotification('页面初始化失败，请刷新页面重试', 'error');
        }
    }
    
    async function renderCourses(coursesToRender) {
        coursesList.innerHTML = '';
        
        if (coursesToRender.length === 0) {
            emptyState.classList.add('show');
            return;
        }
        
        emptyState.classList.remove('show');
        
        // 异步创建课程卡片
        for (const course of coursesToRender) {
            const courseCard = await createCourseCard(course);
            coursesList.appendChild(courseCard);
        }
    }
    
    async function createCourseCard(course) {
        const card = document.createElement('div');
        card.className = 'course-card-list';
        card.dataset.id = course.id;
        
        // 状态徽章文本
        let statusText = '';
        let statusClass = '';
        if (course.status === 'published') {
            statusText = '已发布';
            statusClass = 'published';
        } else if (course.status === 'draft') {
            statusText = '草稿';
            statusClass = 'draft';
        } else {
            statusText = '已归档';
            statusClass = 'archived';
        }
        
        // 从数据库获取真实的作业和考试数量
        let homeworkCount = 0;
        let examCount = 0;
        
        try {
            if (window.gradesManager) {
                const homeworkAssignments = await window.gradesManager.getHomeworkAssignments();
                const examAssignments = await window.gradesManager.getExamAssignments();
                homeworkCount = homeworkAssignments.filter(hw => hw.courseId === course.id).length;
                examCount = examAssignments.filter(exam => exam.courseId === course.id).length;
            }
        } catch (error) {
            console.warn('获取作业考试数据失败:', error);
        }
        
        const totalAssignments = homeworkCount + examCount;
        const studentCount = Math.floor(Math.random() * 30) + 20; // 学生人数保持模拟
        
        card.innerHTML = `
            <div class="course-card-header">
                <div class="course-card-title">
                    <h3>${course.name}</h3>
                    <p class="course-card-code">${course.code} · ${course.class}</p>
                </div>
                <span class="course-status-badge ${statusClass}">${statusText}</span>
            </div>
            <p class="course-description">${course.description ? course.description.substring(0, 100) + (course.description.length > 100 ? '...' : '') : '暂无描述'}</p>
            <div class="course-meta">
                <div class="course-meta-item">
                    <span class="course-meta-label">学分</span>
                    <span class="course-meta-value">${course.credit}</span>
                </div>
                <div class="course-meta-item">
                    <span class="course-meta-label">学生</span>
                    <span class="course-meta-value">${studentCount}</span>
                </div>
                <div class="course-meta-item">
                    <span class="course-meta-label">作业</span>
                    <span class="course-meta-value">${totalAssignments}</span>
                </div>
                <div class="course-meta-item">
                    <span class="course-meta-label">学期</span>
                    <span class="course-meta-value">${course.semester}</span>
                </div>
            </div>
            <div class="course-actions-list">
                <button class="btn-course-action edit-course" data-id="${course.id}">编辑</button>
                <button class="btn-course-action primary manage-course" data-id="${course.id}">管理</button>
                ${course.status === 'published' ? 
                    `<button class="btn-course-action archive-course" data-id="${course.id}">归档</button>` : 
                    course.status === 'draft' ? 
                    `<button class="btn-course-action primary publish-course" data-id="${course.id}">发布</button>` :
                    `<button class="btn-course-action restore-course" data-id="${course.id}">恢复</button>`
                }
                <button class="btn-course-action delete delete-course" data-id="${course.id}">删除</button>
            </div>
        `;
        
        return card;
    }
    
    function updateEmptyState() {
        if (courses.length === 0) {
            emptyState.classList.add('show');
            return;
        } else {
            emptyState.classList.remove('show');
        }
    }
    

    
    function setupEventListeners() {
        // 添加课程按钮
        if (addCourseBtn) addCourseBtn.addEventListener('click', openCourseModal);
        if (createFirstCourseBtn) createFirstCourseBtn.addEventListener('click', openCourseModal);
        
        // 关闭模态框按钮
        if (closeModalBtns.length > 0) {
            closeModalBtns.forEach(btn => {
                // 预览模态框的关闭按钮使用独立的关闭函数
                if (btn.closest('#coursePreviewModal')) {
                    btn.addEventListener('click', closePreviewModal);
                } else {
                    btn.addEventListener('click', closeAllModals);
                }
            });
        }
        
        // 点击模态框外部关闭
        window.addEventListener('click', function(event) {
            if (event.target === courseDetailModal) {
                closeAllModals();
            }
            if (event.target === coursePreviewModal) {
                closePreviewModal();
            }
        });
        
        // 筛选标签
        filterTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                // 移除所有标签的active类
                filterTabs.forEach(t => t.classList.remove('active'));
                // 给当前标签添加active类
                this.classList.add('active');
                
                const filter = this.dataset.filter;
                filterCourses(filter);
            });
        });
        
    // 搜索功能
    if (courseSearch) {
        courseSearch.addEventListener('input', function() {
            const searchTerm = this.value.trim().toLowerCase();
            if (searchTerm) {
                filterCourses('all', searchTerm);
            } else {
                // 如果搜索框为空，显示所有课程
                filterCourses('all');
            }
        });
        
        // 添加键盘事件支持
        courseSearch.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                const searchTerm = this.value.trim().toLowerCase();
                if (searchTerm) {
                    filterCourses('all', searchTerm);
                }
            }
        });
    }
        
        // 课程描述字数统计
        courseDescription.addEventListener('input', function() {
            const length = this.value.length;
            descCharCount.textContent = length;
            
            if (length > 500) {
                descCharCount.style.color = '#e74c3c';
            } else if (length > 400) {
                descCharCount.style.color = '#f39c12';
            } else {
                descCharCount.style.color = '#95a5a6';
            }
        });
        
        // 表单提交 - 只处理表单直接提交，避免与按钮点击重复
        courseForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // 只有当不是通过保存草稿或发布按钮提交时才执行
            // 这样可以避免重复保存
            const target = e.submitter || e.originalTarget || document.activeElement;
            if (!target || (!target.id.includes('saveDraftBtn') && !target.id.includes('publishCourseBtn'))) {
                saveCourse('draft');
            }
        });
        
        // 预览课程按钮
        previewCourseBtn.addEventListener('click', previewCourse);
        
        // 保存草稿按钮
        saveDraftBtn.addEventListener('click', function() {
            saveCourse('draft');
        });
        
        // 发布课程按钮
        publishCourseBtn.addEventListener('click', function() {
            saveCourse('published');
        });
        
        // 委托事件监听器，处理动态生成的课程卡片按钮
        coursesList.addEventListener('click', function(e) {
            const target = e.target;
            const courseId = target.dataset.id;
            
            if (!courseId) return;
            
            if (target.classList.contains('edit-course')) {
                editCourse(courseId);
            } else if (target.classList.contains('manage-course')) {
                manageCourse(courseId);
            } else if (target.classList.contains('publish-course')) {
                publishCourseFromList(courseId);
            } else if (target.classList.contains('archive-course')) {
                archiveCourse(courseId);
            } else if (target.classList.contains('restore-course')) {
                restoreCourse(courseId);
            } else if (target.classList.contains('delete-course')) {
                deleteCourse(courseId);
            }
        });
    }
    
    function setupImageUpload() {
        // 横幅图片上传
        if (!bannerUploadArea || !bannerImageInput) return;
        
        bannerUploadArea.addEventListener('click', function() {
            bannerImageInput.click();
        });
        
        bannerUploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.style.borderColor = '#3498db';
            this.style.backgroundColor = '#f8f9fa';
        });
        
        bannerUploadArea.addEventListener('dragleave', function() {
            this.style.borderColor = '#bdc3c7';
            this.style.backgroundColor = 'transparent';
        });
        
        bannerUploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            this.style.borderColor = '#bdc3c7';
            this.style.backgroundColor = 'transparent';
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleBannerImage(files[0]);
            }
        });
        
        bannerImageInput.addEventListener('change', function() {
            if (this.files.length > 0) {
                handleBannerImage(this.files[0]);
            }
        });
        
        // 图库图片上传
        galleryUploadArea.addEventListener('click', function() {
            galleryImagesInput.click();
        });
        
        galleryUploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.style.borderColor = '#3498db';
            this.style.backgroundColor = '#f8f9fa';
        });
        
        galleryUploadArea.addEventListener('dragleave', function() {
            this.style.borderColor = '#bdc3c7';
            this.style.backgroundColor = 'transparent';
        });
        
        galleryUploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            this.style.borderColor = '#bdc3c7';
            this.style.backgroundColor = 'transparent';
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleGalleryImages(files);
            }
        });
        
        galleryImagesInput.addEventListener('change', function() {
            if (this.files.length > 0) {
                handleGalleryImages(this.files);
            }
        });
    }
    
    function handleBannerImage(file) {
        if (!file.type.startsWith('image/')) {
            alert('请上传图片文件');
            return;
        }
        
        if (file.size > 2 * 1024 * 1024) {
            alert('图片大小不能超过2MB');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            bannerImage = {
                name: file.name,
                data: e.target.result
            };
            
            bannerPreview.innerHTML = `
                <img src="${e.target.result}" alt="横幅图片预览">
                <button type="button" class="remove-image" id="removeBannerBtn">×</button>
            `;
            
            document.getElementById('removeBannerBtn').addEventListener('click', function() {
                bannerImage = null;
                bannerPreview.innerHTML = '';
            });
        };
        reader.readAsDataURL(file);
    }
    
    function handleGalleryImages(files) {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            if (!file.type.startsWith('image/')) {
                alert(`文件 "${file.name}" 不是图片，已跳过`);
                continue;
            }
            
            if (file.size > 2 * 1024 * 1024) {
                alert(`图片 "${file.name}" 大小超过2MB，已跳过`);
                continue;
            }
            
            const reader = new FileReader();
            reader.onload = (function(file) {
                return function(e) {
                    galleryImages.push({
                        id: Date.now() + Math.random(),
                        name: file.name,
                        data: e.target.result
                    });
                    
                    renderGalleryPreview();
                };
            })(file);
            reader.readAsDataURL(file);
        }
    }
    
    function renderGalleryPreview() {
        galleryPreview.innerHTML = '';
        
        galleryImages.forEach((image, index) => {
            const galleryItem = document.createElement('div');
            galleryItem.className = 'gallery-item';
            galleryItem.draggable = true;
            galleryItem.dataset.id = image.id;
            galleryItem.dataset.index = index;
            
            galleryItem.innerHTML = `
                <img src="${image.data}" alt="图片 ${index + 1}">
                <button type="button" class="remove-image" data-id="${image.id}">×</button>
            `;
            
            galleryPreview.appendChild(galleryItem);
        });
        
        // 添加删除事件监听器
        document.querySelectorAll('.gallery-item .remove-image').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.dataset.id;
                galleryImages = galleryImages.filter(img => img.id !== id);
                renderGalleryPreview();
            });
        });
        
        // 重新设置拖拽事件
        setupDragAndDrop();
    }
    
    function setupDragAndDrop() {
        const galleryItems = document.querySelectorAll('.gallery-item');
        
        galleryItems.forEach(item => {
            item.addEventListener('dragstart', function(e) {
                e.dataTransfer.setData('text/plain', this.dataset.id);
                this.classList.add('dragging');
            });
            
            item.addEventListener('dragend', function() {
                this.classList.remove('dragging');
            });
        });
        
        galleryPreview.addEventListener('dragover', function(e) {
            e.preventDefault();
            const draggingItem = document.querySelector('.gallery-item.dragging');
            const afterElement = getDragAfterElement(this, e.clientY);
            
            if (afterElement == null) {
                this.appendChild(draggingItem);
            } else {
                this.insertBefore(draggingItem, afterElement);
            }
        });
        
        galleryPreview.addEventListener('drop', function(e) {
            e.preventDefault();
            const id = e.dataTransfer.getData('text/plain');
            const draggedItem = document.querySelector(`[data-id="${id}"]`);
            
            // 更新galleryImages数组的顺序
            const newOrder = [];
            const items = this.querySelectorAll('.gallery-item');
            items.forEach(item => {
                const itemId = item.dataset.id;
                const image = galleryImages.find(img => img.id === itemId);
                if (image) newOrder.push(image);
            });
            
            galleryImages = newOrder;
        });
    }
    
    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.gallery-item:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
    
    function openCourseModal() {
        currentEditCourseId = null;
        resetForm();
        courseDetailModal.classList.add('active');
        document.getElementById('courseName').focus();
    }
    
    function editCourse(id) {
        const course = courses.find(c => c.id === id);
        if (!course) return;
        
        currentEditCourseId = id;
        
        // 填充表单数据
        document.getElementById('courseName').value = course.name;
        document.getElementById('courseCode').value = course.code;
        document.getElementById('courseCredit').value = course.credit;
        document.getElementById('courseClass').value = course.class;
        document.getElementById('courseSemester').value = course.semester;
        document.getElementById('courseDescription').value = course.description;
        document.getElementById('allowPreview').checked = course.allowPreview || false;
        
        // 更新字数统计
        const descLength = course.description.length;
        descCharCount.textContent = descLength;
        if (descLength > 500) {
            descCharCount.style.color = '#e74c3c';
        } else if (descLength > 400) {
            descCharCount.style.color = '#f39c12';
        } else {
            descCharCount.style.color = '#95a5a6';
        }
        
        // 加载图片
        if (course.bannerImage) {
            bannerImage = course.bannerImage;
            bannerPreview.innerHTML = `
                <img src="${course.bannerImage.data}" alt="横幅图片预览">
                <button type="button" class="remove-image" id="removeBannerBtn">×</button>
            `;
            
            document.getElementById('removeBannerBtn').addEventListener('click', function() {
                bannerImage = null;
                bannerPreview.innerHTML = '';
            });
        }
        
        if (course.galleryImages && course.galleryImages.length > 0) {
            galleryImages = [...course.galleryImages];
            renderGalleryPreview();
        }
        
        courseDetailModal.classList.add('active');
    }
    
    function resetForm() {
        courseForm.reset();
        bannerImage = null;
        galleryImages = [];
        bannerPreview.innerHTML = '';
        galleryPreview.innerHTML = '';
        descCharCount.textContent = '0';
        descCharCount.style.color = '#95a5a6';
    }
    

    
    async function filterCourses(filter, searchTerm = '') {
        let filteredCourses = courses;
        
        // 按状态筛选
        if (filter !== 'all') {
            filteredCourses = filteredCourses.filter(course => course.status === filter);
        }
        
        // 按搜索词筛选
        if (searchTerm) {
            filteredCourses = filteredCourses.filter(course => 
                (course.name && course.name.toLowerCase().includes(searchTerm)) || 
                (course.code && course.code.toLowerCase().includes(searchTerm)) ||
                (course.class && course.class.toLowerCase().includes(searchTerm))
            );
        }
        
        await renderCourses(filteredCourses);
        
        // 如果没有搜索结果，显示提示
        if (searchTerm && filteredCourses.length === 0) {
            showNoResultsMessage(searchTerm);
        }
    }
    
    function showNoResultsMessage(searchTerm) {
        // 移除现有的无结果消息
        const existingMessage = document.getElementById('noResultsMessage');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // 创建无结果消息
        const message = document.createElement('div');
        message.id = 'noResultsMessage';
        message.className = 'no-results-message';
        message.innerHTML = `
            <i class="fas fa-search"></i>
            <h3>没有找到匹配的课程</h3>
            <p>搜索词："${searchTerm}"</p>
            <p>尝试使用不同的关键词或检查拼写</p>
        `;
        
        // 添加到课程列表区域
        coursesList.appendChild(message);
        
        // 添加CSS样式（如果尚未添加）
        if (!document.querySelector('#no-results-styles')) {
            const style = document.createElement('style');
            style.id = 'no-results-styles';
            style.textContent = `
                .no-results-message {
                    text-align: center;
                    padding: 40px 20px;
                    color: #7f8c8d;
                    background: #f8f9fa;
                    border-radius: 8px;
                    margin: 20px 0;
                }
                .no-results-message i {
                    font-size: 3rem;
                    margin-bottom: 15px;
                    color: #bdc3c7;
                }
                .no-results-message h3 {
                    margin: 0 0 10px 0;
                    color: #2c3e50;
                }
                .no-results-message p {
                    margin: 5px 0;
                    font-size: 0.9rem;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    async function saveCourse(status = 'draft') {
        try {
            // 获取表单数据
            const courseName = document.getElementById('courseName').value.trim();
            const courseCode = document.getElementById('courseCode').value.trim();
            const courseCredit = document.getElementById('courseCredit').value;
            const courseClass = document.getElementById('courseClass').value.trim();
            const courseSemester = document.getElementById('courseSemester').value;
            const courseDescription = document.getElementById('courseDescription').value.trim();
            const allowPreview = document.getElementById('allowPreview').checked;
            
            // 验证必填字段
            if (!courseName || !courseCode || !courseDescription) {
                alert('请填写所有必填字段（课程名称、课程代码、课程简介）');
                return;
            }
            
            // 验证课程代码是否已存在（排除当前编辑的课程）
            const existingCourses = await window.dbManager.getAll('courses');
            const existingCourse = existingCourses.find(course => 
                course.code === courseCode && course.id !== currentEditCourseId
            );
            if (existingCourse) {
                alert(`课程代码 "${courseCode}" 已存在，请使用其他代码`);
                return;
            }
            
            // 创建课程对象
            const courseData = {
                id: currentEditCourseId || 'course_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 7),
                name: courseName,
                code: courseCode,
                credit: courseCredit,
                class: courseClass,
                semester: courseSemester,
                description: courseDescription,
                department: '计算机系', // 默认院系，确保与其他模块数据兼容
                status: status,
                allowPreview: allowPreview,
                bannerImage: bannerImage,
                galleryImages: [...galleryImages],
                updatedAt: new Date().toISOString()
            };
            
            if (!currentEditCourseId) {
                // 新课程
                courseData.createdAt = new Date().toISOString();
                console.log('创建新课程:', courseData);
            } else {
                console.log('更新课程:', courseData);
            }
            
            // 保存到IndexedDB
            if (!currentEditCourseId) {
                await window.dbManager.add('courses', courseData);
            } else {
                await window.dbManager.update('courses', courseData);
            }
            
            // 重新加载课程数据
            courses = await window.dbManager.getAll('courses');
            console.log('保存后课程数据:', courses.length, '门课程');
            
            // 重新渲染课程列表
            await renderCourses(courses);
            updateEmptyState();
            
            // 显示成功消息
            const isEdit = !!currentEditCourseId;
            showNotification(`课程"${courseName}"已成功${isEdit ? '更新' : '创建'}！`, 'success');
            
            // 重置编辑状态
            currentEditCourseId = null;
            
            // 关闭模态框
            closeAllModals();
            
            // 手动触发数据更新事件，确保其他页面能收到通知
            window.dispatchEvent(new CustomEvent('courseDataUpdated', {
                detail: { source: 'courses' }
            }));
            
        } catch (error) {
            console.error('保存课程失败:', error);
            showNotification(`保存课程失败: ${error.message}`, 'error');
        }
    }
    
    function previewCourse() {
        // 获取表单数据
        const courseName = document.getElementById('courseName').value.trim() || '示例课程名称';
        const courseCode = document.getElementById('courseCode').value.trim() || 'CS000';
        const courseClass = document.getElementById('courseClass').value.trim() || '计科200班';
        const courseSemester = document.getElementById('courseSemester').value || '2023-2024学年秋季';
        const courseCredit = document.getElementById('courseCredit').value || '3';
        const courseDescription = document.getElementById('courseDescription').value.trim() || '这里是课程简介，用于描述课程的主要内容、教学目标等信息。';
        
        // 生成预览HTML
        const previewHTML = `
            <div class="preview-banner">
                ${bannerImage ? `<img src="${bannerImage.data}" alt="课程横幅" style="width:100%;height:100%;object-fit:cover;">` : '<i class="fas fa-book-open"></i>'}
            </div>
            <div class="preview-content">
                <div class="preview-header">
                    <h2>${courseName}</h2>
                    <p>${courseCode} · ${courseClass} · ${courseSemester} · ${courseCredit}学分</p>
                </div>
                <div class="preview-section">
                    <h3>课程简介</h3>
                    <p class="preview-description">${courseDescription}</p>
                </div>
                ${galleryImages.length > 0 ? `
                <div class="preview-section">
                    <h3>课程图片轮播</h3>
                    <div class="carousel-container">
                        <div class="carousel-main">
                            <div class="carousel-track" style="transform: translateX(0);">
                                ${galleryImages.map((img, index) => `
                                    <div class="carousel-slide ${index === 0 ? 'active' : ''}" data-index="${index}">
                                        <img src="${img.data}" alt="课程图片 ${index + 1}" class="carousel-image">
                                    </div>
                                `).join('')}
                            </div>
                            ${galleryImages.length > 1 ? `
                            <button class="carousel-btn prev">❮</button>
                            <button class="carousel-btn next">❯</button>
                            ` : ''}
                        </div>
                        ${galleryImages.length > 1 ? `
                        <div class="carousel-thumbnails">
                            ${galleryImages.map((img, index) => `
                                <div class="thumbnail ${index === 0 ? 'active' : ''}" data-index="${index}">
                                    <img src="${img.data}" alt="缩略图 ${index + 1}">
                                </div>
                            `).join('')}
                        </div>
                        ` : ''}
                        <div class="carousel-counter">
                            <span class="current-slide">1</span> / <span class="total-slides">${galleryImages.length}</span>
                        </div>
                    </div>
                </div>
                ` : ''}
                <div class="preview-section">
                    <h3>课程状态</h3>
                    <p>${currentEditCourseId ? '编辑中（保持原状态）' : '新创建（草稿状态）'}</p>
                </div>
            </div>
        `;
        
        // 显示预览模态框
        document.querySelector('.course-preview').innerHTML = previewHTML;
        
        // 初始化轮播图功能
        if (galleryImages.length > 0) {
            initCarousel();
        }
        
        // 初始化模态框拖动功能
        initModalDrag(coursePreviewModal);
        
        // 初始化横幅图片自适应
        initBannerAdaptive();
        
        coursePreviewModal.classList.add('active');
    }
    
    function initCarousel() {
        const track = document.querySelector('.carousel-track');
        const slides = document.querySelectorAll('.carousel-slide');
        const thumbnails = document.querySelectorAll('.thumbnail');
        const prevBtn = document.querySelector('.carousel-btn.prev');
        const nextBtn = document.querySelector('.carousel-btn.next');
        const currentSlide = document.querySelector('.current-slide');
        
        if (!track || slides.length === 0) return;
        
        let currentIndex = 0;
        const totalSlides = slides.length;
        
        function updateCarousel() {
            // 移动轨道
            track.style.transform = `translateX(-${currentIndex * 100}%)`;
            
            // 更新当前幻灯片指示器
            currentSlide.textContent = currentIndex + 1;
            
            // 更新幻灯片激活状态
            slides.forEach((slide, index) => {
                slide.classList.toggle('active', index === currentIndex);
            });
            
            // 更新缩略图激活状态
            thumbnails.forEach((thumb, index) => {
                thumb.classList.toggle('active', index === currentIndex);
            });
        }
        
        // 上一张按钮
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
                updateCarousel();
            });
        }
        
        // 下一张按钮
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                currentIndex = (currentIndex + 1) % totalSlides;
                updateCarousel();
            });
        }
        
        // 缩略图点击
        thumbnails.forEach((thumb, index) => {
            thumb.addEventListener('click', () => {
                currentIndex = index;
                updateCarousel();
            });
        });
        
        // 键盘导航
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
                updateCarousel();
            } else if (e.key === 'ArrowRight') {
                currentIndex = (currentIndex + 1) % totalSlides;
                updateCarousel();
            }
        });
        
        // 自动轮播（可选）
        let autoPlayInterval;
        function startAutoPlay() {
            autoPlayInterval = setInterval(() => {
                currentIndex = (currentIndex + 1) % totalSlides;
                updateCarousel();
            }, 5000); // 5秒自动切换
        }
        
        function stopAutoPlay() {
            if (autoPlayInterval) {
                clearInterval(autoPlayInterval);
            }
        }
        
        // 鼠标悬停时暂停自动播放
        const carouselContainer = document.querySelector('.carousel-container');
        if (carouselContainer) {
            carouselContainer.addEventListener('mouseenter', stopAutoPlay);
            carouselContainer.addEventListener('mouseleave', startAutoPlay);
        }
        
        // 开始自动播放
        startAutoPlay();
    }
    
    function initBannerAdaptive() {
        const previewBanner = document.querySelector('.preview-banner');
        const bannerImage = previewBanner.querySelector('img');
        
        if (!bannerImage) return;
        
        // 监听窗口大小变化
        let resizeTimer;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                adjustBannerSize(bannerImage, previewBanner);
            }, 250);
        });
        
        // 初始调整
        adjustBannerSize(bannerImage, previewBanner);
        
        // 监听模态框大小变化
        const modalContent = document.querySelector('.preview-modal .modal-content');
        if (modalContent) {
            const resizeObserver = new ResizeObserver(() => {
                adjustBannerSize(bannerImage, previewBanner);
            });
            resizeObserver.observe(modalContent);
        }
    }
    
    function adjustBannerSize(bannerImage, previewBanner) {
        const modalContent = document.querySelector('.preview-modal .modal-content');
        if (!modalContent) return;
        
        const modalWidth = modalContent.offsetWidth;
        const modalHeight = modalContent.offsetHeight;
        
        // 根据模态框大小动态调整横幅高度
        let bannerHeight;
        
        if (modalWidth >= 1200) {
            bannerHeight = Math.min(400, modalHeight * 0.4);
        } else if (modalWidth >= 992) {
            bannerHeight = Math.min(350, modalHeight * 0.35);
        } else if (modalWidth >= 768) {
            bannerHeight = Math.min(300, modalHeight * 0.3);
        } else if (modalWidth >= 576) {
            bannerHeight = Math.min(250, modalHeight * 0.25);
        } else {
            bannerHeight = Math.min(200, modalHeight * 0.2);
        }
        
        // 确保最小高度
        bannerHeight = Math.max(bannerHeight, 150);
        
        previewBanner.style.height = bannerHeight + 'px';
        
        // 优化图片显示
        bannerImage.style.objectFit = 'cover';
        bannerImage.style.objectPosition = 'center';
        
        // 添加加载完成后的优化
        if (bannerImage.complete) {
            optimizeImageDisplay(bannerImage);
        } else {
            bannerImage.addEventListener('load', function() {
                optimizeImageDisplay(bannerImage);
            });
        }
    }
    
    function optimizeImageDisplay(bannerImage) {
        // 根据图片实际尺寸优化显示
        const naturalWidth = bannerImage.naturalWidth;
        const naturalHeight = bannerImage.naturalHeight;
        const aspectRatio = naturalWidth / naturalHeight;
        
        // 如果图片宽高比与容器差异较大，调整object-fit
        const containerWidth = bannerImage.offsetWidth;
        const containerHeight = bannerImage.offsetHeight;
        const containerAspectRatio = containerWidth / containerHeight;
        
        if (Math.abs(aspectRatio - containerAspectRatio) > 0.5) {
            // 差异较大时使用contain模式，确保图片完整显示
            bannerImage.style.objectFit = 'contain';
            bannerImage.style.backgroundColor = '#f8f9fa';
        } else {
            // 差异不大时使用cover模式，填充容器
            bannerImage.style.objectFit = 'cover';
            bannerImage.style.backgroundColor = 'transparent';
        }
    }
    
    function initModalDrag(modal) {
        const modalContent = modal.querySelector('.modal-content');
        const modalHeader = modal.querySelector('.modal-header');
        
        if (!modalHeader || !modalContent) return;
        
        let isDragging = false;
        let startX, startY, startLeft, startTop;
        
        modalHeader.addEventListener('mousedown', startDrag);
        modalHeader.addEventListener('touchstart', startDrag);
        
        function startDrag(e) {
            if (e.target.classList.contains('close-modal')) return;
            
            isDragging = true;
            
            // 获取初始位置
            const rect = modalContent.getBoundingClientRect();
            startLeft = rect.left;
            startTop = rect.top;
            
            // 获取鼠标/触摸初始位置
            if (e.type === 'mousedown') {
                startX = e.clientX;
                startY = e.clientY;
                document.addEventListener('mousemove', drag);
                document.addEventListener('mouseup', stopDrag);
            } else {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                document.addEventListener('touchmove', drag);
                document.addEventListener('touchend', stopDrag);
            }
            
            // 防止文本选择
            e.preventDefault();
        }
        
        function drag(e) {
            if (!isDragging) return;
            
            let currentX, currentY;
            if (e.type === 'mousemove') {
                currentX = e.clientX;
                currentY = e.clientY;
            } else {
                currentX = e.touches[0].clientX;
                currentY = e.touches[0].clientY;
            }
            
            // 计算新的位置
            const deltaX = currentX - startX;
            const deltaY = currentY - startY;
            
            const newLeft = startLeft + deltaX;
            const newTop = startTop + deltaY;
            
            // 限制在视窗范围内
            const maxLeft = window.innerWidth - modalContent.offsetWidth;
            const maxTop = window.innerHeight - modalContent.offsetHeight;
            
            const boundedLeft = Math.max(0, Math.min(newLeft, maxLeft));
            const boundedTop = Math.max(0, Math.min(newTop, maxTop));
            
            // 应用新位置
            modalContent.style.position = 'fixed';
            modalContent.style.left = boundedLeft + 'px';
            modalContent.style.top = boundedTop + 'px';
            modalContent.style.transform = 'none';
        }
        
        function stopDrag() {
            isDragging = false;
            document.removeEventListener('mousemove', drag);
            document.removeEventListener('mouseup', stopDrag);
            document.removeEventListener('touchmove', drag);
            document.removeEventListener('touchend', stopDrag);
        }
    }
    
    function manageCourse(id) {
        // 这里可以跳转到课程管理详细页面
        alert(`管理课程 ${id}（实际项目中这里会跳转到课程管理页面）`);
    }
    
    async function publishCourseFromList(id) {
        try {
            const course = courses.find(c => c.id === id);
            if (!course) return;
            
            if (confirm(`确定要发布课程"${course.name}"吗？发布后学生将可以查看课程内容。`)) {
                course.status = 'published';
                course.updatedAt = new Date().toISOString();
                
                // 保存到IndexedDB
                await window.dbManager.update('courses', course);
                
                // 更新本地课程列表，避免重新从数据库加载
                const courseIndex = courses.findIndex(c => c.id === id);
                if (courseIndex !== -1) {
                    courses[courseIndex] = course;
                }
                
                // 根据当前筛选条件重新渲染课程列表
                const activeFilter = document.querySelector('.filter-tab.active')?.dataset.filter || 'all';
                const searchTerm = document.getElementById('courseSearch')?.value.trim().toLowerCase() || '';
                
                await filterCourses(activeFilter, searchTerm);
                
                showNotification(`课程"${course.name}"已成功发布！`, 'success');
            }
        } catch (error) {
            console.error('发布课程失败:', error);
            showNotification('发布课程失败，请重试', 'error');
        }
    }
    
    async function archiveCourse(id) {
        try {
            const course = courses.find(c => c.id === id);
            if (!course) return;
            
            if (confirm(`确定要归档课程"${course.name}"吗？归档后课程将对学生不可见，但数据会保留。`)) {
                course.status = 'archived';
                course.updatedAt = new Date().toISOString();
                
                // 保存到IndexedDB
                await window.dbManager.update('courses', course);
                
                // 更新本地课程列表，避免重新从数据库加载
                const courseIndex = courses.findIndex(c => c.id === id);
                if (courseIndex !== -1) {
                    courses[courseIndex] = course;
                }
                
                // 根据当前筛选条件重新渲染课程列表
                const activeFilter = document.querySelector('.filter-tab.active')?.dataset.filter || 'all';
                const searchTerm = document.getElementById('courseSearch')?.value.trim().toLowerCase() || '';
                
                await filterCourses(activeFilter, searchTerm);
                
                showNotification(`课程"${course.name}"已成功归档！`, 'success');
            }
        } catch (error) {
            console.error('归档课程失败:', error);
            showNotification('归档课程失败，请重试', 'error');
        }
    }
    
    async function restoreCourse(id) {
        try {
            const course = courses.find(c => c.id === id);
            if (!course) return;
            
            if (confirm(`确定要恢复课程"${course.name}"吗？`)) {
                course.status = 'draft';
                course.updatedAt = new Date().toISOString();
                
                // 保存到IndexedDB
                await window.dbManager.update('courses', course);
                
                // 更新本地课程列表，避免重新从数据库加载
                const courseIndex = courses.findIndex(c => c.id === id);
                if (courseIndex !== -1) {
                    courses[courseIndex] = course;
                }
                
                // 根据当前筛选条件重新渲染课程列表
                const activeFilter = document.querySelector('.filter-tab.active')?.dataset.filter || 'all';
                const searchTerm = document.getElementById('courseSearch')?.value.trim().toLowerCase() || '';
                
                await filterCourses(activeFilter, searchTerm);
                
                showNotification(`课程"${course.name}"已成功恢复为草稿！`, 'success');
            }
        } catch (error) {
            console.error('恢复课程失败:', error);
            showNotification('恢复课程失败，请重试', 'error');
        }
    }
    
    async function deleteCourse(id) {
        try {
            const course = courses.find(c => c.id === id);
            if (!course) return;
            
            if (confirm(`确定要删除课程"${course.name}"吗？此操作不可恢复。`)) {
                // 从IndexedDB删除课程
                await window.dbManager.delete('courses', id);
                
                // 更新本地课程列表，避免重新从数据库加载
                courses = courses.filter(c => c.id !== id);
                
                // 根据当前筛选条件重新渲染课程列表
                const activeFilter = document.querySelector('.filter-tab.active')?.dataset.filter || 'all';
                const searchTerm = document.getElementById('courseSearch')?.value.trim().toLowerCase() || '';
                
                await filterCourses(activeFilter, searchTerm);
                updateEmptyState();
                
                showNotification(`课程"${course.name}"已成功删除！`, 'success');
            }
        } catch (error) {
            console.error('删除课程失败:', error);
            showNotification('删除课程失败，请重试', 'error');
        }
    }
    
    function showNotification(message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button class="close-notification">&times;</button>
        `;
        
        // 添加到页面
        document.body.appendChild(notification);
        
        // 添加关闭按钮事件
        notification.querySelector('.close-notification').addEventListener('click', function() {
            notification.remove();
        });
        
        // 自动移除通知
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
        
        // 添加CSS样式（如果尚未添加）
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 15px 20px;
                    border-radius: 8px;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    min-width: 300px;
                    max-width: 400px;
                    animation: slideIn 0.3s ease;
                    color: white;
                }
                .notification.success {
                    background-color: #27ae60;
                }
                .notification.info {
                    background-color: #3498db;
                }
                .notification.warning {
                    background-color: #f39c12;
                }
                .notification.error {
                    background-color: #e74c3c;
                }
                .close-notification {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 1.5rem;
                    cursor: pointer;
                    line-height: 1;
                    margin-left: 15px;
                }
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    
});