// Dashboard Module
const Dashboard = {
    charts: {},

    async load() {
        try {
            const [overview, demographics] = await Promise.all([
                API.get('/statistics/overview'),
                API.get('/statistics/demographics')
            ]);

            this.updateStats(overview);
            this.renderCharts(demographics);
            this.renderNotifications(overview.recentActivity);
            this.renderActivity(overview.recentActivity);

            // Load latest notifications separately
            this.loadLatestNotifications();
        } catch (error) {
            console.error('Dashboard load error:', error);
            Toast.error('Lỗi tải dữ liệu dashboard');
        }
    },

    updateStats(data) {
        document.getElementById('stat-households').textContent = data.totalHouseholds || 0;
        document.getElementById('stat-residents').textContent = data.totalResidents || 0;
        document.getElementById('stat-notifications').textContent = data.totalNotifications || 0;

        // Calculate temporary residents
        const tempResidents = data.byResidenceType?.find(r => r.residence_type === 'temporary')?.count || 0;
        document.getElementById('stat-temp-residents').textContent = tempResidents;
    },

    renderCharts(data) {
        this.renderAgeChart(data.ageGroups || []);
        this.renderGenderChart(data.byGender || []);
    },

    renderAgeChart(ageGroups) {
        const ctx = document.getElementById('age-chart');
        if (!ctx) return;

        if (this.charts.age) {
            this.charts.age.destroy();
        }

        const colors = [
            '#818cf8', '#a78bfa', '#c084fc', '#e879f9', '#f472b6', '#fb7185'
        ];

        this.charts.age = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ageGroups.map(g => g.age_group),
                datasets: [{
                    label: 'Số người',
                    data: ageGroups.map(g => g.count),
                    backgroundColor: colors,
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0,0,0,0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    },

    renderGenderChart(byGender) {
        const ctx = document.getElementById('gender-chart');
        if (!ctx) return;

        if (this.charts.gender) {
            this.charts.gender.destroy();
        }

        const colors = {
            'Nam': '#3b82f6',
            'Nữ': '#ec4899'
        };

        this.charts.gender = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: byGender.map(g => g.gender),
                datasets: [{
                    data: byGender.map(g => g.count),
                    backgroundColor: byGender.map(g => colors[g.gender] || '#9ca3af'),
                    borderWidth: 0,
                    spacing: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    },

    async loadLatestNotifications() {
        try {
            const notifications = await API.get('/notifications/latest', { limit: 5 });
            this.renderNotifications(notifications);
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    },

    renderNotifications(notifications) {
        const container = document.getElementById('latest-notifications');
        if (!container) return;

        if (!notifications || notifications.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>Chưa có thông báo nào</p>
                </div>
            `;
            return;
        }

        const typeIcons = {
            'general': '📢',
            'fee': '💰',
            'meeting': '📅',
            'event': '🎉'
        };

        container.innerHTML = notifications.map(n => `
            <div class="notification-item ${n.priority === 'high' ? 'priority-high' : ''} type-${n.type}">
                <div class="icon">${typeIcons[n.type] || '📢'}</div>
                <div class="content">
                    <div class="title">${Utils.escapeHtml(n.title)}</div>
                    <div class="time">${Utils.timeAgo(n.created_at)}</div>
                </div>
            </div>
        `).join('');
    },

    renderActivity(activities) {
        const container = document.getElementById('recent-activity');
        if (!container) return;

        if (!activities || activities.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>Chưa có hoạt động nào</p>
                </div>
            `;
            return;
        }

        const actionLabels = {
            'login': 'đã đăng nhập',
            'create': 'đã thêm',
            'update': 'đã cập nhật',
            'delete': 'đã xóa'
        };

        const entityLabels = {
            'household': 'hộ dân',
            'resident': 'nhân khẩu',
            'notification': 'thông báo',
            'settings': 'cài đặt'
        };

        container.innerHTML = activities.slice(0, 8).map(a => {
            const action = actionLabels[a.action] || a.action;
            const entity = entityLabels[a.entity_type] || a.entity_type || '';

            return `
                <div class="activity-item">
                    <div class="info">
                        <div class="action">
                            <strong>${Utils.escapeHtml(a.user_name || 'Người dùng')}</strong> 
                            ${action} ${entity}
                        </div>
                        <div class="time">${Utils.timeAgo(a.created_at)}</div>
                    </div>
                </div>
            `;
        }).join('');
    }
};
