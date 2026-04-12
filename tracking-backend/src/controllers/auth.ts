import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import {
  AuthRequest,
  RegisterDriverBody,
  LoginBody,
} from '../middlewares/auth';

// helper — keeps token signing in one place
const signToken = (driverId: string): string => {
  return jwt.sign(
    { driverId },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );
};

// ── POST /api/auth/register ───────────────────────────────────
export const registerDriver = async (
  req: Request<{}, {}, RegisterDriverBody>,
  res: Response
) => {
  try {
    const { name, email, phone, password } = req.body;

    // Validate all fields are present
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check email not already used
    const existingEmail = await prisma.driver.findUnique({
      where: { email },
    });
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Check phone not already used
    const existingPhone = await prisma.driver.findUnique({
      where: { phone },
    });
    if (existingPhone) {
      return res.status(400).json({ error: 'Phone number already registered' });
    }

    // Hash password — never store plaintext
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create the driver
    const driver = await prisma.driver.create({
      data: { name, email, phone, password: hashedPassword },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        // password is intentionally excluded
      },
    });

    const token = signToken(driver.id);

    return res.status(201).json({ driver, token });
  } catch (error) {
    console.error('[registerDriver]', error);
    return res.status(500).json({ error: 'Registration failed' });
  }
};

// ── POST /api/auth/login ──────────────────────────────────────
export const loginDriver = async (
  req: Request<{}, {}, LoginBody>,
  res: Response
) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find driver — same error for wrong email OR wrong password
    // (prevents attackers from knowing which field is wrong)
    const driver = await prisma.driver.findUnique({ where: { email } });
    if (!driver) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const passwordValid = await bcrypt.compare(password, driver.password);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken(driver.id);

    return res.json({
      driver: {
        id: driver.id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
      },
      token,
    });
  } catch (error) {
    console.error('[loginDriver]', error);
    return res.status(500).json({ error: 'Login failed' });
  }
};

// ── GET /api/auth/me ──────────────────────────────────────────
export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const driver = await prisma.driver.findUnique({
      where: { id: req.driverId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        latitude: true,
        longitude: true,
        createdAt: true,
      },
    });

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    return res.json({ driver });
  } catch (error) {
    console.error('[getMe]', error);
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
};