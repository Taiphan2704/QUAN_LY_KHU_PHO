import { verifyToken } from '../config/auth.js';
import Database from '../config/database.js';

export function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Không có token xác thực' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
        return res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
    }

    // Get user from database
    const user = Database.getUserById(decoded.id);

    if (!user || !user.is_active) {
        return res.status(401).json({ error: 'Người dùng không tồn tại hoặc đã bị vô hiệu hóa' });
    }

    req.user = {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        role: user.role,
        email: user.email,
        phone: user.phone
    };

    next();
}

// Optional auth - doesn't fail if no token
export function optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);

        if (decoded) {
            const user = Database.getUserById(decoded.id);
            if (user && user.is_active) {
                req.user = {
                    id: user.id,
                    username: user.username,
                    fullName: user.full_name,
                    role: user.role
                };
            }
        }
    }

    next();
}

export default { authMiddleware, optionalAuth };
