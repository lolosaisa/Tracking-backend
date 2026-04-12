// src/routes/mechanics.ts
import { Router } from 'express';
import { get } from 'node:http';
import { getAllMechanics, getMechanicById, registerMechanic, updateMechanicLocation } from '../controllers/mechanics';
import { register } from 'node:module';
const router = Router();

router.get('/', getAllMechanics);
router.get('/:id', getMechanicById);
router.post('/register', registerMechanic);
router.patch('/:id/location', updateMechanicLocation);

router.get('/', (req, res) => res.json({ message: 'mechanics route works' }));
export default router;