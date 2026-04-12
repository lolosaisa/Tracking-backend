import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth';

// ── POST /api/jobs ────────────────────────────────────────────
export const createJob = async (req: AuthRequest, res: Response) => {
  try {
    const { mechanicId, garageId, description } = req.body;

    // Must target either a mechanic or a garage, not neither
    if (!mechanicId && !garageId) {
      return res
        .status(400)
        .json({ error: 'Provide either a mechanicId or garageId' });
    }

    // Verify mechanic exists if provided
    if (mechanicId) {
      const mechanic = await prisma.mechanic.findUnique({
        where: { id: mechanicId },
      });
      if (!mechanic) {
        return res.status(404).json({ error: 'Mechanic not found' });
      }
    }

    // Verify garage exists if provided
    if (garageId) {
      const garage = await prisma.garage.findUnique({
        where: { id: garageId },
      });
      if (!garage) {
        return res.status(404).json({ error: 'Garage not found' });
      }
    }

    const job = await prisma.job.create({
      data: {
        driverId:   req.driverId!,
        mechanicId: mechanicId || null,
        garageId:   garageId   || null,
        description,
      },
      include: {
        driver:   { select: { id: true, name: true, phone: true } },
        mechanic: { select: { id: true, name: true, phone: true } },
        garage:   { select: { id: true, name: true, phone: true } },
      },
    });

    return res.status(201).json({ job });
  } catch (error) {
    console.error('[createJob]', error);
    return res.status(500).json({ error: 'Failed to create job' });
  }
};

// ── GET /api/jobs/my ──────────────────────────────────────────
export const getMyJobs = async (req: AuthRequest, res: Response) => {
  try {
    const jobs = await prisma.job.findMany({
      where: { driverId: req.driverId },
      include: {
        mechanic: {
          select: {
            id: true, name: true, phone: true,
            specialization: true, profilePhoto: true,
          },
        },
        garage: {
          select: { id: true, name: true, phone: true, address: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ jobs, count: jobs.length });
  } catch (error) {
    console.error('[getMyJobs]', error);
    return res.status(500).json({ error: 'Failed to fetch jobs' });
  }
};

// ── PATCH /api/jobs/:id/status ────────────────────────────────
export const updateJobStatus = async (req: AuthRequest, res: Response) => {
  try {
    const jobId = req.params.id as string;   
    const { status } = req.body;

    const validStatuses = [
      'PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED',
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const existing = await prisma.job.findUnique({
      where: { id: jobId },                  // explicit: id: jobId
    });

    if (!existing) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (existing.driverId !== req.driverId) {
      return res.status(403).json({ error: 'Not authorised to update this job' });
    }

    const job = await prisma.job.update({
      where: { id: jobId },                  // explicit: id: jobId
      data: { status },
      select: {
        id: true,
        status: true,
        updatedAt: true,                     // valid after migration
      },
    });

    return res.json({ job });
  } catch (error) {
    console.error('[updateJobStatus]', error);
    return res.status(500).json({ error: 'Failed to update job status' });
  }
};

// ── GET /api/jobs/:id ─────────────────────────────────────────
export const getJobById = async (req: AuthRequest, res: Response) => {
  try {
    const jobId = req.params.id as string;   // explicit — same fix

    const job = await prisma.job.findUnique({
      where: { id: jobId },                  // explicit: id: jobId
      include: {
        driver:   { select: { id: true, name: true, phone: true } },
        mechanic: { select: { id: true, name: true, phone: true, specialization: true } },
        garage:   { select: { id: true, name: true, phone: true, address: true } },
      },
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.driverId !== req.driverId) {
      return res.status(403).json({ error: 'Not authorised to view this job' });
    }

    return res.json({ job });
  } catch (error) {
    console.error('[getJobById]', error);
    return res.status(500).json({ error: 'Failed to fetch job' });
  }
};

// ── PATCH /api/jobs/:id/status ────────────────────────────────
// export const updateJobStatus = async (req: AuthRequest, res: Response) => {
//   try {
//     //explicitly specify jobId to avoid ambiquity with job.id in update data
//     const jobId = req.params.id as String;
//     const { status } = req.body;

//     const validStatuses = [
//       'PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED',
//     ];

//     if (!validStatuses.includes(status)) {
//       return res.status(400).json({ error: 'Invalid status value' });
//     }

//     // Verify job belongs to this driver before allowing update
//     const existing = await prisma.job.findUnique({ 
//         where: { id: jobId } 
//     });
//     if (!existing) {
//       return res.status(404).json({ error: 'Job not found' });
//     }
//     if (existing.driverId !== req.driverId) {
//       return res.status(403).json({ error: 'Not authorised to update this job' });
//     }

//     const job = await prisma.job.update({
//       where: { id: jobId },
//       data: { status },
//       select: { id: true, status: true, updatedAt: true },
//     });

//     return res.json({ job });
//   } catch (error) {
//     console.error('[updateJobStatus]', error);
//     return res.status(500).json({ error: 'Failed to update job status' });
//   }
// };

// // ── GET /api/jobs/:id ─────────────────────────────────────────
// export const getJobById = async (req: AuthRequest, res: Response) => {
//   try {
//     const { id } = req.params;

//     const job = await prisma.job.findUnique({
//       where: { id },
//       include: {
//         driver:   { select: { id: true, name: true, phone: true } },
//         mechanic: { select: { id: true, name: true, phone: true, specialization: true } },
//         garage:   { select: { id: true, name: true, phone: true, address: true } },
//       },
//     });

//     if (!job) {
//       return res.status(404).json({ error: 'Job not found' });
//     }

//     // Only the driver on this job can view it
//     if (job.driverId !== req.driverId) {
//       return res.status(403).json({ error: 'Not authorised to view this job' });
//     }

//     return res.json({ job });
//   } catch (error) {
//     console.error('[getJobById]', error);
//     return res.status(500).json({ error: 'Failed to fetch job' });
//   }
// };