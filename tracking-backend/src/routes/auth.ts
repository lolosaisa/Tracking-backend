import { Router } from 'express';
import { registerDriver, loginDriver, getMe } from '../controllers/auth';
import { authMiddleware } from '../middlewares/auth';
const router = Router();
router.get('/', (req, res) => res.json({ message: 'Authentication  route works' }));


router.post('/register', registerDriver);
router.post('/login',    loginDriver);
router.get('/me',        authMiddleware, getMe);

export default router;

