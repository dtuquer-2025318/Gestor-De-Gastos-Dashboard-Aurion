import { z } from 'zod';

/**
 * Lista de contraseñas comunes y débiles prohibidas.
 * El backend las rechaza inmediatamente para prevenir ataques de diccionario.
 */
const COMMON_PASSWORDS = [
  '123456',
  'password',
  'qwerty',
  '111111',
  '12345678',
  'abc123',
  'password123',
  '123456789',
  '1234567890',
  'admin',
  'aurion',
];

/**
 * Esquema de validación Zod para el registro de usuarios.
 * Valida nombre, email y contraseña con reglas de seguridad claras.
 * Las reglas se evalúan en orden; Zod devuelve SOLO el primer error que falle.
 */
export const registerSchema = z.object({
  name: z
    .string({ required_error: 'El nombre es obligatorio' })
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim(),

  email: z
    .string({ required_error: 'El correo electrónico es obligatorio' })
    .min(1, 'El correo electrónico es obligatorio')
    .email('El formato del correo electrónico no es válido')
    .max(255, 'El correo electrónico es demasiado largo')
    .trim()
    .toLowerCase(),

  password: z
    .string({ required_error: 'La contraseña es obligatoria' })
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(128, 'La contraseña no puede exceder 128 caracteres')
    .refine((val) => !COMMON_PASSWORDS.includes(val.toLowerCase()), {
      message: 'Tu contraseña es muy débil. Usa una combinación de letras y números.',
    })
    .refine((val) => !/^\d+$/.test(val), {
      message: 'Tu contraseña es muy débil. Usa una combinación de letras y números.',
    })
    .refine(
      (val) =>
        /[A-Z]/.test(val) &&   // al menos una mayúscula
        /[a-z]/.test(val) &&   // al menos una minúscula
        /[0-9]/.test(val) &&   // al menos un número
        /[^A-Za-z0-9]/.test(val), // al menos un símbolo especial
      {
        message: 'Usa solo letras, números o signos de puntuación comunes.',
      }
    ),
});

/**
 * Tipo inferido del esquema de registro.
 */
export type RegisterDTO = z.infer<typeof registerSchema>;