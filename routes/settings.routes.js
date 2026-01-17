import express from 'express';
import Database from '../config/database.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { ROLES } from '../config/auth.js';

const router = express.Router();

// Lấy tất cả cài đặt
router.get('/', authMiddleware, (req, res) => {
    try {
        const settings = Database.getSettings();
        res.json(settings);
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ error: 'Lỗi lấy cài đặt' });
    }
});

// API Sao lưu dữ liệu (Chỉ Admin)
router.get('/backup', authMiddleware, requireRole(ROLES.ADMIN), (req, res) => {
    try {
        const data = Database.getFullDatabase();
        
        // Tạo tên file có ngày giờ: backup-2026-01-16.json
        const date = new Date().toISOString().split('T')[0];
        const filename = `backup-khu-pho-25-${date}.json`;

        // Thiết lập header để trình duyệt hiểu đây là file cần tải về
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.setHeader('Content-Type', 'application/json');

        // Gửi dữ liệu đẹp (indent 2 spaces)
        res.send(JSON.stringify(data, null, 2));
        
        // Log hành động
        Database.logActivity({
            user_id: req.user.id,
            action: 'backup_data',
            entity_type: 'system',
            details: 'Sao lưu toàn bộ dữ liệu hệ thống'
        });

    } catch (error) {
        console.error('Backup error:', error);
        res.status(500).json({ error: 'Lỗi sao lưu dữ liệu' });
    }
});

// Lấy một cài đặt
router.get('/:key', authMiddleware, (req, res) => {
    try {
        const value = Database.getSetting(req.params.key);
        if (value === undefined) {
            return res.status(404).json({ error: 'Không tìm thấy cài đặt' });
        }
        res.json({ key: req.params.key, value });
    } catch (error) {
        console.error('Get setting error:', error);
        res.status(500).json({ error: 'Lỗi lấy cài đặt' });
    }
});

// Cập nhật cài đặt (Admin và Trưởng khu phố)
router.put('/:key', authMiddleware, requireRole(ROLES.ADMIN, ROLES.CHIEF), async (req, res) => {
    try {
        const { value } = req.body;

        await Database.updateSetting(req.params.key, value);

        // Log activity
        await Database.logActivity({
            user_id: req.user.id,
            action: 'update_setting',
            entity_type: 'settings',
            details: JSON.stringify({ key: req.params.key, value })
        });

        res.json({ message: 'Cập nhật cài đặt thành công' });
    } catch (error) {
        console.error('Update setting error:', error);
        res.status(500).json({ error: 'Lỗi cập nhật cài đặt' });
    }
});

// Cập nhật nhiều cài đặt cùng lúc
router.put('/', authMiddleware, requireRole(ROLES.ADMIN, ROLES.CHIEF), async (req, res) => {
    try {
        const settings = req.body;

        await Database.updateSettings(settings);

        res.json({ message: 'Cập nhật cài đặt thành công' });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ error: 'Lỗi cập nhật cài đặt' });
    }
});

// Lấy thông tin công khai (không cần auth)
router.get('/public/info', (req, res) => {
    try {
        const settings = Database.getSettings();
        res.json({
            neighborhood_name: settings.neighborhood_name,
            ward_name: settings.ward_name,
            district_name: settings.district_name,
            city_name: settings.city_name,
            contact_phone: settings.contact_phone,
            contact_email: settings.contact_email
        });
    } catch (error) {
        console.error('Get public info error:', error);
        res.status(500).json({ error: 'Lỗi lấy thông tin' });
    }
});

export default router;
