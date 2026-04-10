// src/routes/mechanics.ts
import { Router } from 'express';
import { get } from 'node:http';
import { getAllMechanics, getMechanicById } from '../controllers/mechanics';
const router = Router();

router.get('/', getAllMechanics);
router.get('/:id', getMechanicById);

router.get('/', (req, res) => res.json({ message: 'mechanics route works' }));
export default router;