import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import aiHelper from '../config/ai.config.js';
import Database from '../config/database.js';

const router = express.Router();

// Rate limiting map
const rateLimits = new Map();
const RATE_LIMIT = 10; // requests per minute
const RATE_WINDOW = 60000; // 1 minute

function checkRateLimit(userId) {
    const now = Date.now();
    const userLimit = rateLimits.get(userId) || { count: 0, resetTime: now + RATE_WINDOW };

    if (now > userLimit.resetTime) {
        userLimit.count = 0;
        userLimit.resetTime = now + RATE_WINDOW;
    }

    if (userLimit.count >= RATE_LIMIT) {
        return false;
    }

    userLimit.count++;
    rateLimits.set(userId, userLimit);
    return true;
}

// Chatbot endpoint
router.post('/chat', authMiddleware, async (req, res) => {
    try {
        if (!checkRateLimit(req.user.id)) {
            return res.status(429).json({
                error: 'Bạn đã gửi quá nhiều tin nhắn. Vui lòng đợi 1 phút.'
            });
        }

        const { message } = req.body;

        if (!message || message.trim().length === 0) {
            return res.status(400).json({ error: 'Vui lòng nhập tin nhắn' });
        }

        if (message.length > 500) {
            return res.status(400).json({ error: 'Tin nhắn quá dài (tối đa 500 ký tự)' });
        }

        // Hàm chat đã có userId từ trước, giữ nguyên
        const response = await aiHelper.chat(req.user.id, message.trim());

        res.json({
            message: response,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: error.message || 'Lỗi xử lý tin nhắn' });
    }
});

// Clear chat history
router.delete('/chat/history', authMiddleware, (req, res) => {
    aiHelper.clearChatHistory(req.user.id);
    res.json({ message: 'Đã xóa lịch sử chat' });
});

// Smart search endpoint
router.post('/search', authMiddleware, async (req, res) => {
    try {
        if (!checkRateLimit(req.user.id)) {
            return res.status(429).json({
                error: 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng đợi 1 phút.'
            });
        }

        const { query } = req.body;

        if (!query || query.trim().length === 0) {
            return res.status(400).json({ error: 'Vui lòng nhập câu hỏi tìm kiếm' });
        }

        // --- CẬP NHẬT 1: Truyền thêm req.user.id ---
        const parsed = await aiHelper.parseSearchQuery(query.trim(), req.user.id);

        if (!parsed) {
            return res.json({
                results: [],
                message: 'Không thể hiểu câu hỏi. Vui lòng thử lại với câu hỏi khác.',
                query: query
            });
        }

        // Execute search based on parsed filters
        let results = [];
        let total = 0;

        if (parsed.entity === 'household') {
            const filters = {
                search: parsed.filters?.address_contains,
                area: parsed.filters?.area,
                type: parsed.filters?.household_type,
                status: parsed.filters?.household_status
            };
            results = Database.getHouseholds(filters).slice(0, 20);
            total = results.length;
        } else if (parsed.entity === 'resident') {
            const filters = {
                search: parsed.filters?.address_contains,
                gender: parsed.filters?.gender
            };
            let residents = Database.getResidents(filters);

            // Apply additional filters
            if (parsed.filters?.age_min) {
                residents = residents.filter(r => r.age >= parsed.filters.age_min);
            }
            if (parsed.filters?.age_max) {
                residents = residents.filter(r => r.age <= parsed.filters.age_max);
            }
            if (parsed.filters?.is_household_head) {
                residents = residents.filter(r => r.is_household_head === true);
            }
            if (parsed.filters?.occupation) {
                residents = residents.filter(r =>
                    r.occupation?.toLowerCase().includes(parsed.filters.occupation.toLowerCase())
                );
            }

            results = residents.slice(0, 20);
            total = results.length;
        }

        res.json({
            entity: parsed.entity,
            filters: parsed.filters,
            results: results,
            total: total,
            query: query
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Lỗi tìm kiếm' });
    }
});

// Smart analytics endpoint (ĐÂY LÀ PHẦN LỖI BẠN ĐANG GẶP)
router.get('/analyze', authMiddleware, async (req, res) => {
    try {
        if (!checkRateLimit(req.user.id)) {
            return res.status(429).json({
                error: 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng đợi 1 phút.'
            });
        }

        // Gather statistics data
        const demographics = Database.getDemographicStats();
        const households = Database.getHouseholdStats();
        const overview = Database.getOverviewStats();
        
        // 👇 THÊM DÒNG NÀY: Lấy thông tin cài đặt để lấy tên khu phố
        const settings = Database.getSettings();

        const statisticsData = {
            // 👇 THÊM DÒNG NÀY: Gửi tên khu phố sang cho AI biết
            thong_tin_khu_vuc: {
                ten_khu_pho: settings.neighborhood_name,
                phuong: settings.ward_name,
                quan: settings.district_name
            },
            tong_quan: {
                tong_ho_dan: overview.total_households,
                tong_nhan_khau: overview.total_residents,
                ho_thuong_tru: overview.permanent_households,
                ho_tam_tru: overview.temporary_households
            },
            phan_bo_tuoi: demographics.ageGroups,
            phan_bo_gioi_tinh: demographics.genderDistribution,
            nghe_nghiep_pho_bien: demographics.topOccupations?.slice(0, 5),
            tinh_trang_ho: households.byStatus,
            quy_mo_ho: households.sizeDistribution
        };

        const analysis = await aiHelper.analyzeData(statisticsData, req.user.id);

        res.json({
            statistics: statisticsData,
            analysis: analysis,
            generated_at: new Date().toISOString()
        });
    } catch (error) {
        console.error('Analyze error:', error);
        res.status(500).json({ error: error.message || 'Lỗi phân tích dữ liệu' });
    }
});

// Smart suggestions endpoint
router.get('/suggestions/:field', authMiddleware, async (req, res) => {
    try {
        const { field } = req.params;
        const { value, area } = req.query;

        const allowedFields = ['occupation', 'workplace', 'address', 'street', 'area', 'current_address'];

        if (!allowedFields.includes(field)) {
            return res.status(400).json({ error: 'Trường không hợp lệ' });
        }

        // --- CẬP NHẬT 3: Truyền thêm req.user.id ---
        const suggestions = await aiHelper.getSuggestions(field, value || '', { area }, req.user.id);

        res.json({
            field: field,
            suggestions: suggestions
        });
    } catch (error) {
        console.error('Suggestions error:', error);
        res.status(500).json({ error: 'Lỗi lấy gợi ý' });
    }
});

export default router;