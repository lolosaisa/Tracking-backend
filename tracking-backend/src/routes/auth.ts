// import { Router } from 'express';
// const router = Router();
// router.get('/', (req, res) => res.json({ message: 'Authentication  route works' }));
// export default router;

// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  driverId?: string;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { driverId: string };
    req.driverId = decoded.driverId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};