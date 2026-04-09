import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { prisma } from './lib/prisma';

// Route files
import authRoutes      from './routes/auth';
import mechanicRoutes  from './routes/mechanics';
import driverRoutes    from './routes/drivers';
import garageRoutes    from './routes/garages';
import jobRoutes       from './routes/jobs';
import locationRoutes  from './routes/location';

dotenv.config(); //this has to run before anything else

const app = express();
const httpServer = createServer(app); //socket.io will attach here later for live tracking

app.use(express.json());

app.use(cors({
  origin: '*', // allow all origins in dev
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
}));

// Dev request logger — remove in production
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});
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
app.use('/api/location',  locationRoutes);


