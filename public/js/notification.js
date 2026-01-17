// Notifications Module
const Notifications = {
    currentPage: 1,
    filters: {},

    async load() {
        this.setupFilters();
        this.setupAddButton();
        await this.fetchData();
    },

    setupFilters() {
        const typeFilter = document.getElementById('notification-type-filter');

        typeFilter.addEventListener('change', () => {
            this.filters.type = typeFilter.value;
            this.currentPage = 1;
            this.fetchData();
        });
    },

    setupAddButton() {
        const btn = document.getElementById('add-notification-btn');
        if (btn && !btn.dataset.initialized) {
            btn.dataset.initialized = 'true';
            btn.addEventListener('click', () => this.showForm());
        }
    },

    async fetchData() {
        try {
            const params = {
                page: this.currentPage,
                limit: 12,
                ...this.filters
            };

            const response = await API.get('/notifications', params);
            this.renderGrid(response.data);
            renderPagination('notifications-pagination', response.pagination, (page) => {
                this.currentPage = page;
                this.fetchData();
            });
        } catch (error) {
            Toast.error(error.message);
        }
    },

    renderGrid(notifications) {
        const container = document.getElementById('notifications-list');
        const canManage = Auth.canDelete();

        if (!notifications || notifications.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: span 3;">
                    <div class="empty-state-icon">📢</div>
                    <h3>Chưa có thông báo nào</h3>
                    <p>Các thông báo mới sẽ xuất hiện tại đây</p>
                </div>
            `;
            return;
        }

        const typeLabels = {
            'general': { text: 'Chung', icon: '📢', color: 'primary' },
            'fee': { text: 'Thu phí', icon: '💰', color: 'warning' },
            'meeting': { text: 'Họp', icon: '📅', color: 'success' },
            'event': { text: 'Sự kiện', icon: '🎉', color: 'danger' }
        };

        container.innerHTML = notifications.map(n => {
            const type = typeLabels[n.type] || typeLabels.general;

            return `
                <div class="notification-card ${n.is_pinned ? 'pinned' : ''}">
                    <div class="notification-card-header">
                        <div class="icon" style="background: var(--${type.color}-50);">
                            ${type.icon}
                        </div>
                        <div class="info">
                            <div class="type">${n.is_pinned ? '📌 ' : ''}${type.text}</div>
                            <div class="date">${Utils.formatDateTime(n.created_at)}</div>
                        </div>
                    </div>
                    <div class="notification-card-body">
                        <h3>${Utils.escapeHtml(n.title)}</h3>
                        <p>${Utils.escapeHtml(Utils.truncate(n.content, 200))}</p>
                    </div>
                    ${canManage ? `
                        <div class="notification-card-footer">
                            <button class="btn btn-sm btn-secondary edit-btn" data-id="${n.id}">Sửa</button>
                            <button class="btn btn-sm btn-danger delete-btn" data-id="${n.id}">Xóa</button>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');

        // Add event listeners
        container.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => this.showForm(btn.dataset.id));
        });

        container.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => this.delete(btn.dataset.id));
        });
    },

    async showForm(id = null) {
        let notification = null;

        if (id) {
            try {
                notification = await API.get(`/notifications/${id}`);
            } catch (error) {
                Toast.error(error.message);
                return;
            }
        }

        Modal.open({
            title: id ? 'Chỉnh sửa thông báo' : 'Tạo thông báo mới',
            body: `
                <form id="notification-form">
                    <div class="form-group">
                        <label class="required">Tiêu đề</label>
                        <input type="text" class="form-input" name="title" 
                            value="${notification?.title || ''}" required>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Loại thông báo</label>
                            <select class="select-input" name="type">
                                <option value="general" ${notification?.type === 'general' ? 'selected' : ''}>Chung</option>
                                <option value="fee" ${notification?.type === 'fee' ? 'selected' : ''}>Thu phí</option>
                                <option value="meeting" ${notification?.type === 'meeting' ? 'selected' : ''}>Họp</option>
                                <option value="event" ${notification?.type === 'event' ? 'selected' : ''}>Sự kiện</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Độ ưu tiên</label>
                            <select class="select-input" name="priority">
                                <option value="normal" ${notification?.priority === 'normal' ? 'selected' : ''}>Bình thường</option>
                                <option value="high" ${notification?.priority === 'high' ? 'selected' : ''}>Quan trọng</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="required">Nội dung</label>
                        <textarea class="textarea-input" name="content" rows="6" required>${notification?.content || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                            <input type="checkbox" name="isPinned" ${notification?.is_pinned ? 'checked' : ''}>
                            <span>📌 Ghim thông báo</span>
                        </label>
                    </div>
                </form>
            `,
            footer: `
                <button class="btn btn-secondary" onclick="Modal.close()">Hủy</button>
                <button class="btn btn-primary" id="save-notification-btn">Đăng thông báo</button>
            `
        });

        document.getElementById('save-notification-btn').addEventListener('click', async () => {
            const form = document.getElementById('notification-form');
            const formData = new FormData(form);
            const data = {
                ...Object.fromEntries(formData),
                isPinned: form.querySelector('[name="isPinned"]').checked
            };

            try {
                if (id) {
                    await API.put(`/notifications/${id}`, data);
                    Toast.success('Cập nhật thông báo thành công');
                } else {
                    await API.post('/notifications', data);
                    Toast.success('Đăng thông báo thành công');
                }
                Modal.close();
                this.fetchData();
            } catch (error) {
                Toast.error(error.message);
            }
        });
    },

    async delete(id) {
        Modal.confirm('Bạn có chắc muốn xóa thông báo này?', async () => {
            try {
                await API.delete(`/notifications/${id}`);
                Toast.success('Xóa thông báo thành công');
                this.fetchData();
            } catch (error) {
                Toast.error(error.message);
            }
        });
    }
};
