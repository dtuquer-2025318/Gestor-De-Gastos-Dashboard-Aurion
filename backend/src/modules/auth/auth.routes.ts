import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// Mover la ruta /me aquí desde index.ts
router.get('/me', authMiddleware, (req, res) => {
  res.status(200).json({
    success: true,
    user: (req as any).user,
  });
});

export default router;