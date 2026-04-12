import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth';

// ── PATCH /api/drivers/location ───────────────────────────────
export const updateDriverLocation = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { latitude, longitude } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res
        .status(400)
        .json({ error: 'latitude and longitude are required' });
    }

    const driver = await prisma.driver.update({
      where: { id: req.driverId },
      data: { latitude, longitude },
      select: { id: true, name: true, latitude: true, longitude: true },
    });

    return res.json({ driver });
  } catch (error) {
    console.error('[updateDriverLocation]', error);
    return res.status(500).json({ error: 'Failed to update location' });
  }
};

// ── PATCH /api/drivers/profile ────────────────────────────────
export const updateDriverProfile = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { name, phone } = req.body;

    if (!name && !phone) {
      return res
        .status(400)
        .json({ error: 'Provide at least one field to update' });
    }

    // Build update object dynamically — only update what was sent
    const data: { name?: string; phone?: string } = {};
    if (name)  data.name  = name;
    if (phone) data.phone = phone;

    // If updating phone, make sure it's not already taken
    if (phone) {
      const existing = await prisma.driver.findFirst({
        where: { phone, NOT: { id: req.driverId } },
      });
      if (existing) {
        return res.status(400).json({ error: 'Phone number already in use' });
      }
    }

    const driver = await prisma.driver.update({
      where: { id: req.driverId },
      data,
      select: { id: true, name: true, email: true, phone: true },
    });

    return res.json({ driver });
  } catch (error) {
    console.error('[updateDriverProfile]', error);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
};

// ── DELETE /api/drivers/account ───────────────────────────────
export const deleteDriverAccount = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    // Soft delete — set isActive: false, keep data for job history
    // Note: add isActive field to Driver model if not already there
    await prisma.driver.update({
      where: { id: req.driverId },
      data: { isActive: false },
    });

    return res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('[deleteDriverAccount]', error);
    return res.status(500).json({ error: 'Failed to delete account' });
  }
};