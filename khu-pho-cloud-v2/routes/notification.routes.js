import express from 'express';
import Database from '../config/database.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { ROLES } from '../config/auth.js';

const router = express.Router();

// Lấy danh sách thông báo
router.get('/', authMiddleware, (req, res) => {
    try {
        const { type, page = 1, limit = 20 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        let notifications = Database.getNotifications({ type });

        // Members can only see notifications targeted to all or members
        if (req.user.role === ROLES.MEMBER) {
            notifications = notifications.filter(n =>
                n.target_type === 'all' || n.target_type === 'members'
            );
        }

        const total = notifications.length;

        // Pagination
        const offset = (pageNum - 1) * limitNum;
        notifications = notifications.slice(offset, offset + limitNum);

        res.json({
            data: notifications,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Lỗi lấy danh sách thông báo' });
    }
});

// Lấy thông báo mới nhất cho dashboard
router.get('/latest', authMiddleware, (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        let notifications = Database.getNotifications({});

        if (req.user.role === ROLES.MEMBER) {
            notifications = notifications.filter(n =>
                n.target_type === 'all' || n.target_type === 'members'
            );
        }

        res.json(notifications.slice(0, limit));
    } catch (error) {
        console.error('Get latest notifications error:', error);
        res.status(500).json({ error: 'Lỗi lấy thông báo mới nhất' });
    }
});

// Lấy chi tiết thông báo
router.get('/:id', authMiddleware, (req, res) => {
    try {
        const notification = Database.getNotificationById(req.params.id);

        if (!notification) {
            return res.status(404).json({ error: 'Không tìm thấy thông báo' });
        }

        res.json(notification);
    } catch (error) {
        console.error('Get notification error:', error);
        res.status(500).json({ error: 'Lỗi lấy thông tin thông báo' });
    }
});

// Tạo thông báo mới
router.post('/', authMiddleware, requireRole(ROLES.ADMIN, ROLES.CHIEF), async (req, res) => {
    try {
        const { title, content, type, priority, targetType, isPinned, expiresAt } = req.body;

        if (!title || !content) {
            return res.status(400).json({ error: 'Vui lòng nhập tiêu đề và nội dung' });
        }

        const notification = await Database.createNotification({
            title,
            content,
            type: type || 'general',
            priority: priority || 'normal',
            target_type: targetType || 'all',
            is_pinned: isPinned || false,
            expires_at: expiresAt || null,
            created_by: req.user.id
        });

        res.status(201).json({
            message: 'Tạo thông báo thành công',
            id: notification.id
        });
    } catch (error) {
        console.error('Create notification error:', error);
        res.status(500).json({ error: 'Lỗi tạo thông báo' });
    }
});

// Cập nhật thông báo
router.put('/:id', authMiddleware, requireRole(ROLES.ADMIN, ROLES.CHIEF), async (req, res) => {
    try {
        const { title, content, type, priority, targetType, isPinned, expiresAt } = req.body;

        const existing = Database.getNotificationById(req.params.id);
        if (!existing) {
            return res.status(404).json({ error: 'Không tìm thấy thông báo' });
        }

        await Database.updateNotification(req.params.id, {
            title: title || existing.title,
            content: content || existing.content,
            type: type || existing.type,
            priority: priority || existing.priority,
            target_type: targetType || existing.target_type,
            is_pinned: isPinned !== undefined ? isPinned : existing.is_pinned,
            expires_at: expiresAt !== undefined ? expiresAt : existing.expires_at
        });

        res.json({ message: 'Cập nhật thông báo thành công' });
    } catch (error) {
        console.error('Update notification error:', error);
        res.status(500).json({ error: 'Lỗi cập nhật thông báo' });
    }
});

// Xóa thông báo
router.delete('/:id', authMiddleware, requireRole(ROLES.ADMIN, ROLES.CHIEF), async (req, res) => {
    try {
        const existing = Database.getNotificationById(req.params.id);
        if (!existing) {
            return res.status(404).json({ error: 'Không tìm thấy thông báo' });
        }

        await Database.deleteNotification(req.params.id);

        res.json({ message: 'Xóa thông báo thành công' });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ error: 'Lỗi xóa thông báo' });
    }
});

export default router;
