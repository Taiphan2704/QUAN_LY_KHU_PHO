import express from 'express';
import Database from '../config/database.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

// Tổng quan (Dashboard widgets)
router.get('/overview', authMiddleware, (req, res) => {
    try {
        const stats = Database.getOverviewStats();
        
        // Tính toán số liệu thông báo
        const activeNotifications = Database.getNotifications()
            .filter(n => !n.expires_at || new Date(n.expires_at) > new Date()).length;

        // Trả về dữ liệu camelCase đúng chuẩn Frontend dashboard.js yêu cầu
        res.json({
            totalHouseholds: stats.total_households || 0,
            totalResidents: stats.total_residents || 0,
            totalNotifications: activeNotifications,
            permanentHouseholds: stats.permanent_households || 0,
            temporaryHouseholds: stats.temporary_households || 0,
            // Cấu trúc phụ trợ cho các biểu đồ khác nếu cần
            byResidenceType: [
                { residence_type: 'permanent', count: stats.permanent_households || 0 },
                { residence_type: 'temporary', count: stats.temporary_households || 0 }
            ],
            recentActivity: Database.getRecentActivity()
        });
    } catch (error) {
        console.error('Overview stats error:', error);
        res.status(500).json({ error: 'Lỗi lấy số liệu tổng quan' });
    }
});

// Thống kê nhân khẩu học (API này sửa lỗi biểu đồ trống)
router.get('/demographics', authMiddleware, (req, res) => {
    try {
        const data = Database.getDemographicStats();

        // 1. Xử lý dữ liệu Giới tính
        // Database trả về object {Nam: x, Nữ: y}, nhưng Frontend cần mảng [{gender: 'Nam', count: x}, ...]
        let byGender = [];
        if (data.genderDistribution) {
            byGender = Object.entries(data.genderDistribution).map(([gender, count]) => ({
                gender,
                count
            }));
        } else if (data.byGender) {
            byGender = data.byGender;
        }

        // 2. Xử lý dữ liệu Độ tuổi
        // Database trả về key "group", nhưng Frontend cần key "age_group"
        const ageGroups = (data.ageGroups || []).map(item => ({
            age_group: item.age_group || item.group, // Ưu tiên age_group, fallback về group
            count: item.count
        }));

        // Trả về dữ liệu đã được chuẩn hóa khớp với Frontend
        res.json({
            ...data,
            byGender: byGender,   // Ghi đè bằng dữ liệu đã xử lý
            ageGroups: ageGroups  // Ghi đè bằng dữ liệu đã xử lý
        });
    } catch (error) {
        console.error('Demographics stats error:', error);
        res.status(500).json({ error: 'Lỗi lấy thống kê nhân khẩu' });
    }
});

// Thống kê hộ dân
router.get('/households', authMiddleware, (req, res) => {
    try {
        const data = Database.getHouseholdStats();
        res.json(data);
    } catch (error) {
        console.error('Household stats error:', error);
        res.status(500).json({ error: 'Lỗi lấy thống kê hộ dân' });
    }
});

// Biểu đồ timeline
router.get('/timeline', authMiddleware, (req, res) => {
    try {
        const data = Database.getTimelineStats();
        res.json(data);
    } catch (error) {
        console.error('Timeline stats error:', error);
        res.status(500).json({ error: 'Lỗi lấy thống kê theo thời gian' });
    }
});

export default router;