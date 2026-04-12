// // ── controllers/mechanics.ts ─────────────────────────
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { RegisterMechanicBody } from '../middlewares/auth';

// ── GET /api/mechanics ────────────────────────────────────────
export const getAllMechanics = async (req: Request, res: Response) => {
  try {
    const mechanics = await prisma.mechanic.findMany({
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
        specialization: true,
        verificationStatus: true,
        profilePhoto: true,
        garage: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ mechanics, count: mechanics.length });
  } catch (error) {
    console.error('[getAllMechanics]', error);
    return res.status(500).json({ error: 'Failed to fetch mechanics' });
  }
};

// ── GET /api/mechanics/:id ────────────────────────────────────
export const getMechanicById = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params;

    const mechanic = await prisma.mechanic.findUnique({
      where: { id },
      include: {
        garage: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            verificationStatus: true,
          },
        },
      },
    });

    if (!mechanic) {
      return res.status(404).json({ error: 'Mechanic not found' });
    }

    return res.json({ mechanic });
  } catch (error) {
    console.error('[getMechanicById]', error);
    return res.status(500).json({ error: 'Failed to fetch mechanic' });
  }
};

// ── POST /api/mechanics/register ─────────────────────────────
export const registerMechanic = async (
  req: Request<{}, {}, RegisterMechanicBody>,
  res: Response
) => {
  try {
    const { name, phone, latitude, longitude, specialization, garageId } =
      req.body;

    if (!name || !phone || latitude === undefined || longitude === undefined) {
      return res
        .status(400)
        .json({ error: 'Name, phone, latitude and longitude are required' });
    }

    // Check phone not already used
    const existing = await prisma.mechanic.findUnique({ where: { phone } });
    if (existing) {
      return res.status(400).json({ error: 'Phone number already registered' });
    }

    // If garageId provided, verify that garage exists
    if (garageId) {
      const garage = await prisma.garage.findUnique({ where: { id: garageId } });
      if (!garage) {
        return res.status(400).json({ error: 'Garage not found' });
      }
    }

    const mechanic = await prisma.mechanic.create({
      data: {
        name,
        phone,
        latitude,
        longitude,
        specialization,
        garageId: garageId || null,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        specialization: true,
        verificationStatus: true,
        latitude: true,
        longitude: true,
        createdAt: true,
      },
    });

    return res.status(201).json({ mechanic });
  } catch (error) {
    console.error('[registerMechanic]', error);
    return res.status(500).json({ error: 'Failed to register mechanic' });
  }
};

// ── PATCH /api/mechanics/:id/location ────────────────────────
export const updateMechanicLocation = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params;
    const { latitude, longitude } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res
        .status(400)
        .json({ error: 'latitude and longitude are required' });
    }

    const mechanic = await prisma.mechanic.update({
      where: { id },
      data: { latitude, longitude },
      select: { id: true, name: true, latitude: true, longitude: true },
    });

    return res.json({ mechanic });
  } catch (error) {
    console.error('[updateMechanicLocation]', error);
    return res.status(500).json({ error: 'Failed to update location' });
  }
};