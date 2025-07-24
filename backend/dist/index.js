"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
dotenv_1.default.config();
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
const PORT = 3001; // Changed from 5000 to 3001
// Enhanced CORS - must come BEFORE other middleware
app.use((0, cors_1.default)({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    optionsSuccessStatus: 200
}));
// Handle preflight requests
app.options('*', (0, cors_1.default)());
app.use(express_1.default.json());
// Add request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});
// Health check
app.get('/api/health', (req, res) => {
    console.log('Health check requested');
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
// Users endpoints
app.get('/api/users', async (req, res) => {
    try {
        console.log('Getting users...');
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(users);
    }
    catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});
// Incidents endpoints
app.get('/api/incidents', async (req, res) => {
    try {
        console.log('Getting incidents with query:', req.query);
        const { resolved } = req.query;
        const whereClause = resolved !== undefined ? { resolved: resolved === 'true' } : {};
        const incidents = await prisma.incident.findMany({
            where: whereClause,
            include: {
                camera: true
            },
            orderBy: { tsStart: 'desc' }
        });
        console.log(`Found ${incidents.length} incidents`);
        res.json(incidents);
    }
    catch (error) {
        console.error('Error fetching incidents:', error);
        res.status(500).json({ error: 'Failed to fetch incidents' });
    }
});
// Cameras endpoint
app.get('/api/cameras', async (req, res) => {
    try {
        const cameras = await prisma.camera.findMany({
            include: {
                incidents: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        });
        res.json(cameras);
    }
    catch (error) {
        console.error('Error fetching cameras:', error);
        res.status(500).json({ error: 'Failed to fetch cameras' });
    }
});
// Incident resolve endpoint
app.patch('/api/incidents/:id/resolve', async (req, res) => {
    try {
        const { id } = req.params;
        const incidentId = parseInt(id);
        if (isNaN(incidentId)) {
            return res.status(400).json({ error: 'Invalid incident ID' });
        }
        const incident = await prisma.incident.findUnique({
            where: { id: incidentId }
        });
        if (!incident) {
            return res.status(404).json({ error: 'Incident not found' });
        }
        const updatedIncident = await prisma.incident.update({
            where: { id: incidentId },
            data: { resolved: !incident.resolved },
            include: { camera: true }
        });
        res.json(updatedIncident);
    }
    catch (error) {
        console.error('Error updating incident:', error);
        res.status(500).json({ error: 'Failed to update incident' });
    }
});
// Catch-all error handler
app.use((req, res) => {
    console.log(`404 - Route not found: ${req.method} ${req.path}`);
    res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});
// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');
    await prisma.$disconnect();
    process.exit(0);
});
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 SecureSight API running on http://localhost:${PORT}`);
    console.log(`📹 Available endpoints:`);
    console.log(`   GET  /api/health`);
    console.log(`   GET  /api/users`);
    console.log(`   GET  /api/cameras`);
    console.log(`   GET  /api/incidents`);
    console.log(`   PATCH /api/incidents/:id/resolve`);
    console.log(`\n🔧 CORS enabled for: http://localhost:3000`);
});
