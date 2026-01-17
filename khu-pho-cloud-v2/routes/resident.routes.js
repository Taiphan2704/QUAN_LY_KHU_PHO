import express from 'express';
import Database from '../config/database.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { canManage } from '../middleware/role.middleware.js';
import { ROLES } from '../config/auth.js';

const router = express.Router();

// Lấy danh sách nhân khẩu
router.get('/', authMiddleware, (req, res) => {
    try {
        const { search, gender, residenceType, householdId, page = 1, limit = 20 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        let residents = Database.getResidents({ search, gender, residenceType, householdId });
        const total = residents.length;

        // Pagination
        const offset = (pageNum - 1) * limitNum;
        residents = residents.slice(offset, offset + limitNum);

        res.json({
            data: residents,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        console.error('Get residents error:', error);
        res.status(500).json({ error: 'Lỗi lấy danh sách nhân khẩu' });
    }
});

// Lấy chi tiết nhân khẩu
router.get('/:id', authMiddleware, (req, res) => {
    try {
        const resident = Database.getResidentById(req.params.id);

        if (!resident) {
            return res.status(404).json({ error: 'Không tìm thấy nhân khẩu' });
        }

        // Mask sensitive data for members
        if (req.user.role === ROLES.MEMBER && resident.id_number) {
            resident.id_number = '***' + resident.id_number.slice(-4);
        }

        res.json(resident);
    } catch (error) {
        console.error('Get resident error:', error);
        res.status(500).json({ error: 'Lỗi lấy thông tin nhân khẩu' });
    }
});

// Thêm nhân khẩu
router.post('/', authMiddleware, canManage('resident'), async (req, res) => {
    try {
        const {
            householdId, fullName, birthDate, gender, idNumber, phone, email,
            occupation, workplace, education, religion, ethnicity, relationship,
            isHouseholdHead, residenceType, residenceStatus, currentAddress, notes
        } = req.body;

        if (!fullName) {
            return res.status(400).json({ error: 'Vui lòng nhập họ tên' });
        }

        const resident = await Database.createResident({
            household_id: householdId || null,
            full_name: fullName,
            birth_date: birthDate || null,
            gender: gender || null,
            id_number: idNumber || null,
            phone: phone || null,
            email: email || null,
            occupation: occupation || null,
            workplace: workplace || null,
            education: education || null,
            religion: religion || null,
            ethnicity: ethnicity || 'Kinh',
            relationship: relationship || null,
            is_household_head: isHouseholdHead || false,
            residence_type: residenceType || 'permanent',
            residence_status: residenceStatus || 'present',
            current_address: currentAddress || null,
            notes: notes || null
        });

        // Log activity
        await Database.logActivity({
            user_id: req.user.id,
            action: 'create',
            entity_type: 'resident',
            entity_id: resident.id,
            details: JSON.stringify({ fullName })
        });

        res.status(201).json({
            message: 'Thêm nhân khẩu thành công',
            id: resident.id
        });
    } catch (error) {
        console.error('Create resident error:', error);
        res.status(500).json({ error: 'Lỗi thêm nhân khẩu' });
    }
});

// Cập nhật nhân khẩu
router.put('/:id', authMiddleware, canManage('resident'), async (req, res) => {
    try {
        const {
            householdId, fullName, birthDate, gender, idNumber, phone, email,
            occupation, workplace, education, religion, ethnicity, relationship,
            isHouseholdHead, residenceType, residenceStatus, currentAddress, notes
        } = req.body;

        const existing = Database.getResidentById(req.params.id);
        if (!existing) {
            return res.status(404).json({ error: 'Không tìm thấy nhân khẩu' });
        }

        await Database.updateResident(req.params.id, {
            household_id: householdId !== undefined ? householdId : existing.household_id,
            full_name: fullName || existing.full_name,
            birth_date: birthDate,
            gender,
            id_number: idNumber,
            phone,
            email,
            occupation,
            workplace,
            education,
            religion,
            ethnicity: ethnicity || existing.ethnicity,
            relationship,
            is_household_head: isHouseholdHead !== undefined ? isHouseholdHead : existing.is_household_head,
            residence_type: residenceType || existing.residence_type,
            residence_status: residenceStatus || existing.residence_status,
            current_address: currentAddress,
            notes
        });

        res.json({ message: 'Cập nhật nhân khẩu thành công' });
    } catch (error) {
        console.error('Update resident error:', error);
        res.status(500).json({ error: 'Lỗi cập nhật nhân khẩu' });
    }
});

// Xóa nhân khẩu
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        if (![ROLES.ADMIN, ROLES.CHIEF].includes(req.user.role)) {
            return res.status(403).json({ error: 'Không có quyền xóa nhân khẩu' });
        }

        const existing = Database.getResidentById(req.params.id);
        if (!existing) {
            return res.status(404).json({ error: 'Không tìm thấy nhân khẩu' });
        }

        await Database.deleteResident(req.params.id);

        // Log activity
        await Database.logActivity({
            user_id: req.user.id,
            action: 'delete',
            entity_type: 'resident',
            entity_id: req.params.id,
            details: JSON.stringify({ fullName: existing.full_name })
        });

        res.json({ message: 'Xóa nhân khẩu thành công' });
    } catch (error) {
        console.error('Delete resident error:', error);
        res.status(500).json({ error: 'Lỗi xóa nhân khẩu' });
    }
});

export default router;
