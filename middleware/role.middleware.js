import { hasPermission, ROLES } from '../config/auth.js';

export function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Chưa đăng nhập' });
        }

        // Admin always has access
        if (req.user.role === ROLES.ADMIN) {
            return next();
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Bạn không có quyền thực hiện thao tác này' });
        }

        next();
    };
}

export function requirePermission(permission) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Chưa đăng nhập' });
        }

        if (!hasPermission(req.user.role, permission)) {
            return res.status(403).json({ error: 'Bạn không có quyền thực hiện thao tác này' });
        }

        next();
    };
}

// Check if user can manage a specific resource
export function canManage(resourceType) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Chưa đăng nhập' });
        }

        const role = req.user.role;

        // Admin and Chief can manage everything
        if (role === ROLES.ADMIN || role === ROLES.CHIEF) {
            return next();
        }

        // Police can view and create/edit households and residents
        if (role === ROLES.POLICE) {
            if (['household', 'resident'].includes(resourceType)) {
                return next();
            }
        }

        return res.status(403).json({ error: 'Bạn không có quyền quản lý tài nguyên này' });
    };
}

export default { requireRole, requirePermission, canManage };
