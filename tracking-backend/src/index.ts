import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { prisma } from './lib/prisma';
import { Server } from 'socket.io';
import { registerSocketHandlers } from './sockets';

// Route files
import authRoutes      from './routes/auth';
import mechanicRoutes  from './routes/mechanics';
import driverRoutes    from './routes/drivers';
import garageRoutes    from './routes/garages';
import jobRoutes       from './routes/jobs';
//import locationRoutes  from './routes/location';

dotenv.config(); //this has to run before anything else

const app = express();
const httpServer = createServer(app); //socket.io will attach here later for live tracking

const io = new Server(httpServer, {
  cors: {
    origin: '*', // allow all origins in dev
    methods: ['GET', 'POST', ],
  },
  pingTimeout: 60000, // increase ping timeout for slow connections
  pingInterval: 25000, // how often to check if client is alive
});

app.use(express.json());

// ── middleware ──────────────────────────────────────────────

app.use(cors({
  origin: '*', // allow all origins in dev
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
}));

// Dev request logger — remove in production
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── Routes ──────────────────────────────────────────────

// Health check — always useful, no auth needed
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Mount all route groups
app.use('/api/auth',      authRoutes);
app.use('/api/mechanics', mechanicRoutes);
app.use('/api/drivers',   driverRoutes);
app.use('/api/garages',   garageRoutes);
app.use('/api/jobs',      jobRoutes);
//app.use('/api/location',  locationRoutes);
// 

// this Must come AFTER io is created, BEFORE httpServer.listen()(calling the socket handlers)
registerSocketHandlers(io);




// 404 — no route matched
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler — must have exactly 4 params
app.use((err: Error, _req: any, res: any, _next: any) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// ── Start the Server──────────────────────────────────────────────

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);

  // Test database connection on boot
  try {
    await prisma.$connect();
    console.log('Database connected');
  } catch (e) {
    console.error('Database connection failed:', e);
    process.exit(1); // crash fast — don't run with no DB
  }
});

// Clean shutdown — disconnect Prisma before process exits
process.on('SIGINT',  async () => { await prisma.$disconnect(); process.exit(0); });
process.on('SIGTERM', async () => { await prisma.$disconnect(); process.exit(0); });



