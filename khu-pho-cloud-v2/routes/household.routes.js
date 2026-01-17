import express from 'express';
import Database from '../config/database.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { canManage } from '../middleware/role.middleware.js';
import { ROLES } from '../config/auth.js';

const router = express.Router();

// Lấy danh sách hộ dân
router.get('/', authMiddleware, (req, res) => {
    try {
        const { search, area, type, status, page = 1, limit = 20 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        let households = Database.getHouseholds({ search, area, type, status });
        const total = households.length;

        // Pagination
        const offset = (pageNum - 1) * limitNum;
        households = households.slice(offset, offset + limitNum);

        res.json({
            data: households,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        console.error('Get households error:', error);
        res.status(500).json({ error: 'Lỗi lấy danh sách hộ dân' });
    }
});

// Lấy chi tiết một hộ dân
router.get('/:id', authMiddleware, (req, res) => {
    try {
        const household = Database.getHouseholdById(req.params.id);

        if (!household) {
            return res.status(404).json({ error: 'Không tìm thấy hộ dân' });
        }

        res.json(household);
    } catch (error) {
        console.error('Get household error:', error);
        res.status(500).json({ error: 'Lỗi lấy thông tin hộ dân' });
    }
});

// Thêm hộ dân mới
router.post('/', authMiddleware, canManage('household'), async (req, res) => {
    try {
        const {
            householdCode, address, houseNumber, lane, street, area,
            householdType, householdStatus, phone, email, notes
        } = req.body;

        if (!householdCode || !address) {
            return res.status(400).json({ error: 'Thiếu mã hộ khẩu hoặc địa chỉ' });
        }

        // Check if code exists
        const existing = Database.getHouseholdByCode(householdCode);
        if (existing) {
            return res.status(400).json({ error: 'Mã hộ khẩu đã tồn tại' });
        }

        const household = await Database.createHousehold({
            household_code: householdCode,
            address,
            house_number: houseNumber || null,
            lane: lane || null,
            street: street || null,
            area: area || null,
            household_type: householdType || 'permanent',
            household_status: householdStatus || 'normal',
            phone: phone || null,
            email: email || null,
            notes: notes || null,
            created_by: req.user.id
        });

        // Log activity
        await Database.logActivity({
            user_id: req.user.id,
            action: 'create',
            entity_type: 'household',
            entity_id: household.id,
            details: JSON.stringify({ householdCode, address })
        });

        res.status(201).json({
            message: 'Thêm hộ dân thành công',
            id: household.id
        });
    } catch (error) {
        console.error('Create household error:', error);
        res.status(500).json({ error: 'Lỗi thêm hộ dân' });
    }
});

// Cập nhật hộ dân
router.put('/:id', authMiddleware, canManage('household'), async (req, res) => {
    try {
        const {
            householdCode, address, houseNumber, lane, street, area,
            householdType, householdStatus, phone, email, notes
        } = req.body;

        const existing = Database.getHouseholdById(req.params.id);
        if (!existing) {
            return res.status(404).json({ error: 'Không tìm thấy hộ dân' });
        }

        // Check if new code conflicts
        if (householdCode && householdCode !== existing.household_code) {
            const codeExists = Database.getHouseholdByCode(householdCode);
            if (codeExists) {
                return res.status(400).json({ error: 'Mã hộ khẩu đã tồn tại' });
            }
        }

        await Database.updateHousehold(req.params.id, {
            household_code: householdCode || existing.household_code,
            address: address || existing.address,
            house_number: houseNumber,
            lane,
            street,
            area,
            household_type: householdType || existing.household_type,
            household_status: householdStatus || existing.household_status || 'normal',
            phone,
            email,
            notes
        });

        res.json({ message: 'Cập nhật hộ dân thành công' });
    } catch (error) {
        console.error('Update household error:', error);
        res.status(500).json({ error: 'Lỗi cập nhật hộ dân' });
    }
});

// Xóa hộ dân
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        // Only admin and chief can delete
        if (![ROLES.ADMIN, ROLES.CHIEF].includes(req.user.role)) {
            return res.status(403).json({ error: 'Không có quyền xóa hộ dân' });
        }

        const existing = Database.getHouseholdById(req.params.id);
        if (!existing) {
            return res.status(404).json({ error: 'Không tìm thấy hộ dân' });
        }

        await Database.deleteHousehold(req.params.id);

        // Log activity
        await Database.logActivity({
            user_id: req.user.id,
            action: 'delete',
            entity_type: 'household',
            entity_id: req.params.id,
            details: JSON.stringify({ householdCode: existing.household_code })
        });

        res.json({ message: 'Xóa hộ dân thành công' });
    } catch (error) {
        console.error('Delete household error:', error);
        res.status(500).json({ error: 'Lỗi xóa hộ dân' });
    }
});

// Lấy danh sách khu vực
router.get('/meta/areas', authMiddleware, (req, res) => {
    const areas = Database.getAreas();
    res.json(areas);
});

export default router;
