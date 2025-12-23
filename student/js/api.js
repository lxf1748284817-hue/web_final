/**
 * API 接口模块
 * 提供给教师端或其他模块调用的接口函数
 */

/**
 * 获取学生的课程统计信息
 * @param {string} studentId - 学生ID
 * @returns {Promise<Object>} 统计信息
 */
async function getStudentCourseStats(studentId) {
    try {
        const enrollments = await getDataByIndex('enrollments', 'studentId', studentId);
        
        // 简化统计（实际应该从作业提交等数据统计）
        const assignments = await getAllData('assignments');
        const submissions = await getDataByIndex('assignment_submissions', 'studentId', studentId);
        
        // 获取学生选修的所有开课计划的作业
        const myPlanIds = enrollments.map(e => e.planId);
        const myAssignments = assignments.filter(a => myPlanIds.includes(a.planId));
        
        const pendingTasks = myAssignments.length - submissions.length;
        const completedTasks = submissions.length;

        return {
            totalCourses: enrollments.length,
            pendingTasks: pendingTasks > 0 ? pendingTasks : 0,
            completedTasks
        };
    } catch (error) {
        console.error('获取学生课程统计失败:', error);
        throw error;
    }
}

// 将接口函数暴露到全局作用域，供其他模块调用
window.TeachingAPI = {
    getStudentCourseStats
};
