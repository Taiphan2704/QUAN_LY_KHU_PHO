// Households Module
const Households = {
    currentPage: 1,
    filters: {},

    // Helper function to get status label
    getStatusLabel(status) {
        const labels = {
            'normal': 'H\u1ed9 th\u01b0\u1eddng',
            'business': 'H\u1ed9 kinh doanh',
            'rental': 'H\u1ed9 cho thu\u00ea',
            'poor': 'H\u1ed9 ngh\u00e8o',
            'near_poor': 'H\u1ed9 c\u1eadn ngh\u00e8o',
            'policy': 'Gia \u0111\u00ecnh ch\u00ednh s\u00e1ch'
        };
        return labels[status] || labels['normal'];
    },

    async load() {
        this.setupFilters();
        this.setupAddButton();
        await this.fetchData();
        await this.loadAreas();
    },

    setupFilters() {
        const searchInput = document.getElementById('household-search');
        const areaFilter = document.getElementById('household-area-filter');
        const typeFilter = document.getElementById('household-type-filter');
        const statusFilter = document.getElementById('household-status-filter');

        const debouncedLoad = Utils.debounce(() => this.fetchData(), 300);

        searchInput.addEventListener('input', () => {
            this.filters.search = searchInput.value;
            this.currentPage = 1;
            debouncedLoad();
        });

        areaFilter.addEventListener('change', () => {
            this.filters.area = areaFilter.value;
            this.currentPage = 1;
            this.fetchData();
        });

        typeFilter.addEventListener('change', () => {
            this.filters.type = typeFilter.value;
            this.currentPage = 1;
            this.fetchData();
        });

        if (statusFilter) {
            statusFilter.addEventListener('change', () => {
                this.filters.status = statusFilter.value;
                this.currentPage = 1;
                this.fetchData();
            });
        }
    },

    setupAddButton() {
        const btn = document.getElementById('add-household-btn');
        if (btn && !btn.dataset.initialized) {
            btn.dataset.initialized = 'true';
            btn.addEventListener('click', () => this.showForm());
        }

        // Hide if no permission
        if (btn) {
            btn.style.display = Auth.canManage() ? 'inline-flex' : 'none';
        }
    },

    async loadAreas() {
        try {
            const areas = await API.get('/households/meta/areas');
            const select = document.getElementById('household-area-filter');

            // Keep first option
            const firstOption = select.options[0];
            select.innerHTML = '';
            select.appendChild(firstOption);

            areas.forEach(area => {
                const option = document.createElement('option');
                option.value = area;
                option.textContent = area;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading areas:', error);
        }
    },

    async fetchData() {
        try {
            const params = {
                page: this.currentPage,
                limit: 20,
                ...this.filters
            };

            const response = await API.get('/households', params);
            this.renderTable(response.data);
            renderPagination('households-pagination', response.pagination, (page) => {
                this.currentPage = page;
                this.fetchData();
            });
        } catch (error) {
            Toast.error(error.message);
        }
    },

    renderTable(households) {
        const tbody = document.getElementById('households-tbody');
        const canManage = Auth.canManage();
        const canDelete = Auth.canDelete();

        if (!households || households.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        <div class="empty-state-icon">🏠</div>
                        <h3>Chưa có hộ dân nào</h3>
                        <p>Nhấn nút "Thêm hộ dân" để bắt đầu</p>
                    </td>
                </tr>
            `;
            return;
        }

        const typeLabels = {
            'permanent': { text: 'Thường trú', class: 'badge-success' },
            'temporary': { text: 'Tạm trú', class: 'badge-warning' }
        };

        const statusLabels = {
            'normal': { text: 'Hộ thường', class: 'badge-gray' },
            'business': { text: 'Hộ kinh doanh', class: 'badge-primary' },
            'rental': { text: 'Hộ cho thuê', class: 'badge-info' },
            'poor': { text: 'Hộ nghèo', class: 'badge-danger' },
            'near_poor': { text: 'Hộ cận nghèo', class: 'badge-warning' },
            'policy': { text: 'GĐ chính sách', class: 'badge-success' }
        };

        tbody.innerHTML = households.map(h => {
            const type = typeLabels[h.household_type] || { text: h.household_type, class: 'badge-gray' };
            const status = statusLabels[h.household_status] || statusLabels['normal'];

            return `
                <tr data-id="${h.id}">
                    <td><strong>${Utils.escapeHtml(h.household_code)}</strong></td>
                    <td>${Utils.escapeHtml(h.address)}</td>
                    <td>${Utils.escapeHtml(h.head_name) || '-'}</td>
                    <td>
                        <span class="badge badge-primary">${h.member_count || 0} người</span>
                    </td>
                    <td><span class="badge ${type.class}">${type.text}</span></td>
                    <td><span class="badge ${status.class}">${status.text}</span></td>
                    <td>
                        <div class="table-actions">
                            <button class="action-btn view-btn" title="Xem chi tiết" data-id="${h.id}">👁️</button>
                            ${canManage ? `<button class="action-btn edit-btn" title="Chỉnh sửa" data-id="${h.id}">📝</button>` : ''}
                            ${canDelete ? `<button class="action-btn delete delete-btn" title="Xóa" data-id="${h.id}">🗑️</button>` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Add event listeners
        tbody.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => this.showDetail(btn.dataset.id));
        });

        tbody.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => this.showForm(btn.dataset.id));
        });

        tbody.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => this.delete(btn.dataset.id));
        });
    },

    async showDetail(id) {
        try {
            const household = await API.get(`/households/${id}`);

            Modal.open({
                title: `Hộ dân: ${household.household_code}`,
                size: 'lg',
                body: `
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>Mã hộ khẩu</label>
                            <span>${Utils.escapeHtml(household.household_code)}</span>
                        </div>
                        <div class="detail-item">
                            <label>Loại hộ</label>
                            <span>${household.household_type === 'permanent' ? 'Thường trú' : 'Tạm trú'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Tình trạng</label>
                            <span>${this.getStatusLabel(household.household_status)}</span>
                        </div>
                        <div class="detail-item">
                            <label>Khu vực</label>
                            <span>${Utils.escapeHtml(household.area) || '-'}</span>
                        </div>
                        <div class="detail-item" style="grid-column: span 2;">
                            <label>Địa chỉ</label>
                            <span>${Utils.escapeHtml(household.address)}</span>
                        </div>
                        <div class="detail-item">
                            <label>Số nhà</label>
                            <span>${Utils.escapeHtml(household.house_number) || '-'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Số điện thoại</label>
                            <span>${Utils.escapeHtml(household.phone) || '-'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Email</label>
                            <span>${Utils.escapeHtml(household.email) || '-'}</span>
                        </div>
                    </div>
                    
                    <h4 style="margin: 1.5rem 0 1rem; font-size: 1rem;">Thành viên (${household.members?.length || 0})</h4>
                    <table class="data-table" style="margin: 0 -1.5rem; width: calc(100% + 3rem);">
                        <thead>
                            <tr>
                                <th>Họ tên</th>
                                <th>Năm sinh</th>
                                <th>Quan hệ</th>
                                <th>Nghề nghiệp</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${household.members?.map(m => `
                                <tr>
                                    <td>
                                        ${m.is_household_head ? '⭐ ' : ''}
                                        <strong>${Utils.escapeHtml(m.full_name)}</strong>
                                    </td>
                                    <td>${Utils.getYear(m.birth_date)}</td>
                                    <td>${Utils.escapeHtml(m.relationship) || '-'}</td>
                                    <td>${Utils.escapeHtml(m.occupation) || '-'}</td>
                                </tr>
                            `).join('') || '<tr><td colspan="4" style="text-align:center">Chưa có thành viên</td></tr>'}
                        </tbody>
                    </table>
                `,
                footer: `<button class="btn btn-secondary" onclick="Modal.close()">Đóng</button>`
            });
        } catch (error) {
            Toast.error(error.message);
        }
    },

    async showForm(id = null) {
        let household = null;

        if (id) {
            try {
                household = await API.get(`/households/${id}`);
            } catch (error) {
                Toast.error(error.message);
                return;
            }
        }

        Modal.open({
            title: id ? 'Chỉnh sửa hộ dân' : 'Thêm hộ dân mới',
            body: `
                <form id="household-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label class="required">Mã hộ khẩu</label>
                            <input type="text" class="form-input" name="householdCode" 
                                value="${household?.household_code || ''}" required>
                        </div>
                        <div class="form-group">
                            <label>Loại hộ</label>
                            <select class="select-input" name="householdType">
                                <option value="permanent" ${household?.household_type === 'permanent' ? 'selected' : ''}>Thường trú</option>
                                <option value="temporary" ${household?.household_type === 'temporary' ? 'selected' : ''}>Tạm trú</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Tình trạng hộ</label>
                        <select class="select-input" name="householdStatus">
                            <option value="normal" ${household?.household_status === 'normal' || !household?.household_status ? 'selected' : ''}>Hộ thường</option>
                            <option value="business" ${household?.household_status === 'business' ? 'selected' : ''}>Hộ kinh doanh</option>
                            <option value="rental" ${household?.household_status === 'rental' ? 'selected' : ''}>Hộ cho thuê</option>
                            <option value="poor" ${household?.household_status === 'poor' ? 'selected' : ''}>Hộ nghèo</option>
                            <option value="near_poor" ${household?.household_status === 'near_poor' ? 'selected' : ''}>Hộ cận nghèo</option>
                            <option value="policy" ${household?.household_status === 'policy' ? 'selected' : ''}>Gia đình chính sách</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="required">Địa chỉ</label>
                        <input type="text" class="form-input" name="address" 
                            value="${household?.address || ''}" required>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Số nhà</label>
                            <input type="text" class="form-input" name="houseNumber" 
                                value="${household?.house_number || ''}">
                        </div>
                        <div class="form-group">
                            <label>Hẻm/Ngõ</label>
                            <input type="text" class="form-input" name="lane" 
                                value="${household?.lane || ''}">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Đường</label>
                            <input type="text" class="form-input" name="street" 
                                value="${household?.street || ''}">
                        </div>
                        <div class="form-group">
                            <label>Khu vực/Tổ</label>
                            <input type="text" class="form-input" name="area" 
                                value="${household?.area || ''}">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Số điện thoại</label>
                            <input type="tel" class="form-input" name="phone" 
                                value="${household?.phone || ''}">
                        </div>
                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" class="form-input" name="email" 
                                value="${household?.email || ''}">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Ghi chú</label>
                        <textarea class="textarea-input" name="notes" rows="3">${household?.notes || ''}</textarea>
                    </div>
                </form>
            `,
            footer: `
                <button class="btn btn-secondary" onclick="Modal.close()">Hủy</button>
                <button class="btn btn-primary" id="save-household-btn">Lưu</button>
            `
        });

        document.getElementById('save-household-btn').addEventListener('click', async () => {
            const form = document.getElementById('household-form');
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);

            try {
                if (id) {
                    await API.put(`/households/${id}`, data);
                    Toast.success('Cập nhật hộ dân thành công');
                } else {
                    await API.post('/households', data);
                    Toast.success('Thêm hộ dân thành công');
                }
                Modal.close();
                this.fetchData();
                this.loadAreas();
            } catch (error) {
                Toast.error(error.message);
            }
        });
    },

    async delete(id) {
        Modal.confirm('Bạn có chắc muốn xóa hộ dân này?', async () => {
            try {
                await API.delete(`/households/${id}`);
                Toast.success('Xóa hộ dân thành công');
                this.fetchData();
            } catch (error) {
                Toast.error(error.message);
            }
        });
    }
};
