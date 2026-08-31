import { z } from 'zod';

/**
 * Esquema de validación Zod para el registro de usuarios.
 * Valida nombre, email y contraseña con reglas de seguridad claras.
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