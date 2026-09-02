import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/role.middleware';
import * as controller from './income.controller';

const router = Router();

// Lectura: cualquier usuario autenticado
router.get('/', authMiddleware, controller.listar);
router.get('/kpis', authMiddleware, controller.kpis);

// Mutación: solo ADMIN
router.post('/', authMiddleware, requireAdmin, controller.crear);
router.put('/:id', authMiddleware, requireAdmin, controller.actualizar);
router.patch('/:id/anular', authMiddleware, requireAdmin, controller.anular);

export default router;