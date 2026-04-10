// ── controllers/mechanics.ts ─────────────────────────
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const getAllMechanics = async (req: Request, res: Response) => {
  try {
    const mechanics = await prisma.mechanic.findMany({
      where: {
        isActive: true,
        verificationStatus: { not: 'REJECTED' },
      },
      select: {
        id: true, name: true, phone: true,
        latitude: true, longitude: true,
        specialization: true, verificationStatus: true,
        profilePhoto: true,
      },
    });
    res.json({ mechanics });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch mechanics' });
  }
};

export const getMechanicById = async (
    req: Request<{ id:string}>,
     res: Response) => {
  try {
    const mechanic = await prisma.mechanic.findUnique({
      where: {id: req.params.id },
      include: { garage: true },   // joins garage data automatically
    });
    if (!mechanic) return res.status(404).json({ error: 'Mechanic not found' });
    res.json({ mechanic });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch mechanic' });
  }
};