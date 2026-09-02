import express, { Response } from 'express';
import cors from 'cors';
import { env } from './config/env';
import authRoutes from './modules/auth/auth.routes';
import ingresosRoutes from './modules/income/income.routes';
import { errorMiddleware } from './middleware/error.middleware';
import { helmetConfig, authRateLimiter } from './config/security';

const app = express();

app.use(helmetConfig);
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(express.json());

app.get('/api/v1/health', (_req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

app.use('/api/v1/auth', authRateLimiter, authRoutes);

// ── ESTA LÍNEA SE MOVIÓ ARRIBA DEL 404 Y SE CORRIGIÓ EL PATH ──
app.use('/api/v1/ingresos', ingresosRoutes);

app.use((_req, res, _next) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: 'El endpoint solicitado no existe. Verifica la URL e intenta nuevamente.',
  });
});

app.use(errorMiddleware);

app.listen(env.PORT, () => {
  console.log(`🚀 Servidor backend escuchando en: http://localhost:${env.PORT}`);
  console.log(`📡 Health check disponible en: http://localhost:${env.PORT}/api/v1/health`);
  console.log(`🌐 CORS habilitado para: ${env.FRONTEND_URL}`);
  console.log(`🔧 Entorno: ${env.NODE_ENV}`);
});