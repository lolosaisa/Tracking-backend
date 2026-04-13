import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { updateDriverLocation, deleteDriverAccount, updateDriverProfile } from '../controllers/drivers';
const router = Router();
router.get('/', authMiddleware, (req, res) => res.json({ message: 'Driver route works' }));
router.patch('/location', authMiddleware, updateDriverLocation);
router.delete('/delete', authMiddleware, deleteDriverAccount);
router.patch('/account', authMiddleware, updateDriverProfile);
export default router;