import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'khu_pho_25_long_truong_secret';
const JWT_EXPIRES_IN = '7d';

// Vai trò và quyền hạn
export const ROLES = {
    ADMIN: 'admin',
    CHIEF: 'chief',           // Trưởng khu phố
    POLICE: 'police',         // Công an khu vực
    MEMBER: 'member'          // Thành viên
};

// Quyền hạn theo vai trò
export const PERMISSIONS = {
    [ROLES.ADMIN]: ['*'],      // Toàn quyền
    [ROLES.CHIEF]: [
        'view_all', 'create_household', 'edit_household', 'delete_household',
        'create_resident', 'edit_resident', 'delete_resident',
        'create_notification', 'edit_notification', 'delete_notification',
        'create_event', 'edit_event', 'delete_event',
        'view_statistics', 'export_data', 'manage_settings'
    ],
    [ROLES.POLICE]: [
        'view_all', 'create_household', 'edit_household',
        'create_resident', 'edit_resident',
        'view_statistics', 'export_data', 'view_sensitive_data'
    ],
    [ROLES.MEMBER]: [
        'view_public', 'view_notifications', 'view_events', 'view_own_data'
    ]
};

// Tên hiển thị vai trò
export const ROLE_NAMES = {
    [ROLES.ADMIN]: 'Quản trị viên',
    [ROLES.CHIEF]: 'Trưởng khu phố',
    [ROLES.POLICE]: 'Công an khu vực',
    [ROLES.MEMBER]: 'Thành viên'
};

export function generateToken(user) {
    return jwt.sign(
        {
            id: user.id,
            username: user.username,
            role: user.role,
            fullName: user.full_name
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
}

export function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

export function hasPermission(role, permission) {
    const perms = PERMISSIONS[role] || [];
    return perms.includes('*') || perms.includes(permission);
}

export default {
    JWT_SECRET,
    JWT_EXPIRES_IN,
    ROLES,
    PERMISSIONS,
    ROLE_NAMES,
    generateToken,
    verifyToken,
    hasPermission
};
