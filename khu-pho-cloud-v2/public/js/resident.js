// Residents Module
const Residents = {
    currentPage: 1,
    filters: {},

    async load() {
        this.setupFilters();
        this.setupAddButton();
        await this.fetchData();
    },

    setupFilters() {
        const searchInput = document.getElementById('resident-search');
        const genderFilter = document.getElementById('resident-gender-filter');
        const typeFilter = document.getElementById('resident-type-filter');

        const debouncedLoad = Utils.debounce(() => this.fetchData(), 300);

        searchInput.addEventListener('input', () => {
            this.filters.search = searchInput.value;
            this.currentPage = 1;
            debouncedLoad();
        });

        genderFilter.addEventListener('change', () => {
            this.filters.gender = genderFilter.value;
            this.currentPage = 1;
            this.fetchData();
        });

        typeFilter.addEventListener('change', () => {
            this.filters.residenceType = typeFilter.value;
            this.currentPage = 1;
            this.fetchData();
        });
    },

    setupAddButton() {
        const btn = document.getElementById('add-resident-btn');
        if (btn && !btn.dataset.initialized) {
            btn.dataset.initialized = 'true';
            btn.addEventListener('click', () => this.showForm());
        }

        // Hide if no permission
        if (btn) {
            btn.style.display = Auth.canManage() ? 'inline-flex' : 'none';
        }
    },

    async fetchData() {
        try {
            const params = {
                page: this.currentPage,
                limit: 20,
                ...this.filters
            };

            const response = await API.get('/residents', params);
            this.renderTable(response.data);
            renderPagination('residents-pagination', response.pagination, (page) => {
                this.currentPage = page;
                this.fetchData();
            });
        } catch (error) {
            Toast.error(error.message);
        }
    },

    renderTable(residents) {
        const tbody = document.getElementById('residents-tbody');
        const canManage = Auth.canManage();
        const canDelete = Auth.canDelete();

        if (!residents || residents.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        <div class="empty-state-icon">👥</div>
                        <h3>Chưa có nhân khẩu nào</h3>
                        <p>Nhấn nút "Thêm nhân khẩu" để bắt đầu</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = residents.map(r => `
            <tr data-id="${r.id}">
                <td>
                    ${r.is_household_head ? '⭐ ' : ''}
                    <strong>${Utils.escapeHtml(r.full_name)}</strong>
                </td>
                <td>${Utils.getYear(r.birth_date)}</td>
                <td>
                    <span class="badge ${r.gender === 'Nam' ? 'badge-primary' : 'badge-warning'}">
                        ${r.gender || '-'}
                    </span>
                </td>
                <td>${Utils.escapeHtml(r.household_code) || '-'}</td>
                <td>${Utils.escapeHtml(r.relationship) || '-'}</td>
                <td>${Utils.escapeHtml(r.current_address) || Utils.escapeHtml(r.household_address) || '-'}</td>
                <td>
                    <div class="table-actions">
                        <button class="action-btn view-btn" title="Xem chi tiết" data-id="${r.id}">👁️</button>
                        ${canManage ? `<button class="action-btn edit-btn" title="Chỉnh sửa" data-id="${r.id}">📝</button>` : ''}
                        ${canDelete ? `<button class="action-btn delete delete-btn" title="Xóa" data-id="${r.id}">🗑️</button>` : ''}
                    </div>
                </td>
            </tr>
        `).join('');

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
            const resident = await API.get(`/residents/${id}`);

            Modal.open({
                title: `Thông tin: ${resident.full_name}`,
                size: 'lg',
                body: `
                    <div class="resident-detail-header">
                        <div class="avatar avatar-lg">${Utils.getInitials(resident.full_name)}</div>
                        <div class="resident-detail-info">
                            <h2>${Utils.escapeHtml(resident.full_name)}</h2>
                            <p>${resident.is_household_head ? '⭐ Chủ hộ' : resident.relationship || ''}</p>
                        </div>
                    </div>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>Ngày sinh</label>
                            <span>${Utils.formatDate(resident.birth_date)}</span>
                        </div>
                        <div class="detail-item">
                            <label>Giới tính</label>
                            <span>${resident.gender || '-'}</span>
                        </div>
                        <div class="detail-item">
                            <label>CCCD/CMND</label>
                            <span>${resident.id_number || '-'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Điện thoại</label>
                            <span>${resident.phone || '-'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Email</label>
                            <span>${resident.email || '-'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Nghề nghiệp</label>
                            <span>${resident.occupation || '-'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Nơi làm việc</label>
                            <span>${resident.workplace || '-'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Trình độ học vấn</label>
                            <span>${resident.education || '-'}</span>
                        </div>
                        <div class="detail-item" style="grid-column: span 2;">
                            <label>Nơi ở hiện nay</label>
                            <span>${resident.current_address || resident.household_address || '-'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Dân tộc</label>
                            <span>${resident.ethnicity || '-'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Tôn giáo</label>
                            <span>${resident.religion || 'Không'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Loại cư trú</label>
                            <span>${resident.residence_type === 'permanent' ? 'Thường trú' : 'Tạm trú'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Mã hộ khẩu</label>
                            <span>${resident.household_code || '-'}</span>
                        </div>
                    </div>
                    ${resident.notes ? `
                        <div class="detail-item" style="margin-top: 1rem;">
                            <label>Ghi chú</label>
                            <span>${Utils.escapeHtml(resident.notes)}</span>
                        </div>
                    ` : ''}
                `,
                footer: `<button class="btn btn-secondary" onclick="Modal.close()">Đóng</button>`
            });
        } catch (error) {
            Toast.error(error.message);
        }
    },

    async showForm(id = null) {
        let resident = null;
        let households = [];

        try {
            // Load households for dropdown
            const householdResponse = await API.get('/households', { limit: 100 });
            households = householdResponse.data || [];

            if (id) {
                resident = await API.get(`/residents/${id}`);
            }
        } catch (error) {
            Toast.error(error.message);
            return;
        }

        Modal.open({
            title: id ? 'Chỉnh sửa nhân khẩu' : 'Thêm nhân khẩu mới',
            size: 'lg',
            body: `
                <form id="resident-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label class="required">Họ và tên</label>
                            <input type="text" class="form-input" name="fullName" 
                                value="${resident?.full_name || ''}" required>
                        </div>
                        <div class="form-group">
                            <label>Hộ khẩu</label>
                            <select class="select-input" name="householdId">
                                <option value="">-- Chọn hộ --</option>
                                ${households.map(h => `
                                    <option value="${h.id}" ${resident?.household_id == h.id ? 'selected' : ''}>
                                        ${h.household_code} - ${Utils.truncate(h.address, 40)}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Ngày sinh</label>
                            <input type="date" class="form-input" name="birthDate" 
                                value="${resident?.birth_date?.split('T')[0] || ''}">
                        </div>
                        <div class="form-group">
                            <label>Giới tính</label>
                            <select class="select-input" name="gender">
                                <option value="">-- Chọn --</option>
                                <option value="Nam" ${resident?.gender === 'Nam' ? 'selected' : ''}>Nam</option>
                                <option value="Nữ" ${resident?.gender === 'Nữ' ? 'selected' : ''}>Nữ</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>CCCD/CMND</label>
                            <input type="text" class="form-input" name="idNumber" 
                                value="${resident?.id_number || ''}">
                        </div>
                        <div class="form-group">
                            <label>Số điện thoại</label>
                            <input type="tel" class="form-input" name="phone" 
                                value="${resident?.phone || ''}">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" class="form-input" name="email" 
                                value="${resident?.email || ''}">
                        </div>
                        <div class="form-group">
                            <label>Quan hệ với chủ hộ</label>
                            <input type="text" class="form-input" name="relationship" 
                                value="${resident?.relationship || ''}" 
                                placeholder="VD: Chủ hộ, Vợ, Con...">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Nghề nghiệp</label>
                            <input type="text" class="form-input" name="occupation" 
                                value="${resident?.occupation || ''}">
                        </div>
                        <div class="form-group">
                            <label>Nơi làm việc</label>
                            <input type="text" class="form-input" name="workplace" 
                                value="${resident?.workplace || ''}">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Trình độ học vấn</label>
                            <select class="select-input" name="education">
                                <option value="">-- Chọn --</option>
                                <option value="Mầm non" ${resident?.education === 'Mầm non' ? 'selected' : ''}>Mầm non</option>
                                <option value="Tiểu học" ${resident?.education === 'Tiểu học' ? 'selected' : ''}>Tiểu học</option>
                                <option value="THCS" ${resident?.education === 'THCS' ? 'selected' : ''}>THCS</option>
                                <option value="THPT" ${resident?.education === 'THPT' ? 'selected' : ''}>THPT</option>
                                <option value="Trung cấp" ${resident?.education === 'Trung cấp' ? 'selected' : ''}>Trung cấp</option>
                                <option value="Cao đẳng" ${resident?.education === 'Cao đẳng' ? 'selected' : ''}>Cao đẳng</option>
                                <option value="Đại học" ${resident?.education === 'Đại học' ? 'selected' : ''}>Đại học</option>
                                <option value="Sau đại học" ${resident?.education === 'Sau đại học' ? 'selected' : ''}>Sau đại học</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Dân tộc</label>
                            <input type="text" class="form-input" name="ethnicity" 
                                value="${resident?.ethnicity || 'Kinh'}">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Tôn giáo</label>
                            <input type="text" class="form-input" name="religion" 
                                value="${resident?.religion || ''}" placeholder="VD: Phật giáo, Công giáo...">
                        </div>
                        <div class="form-group">
                            <label>Loại cư trú</label>
                            <select class="select-input" name="residenceType">
                                <option value="permanent" ${resident?.residence_type === 'permanent' ? 'selected' : ''}>Thường trú</option>
                                <option value="temporary" ${resident?.residence_type === 'temporary' ? 'selected' : ''}>Tạm trú</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                            <input type="checkbox" name="isHouseholdHead" ${resident?.is_household_head ? 'checked' : ''}>
                            <span>Là chủ hộ</span>
                        </label>
                    </div>
                    <div class="form-group">
                        <label>Nơi ở hiện nay</label>
                        <input type="text" class="form-input" name="currentAddress" 
                            value="${resident?.current_address || ''}" placeholder="VD: Số 123 Đường ABC, Phường XYZ...">
                    </div>
                    <div class="form-group">
                        <label>Ghi chú</label>
                        <textarea class="textarea-input" name="notes" rows="2">${resident?.notes || ''}</textarea>
                    </div>
                </form>
            `,
            footer: `
                <button class="btn btn-secondary" onclick="Modal.close()">Hủy</button>
                <button class="btn btn-primary" id="save-resident-btn">Lưu</button>
            `
        });

        document.getElementById('save-resident-btn').addEventListener('click', async () => {
            const form = document.getElementById('resident-form');
            const formData = new FormData(form);
            const data = {
                ...Object.fromEntries(formData),
                isHouseholdHead: form.querySelector('[name="isHouseholdHead"]').checked,
                householdId: formData.get('householdId') || null
            };

            try {
                if (id) {
                    await API.put(`/residents/${id}`, data);
                    Toast.success('Cập nhật nhân khẩu thành công');
                } else {
                    await API.post('/residents', data);
                    Toast.success('Thêm nhân khẩu thành công');
                }
                Modal.close();
                this.fetchData();
            } catch (error) {
                Toast.error(error.message);
            }
        });
    },

    async delete(id) {
        Modal.confirm('Bạn có chắc muốn xóa nhân khẩu này?', async () => {
            try {
                await API.delete(`/residents/${id}`);
                Toast.success('Xóa nhân khẩu thành công');
                this.fetchData();
            } catch (error) {
                Toast.error(error.message);
            }
        });
    }
};
