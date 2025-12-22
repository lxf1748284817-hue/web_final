/**
 * 教师端统一数据库初始化脚本
 * 替代原有的data.js，使用shared/DatabaseManager.js
 */

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', async () => {
    console.log('=== 教师端数据库初始化 ===');
    
    // 默认标记为初始化完成，避免死等
    window.dbInitialized = true;
    window.dbInitError = null;
    
    try {
        // 确保DatabaseManager已加载并初始化
        if (window.dbManager) {
            await window.dbManager.init();
            console.log('✅ 统一数据库初始化成功');
            
            // 兼容旧的接口，确保现有代码能正常工作
            window.courseManager = {
                getCourses: async () => await window.dbManager.getAll('courses'),
                getPublishedCourses: async () => {
                    const courses = await window.dbManager.getAll('courses');
                    return courses.filter(c => c.status === 'published' || !c.status);
                },
                saveCourse: async (courseData) => {
                    if (courseData.id) {
                        await window.dbManager.update('courses', courseData);
                    } else {
                        courseData.id = 'course_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
                        await window.dbManager.add('courses', courseData);
                    }
                    return courseData;
                },
                deleteCourse: async (id) => await window.dbManager.delete('courses', id),
                generateCourseId: () => 'course_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 7)
            };
            
            window.gradesManager = {
                getCourseGrades: async (courseId) => {
                    const grades = await window.dbManager.getAll('scores');
                    return grades.filter(g => g.coursePlanId === courseId || g.courseId === courseId);
                },
                saveCourseGrades: async (courseId, gradesData) => {
                    // 删除旧的该课程成绩数据
                    const allGrades = await window.dbManager.getAll('scores');
                    const oldGrades = allGrades.filter(g => (g.coursePlanId === courseId || g.courseId === courseId));
                    
                    for (const grade of oldGrades) {
                        await window.dbManager.delete('scores', grade.id);
                    }
                    
                    // 添加新数据
                    for (const grade of gradesData) {
                        const gradeWithId = {
                            ...grade,
                            id: `${courseId}_${grade.id}`,
                            courseId: courseId,
                            coursePlanId: courseId
                        };
                        await window.dbManager.add('scores', gradeWithId);
                    }
                    return true;
                },
                getHomeworkAssignments: () => [],
                getExamAssignments: () => [],
                getSubmissions: () => [],
                saveHomeworkAssignment: () => true,
                saveExamAssignment: () => true,
                saveSubmission: () => true,
                deleteHomeworkAssignment: () => true,
                deleteExamAssignment: () => true,
                deleteSubmissionsByAssignment: () => true
            };
            
            console.log('✅ 兼容接口设置完成');
        } else {
            console.error('❌ DatabaseManager未找到，请确保已正确引入');
            window.dbInitError = 'DatabaseManager未找到';
        }
    } catch (error) {
        console.error('❌ 数据库初始化失败:', error);
        window.dbInitError = error.message || '未知初始化错误';
    }
});