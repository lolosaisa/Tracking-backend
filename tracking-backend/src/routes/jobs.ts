import { Router } from 'express';
const router = Router();
router.get('/', (req, res) => res.json({ message: 'job route works' }));
export default router;