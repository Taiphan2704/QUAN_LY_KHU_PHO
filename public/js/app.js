// Main Application
const App = {
    currentPage: 'dashboard',
    settings: {},

    init() {
        Toast.init();
        Modal.init();
        Auth.init();
        this.setupNavigation();
        this.setupSidebar();
        this.setupTheme();
        this.setupGlobalSearch();
        this.setupAISearch();
        this.setupBackup();
        this.setupUserManagement(); // Thêm hàm khởi tạo quản lý user
        this.setupAISettings();
    },

    async loadSettings() {
        try {
            const settings = await API.get('/settings');
            this.settings = settings;

            const name = settings.neighborhood_name || 'Khu phố 25 - Long Trường';
            document.getElementById('neighborhood-name').textContent = name;
            document.getElementById('sidebar-title').textContent = name.split(' - ')[0];
            document.title = `${name} - Quản Lý Khu Phố`;

            this.populateSettingsForm(settings);
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    },

    populateSettingsForm(settings) {
        const fields = [
            'neighborhood_name', 'ward_name', 'district_name',
            'city_name', 'contact_phone', 'contact_email'
        ];

        fields.forEach(field => {
            const input = document.getElementById(`setting-${field.replace(/_/g, '-')}`);
            if (input) {
                input.value = settings[field] || '';
            }
        });

        const form = document.getElementById('settings-form');
        if (form && !form.dataset.initialized) {
            form.dataset.initialized = 'true';
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const data = {};
                fields.forEach(field => {
                    const input = document.getElementById(`setting-${field.replace(/_/g, '-')}`);
                    if (input) {
                        data[field] = input.value;
                    }
                });

                try {
                    await API.put('/settings', data);
                    Toast.success('Cập nhật cài đặt thành công');
                    this.loadSettings();
                } catch (error) {
                    Toast.error(error.message);
                }
            });
        }
    },

    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        const pages = document.querySelectorAll('.page');
        const pageTitle = document.getElementById('page-title');

        const pageTitles = {
            'dashboard': 'Tổng quan',
            'households': 'Quản lý Hộ dân',
            'residents': 'Quản lý Nhân khẩu',
            'notifications': 'Thông báo',
            'statistics': 'Thống kê',
            'users': 'Quản lý Người dùng',
            'settings': 'Cài đặt'
        };

        const loadPage = (pageName) => {
            navLinks.forEach(link => {
                link.classList.toggle('active', link.dataset.page === pageName);
            });

            pages.forEach(page => {
                page.classList.toggle('active', page.id === `page-${pageName}`);
            });

            pageTitle.textContent = pageTitles[pageName] || pageName;
            this.currentPage = pageName;

            switch (pageName) {
                case 'dashboard': Dashboard.load(); break;
                case 'households': Households.load(); break;
                case 'residents': Residents.load(); break;
                case 'notifications': Notifications.load(); break;
                case 'statistics': Statistics.load(); break;
                case 'users': this.loadUsers(); break;
            }

            document.getElementById('sidebar').classList.remove('open');
        };

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                if (page) {
                    loadPage(page);
                    window.location.hash = page;
                }
            });
        });

        window.addEventListener('hashchange', () => {
            const page = window.location.hash.slice(1) || 'dashboard';
            loadPage(page);
        });

        const initialPage = window.location.hash.slice(1) || 'dashboard';
        if (initialPage !== 'dashboard') {
            loadPage(initialPage);
        }
    },

    setupSidebar() {
        const sidebar = document.getElementById('sidebar');
        const sidebarToggle = document.getElementById('sidebar-toggle');
        const mobileToggle = document.getElementById('mobile-menu-toggle');

        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
        });

        mobileToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });

        //if (localStorage.getItem('sidebarCollapsed') === 'true') {
        //    sidebar.classList.add('collapsed');
        //}

        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 1024 &&
                !sidebar.contains(e.target) &&
                !mobileToggle.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        });
    },

    setupTheme() {
        const toggle = document.getElementById('theme-toggle');
        const icon = toggle.querySelector('.theme-icon');
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        icon.textContent = savedTheme === 'dark' ? '☀️' : '🌙';

        toggle.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
            icon.textContent = next === 'dark' ? '☀️' : '🌙';
        });
    },

    setupGlobalSearch() {
        const searchInput = document.getElementById('global-search');
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = searchInput.value.trim();
                if (query) {
                    if (this.currentPage === 'households') {
                        document.getElementById('household-search').value = query;
                        Households.load();
                    } else if (this.currentPage === 'residents') {
                        document.getElementById('resident-search').value = query;
                        Residents.load();
                    } else {
                        document.getElementById('resident-search').value = query;
                        window.location.hash = 'residents';
                    }
                }
            }
        });
    },

    // --- USER MANAGEMENT LOGIC (Đã thêm mới) ---

    setupUserManagement() {
        // Gán sự kiện cho nút Thêm người dùng
        const addUserBtn = document.getElementById('add-user-btn');
        if (addUserBtn) {
            addUserBtn.addEventListener('click', () => {
                this.showUserForm();
            });
        }
    },

    async loadUsers() {
        try {
            const users = await API.get('/auth/users');
            const tbody = document.getElementById('users-tbody');
            const currentUserId = Auth.user?.id;

            if (!users || users.length === 0) {
                tbody.innerHTML = `<tr><td colspan="7" class="text-center">Chưa có người dùng nào</td></tr>`;
                return;
            }

            tbody.innerHTML = users.map(user => `
                <tr>
                    <td><strong>${Utils.escapeHtml(user.username)}</strong></td>
                    <td>${Utils.escapeHtml(user.full_name)}</td>
                    <td><span class="badge badge-primary">${user.roleName || user.role}</span></td>
                    <td>${Utils.escapeHtml(user.email) || '-'}</td>
                    <td>${Utils.escapeHtml(user.phone) || '-'}</td>
                    <td>
                        <span class="badge ${user.is_active ? 'badge-success' : 'badge-gray'}">
                            ${user.is_active ? 'Hoạt động' : 'Vô hiệu'}
                        </span>
                    </td>
                    <td>
                        <div class="table-actions">
                            <button class="action-btn edit-user-btn" title="Chỉnh sửa" data-id="${user.id}">📝</button>
                            ${user.id !== currentUserId ? `<button class="action-btn delete delete-user-btn" title="Xóa" data-id="${user.id}" data-username="${Utils.escapeHtml(user.username)}">🗑️</button>` : ''}
                        </div>
                    </td>
                </tr>
            `).join('');

            // Add edit event listeners
            tbody.querySelectorAll('.edit-user-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const userId = btn.dataset.id;
                    const user = users.find(u => u.id === userId);
                    this.showUserForm(user);
                });
            });

            // Add delete event listeners
            tbody.querySelectorAll('.delete-user-btn').forEach(btn => {
                btn.addEventListener('click', () => this.deleteUser(btn.dataset.id, btn.dataset.username));
            });
        } catch (error) {
            console.error(error);
            Toast.error('Không tải được danh sách người dùng: ' + error.message);
        }
    },

    // Hiển thị Form Thêm/Sửa User
    showUserForm(user = null) {
        const isEdit = !!user;
        
        Modal.open({
            title: isEdit ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới',
            size: 'md',
            body: `
                <form id="user-form">
                    <div class="form-group">
                        <label class="required">Tên đăng nhập</label>
                        <input type="text" class="form-input" name="username" 
                            value="${user?.username || ''}" ${isEdit ? 'disabled' : 'required'}>
                        ${isEdit ? '<small style="color:#666">Không thể thay đổi tên đăng nhập</small>' : ''}
                    </div>
                    
                    <div class="form-group">
                        <label class="${isEdit ? '' : 'required'}">Mật khẩu</label>
                        <input type="password" class="form-input" name="password" 
                            placeholder="${isEdit ? 'Để trống nếu không đổi' : 'Nhập mật khẩu'}" 
                            ${isEdit ? '' : 'required'}>
                    </div>

                    <div class="form-group">
                        <label class="required">Họ và tên</label>
                        <input type="text" class="form-input" name="fullName" 
                            value="${user?.full_name || ''}" required>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Số điện thoại</label>
                            <input type="tel" class="form-input" name="phone" 
                                value="${user?.phone || ''}">
                        </div>
                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" class="form-input" name="email" 
                                value="${user?.email || ''}">
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="required">Vai trò</label>
                        <select class="select-input" name="role" required>
                            <option value="member" ${user?.role === 'member' ? 'selected' : ''}>Thành viên</option>
                            <option value="police" ${user?.role === 'police' ? 'selected' : ''}>Công an khu vực</option>
                            <option value="chief" ${user?.role === 'chief' ? 'selected' : ''}>Trưởng khu phố</option>
                            <option value="admin" ${user?.role === 'admin' ? 'selected' : ''}>Quản trị viên</option>
                        </select>
                    </div>

                    ${isEdit ? `
                    <div class="form-group">
                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                            <input type="checkbox" name="is_active" ${user?.is_active ? 'checked' : ''}>
                            <span>Kích hoạt tài khoản</span>
                        </label>
                    </div>
                    ` : ''}
                </form>
            `,
            footer: `
                <button class="btn btn-secondary" onclick="Modal.close()">Hủy</button>
                <button class="btn btn-primary" id="save-user-btn">${isEdit ? 'Cập nhật' : 'Tạo mới'}</button>
            `
        });

        // Xử lý lưu form
        document.getElementById('save-user-btn').addEventListener('click', async () => {
            const form = document.getElementById('user-form');
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);
            
            // Xử lý checkbox is_active
            if (isEdit) {
                data.is_active = form.querySelector('[name="is_active"]').checked;
            }

            try {
                if (isEdit) {
                    await API.put(`/auth/users/${user.id}`, data);
                    Toast.success('Cập nhật người dùng thành công');
                } else {
                    await API.post('/auth/register', data);
                    Toast.success('Thêm người dùng thành công');
                }
                Modal.close();
                this.loadUsers();
            } catch (error) {
                Toast.error(error.message);
            }
        });
    },

    async deleteUser(id, username) {
        Modal.confirm(`Bạn có chắc muốn xóa người dùng "${username}"?`, async () => {
            try {
                await API.delete(`/auth/users/${id}`);
                Toast.success('Xóa người dùng thành công');
                this.loadUsers();
            } catch (error) {
                Toast.error(error.message);
            }
        });
    },

    // --- END USER MANAGEMENT LOGIC ---

   setupAISearch() {
        const aiSearchBtn = document.getElementById('ai-search-btn');
        
        if (aiSearchBtn) {
            aiSearchBtn.addEventListener('click', () => this.showAISearchDialog());
        }

        // Also trigger AI search with Ctrl+Shift+F
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'F') {
                e.preventDefault();
                this.showAISearchDialog();
            }
        });
    }, 

    showAISearchDialog() {
        const currentQuery = document.getElementById('global-search').value;

        Modal.open({
            title: '🤖 Tìm kiếm thông minh AI',
            body: `
                <div class="form-group">
                    <label>Nhập câu hỏi bằng ngôn ngữ tự nhiên</label>
                    <input type="text" id="ai-search-query" class="form-input" 
                        placeholder="VD: Tìm hộ nghèo ở Tổ 2, Ai trên 60 tuổi?..." 
                        value="${Utils.escapeHtml(currentQuery)}">
                    <p class="form-hint">Ví dụ: "Hộ kinh doanh đường Long Trường", "Chủ hộ là nữ", "Người làm công nhân"</p>
                </div>
            `,
            footer: `
                <button class="btn btn-secondary" onclick="Modal.close()">Hủy</button>
                <button class="btn btn-primary" id="ai-search-submit">
                    <span>🔍</span> Tìm kiếm AI
                </button>
            `
        });

        const input = document.getElementById('ai-search-query');
        const submitBtn = document.getElementById('ai-search-submit');

        input.focus();

        const doSearch = async () => {
            const query = input.value.trim();
            if (!query) {
                Toast.error('Vui lòng nhập câu hỏi tìm kiếm');
                return;
            }

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="btn-loader"></span> Đang tìm...';

            try {
                const result = await SmartSearch.search(query);
                Modal.close();
                SmartSearch.showResults(result, result.entity);
            } catch (error) {
                Toast.error(error.message || 'Lỗi tìm kiếm');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<span>🔍</span> Tìm kiếm AI';
            }
        };

        submitBtn.addEventListener('click', doSearch);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') doSearch();
        });
    }, 

    async setupAISettings() {
        // 1. Load Key hiện tại của user
        try {
            const user = await API.get('/auth/me'); // API này đã sửa ở Bước 2 để trả về geminiApiKey
            const keyInput = document.getElementById('setting-ai-key');
            if (keyInput) {
                keyInput.value = user.geminiApiKey || '';
            }
        } catch (e) { console.error(e); }

        // 2. Xử lý nút ẩn/hiện Key
        const toggleBtn = document.getElementById('toggle-ai-key');
        const keyInput = document.getElementById('setting-ai-key');
        if (toggleBtn && keyInput) {
            toggleBtn.addEventListener('click', () => {
                const type = keyInput.getAttribute('type') === 'password' ? 'text' : 'password';
                keyInput.setAttribute('type', type);
                toggleBtn.textContent = type === 'password' ? '👁️' : '🙈';
            });
        }

        // 3. Xử lý lưu Form
        const form = document.getElementById('ai-settings-form');
        if (form && !form.dataset.initialized) {
            form.dataset.initialized = 'true';
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = form.querySelector('button[type="submit"]');
                const originalText = btn.textContent;
                btn.disabled = true;
                btn.textContent = 'Đang lưu...';

                try {
                    const newKey = keyInput.value.trim();                                   
                    const currentUser = await API.get('/auth/me');                    
                    await API.put('/auth/profile', {
                        fullName: currentUser.fullName,
                        email: currentUser.email,
                        phone: currentUser.phone,
                        geminiApiKey: newKey
                    });

                    Toast.success('Đã lưu API Key cá nhân thành công');
                } catch (error) {
                    Toast.error('Lỗi lưu Key: ' + error.message);
                } finally {
                    btn.disabled = false;
                    btn.textContent = originalText;
                }
            });
        }
    },

    // Hàm Backup mới thêm vào
    setupBackup() {
        const btn = document.getElementById('backup-btn');
        if (btn) {
            btn.addEventListener('click', async () => {
                try {
                    btn.disabled = true;
                    btn.innerHTML = '<span>⏳</span> Đang tạo file...';
                    
                    const response = await fetch('/api/settings/backup', {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    });

                    if (!response.ok) throw new Error('Lỗi tải file backup');

                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `backup-khu-pho-${new Date().toISOString().split('T')[0]}.json`;
                    document.body.appendChild(a);
                    a.click();
                    
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                    
                    Toast.success('Đã tải xuống bản sao lưu thành công');
                } catch (error) {
                    console.error(error);
                    Toast.error('Không thể sao lưu dữ liệu');
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = '<span>💾</span> Tải bản sao lưu (.json)';
                }
            });
        }
    }
}; 

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});