import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(join(__dirname, 'public')));

// Routes
import authRoutes from './routes/auth.routes.js';
import householdRoutes from './routes/household.routes.js';
import residentRoutes from './routes/resident.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import statisticsRoutes from './routes/statistics.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import aiRoutes from './routes/ai.routes.js';

app.use('/api/auth', authRoutes);
app.use('/api/households', householdRoutes);
app.use('/api/residents', residentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running', timestamp: new Date().toISOString() });
});

// Serve frontend for all other routes (SPA)
app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'public', 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Có lỗi xảy ra!' });
});

app.listen(PORT, () => {
    console.log(`🏘️  Khu phố 25 - Long Trường Server đang chạy tại http://localhost:${PORT}`);
});
