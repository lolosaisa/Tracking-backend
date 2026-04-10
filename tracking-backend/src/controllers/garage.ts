import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { RegisterGarageBody } from '../middlewares/auth';

// ── GET /api/garages ──────────────────────────────────────────
export const getAllGarages = async (req: Request, res: Response) => {
  try {
    const garages = await prisma.garage.findMany({
      where: {
        isActive: true,
        verificationStatus: { not: 'REJECTED' },
      },
      select: {
        id: true,
        name: true,
        phone: true,
        latitude: true,
        longitude: true,
        address: true,
        verificationStatus: true,
        _count: {
          select: { mechanics: true }, // returns number of mechanics
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ garages, count: garages.length });
  } catch (error) {
    console.error('[getAllGarages]', error);
    return res.status(500).json({ error: 'Failed to fetch garages' });
  }
};

// ── GET /api/garages/:id ──────────────────────────────────────
export const getGarageById = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params;

    const garage = await prisma.garage.findUnique({
      where: { id },
      include: {
        mechanics: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            phone: true,
            specialization: true,
            verificationStatus: true,
            profilePhoto: true,
          },
        },
      },
    });

    if (!garage) {
      return res.status(404).json({ error: 'Garage not found' });
    }

    return res.json({ garage });
  } catch (error) {
    console.error('[getGarageById]', error);
    return res.status(500).json({ error: 'Failed to fetch garage' });
  }
};

// ── POST /api/garages/register ────────────────────────────────
export const registerGarage = async (
  req: Request<{}, {}, RegisterGarageBody>,
  res: Response
) => {
  try {
    const { name, phone, latitude, longitude, address } = req.body;

    if (!name || !phone || latitude === undefined || longitude === undefined) {
      return res
        .status(400)
        .json({ error: 'Name, phone, latitude and longitude are required' });
    }

    const existing = await prisma.garage.findUnique({ where: { phone } });
    if (existing) {
      return res.status(400).json({ error: 'Phone number already registered' });
    }

    const garage = await prisma.garage.create({
      data: { name, phone, latitude, longitude, address },
      select: {
        id: true,
        name: true,
        phone: true,
        address: true,
        verificationStatus: true,
        latitude: true,
        longitude: true,
        createdAt: true,
      },
    });

    return res.status(201).json({ garage });
  } catch (error) {
    console.error('[registerGarage]', error);
    return res.status(500).json({ error: 'Failed to register garage' });
  }
};