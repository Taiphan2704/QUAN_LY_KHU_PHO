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
    },

    async loadSettings() {
        try {
            const settings = await API.get('/settings');
            this.settings = settings;

            // Update neighborhood name in UI
            const name = settings.neighborhood_name || 'Khu phố 25 - Long Trường';
            document.getElementById('neighborhood-name').textContent = name;
            document.getElementById('sidebar-title').textContent = name.split(' - ')[0];
            document.title = `${name} - Quản Lý Khu Phố`;

            // Load settings form
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

        // Setup settings form submit
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
            // Update active nav
            navLinks.forEach(link => {
                link.classList.toggle('active', link.dataset.page === pageName);
            });

            // Show active page
            pages.forEach(page => {
                page.classList.toggle('active', page.id === `page-${pageName}`);
            });

            // Update title
            pageTitle.textContent = pageTitles[pageName] || pageName;
            this.currentPage = pageName;

            // Load page data
            switch (pageName) {
                case 'dashboard':
                    Dashboard.load();
                    break;
                case 'households':
                    Households.load();
                    break;
                case 'residents':
                    Residents.load();
                    break;
                case 'notifications':
                    Notifications.load();
                    break;
                case 'statistics':
                    Statistics.load();
                    break;
                case 'users':
                    this.loadUsers();
                    break;
                case 'settings':
                    this.setupApiKeyManagement();
                    break;
            }

            // Close mobile sidebar
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

        // Handle hash change
        window.addEventListener('hashchange', () => {
            const page = window.location.hash.slice(1) || 'dashboard';
            loadPage(page);
        });

        // Load initial page from hash
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

        // Restore sidebar state
        if (localStorage.getItem('sidebarCollapsed') === 'true') {
            sidebar.classList.add('collapsed');
        }

        // Close sidebar on outside click (mobile)
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
                    // Search in current context
                    if (this.currentPage === 'households') {
                        document.getElementById('household-search').value = query;
                        Households.load();
                    } else if (this.currentPage === 'residents') {
                        document.getElementById('resident-search').value = query;
                        Residents.load();
                    } else {
                        // Default to residents search
                        document.getElementById('resident-search').value = query;
                        window.location.hash = 'residents';
                    }
                }
            }
        });
    },

    async loadUsers() {
        try {
            const users = await API.get('/auth/users');
            const tbody = document.getElementById('users-tbody');
            const currentUserId = Auth.user?.id;

            tbody.innerHTML = users.map(user => `
                <tr>
                    <td><strong>${Utils.escapeHtml(user.username)}</strong></td>
                    <td>${Utils.escapeHtml(user.full_name)}</td>
                    <td><span class="badge badge-primary">${user.roleName}</span></td>
                    <td>${Utils.escapeHtml(user.email) || '-'}</td>
                    <td>${Utils.escapeHtml(user.phone) || '-'}</td>
                    <td>
                        <span class="badge ${user.is_active ? 'badge-success' : 'badge-gray'}">
                            ${user.is_active ? 'Hoạt động' : 'Vô hiệu'}
                        </span>
                    </td>
                    <td>
                        <div class="table-actions">
                            <button class="action-btn" title="Chỉnh sửa">📝</button>
                            ${user.id !== currentUserId ? `<button class="action-btn delete delete-user-btn" title="Xóa" data-id="${user.id}" data-username="${Utils.escapeHtml(user.username)}">🗑️</button>` : ''}
                        </div>
                    </td>
                </tr>
            `).join('');

            // Add delete event listeners
            tbody.querySelectorAll('.delete-user-btn').forEach(btn => {
                btn.addEventListener('click', () => this.deleteUser(btn.dataset.id, btn.dataset.username));
            });
        } catch (error) {
            Toast.error(error.message);
        }
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

    setupAISearch() {
        const aiSearchBtn = document.getElementById('ai-search-btn');
        const globalSearch = document.getElementById('global-search');

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

    // API Key Management
    setupApiKeyManagement() {
        const apiKeyInput = document.getElementById('gemini-api-key');
        const toggleBtn = document.getElementById('toggle-api-key');
        const saveBtn = document.getElementById('save-api-key');
        const clearBtn = document.getElementById('clear-api-key');
        const statusEl = document.getElementById('api-key-status');

        if (!apiKeyInput) return;

        // Toggle visibility
        toggleBtn?.addEventListener('click', () => {
            const type = apiKeyInput.type === 'password' ? 'text' : 'password';
            apiKeyInput.type = type;
            toggleBtn.textContent = type === 'password' ? '👁️' : '🙈';
        });

        // Save API key
        saveBtn?.addEventListener('click', async () => {
            const apiKey = apiKeyInput.value.trim();
            if (!apiKey) {
                Toast.error('Vui lòng nhập API Key');
                return;
            }

            try {
                saveBtn.disabled = true;
                saveBtn.textContent = '⏳ Đang lưu...';
                
                const result = await API.put('/auth/api-key', { apiKey });
                Toast.success(result.message);
                this.updateApiKeyStatus(true);
                apiKeyInput.value = '';
            } catch (error) {
                Toast.error(error.message);
            } finally {
                saveBtn.disabled = false;
                saveBtn.textContent = '💾 Lưu API Key';
            }
        });

        // Clear API key
        clearBtn?.addEventListener('click', async () => {
            Modal.confirm('Bạn có chắc muốn xóa API Key?', async () => {
                try {
                    const result = await API.put('/auth/api-key', { apiKey: null });
                    Toast.success(result.message);
                    this.updateApiKeyStatus(false);
                    apiKeyInput.value = '';
                } catch (error) {
                    Toast.error(error.message);
                }
            });
        });

        // Load initial status
        this.loadApiKeyStatus();
    },

    async loadApiKeyStatus() {
        try {
            const result = await API.get('/auth/api-key/status');
            this.updateApiKeyStatus(result.hasApiKey);
        } catch (error) {
            console.error('Error loading API key status:', error);
        }
    },

    updateApiKeyStatus(hasKey) {
        const statusEl = document.getElementById('api-key-status');
        if (statusEl) {
            if (hasKey) {
                statusEl.innerHTML = '✅ Đã cấu hình API Key';
                statusEl.style.color = 'var(--success-500)';
            } else {
                statusEl.innerHTML = '⚠️ Chưa cấu hình API Key';
                statusEl.style.color = 'var(--warning-500)';
            }
        }
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
