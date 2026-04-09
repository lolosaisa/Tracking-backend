// src/routes/mechanics.ts
import { Router } from 'express';
const router = Router();
router.get('/', (req, res) => res.json({ message: 'mechanics route works' }));
export default router;