import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { CreateServer } from 'http';
import { prisma } from './lib/prisma';

//Route files
import authRoutes from './routes/auth';
import driveRoutes from './routes/drivers';
import garageRoutes from './routes/garages';
import jobsRoutes from './routes/jobs';
import mechanicsRoutes from './routes/mechanics';
import locationRoutes from './routes/location';

dotenv.config(); //this has to run before anything else

