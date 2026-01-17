import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'data');
const dbPath = join(dataDir, 'db.json');

// Create data directory if not exists
if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
    console.log('📁 Đã tạo thư mục data');
}

// Default database structure with sample data
function createDefaultData() {
    const adminPassword = bcrypt.hashSync('admin123', 10);
    const chiefPassword = bcrypt.hashSync('chief123', 10);
    const policePassword = bcrypt.hashSync('police123', 10);
    const memberPassword = bcrypt.hashSync('member123', 10);

    const users = [
        { id: uuidv4(), username: 'admin', password: adminPassword, full_name: 'Quản trị viên', phone: '0901234567', role: 'admin', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: uuidv4(), username: 'truongkp', password: chiefPassword, full_name: 'Nguyễn Văn An', phone: '0902345678', role: 'chief', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: uuidv4(), username: 'congan', password: policePassword, full_name: 'Trần Văn Bình', phone: '0903456789', role: 'police', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: uuidv4(), username: 'thanhvien', password: memberPassword, full_name: 'Lê Thị Cẩm', phone: '0904567890', role: 'member', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    ];

    // Sample households
    // household_status: normal, business, rental, poor, near_poor, policy
    const households = [
        { id: uuidv4(), household_code: 'HK001', address: '123 Đường Long Trường', house_number: '123', street: 'Long Trường', area: 'Tổ 1', household_type: 'permanent', household_status: 'business', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: uuidv4(), household_code: 'HK002', address: '45 Đường Nguyễn Duy Trinh', house_number: '45', street: 'Nguyễn Duy Trinh', area: 'Tổ 1', household_type: 'permanent', household_status: 'policy', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: uuidv4(), household_code: 'HK003', address: '78/2 Hẻm 234', house_number: '78/2', lane: '234', street: 'Long Trường', area: 'Tổ 2', household_type: 'permanent', household_status: 'normal', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: uuidv4(), household_code: 'HK004', address: '90 Đường Long Trường', house_number: '90', street: 'Long Trường', area: 'Tổ 2', household_type: 'temporary', household_status: 'rental', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: uuidv4(), household_code: 'HK005', address: '156 Đường Long Phước', house_number: '156', street: 'Long Phước', area: 'Tổ 3', household_type: 'permanent', household_status: 'normal', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    ];

    // Sample residents with current_address field
    const residents = [
        { id: uuidv4(), household_id: households[0].id, full_name: 'Nguyễn Văn Minh', birth_date: '1975-05-15', gender: 'Nam', id_number: '079123456789', phone: '0901111111', occupation: 'Kinh doanh', workplace: 'Công ty ABC', education: 'Đại học', ethnicity: 'Kinh', relationship: 'Chủ hộ', is_household_head: true, residence_type: 'permanent', residence_status: 'present', current_address: '123 Đường Long Trường, P. Long Trường', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: uuidv4(), household_id: households[0].id, full_name: 'Trần Thị Hoa', birth_date: '1978-08-20', gender: 'Nữ', id_number: '079123456790', phone: '0901111112', occupation: 'Nội trợ', education: 'THPT', ethnicity: 'Kinh', relationship: 'Vợ', is_household_head: false, residence_type: 'permanent', residence_status: 'present', current_address: '123 Đường Long Trường, P. Long Trường', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: uuidv4(), household_id: households[0].id, full_name: 'Nguyễn Văn Nam', birth_date: '2005-03-10', gender: 'Nam', id_number: '079123456791', occupation: 'Sinh viên', workplace: 'Đại học Bách khoa', education: 'Đại học', ethnicity: 'Kinh', relationship: 'Con', is_household_head: false, residence_type: 'permanent', residence_status: 'present', current_address: 'KTX Đại học Bách khoa, Q.10', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: uuidv4(), household_id: households[1].id, full_name: 'Lê Văn Tùng', birth_date: '1968-12-01', gender: 'Nam', id_number: '079234567890', phone: '0902222222', occupation: 'Hưu trí', education: 'Đại học', ethnicity: 'Kinh', relationship: 'Chủ hộ', is_household_head: true, residence_type: 'permanent', residence_status: 'present', current_address: '45 Đường Nguyễn Duy Trinh, P. Long Trường', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: uuidv4(), household_id: households[1].id, full_name: 'Phạm Thị Mai', birth_date: '1970-04-25', gender: 'Nữ', id_number: '079234567891', phone: '0902222223', occupation: 'Hưu trí', education: 'Trung cấp', ethnicity: 'Kinh', relationship: 'Vợ', is_household_head: false, residence_type: 'permanent', residence_status: 'present', current_address: '45 Đường Nguyễn Duy Trinh, P. Long Trường', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: uuidv4(), household_id: households[2].id, full_name: 'Hoàng Văn Đức', birth_date: '1985-07-18', gender: 'Nam', id_number: '079345678901', phone: '0903333333', occupation: 'Công nhân', workplace: 'Khu CN Thủ Đức', education: 'THPT', ethnicity: 'Kinh', relationship: 'Chủ hộ', is_household_head: true, residence_type: 'permanent', residence_status: 'present', current_address: '78/2 Hẻm 234, P. Long Trường', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: uuidv4(), household_id: households[2].id, full_name: 'Nguyễn Thị Lan', birth_date: '1988-11-30', gender: 'Nữ', id_number: '079345678902', phone: '0903333334', occupation: 'Công nhân', workplace: 'Khu CN Thủ Đức', education: 'THPT', ethnicity: 'Kinh', relationship: 'Vợ', is_household_head: false, residence_type: 'permanent', residence_status: 'present', current_address: '78/2 Hẻm 234, P. Long Trường', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: uuidv4(), household_id: households[2].id, full_name: 'Hoàng Văn Bảo', birth_date: '2015-02-14', gender: 'Nam', occupation: 'Học sinh', workplace: 'Trường TH Long Trường', education: 'Tiểu học', ethnicity: 'Kinh', relationship: 'Con', is_household_head: false, residence_type: 'permanent', residence_status: 'present', current_address: '78/2 Hẻm 234, P. Long Trường', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: uuidv4(), household_id: households[3].id, full_name: 'Võ Văn Hải', birth_date: '1990-01-22', gender: 'Nam', id_number: '079456789012', phone: '0904444444', occupation: 'Lái xe', education: 'THPT', ethnicity: 'Kinh', relationship: 'Chủ hộ', is_household_head: true, residence_type: 'temporary', residence_status: 'present', current_address: '90 Đường Long Trường (tạm trú)', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: uuidv4(), household_id: households[4].id, full_name: 'Đặng Văn Phong', birth_date: '1972-06-08', gender: 'Nam', id_number: '079567890123', phone: '0905555555', occupation: 'Buôn bán', workplace: 'Chợ Long Trường', education: 'THCS', religion: 'Phật giáo', ethnicity: 'Kinh', relationship: 'Chủ hộ', is_household_head: true, residence_type: 'permanent', residence_status: 'present', current_address: '156 Đường Long Phước, P. Long Trường', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: uuidv4(), household_id: households[4].id, full_name: 'Lý Thị Hương', birth_date: '1975-10-12', gender: 'Nữ', id_number: '079567890124', phone: '0905555556', occupation: 'Buôn bán', workplace: 'Chợ Long Trường', education: 'THCS', religion: 'Phật giáo', ethnicity: 'Kinh', relationship: 'Vợ', is_household_head: false, residence_type: 'permanent', residence_status: 'present', current_address: '156 Đường Long Phước, P. Long Trường', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: uuidv4(), household_id: households[4].id, full_name: 'Đặng Văn Long', birth_date: '1998-04-20', gender: 'Nam', id_number: '079567890125', phone: '0905555557', occupation: 'Nhân viên văn phòng', workplace: 'Công ty XYZ', education: 'Đại học', ethnicity: 'Kinh', relationship: 'Con', is_household_head: false, residence_type: 'permanent', residence_status: 'present', current_address: '156 Đường Long Phước, P. Long Trường', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    ];

    const notifications = [
        { id: uuidv4(), title: 'Thông báo về việc đóng phí vệ sinh tháng 1/2026', content: 'Kính gửi các hộ dân,\n\nĐề nghị các hộ đóng phí vệ sinh tháng 1/2026 trước ngày 15/01/2026.\n\nSố tiền: 30.000đ/hộ\nNơi thu: Nhà Trưởng khu phố\n\nTrân trọng!', type: 'fee', priority: 'high', target_type: 'all', is_pinned: true, created_at: new Date().toISOString() },
        { id: uuidv4(), title: 'Lịch họp khu phố đầu năm 2026', content: 'Khu phố tổ chức họp đầu năm 2026:\n\n- Thời gian: 19h00 ngày 20/01/2026\n- Địa điểm: Nhà văn hóa khu phố\n- Nội dung: Tổng kết năm 2025 và kế hoạch năm 2026\n\nĐề nghị các hộ cử đại diện tham dự đầy đủ.', type: 'meeting', priority: 'normal', target_type: 'all', is_pinned: true, created_at: new Date().toISOString() }
    ];

    return {
        settings: {
            neighborhood_name: 'Khu phố 25 - Long Trường',
            ward_name: 'Phường Long Trường',
            district_name: 'TP. Thủ Đức',
            city_name: 'TP. Hồ Chí Minh',
            contact_phone: '',
            contact_email: '',
            theme: 'light'
        },
        users,
        households,
        residents,
        notifications,
        events: [],
        activity_logs: []
    };
}

// Load or create database
let db;
if (existsSync(dbPath)) {
    try {
        const data = readFileSync(dbPath, 'utf-8');
        db = JSON.parse(data);
        console.log('📖 Đã tải database từ file');
    } catch (error) {
        console.error('Lỗi đọc database, tạo mới...', error);
        db = createDefaultData();
        writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
    }
} else {
    console.log('🆕 Khởi tạo database mới với dữ liệu mẫu...');
    db = createDefaultData();
    writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
    console.log('✅ Đã tạo database với dữ liệu mẫu');
    console.log('📋 Tài khoản: admin/admin123, truongkp/chief123, congan/police123, thanhvien/member123');
}

// Save database function
function saveDb() {
    try {
        writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
    } catch (error) {
        console.error('Lỗi lưu database:', error);
    }
}

// Database helper functions
const Database = {
    // Settings
    getSettings() {
        return db.settings;
    },

    getSetting(key) {
        return db.settings[key];
    },

    async updateSetting(key, value) {
        db.settings[key] = value;
        saveDb();
    },

    async updateSettings(settings) {
        db.settings = { ...db.settings, ...settings };
        saveDb();
    },

    // Users
    getUsers() {
        return db.users;
    },

    getUserById(id) {
        return db.users.find(u => u.id === id);
    },

    getUserByUsername(username) {
        return db.users.find(u => u.username === username && u.is_active);
    },

    async createUser(user) {
        const newUser = {
            id: uuidv4(),
            ...user,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        db.users.push(newUser);
        saveDb();
        return newUser;
    },

    async updateUser(id, updates) {
        const index = db.users.findIndex(u => u.id === id);
        if (index !== -1) {
            db.users[index] = {
                ...db.users[index],
                ...updates,
                updated_at: new Date().toISOString()
            };
            saveDb();
            return db.users[index];
        }
        return null;
    },

    async deleteUser(id) {
        const index = db.users.findIndex(u => u.id === id);
        if (index !== -1) {
            const deleted = db.users.splice(index, 1)[0];
            saveDb();
            return deleted;
        }
        return null;
    },

    // Households
    getHouseholds(filters = {}) {
        let households = [...db.households];

        if (filters.search) {
            const search = filters.search.toLowerCase();
            households = households.filter(h =>
                h.household_code?.toLowerCase().includes(search) ||
                h.address?.toLowerCase().includes(search) ||
                h.house_number?.toLowerCase().includes(search)
            );
        }

        if (filters.area) {
            households = households.filter(h => h.area === filters.area);
        }

        if (filters.type) {
            households = households.filter(h => h.household_type === filters.type);
        }

        if (filters.status) {
            households = households.filter(h => h.household_status === filters.status);
        }

        // Add member count and head name
        households = households.map(h => ({
            ...h,
            member_count: db.residents.filter(r => r.household_id === h.id).length,
            head_name: db.residents.find(r => r.household_id === h.id && r.is_household_head)?.full_name || null
        }));

        return households.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    },

    getHouseholdById(id) {
        const household = db.households.find(h => h.id === id);
        if (household) {
            const result = { ...household };
            result.members = db.residents.filter(r => r.household_id === id)
                .sort((a, b) => (b.is_household_head ? 1 : 0) - (a.is_household_head ? 1 : 0));
            return result;
        }
        return null;
    },

    getHouseholdByCode(code) {
        return db.households.find(h => h.household_code === code);
    },

    getAreas() {
        return [...new Set(db.households.map(h => h.area).filter(Boolean))];
    },

    async createHousehold(household) {
        const newHousehold = {
            id: uuidv4(),
            ...household,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        db.households.push(newHousehold);
        saveDb();
        return newHousehold;
    },

    async updateHousehold(id, updates) {
        const index = db.households.findIndex(h => h.id === id);
        if (index !== -1) {
            db.households[index] = {
                ...db.households[index],
                ...updates,
                updated_at: new Date().toISOString()
            };
            saveDb();
            return db.households[index];
        }
        return null;
    },

    async deleteHousehold(id) {
        const index = db.households.findIndex(h => h.id === id);
        if (index !== -1) {
            db.households.splice(index, 1);
            // Set household_id to null for residents
            db.residents.forEach(r => {
                if (r.household_id === id) r.household_id = null;
            });
            saveDb();
            return true;
        }
        return false;
    },

    // Residents
    getResidents(filters = {}) {
        let residents = [...db.residents];

        if (filters.search) {
            const search = filters.search.toLowerCase();
            residents = residents.filter(r =>
                r.full_name?.toLowerCase().includes(search) ||
                r.id_number?.includes(search) ||
                r.phone?.includes(search)
            );
        }

        if (filters.gender) {
            residents = residents.filter(r => r.gender === filters.gender);
        }

        if (filters.residenceType) {
            residents = residents.filter(r => r.residence_type === filters.residenceType);
        }

        if (filters.householdId) {
            residents = residents.filter(r => r.household_id === filters.householdId);
        }

        // Add household info and current_address
       residents = residents.map(r => {
            const household = db.households.find(h => h.id === r.household_id);
            return {
                ...r,
                household_code: household?.household_code || null,
                household_address: household?.address || null,
                current_address: r.current_address || household?.address || null,
                age: r.birth_date ? Math.floor((Date.now() - new Date(r.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null
            };
        });

        // --- BẮT ĐẦU ĐOẠN CẦN SỬA ---
        return residents.sort((a, b) => {
            // 1. Sắp xếp theo Mã hộ khẩu (Tăng dần: HK001, HK002...)
            // Dùng { numeric: true } để HK2 đứng trước HK10
            const codeA = a.household_code || 'ZZZ'; // Hộ chưa có mã xếp cuối
            const codeB = b.household_code || 'ZZZ';
            const codeCompare = codeA.localeCompare(codeB, undefined, { numeric: true });
            
            if (codeCompare !== 0) return codeCompare;

            // 2. Trong cùng 1 hộ, Chủ hộ xếp trước
            if (a.is_household_head && !b.is_household_head) return -1;
            if (!a.is_household_head && b.is_household_head) return 1;

            // 3. Cuối cùng sắp xếp theo Tên (A-Z)
            return (a.full_name || '').localeCompare(b.full_name || '');
        });
        // --- KẾT THÚC ĐOẠN CẦN SỬA ---
    },

    getResidentById(id) {
        const resident = db.residents.find(r => r.id === id);
        if (resident) {
            const result = { ...resident };
            const household = db.households.find(h => h.id === resident.household_id);
            result.household_code = household?.household_code || null;
            result.household_address = household?.address || null;
            return result;
        }
        return null;
    },

    async createResident(resident) {
        // If setting as head, clear existing head
        if (resident.is_household_head && resident.household_id) {
            db.residents.forEach(r => {
                if (r.household_id === resident.household_id) {
                    r.is_household_head = false;
                }
            });
        }

        const newResident = {
            id: uuidv4(),
            ...resident,
            ethnicity: resident.ethnicity || 'Kinh',
            residence_type: resident.residence_type || 'permanent',
            residence_status: resident.residence_status || 'present',
            is_household_head: resident.is_household_head || false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        db.residents.push(newResident);
        saveDb();
        return newResident;
    },

    async updateResident(id, updates) {
        const index = db.residents.findIndex(r => r.id === id);
        if (index !== -1) {
            // If setting as head, clear existing head
            if (updates.is_household_head) {
                const householdId = updates.household_id || db.residents[index].household_id;
                db.residents.forEach((r, i) => {
                    if (r.household_id === householdId && i !== index) {
                        r.is_household_head = false;
                    }
                });
            }

            db.residents[index] = {
                ...db.residents[index],
                ...updates,
                updated_at: new Date().toISOString()
            };
            saveDb();
            return db.residents[index];
        }
        return null;
    },

    async deleteResident(id) {
        const index = db.residents.findIndex(r => r.id === id);
        if (index !== -1) {
            const deleted = db.residents.splice(index, 1)[0];
            saveDb();
            return deleted;
        }
        return null;
    },

    // Notifications
    getNotifications(filters = {}) {
        let notifications = [...db.notifications];

        // Filter expired
        const now = new Date();
        notifications = notifications.filter(n =>
            !n.expires_at || new Date(n.expires_at) > now
        );

        if (filters.type) {
            notifications = notifications.filter(n => n.type === filters.type);
        }

        return notifications.sort((a, b) =>
            (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0) || new Date(b.created_at) - new Date(a.created_at)
        );
    },

    getNotificationById(id) {
        return db.notifications.find(n => n.id === id);
    },

    async createNotification(notification) {
        const creator = db.users.find(u => u.id === notification.created_by);
        const newNotification = {
            id: uuidv4(),
            ...notification,
            type: notification.type || 'general',
            priority: notification.priority || 'normal',
            target_type: notification.target_type || 'all',
            is_pinned: notification.is_pinned || false,
            created_by_name: creator?.full_name || null,
            created_at: new Date().toISOString()
        };
        db.notifications.push(newNotification);
        saveDb();
        return newNotification;
    },

    async updateNotification(id, updates) {
        const index = db.notifications.findIndex(n => n.id === id);
        if (index !== -1) {
            db.notifications[index] = {
                ...db.notifications[index],
                ...updates
            };
            saveDb();
            return db.notifications[index];
        }
        return null;
    },

    async deleteNotification(id) {
        const index = db.notifications.findIndex(n => n.id === id);
        if (index !== -1) {
            db.notifications.splice(index, 1);
            saveDb();
            return true;
        }
        return false;
    },

    // Activity Logs
    async logActivity(log) {
        const user = db.users.find(u => u.id === log.user_id);
        const newLog = {
            id: uuidv4(),
            ...log,
            user_name: user?.full_name || null,
            created_at: new Date().toISOString()
        };
        db.activity_logs.push(newLog);

        // Keep only last 500 logs
        if (db.activity_logs.length > 500) {
            db.activity_logs = db.activity_logs.slice(-500);
        }

        saveDb();
        return newLog;
    },

    getRecentActivity(limit = 10) {
        return db.activity_logs
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, limit);
    },

    // Statistics
    getOverviewStats() {
        const residents = db.residents;
        const byResidenceType = {};
        residents.forEach(r => {
            const type = r.residence_type || 'permanent';
            byResidenceType[type] = (byResidenceType[type] || 0) + 1;
        });

        return {
            totalHouseholds: db.households.length,
            totalResidents: residents.length,
            totalNotifications: db.notifications.filter(n =>
                !n.expires_at || new Date(n.expires_at) > new Date()
            ).length,
            byResidenceType: Object.entries(byResidenceType).map(([type, count]) => ({
                residence_type: type,
                count
            }))
        };
    },

    getDemographics() {
        const residents = db.residents;

        // By gender
        const byGender = {};
        residents.forEach(r => {
            if (r.gender) {
                byGender[r.gender] = (byGender[r.gender] || 0) + 1;
            }
        });

        // Age groups
        const ageGroups = {
            'Dưới 6 tuổi': 0,
            '6-14 tuổi': 0,
            '15-17 tuổi': 0,
            '18-34 tuổi': 0,
            '35-59 tuổi': 0,
            '60 tuổi trở lên': 0
        };

        residents.forEach(r => {
            if (r.birth_date) {
                const age = Math.floor((Date.now() - new Date(r.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
                if (age < 6) ageGroups['Dưới 6 tuổi']++;
                else if (age < 15) ageGroups['6-14 tuổi']++;
                else if (age < 18) ageGroups['15-17 tuổi']++;
                else if (age < 35) ageGroups['18-34 tuổi']++;
                else if (age < 60) ageGroups['35-59 tuổi']++;
                else ageGroups['60 tuổi trở lên']++;
            }
        });

        // Top occupations
        const occupations = {};
        residents.forEach(r => {
            if (r.occupation) {
                occupations[r.occupation] = (occupations[r.occupation] || 0) + 1;
            }
        });

        // Education
        const byEducation = {};
        residents.forEach(r => {
            if (r.education) {
                byEducation[r.education] = (byEducation[r.education] || 0) + 1;
            }
        });

        return {
            byGender: Object.entries(byGender).map(([gender, count]) => ({ gender, count })),
            ageGroups: Object.entries(ageGroups).map(([age_group, count]) => ({ age_group, count })).filter(a => a.count > 0),
            topOccupations: Object.entries(occupations)
                .map(([occupation, count]) => ({ occupation, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10),
            byEducation: Object.entries(byEducation).map(([education, count]) => ({ education, count }))
        };
    },

    getHouseholdStats() {
        const households = db.households;

        // By type
        const byType = {};
        households.forEach(h => {
            const type = h.household_type || 'permanent';
            byType[type] = (byType[type] || 0) + 1;
        });

        // By area
        const byArea = {};
        households.forEach(h => {
            const area = h.area || 'Chưa phân loại';
            byArea[area] = (byArea[area] || 0) + 1;
        });

        // Size distribution
        const sizes = households.map(h =>
            db.residents.filter(r => r.household_id === h.id).length
        );

        const sizeDistribution = {
            '1 người': 0,
            '2 người': 0,
            '3-4 người': 0,
            '5-6 người': 0,
            '7+ người': 0
        };

        sizes.forEach(size => {
            if (size === 1) sizeDistribution['1 người']++;
            else if (size === 2) sizeDistribution['2 người']++;
            else if (size <= 4) sizeDistribution['3-4 người']++;
            else if (size <= 6) sizeDistribution['5-6 người']++;
            else sizeDistribution['7+ người']++;
        });

        // By status (Tình trạng hộ)
        const byStatus = {};
        households.forEach(h => {
            const status = h.household_status || 'normal';
            byStatus[status] = (byStatus[status] || 0) + 1;
        });

        return {
            byType: Object.entries(byType).map(([type, count]) => ({ household_type: type, count })),
            byArea: Object.entries(byArea).map(([area, count]) => ({ area, count })).sort((a, b) => b.count - a.count),
            sizeDistribution: Object.entries(sizeDistribution).map(([size_group, count]) => ({ size_group, count })),
            byStatus: Object.entries(byStatus).map(([status, count]) => ({ status, count }))
        };
    },

    getTimelineStats() {
        const now = new Date();
        const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);

        const getMonth = (date) => {
            const d = new Date(date);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        };

        const residentsTimeline = {};
        const householdsTimeline = {};

        db.residents.forEach(r => {
            if (new Date(r.created_at) >= oneYearAgo) {
                const month = getMonth(r.created_at);
                residentsTimeline[month] = (residentsTimeline[month] || 0) + 1;
            }
        });

        db.households.forEach(h => {
            if (new Date(h.created_at) >= oneYearAgo) {
                const month = getMonth(h.created_at);
                householdsTimeline[month] = (householdsTimeline[month] || 0) + 1;
            }
        });

        return {
            residents: Object.entries(residentsTimeline).map(([period, count]) => ({ period, count })).sort((a, b) => a.period.localeCompare(b.period)),
            households: Object.entries(householdsTimeline).map(([period, count]) => ({ period, count })).sort((a, b) => a.period.localeCompare(b.period))
        };
    },

    getDemographicStats() {
        const residents = db.residents;

        // Age groups
        const ageGroups = {
            '0-14': 0,
            '15-24': 0,
            '25-39': 0,
            '40-54': 0,
            '55-64': 0,
            '65+': 0
        };

        const now = new Date();
        residents.forEach(r => {
            if (r.birth_date) {
                const age = Math.floor((now - new Date(r.birth_date)) / (365.25 * 24 * 60 * 60 * 1000));
                if (age < 15) ageGroups['0-14']++;
                else if (age < 25) ageGroups['15-24']++;
                else if (age < 40) ageGroups['25-39']++;
                else if (age < 55) ageGroups['40-54']++;
                else if (age < 65) ageGroups['55-64']++;
                else ageGroups['65+']++;
            }
        });

        // Gender distribution
        const genderDistribution = { Nam: 0, Nữ: 0 };
        residents.forEach(r => {
            if (r.gender === 'Nam') genderDistribution.Nam++;
            else if (r.gender === 'Nữ') genderDistribution.Nữ++;
        });

        // Top occupations
        const occupationCount = {};
        residents.forEach(r => {
            if (r.occupation) {
                occupationCount[r.occupation] = (occupationCount[r.occupation] || 0) + 1;
            }
        });
        const topOccupations = Object.entries(occupationCount)
            .map(([occupation, count]) => ({ occupation, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // Education distribution
        const educationCount = {};
        residents.forEach(r => {
            if (r.education) {
                educationCount[r.education] = (educationCount[r.education] || 0) + 1;
            }
        });
        const byEducation = Object.entries(educationCount)
            .map(([education, count]) => ({ education, count }));

        return {
            ageGroups: Object.entries(ageGroups).map(([group, count]) => ({ group, count })),
            genderDistribution,
            topOccupations,
            byEducation
        };
    },

    getOverviewStats() {
        const totalHouseholds = db.households.length;
        const totalResidents = db.residents.length;
        const permanentHouseholds = db.households.filter(h => h.household_type === 'permanent').length;
        const temporaryHouseholds = db.households.filter(h => h.household_type === 'temporary').length;

        return {
            total_households: totalHouseholds,
            total_residents: totalResidents,
            permanent_households: permanentHouseholds,
            temporary_households: temporaryHouseholds
        };
    },

   getFullDatabase() {
        return db;
    }
};

export default Database;