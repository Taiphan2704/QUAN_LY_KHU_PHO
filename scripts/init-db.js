import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'data');
const dbPath = join(dataDir, 'db.json');

// Create data directory
if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
    console.log('📁 Đã tạo thư mục data');
}

console.log('📦 Đang khởi tạo database...');

// Hash passwords
const adminPassword = bcrypt.hashSync('admin123', 10);
const chiefPassword = bcrypt.hashSync('chief123', 10);
const policePassword = bcrypt.hashSync('police123', 10);
const memberPassword = bcrypt.hashSync('member123', 10);

// Initial database
const db = {
    settings: {
        neighborhood_name: 'Khu phố 25 - Long Trường',
        ward_name: 'Phường Long Trường',
        district_name: 'TP. Thủ Đức',
        city_name: 'TP. Hồ Chí Minh',
        contact_phone: '',
        contact_email: '',
        theme: 'light'
    },
    users: [
        {
            id: uuidv4(),
            username: 'admin',
            password: adminPassword,
            full_name: 'Quản trị viên',
            email: null,
            phone: '0901234567',
            role: 'admin',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        },
        {
            id: uuidv4(),
            username: 'truongkp',
            password: chiefPassword,
            full_name: 'Nguyễn Văn An',
            email: null,
            phone: '0902345678',
            role: 'chief',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        },
        {
            id: uuidv4(),
            username: 'congan',
            password: policePassword,
            full_name: 'Trần Văn Bình',
            email: null,
            phone: '0903456789',
            role: 'police',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        },
        {
            id: uuidv4(),
            username: 'thanhvien',
            password: memberPassword,
            full_name: 'Lê Thị Cẩm',
            email: null,
            phone: '0904567890',
            role: 'member',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }
    ],
    households: [],
    residents: [],
    notifications: [
        {
            id: uuidv4(),
            title: 'Thông báo về việc đóng phí vệ sinh tháng 1/2026',
            content: 'Kính gửi các hộ dân,\n\nĐề nghị các hộ đóng phí vệ sinh tháng 1/2026 trước ngày 15/01/2026.\n\nSố tiền: 30.000đ/hộ\nNơi thu: Nhà Trưởng khu phố\n\nTrân trọng!',
            type: 'fee',
            priority: 'high',
            target_type: 'all',
            is_pinned: true,
            expires_at: null,
            created_at: new Date().toISOString()
        },
        {
            id: uuidv4(),
            title: 'Lịch họp khu phố đầu năm 2026',
            content: 'Khu phố tổ chức họp đầu năm 2026:\n\n- Thời gian: 19h00 ngày 20/01/2026\n- Địa điểm: Nhà văn hóa khu phố\n- Nội dung: Tổng kết năm 2025 và kế hoạch năm 2026\n\nĐề nghị các hộ cử đại diện tham dự đầy đủ.',
            type: 'meeting',
            priority: 'normal',
            target_type: 'all',
            is_pinned: true,
            expires_at: null,
            created_at: new Date().toISOString()
        }
    ],
    events: [],
    activity_logs: []
};

// Create sample households
const sampleHouseholds = [
    { code: 'HK001', address: '123 Đường Long Trường', house_number: '123', street: 'Long Trường', area: 'Tổ 1', type: 'permanent' },
    { code: 'HK002', address: '45 Đường Nguyễn Duy Trinh', house_number: '45', street: 'Nguyễn Duy Trinh', area: 'Tổ 1', type: 'permanent' },
    { code: 'HK003', address: '78/2 Hẻm 234', house_number: '78/2', lane: '234', street: 'Long Trường', area: 'Tổ 2', type: 'permanent' },
    { code: 'HK004', address: '90 Đường Long Trường', house_number: '90', street: 'Long Trường', area: 'Tổ 2', type: 'temporary' },
    { code: 'HK005', address: '156 Đường Long Phước', house_number: '156', street: 'Long Phước', area: 'Tổ 3', type: 'permanent' }
];

sampleHouseholds.forEach(h => {
    db.households.push({
        id: uuidv4(),
        household_code: h.code,
        address: h.address,
        house_number: h.house_number,
        lane: h.lane || null,
        street: h.street,
        area: h.area,
        household_type: h.type,
        phone: null,
        email: null,
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    });
});

console.log('✅ Đã tạo 5 hộ dân mẫu');

// Create sample residents
const sampleResidents = [
    // Household 1
    { hIdx: 0, name: 'Nguyễn Văn Minh', birth: '1975-05-15', gender: 'Nam', id: '079123456789', phone: '0901111111', job: 'Kinh doanh', work: 'Công ty ABC', edu: 'Đại học', rel: 'Chủ hộ', head: true },
    { hIdx: 0, name: 'Trần Thị Hoa', birth: '1978-08-20', gender: 'Nữ', id: '079123456790', phone: '0901111112', job: 'Nội trợ', edu: 'THPT', rel: 'Vợ', head: false },
    { hIdx: 0, name: 'Nguyễn Văn Nam', birth: '2005-03-10', gender: 'Nam', id: '079123456791', job: 'Sinh viên', work: 'Đại học Bách khoa', edu: 'Đại học', rel: 'Con', head: false },

    // Household 2
    { hIdx: 1, name: 'Lê Văn Tùng', birth: '1968-12-01', gender: 'Nam', id: '079234567890', phone: '0902222222', job: 'Hưu trí', edu: 'Đại học', rel: 'Chủ hộ', head: true },
    { hIdx: 1, name: 'Phạm Thị Mai', birth: '1970-04-25', gender: 'Nữ', id: '079234567891', phone: '0902222223', job: 'Hưu trí', edu: 'Trung cấp', rel: 'Vợ', head: false },

    // Household 3
    { hIdx: 2, name: 'Hoàng Văn Đức', birth: '1985-07-18', gender: 'Nam', id: '079345678901', phone: '0903333333', job: 'Công nhân', work: 'Khu CN Thủ Đức', edu: 'THPT', rel: 'Chủ hộ', head: true },
    { hIdx: 2, name: 'Nguyễn Thị Lan', birth: '1988-11-30', gender: 'Nữ', id: '079345678902', phone: '0903333334', job: 'Công nhân', work: 'Khu CN Thủ Đức', edu: 'THPT', rel: 'Vợ', head: false },
    { hIdx: 2, name: 'Hoàng Văn Bảo', birth: '2015-02-14', gender: 'Nam', job: 'Học sinh', work: 'Trường TH Long Trường', edu: 'Tiểu học', rel: 'Con', head: false },
    { hIdx: 2, name: 'Hoàng Thị Ngọc', birth: '2018-09-05', gender: 'Nữ', edu: 'Mầm non', rel: 'Con', head: false },

    // Household 4
    { hIdx: 3, name: 'Võ Văn Hải', birth: '1990-01-22', gender: 'Nam', id: '079456789012', phone: '0904444444', job: 'Lái xe', edu: 'THPT', rel: 'Chủ hộ', head: true, resType: 'temporary' },

    // Household 5
    { hIdx: 4, name: 'Đặng Văn Phong', birth: '1972-06-08', gender: 'Nam', id: '079567890123', phone: '0905555555', job: 'Buôn bán', work: 'Chợ Long Trường', edu: 'THCS', religion: 'Phật giáo', rel: 'Chủ hộ', head: true },
    { hIdx: 4, name: 'Lý Thị Hương', birth: '1975-10-12', gender: 'Nữ', id: '079567890124', phone: '0905555556', job: 'Buôn bán', work: 'Chợ Long Trường', edu: 'THCS', religion: 'Phật giáo', rel: 'Vợ', head: false },
    { hIdx: 4, name: 'Đặng Văn Long', birth: '1998-04-20', gender: 'Nam', id: '079567890125', phone: '0905555557', job: 'Nhân viên văn phòng', work: 'Công ty XYZ', edu: 'Đại học', rel: 'Con', head: false },
    { hIdx: 4, name: 'Đặng Thị Linh', birth: '2002-08-15', gender: 'Nữ', id: '079567890126', phone: '0905555558', job: 'Sinh viên', work: 'Đại học Kinh tế', edu: 'Đại học', rel: 'Con', head: false }
];

sampleResidents.forEach(r => {
    db.residents.push({
        id: uuidv4(),
        household_id: db.households[r.hIdx].id,
        full_name: r.name,
        birth_date: r.birth || null,
        gender: r.gender || null,
        id_number: r.id || null,
        phone: r.phone || null,
        email: null,
        occupation: r.job || null,
        workplace: r.work || null,
        education: r.edu || null,
        religion: r.religion || null,
        ethnicity: 'Kinh',
        relationship: r.rel,
        is_household_head: r.head || false,
        residence_type: r.resType || 'permanent',
        residence_status: 'present',
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    });
});

console.log('✅ Đã tạo 14 nhân khẩu mẫu');

// Write database
writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');

console.log('\n🎉 Khởi tạo database thành công!');
console.log('\n📋 Tài khoản đăng nhập:');
console.log('   Admin:       admin / admin123');
console.log('   Trưởng KP:   truongkp / chief123');
console.log('   Công an:     congan / police123');
console.log('   Thành viên:  thanhvien / member123');
