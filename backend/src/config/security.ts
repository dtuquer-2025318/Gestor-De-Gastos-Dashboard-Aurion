import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { env } from './env';

/**
 * Configuración de Helmet: headers de seguridad HTTP.
 * Protege contra XSS, clickjacking, sniffing de MIME, etc.
 */
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Necesario para estilos inline de Angular
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false, // Deshabilitado para compatibilidad con recursos externos
});

/**
 * Rate limiter estricto para endpoints de autenticación.
 * Máximo 5 intentos por IP cada 15 minutos.
 * Esto mitiga ataques de fuerza bruta y diccionario.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // No contar logins exitosos
  message: {
    success: false,
    statusCode: 429,
    message: 'Demasiados intentos de inicio de sesión. Por favor intenta más tarde.',
  },
});