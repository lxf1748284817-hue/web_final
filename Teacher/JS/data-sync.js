/**
 * 数据同步管理模块
 * 确保页面切换时数据能够正确加载和同步
 */

class DataSyncManager {
    constructor() {
        this.initialized = false;
        this.syncInterval = null;
        this.init();
    }

    async init() {
        try {
            // 等待数据管理器初始化
            await this.waitForDataManager();
            
            // 设置定期同步
            this.setupPeriodicSync();
            
            // 监听页面可见性变化
            this.setupVisibilitySync();
            
            // 监听页面关闭事件
            this.setupBeforeUnloadSync();
            
            // 监听跨页面消息
            this.setupCrossPageSync();
            
            this.initialized = true;
            console.log('数据同步管理器已初始化');
        } catch (error) {
            console.error('数据同步管理器初始化失败:', error);
        }
    }

    async waitForDataManager() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 10;
            
            const checkDataManager = () => {
                attempts++;
                
                if (window.dataManager && window.courseManager) {
                    resolve();
                    return;
                }
                
                if (attempts >= maxAttempts) {
                    reject(new Error('数据管理器初始化超时'));
                    return;
                }
                
                setTimeout(checkDataManager, 100);
            };
            
            checkDataManager();
        });
    }

    setupPeriodicSync() {
        // 每30秒自动同步一次数据
        this.syncInterval = setInterval(() => {
            this.triggerDataSync();
        }, 30000);
    }

    setupVisibilitySync() {
        document.addEventListener('visibilitychange', async () => {
            if (!document.hidden) {
                console.log('页面重新可见，同步数据');
                await this.triggerDataSync();
            }
        });
    }

    setupBeforeUnloadSync() {
        window.addEventListener('beforeunload', () => {
            console.log('页面即将关闭，确保数据已保存');
            // 可以在这里保存任何未保存的数据
        });
    }

    setupCrossPageSync() {
        // 监听来自其他页面的数据更新消息
        window.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'courseDataUpdated') {
                console.log('收到跨页面数据更新通知');
                this.triggerDataSync();
            }
        });

        // 监听自定义事件
        window.addEventListener('courseDataUpdated', () => {
            console.log('收到自定义事件的数据更新通知');
            this.notifyOtherPages();
        });
    }

    async triggerDataSync() {
        try {
            console.log('开始数据同步...');
            
            // 触发数据更新事件
            const event = new CustomEvent('dataSyncTriggered', {
                detail: { timestamp: new Date().toISOString() }
            });
            window.dispatchEvent(event);
            
            // 通知其他页面
            this.notifyOtherPages();
            
            console.log('数据同步完成');
        } catch (error) {
            console.error('数据同步失败:', error);
        }
    }

    notifyOtherPages() {
        // 向其他页面发送消息
        if (window.parent && window.parent !== window) {
            try {
                window.parent.postMessage({
                    type: 'courseDataUpdated',
                    timestamp: new Date().toISOString(),
                    source: window.location.href
                }, '*');
            } catch (error) {
                console.log('无法通知父窗口:', error);
            }
        }

        // 向所有iframe发送消息
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(iframe => {
            try {
                iframe.contentWindow.postMessage({
                    type: 'courseDataUpdated',
                    timestamp: new Date().toISOString(),
                    source: window.location.href
                }, '*');
            } catch (error) {
                console.log('无法通知iframe:', error);
            }
        });

        // 向opener窗口发送消息（如果是弹窗）
        if (window.opener) {
            try {
                window.opener.postMessage({
                    type: 'courseDataUpdated',
                    timestamp: new Date().toISOString(),
                    source: window.location.href
                }, '*');
            } catch (error) {
                console.log('无法通知opener窗口:', error);
            }
        }
    }

    // 获取当前页面的数据状态
    async getDataStatus() {
        try {
            const courses = await window.courseManager.getCourses();
            const stats = {
                totalCourses: courses.length,
                published: courses.filter(c => c.status === 'published').length,
                draft: courses.filter(c => c.status === 'draft').length,
                archived: courses.filter(c => c.status === 'archived').length,
                lastSync: new Date().toISOString(),
                page: window.location.pathname
            };
            
            return stats;
        } catch (error) {
            console.error('获取数据状态失败:', error);
            return null;
        }
    }

    // 强制重新加载数据
    async forceReload() {
        try {
            console.log('强制重新加载数据...');
            
            // 清除本地存储标记，触发重新初始化
            localStorage.removeItem('cms_data_v7_avatar');
            
            // 重新加载页面
            window.location.reload();
        } catch (error) {
            console.error('强制重新加载失败:', error);
        }
    }

    // 检查数据一致性
    async checkDataConsistency() {
        try {
            const courses = await window.courseManager.getCourses();
            const issues = [];
            
            // 检查必填字段
            courses.forEach((course, index) => {
                if (!course.id || !course.name || !course.code) {
                    issues.push(`课程 ${index + 1}: 缺少必填字段`);
                }
                
                if (course.id && course.id.startsWith('course_')) {
                    // 检查ID格式
                    const match = course.id.match(/^course_[a-z0-9]+$/);
                    if (!match) {
                        issues.push(`课程 ${course.name}: ID格式不正确`);
                    }
                }
            });
            
            // 检查重复的课程代码
            const codeMap = new Map();
            courses.forEach(course => {
                if (codeMap.has(course.code)) {
                    issues.push(`重复的课程代码: ${course.code}`);
                } else {
                    codeMap.set(course.code, course.name);
                }
            });
            
            return {
                totalCourses: courses.length,
                issues: issues,
                isValid: issues.length === 0
            };
        } catch (error) {
            console.error('检查数据一致性失败:', error);
            return { totalCourses: 0, issues: ['检查失败'], isValid: false };
        }
    }

    // 清理资源
    destroy() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        
        console.log('数据同步管理器已销毁');
    }
}

// 创建全局实例
window.dataSyncManager = new DataSyncManager();

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM加载完成，数据同步管理器已就绪');
    });
} else {
    console.log('DOM已就绪，数据同步管理器已初始化');
}

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataSyncManager;
}