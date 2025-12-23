/**
 * 教师端统一数据库初始化脚本
 * 替代原有的data.js，使用shared/DatabaseManager.js
 */

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', async () => {
    
    // 默认标记为初始化完成，避免死等
    window.dbInitialized = true;
    window.dbInitError = null;
    
    try {
        // 确保DatabaseManager已加载并初始化
        if (window.dbManager) {
            await window.dbManager.init();
            
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
                getHomeworkAssignments: async () => {
                    try {
                        const assignments = await window.dbManager.getAll('assignments');
                        return assignments;
                    } catch (error) {
                        console.error('❌ 获取作业列表失败:', error);
                        return [];
                    }
                },
                getExamAssignments: () => [],
                getSubmissions: async () => {
                    try {
                        console.log('📝 获取提交记录列表...');
                        const submissions = await window.dbManager.getAll('assignment_submissions');
                        console.log('📋 提交记录列表:', submissions);
                        return submissions || [];
                    } catch (error) {
                        console.error('❌ 获取提交记录失败:', error);
                        return [];
                    }
                },
                saveHomeworkAssignment: async (assignment) => {
                    try {
                        // 生成唯一ID（如果不存在）
                        if (!assignment.id) {
                            assignment.id = `assign_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
                        }

                        // 确保有创建时间
                        if (!assignment.createdAt) {
                            assignment.createdAt = new Date().toISOString();
                        }

                        // 使用 update 而不是 add（避免 Key already exists 错误）
                        await window.dbManager.update('assignments', assignment);

                        return true;
                    } catch (error) {
                        console.error('❌ 保存作业失败:', error);
                        return false;
                    }
                },
                saveExamAssignment: async (exam) => {
                    try {
                        // 生成唯一ID（如果不存在）
                        if (!exam.id) {
                            exam.id = `exam_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
                        }

                        // 确保有创建时间
                        if (!exam.createdAt) {
                            exam.createdAt = new Date().toISOString();
                        }

                        // 使用 update 而不是 add
                        await window.dbManager.update('assignments', exam);

                        return true;
                    } catch (error) {
                        console.error('❌ 保存考试失败:', error);
                        return false;
                    }
                },
                saveSubmission: async (submission) => {
                    try {
                        console.log('💾 保存提交记录:', submission);

                        // 使用 update 更新已存在的记录
                        await window.dbManager.update('assignment_submissions', submission);

                        console.log('✅ 提交记录保存成功');
                        return true;
                    } catch (error) {
                        console.error('❌ 保存提交记录失败:', error);
                        throw error;
                    }
                },
                deleteHomeworkAssignment: () => true,
                deleteExamAssignment: () => true,
                deleteSubmissionsByAssignment: () => true
            };
        } else {
            console.error('❌ DatabaseManager未找到，请确保已正确引入');
            window.dbInitError = 'DatabaseManager未找到';
        }
    } catch (error) {
        console.error('❌ 数据库初始化失败:', error);
        window.dbInitError = error.message || '未知初始化错误';
    }
});