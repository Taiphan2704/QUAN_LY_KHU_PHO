import express from 'express';
import bcrypt from 'bcryptjs';
import Database from '../config/database.js';
import { generateToken, ROLES, ROLE_NAMES } from '../config/auth.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

// Đăng ký (chỉ Admin mới có thể tạo user mới)
router.post('/register', authMiddleware, async (req, res) => {
    try {
        // Only admin can create new users
        if (req.user.role !== ROLES.ADMIN) {
            return res.status(403).json({ error: 'Chỉ Admin mới có thể tạo người dùng mới' });
        }

        const { username, password, fullName, email, phone, role } = req.body;

        if (!username || !password || !fullName) {
            return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
        }

        // Check if username exists
        const existing = Database.getUserByUsername(username);
        if (existing) {
            return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const user = await Database.createUser({
            username,
            password: hashedPassword,
            full_name: fullName,
            email: email || null,
            phone: phone || null,
            role: role || ROLES.MEMBER
        });

        res.status(201).json({
            message: 'Tạo người dùng thành công',
            user: {
                id: user.id,
                username,
                fullName,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Lỗi tạo người dùng' });
    }
});

// Đăng nhập
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Vui lòng nhập tên đăng nhập và mật khẩu' });
        }

        // Find user
        const user = Database.getUserByUsername(username);

        if (!user) {
            return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng' });
        }

        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng' });
        }

        // Generate token
        const token = generateToken(user);

        // Log activity
        await Database.logActivity({
            user_id: user.id,
            action: 'login',
            details: JSON.stringify({ timestamp: new Date().toISOString() })
        });

        res.json({
            message: 'Đăng nhập thành công',
            token,
            user: {
                id: user.id,
                username: user.username,
                fullName: user.full_name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                roleName: ROLE_NAMES[user.role],
                avatar: user.avatar
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Lỗi đăng nhập' });
    }
});

// Lấy thông tin user hiện tại
router.get('/me', authMiddleware, (req, res) => {
    const user = Database.getUserById(req.user.id);

    res.json({
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        roleName: ROLE_NAMES[user.role],
        avatar: user.avatar,
        createdAt: user.created_at,
        hasApiKey: !!user.gemini_api_key
    });
});

// Cập nhật Gemini API Key
router.put('/api-key', authMiddleware, async (req, res) => {
    try {
        const { apiKey } = req.body;

        // Validate API key format (basic check)
        if (apiKey && !apiKey.startsWith('AIza')) {
            return res.status(400).json({ error: 'API Key không hợp lệ. API Key của Google thường bắt đầu bằng "AIza"' });
        }

        await Database.updateUser(req.user.id, {
            gemini_api_key: apiKey || null
        });

        res.json({ 
            message: apiKey ? 'Đã lưu Gemini API Key' : 'Đã xóa Gemini API Key',
            hasApiKey: !!apiKey
        });
    } catch (error) {
        console.error('Update API key error:', error);
        res.status(500).json({ error: 'Lỗi cập nhật API Key' });
    }
});

// Kiểm tra API Key
router.get('/api-key/status', authMiddleware, (req, res) => {
    const user = Database.getUserById(req.user.id);
    const hasKey = !!user.gemini_api_key;
    
    res.json({
        hasApiKey: hasKey,
        message: hasKey ? 'Đã cấu hình Gemini API Key' : 'Chưa cấu hình Gemini API Key'
    });
});

// Đổi mật khẩu
router.put('/change-password', authMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Vui lòng nhập đầy đủ thông tin' });
        }

        const user = Database.getUserById(req.user.id);
        const validPassword = await bcrypt.compare(currentPassword, user.password);

        if (!validPassword) {
            return res.status(400).json({ error: 'Mật khẩu hiện tại không đúng' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await Database.updateUser(req.user.id, { password: hashedPassword });

        res.json({ message: 'Đổi mật khẩu thành công' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Lỗi đổi mật khẩu' });
    }
});

// Cập nhật thông tin cá nhân
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const { fullName, email, phone } = req.body;

        await Database.updateUser(req.user.id, {
            full_name: fullName,
            email,
            phone
        });

        res.json({ message: 'Cập nhật thông tin thành công' });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Lỗi cập nhật thông tin' });
    }
});

// Lấy danh sách users (Admin only)
router.get('/users', authMiddleware, (req, res) => {
    if (req.user.role !== ROLES.ADMIN) {
        return res.status(403).json({ error: 'Không có quyền truy cập' });
    }

    const users = Database.getUsers().map(u => ({
        id: u.id,
        username: u.username,
        full_name: u.full_name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        roleName: ROLE_NAMES[u.role],
        is_active: u.is_active,
        created_at: u.created_at
    }));

    res.json(users);
});

// Lấy danh sách roles
router.get('/roles', authMiddleware, (req, res) => {
    res.json(Object.entries(ROLE_NAMES).map(([key, value]) => ({
        value: key,
        label: value
    })));
});

// Xóa người dùng (Admin only)
router.delete('/users/:id', authMiddleware, async (req, res) => {
    try {
        // Only admin can delete users
        if (req.user.role !== ROLES.ADMIN) {
            return res.status(403).json({ error: 'Chỉ Admin mới có thể xóa người dùng' });
        }

        const userId = req.params.id;

        // Cannot delete yourself
        if (userId === req.user.id) {
            return res.status(400).json({ error: 'Không thể xóa tài khoản của chính bạn' });
        }

        const existing = Database.getUserById(userId);
        if (!existing) {
            return res.status(404).json({ error: 'Không tìm thấy người dùng' });
        }

        await Database.deleteUser(userId);

        // Log activity
        await Database.logActivity({
            user_id: req.user.id,
            action: 'delete',
            entity_type: 'user',
            entity_id: userId,
            details: JSON.stringify({ username: existing.username })
        });

        res.json({ message: 'Xóa người dùng thành công' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Lỗi xóa người dùng' });
    }
});

export default router;
