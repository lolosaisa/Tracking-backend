import { Router } from 'express';
import { getAllGarages, getGarageById, registerGarage } from '../controllers/garage';
const router = Router();
router.get('/', (req, res) => res.json({ message: 'Garage route works' }));
router.get('/', getAllGarages);
router.get('/:id', getGarageById);
router.post('/register', registerGarage);
export default router;