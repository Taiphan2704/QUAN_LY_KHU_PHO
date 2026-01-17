import express from 'express';
import Database from '../config/database.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

// Thống kê tổng quan
router.get('/overview', authMiddleware, (req, res) => {
    try {
        const overview = Database.getOverviewStats();
        const recentActivity = Database.getRecentActivity(10);

        res.json({
            ...overview,
            recentActivity
        });
    } catch (error) {
        console.error('Get overview error:', error);
        res.status(500).json({ error: 'Lỗi lấy thống kê tổng quan' });
    }
});

// Thống kê dân số
router.get('/demographics', authMiddleware, (req, res) => {
    try {
        const demographics = Database.getDemographics();
        res.json(demographics);
    } catch (error) {
        console.error('Get demographics error:', error);
        res.status(500).json({ error: 'Lỗi lấy thống kê dân số' });
    }
});

// Thống kê hộ dân
router.get('/households', authMiddleware, (req, res) => {
    try {
        const stats = Database.getHouseholdStats();
        res.json(stats);
    } catch (error) {
        console.error('Get household stats error:', error);
        res.status(500).json({ error: 'Lỗi lấy thống kê hộ dân' });
    }
});

// Thống kê theo thời gian
router.get('/timeline', authMiddleware, (req, res) => {
    try {
        const timeline = Database.getTimelineStats();
        res.json(timeline);
    } catch (error) {
        console.error('Get timeline error:', error);
        res.status(500).json({ error: 'Lỗi lấy thống kê theo thời gian' });
    }
});

export default router;