// Statistics Module
const Statistics = {
    charts: {},

    async load() {
        try {
            const [demographics, households, timeline] = await Promise.all([
                API.get('/statistics/demographics'),
                API.get('/statistics/households'),
                API.get('/statistics/timeline', { period: 'month' })
            ]);

            this.renderTimelineChart(timeline);
            this.renderOccupationChart(demographics.topOccupations || []);
            this.renderHouseholdStatusChart(households.byStatus || []);
            this.renderHouseholdSizeChart(households.sizeDistribution || []);
            this.renderEducationChart(demographics.byEducation || []);
            this.renderAreaChart(households.byArea || []);
            this.setupAIInsights();
        } catch (error) {
            console.error('Statistics load error:', error);
            Toast.error('Lỗi tải dữ liệu thống kê');
        }
    },

    setupAIInsights() {
        const refreshBtn = document.getElementById('refresh-ai-insights');
        if (refreshBtn && !refreshBtn.dataset.initialized) {
            refreshBtn.dataset.initialized = 'true';
            refreshBtn.addEventListener('click', () => this.loadAIInsights());
        }
    },

    async loadAIInsights() {
        const container = document.getElementById('ai-insights-container');
        const refreshBtn = document.getElementById('refresh-ai-insights');

        if (!container) return;

        container.innerHTML = `
            <div class="loading" style="padding: 2rem;">
                <div class="loading-spinner"></div>
            </div>
        `;
        refreshBtn.disabled = true;

        try {
            const result = await SmartAnalytics.getAnalysis();
            container.innerHTML = SmartAnalytics.renderInsights(result.analysis);
        } catch (error) {
            container.innerHTML = `
                <div class="empty-state" style="padding: 2rem;">
                    <p style="color: var(--danger-500);">Lỗi: ${error.message || 'Không thể phân tích dữ liệu'}</p>
                </div>
            `;
        } finally {
            refreshBtn.disabled = false;
        }
    },

    renderTimelineChart(data) {
        const ctx = document.getElementById('timeline-chart');
        if (!ctx) return;

        if (this.charts.timeline) {
            this.charts.timeline.destroy();
        }

        const months = [...new Set([
            ...data.residents.map(r => r.period),
            ...data.households.map(h => h.period)
        ])].sort();

        const residentsData = months.map(m => {
            const item = data.residents.find(r => r.period === m);
            return item ? item.count : 0;
        });

        const householdsData = months.map(m => {
            const item = data.households.find(h => h.period === m);
            return item ? item.count : 0;
        });

        this.charts.timeline = new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [
                    {
                        label: 'Nhân khẩu mới',
                        data: residentsData,
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        pointBackgroundColor: '#6366f1'
                    },
                    {
                        label: 'Hộ dân mới',
                        data: householdsData,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        pointBackgroundColor: '#10b981'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
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

    renderOccupationChart(data) {
        const ctx = document.getElementById('occupation-chart');
        if (!ctx) return;

        if (this.charts.occupation) {
            this.charts.occupation.destroy();
        }

        const colors = [
            '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
            '#f43f5e', '#f97316', '#eab308', '#84cc16', '#22c55e'
        ];

        this.charts.occupation = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.slice(0, 8).map(d => Utils.truncate(d.occupation, 15)),
                datasets: [{
                    label: 'Số người',
                    data: data.slice(0, 8).map(d => d.count),
                    backgroundColor: colors,
                    borderRadius: 6,
                    borderSkipped: false
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0,0,0,0.05)'
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    },

    renderHouseholdSizeChart(data) {
        const ctx = document.getElementById('household-size-chart');
        if (!ctx) return;

        if (this.charts.householdSize) {
            this.charts.householdSize.destroy();
        }

        const colors = ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

        this.charts.householdSize = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.map(d => d.size_group),
                datasets: [{
                    data: data.map(d => d.count),
                    backgroundColor: colors,
                    borderWidth: 0,
                    spacing: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            padding: 15,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    },

    renderEducationChart(data) {
        const ctx = document.getElementById('education-chart');
        if (!ctx) return;

        if (this.charts.education) {
            this.charts.education.destroy();
        }

        const order = ['Mầm non', 'Tiểu học', 'THCS', 'THPT', 'Trung cấp', 'Cao đẳng', 'Đại học', 'Sau đại học'];
        const sortedData = order.map(level => {
            const item = data.find(d => d.education === level);
            return { education: level, count: item ? item.count : 0 };
        }).filter(d => d.count > 0);

        const colors = ['#fbbf24', '#fb923c', '#f97316', '#ef4444', '#a855f7', '#8b5cf6', '#6366f1', '#3b82f6'];

        this.charts.education = new Chart(ctx, {
            type: 'polarArea',
            data: {
                labels: sortedData.map(d => d.education),
                datasets: [{
                    data: sortedData.map(d => d.count),
                    backgroundColor: colors.slice(0, sortedData.length).map(c => c + '99'),
                    borderColor: colors.slice(0, sortedData.length),
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            padding: 10,
                            usePointStyle: true,
                            font: {
                                size: 11
                            }
                        }
                    }
                }
            }
        });
    },

    renderAreaChart(data) {
        const ctx = document.getElementById('area-chart');
        if (!ctx) return;

        if (this.charts.area) {
            this.charts.area.destroy();
        }

        const colors = [
            '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'
        ];

        this.charts.area = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: data.slice(0, 6).map(d => d.area),
                datasets: [{
                    data: data.slice(0, 6).map(d => d.count),
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            padding: 15,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    },

    renderHouseholdStatusChart(data) {
        const ctx = document.getElementById('household-status-chart');
        if (!ctx) return;

        if (this.charts.householdStatus) {
            this.charts.householdStatus.destroy();
        }

        // Map status codes to Vietnamese labels
        const statusLabels = {
            'normal': 'Hộ thường',
            'business': 'Hộ kinh doanh',
            'rental': 'Hộ cho thuê',
            'poor': 'Hộ nghèo',
            'near_poor': 'Hộ cận nghèo',
            'policy': 'GĐ chính sách'
        };

        const colors = [
            '#94a3b8', // normal - gray
            '#3b82f6', // business - blue
            '#06b6d4', // rental - cyan
            '#ef4444', // poor - red
            '#f97316', // near_poor - orange
            '#10b981'  // policy - green
        ];

        const labels = data.map(d => statusLabels[d.status] || d.status);
        const values = data.map(d => d.count);

        this.charts.householdStatus = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors.slice(0, data.length),
                    borderWidth: 2,
                    borderColor: '#fff',
                    spacing: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '55%',
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            padding: 12,
                            usePointStyle: true,
                            font: {
                                size: 11
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const value = context.raw;
                                const percent = ((value / total) * 100).toFixed(1);
                                return `${context.label}: ${value} hộ (${percent}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
};
