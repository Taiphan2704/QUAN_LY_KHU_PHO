// Authentication Module
const Auth = {
    user: null,

    init() {
        this.checkAuth();
        this.setupLoginForm();
        this.setupLogout();
    },

    async checkAuth() {
        const token = localStorage.getItem('token');

        if (!token) {
            this.showLoginScreen();
            return false;
        }

        try {
            const user = await API.get('/auth/me');
            this.setUser(user);
            this.showApp();
            return true;
        } catch (error) {
            this.logout();
            return false;
        }
    },

    setUser(user) {
        this.user = user;

        // Update UI
        document.getElementById('user-name').textContent = user.fullName;
        document.getElementById('user-role').textContent = user.roleName;
        document.getElementById('user-avatar').textContent = Utils.getInitials(user.fullName);

        // Show/hide admin elements
        const isAdmin = user.role === 'admin';
        const isChiefOrAdmin = ['admin', 'chief'].includes(user.role);

        document.querySelectorAll('.nav-item-admin').forEach(el => {
            el.style.display = isAdmin ? 'block' : 'none';
        });

        document.querySelectorAll('.nav-item-settings').forEach(el => {
            el.style.display = isChiefOrAdmin ? 'block' : 'none';
        });

        // Show add notification button for chief/admin
        const addNotifBtn = document.getElementById('add-notification-btn');
        if (addNotifBtn) {
            addNotifBtn.style.display = isChiefOrAdmin ? 'inline-flex' : 'none';
        }
    },

    setupLoginForm() {
        const form = document.getElementById('login-form');
        const loginBtn = document.getElementById('login-btn');
        const errorDiv = document.getElementById('login-error');
        const togglePassword = document.querySelector('.toggle-password');
        const passwordInput = document.getElementById('password');

        // Toggle password visibility
        if (togglePassword) {
            togglePassword.addEventListener('click', () => {
                const type = passwordInput.type === 'password' ? 'text' : 'password';
                passwordInput.type = type;
                togglePassword.textContent = type === 'password' ? '👁️' : '🙈';
            });
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;

            if (!username || !password) {
                errorDiv.textContent = 'Vui lòng nhập đầy đủ thông tin';
                errorDiv.style.display = 'block';
                return;
            }

            // Show loading
            loginBtn.disabled = true;
            loginBtn.querySelector('.btn-text').style.display = 'none';
            loginBtn.querySelector('.btn-loader').style.display = 'inline-block';
            errorDiv.style.display = 'none';

            try {
                const response = await API.post('/auth/login', { username, password });

                API.setToken(response.token);
                this.setUser(response.user);
                this.showApp();

                Toast.success(`Chào mừng ${response.user.fullName}!`);

                // Clear form
                form.reset();
            } catch (error) {
                errorDiv.textContent = error.message || 'Đăng nhập thất bại';
                errorDiv.style.display = 'block';
            } finally {
                loginBtn.disabled = false;
                loginBtn.querySelector('.btn-text').style.display = 'inline';
                loginBtn.querySelector('.btn-loader').style.display = 'none';
            }
        });
    },

    setupLogout() {
        document.getElementById('logout-btn').addEventListener('click', () => {
            Modal.confirm('Bạn có chắc muốn đăng xuất?', () => {
                this.logout();
            });
        });
    },

    logout() {
        API.setToken(null);
        this.user = null;
        this.showLoginScreen();
    },

    showLoginScreen() {
        document.getElementById('login-screen').style.display = 'flex';
        document.getElementById('app').style.display = 'none';
    },

    showApp() {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('app').style.display = 'flex';

        // Load initial data
        App.loadSettings();
        Dashboard.load();
    },

    hasPermission(permission) {
        if (!this.user) return false;
        if (this.user.role === 'admin') return true;

        const permissions = {
            'chief': ['view_all', 'create', 'edit', 'delete', 'notifications', 'settings'],
            'police': ['view_all', 'create', 'edit'],
            'member': ['view_public']
        };

        return permissions[this.user.role]?.some(p =>
            permission.includes(p) || p === permission
        );
    },

    canManage() {
        return ['admin', 'chief', 'police'].includes(this.user?.role);
    },

    canDelete() {
        return ['admin', 'chief'].includes(this.user?.role);
    }
};
