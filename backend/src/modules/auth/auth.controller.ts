import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { loginSchema } from './dto/login.dto';
import { registerSchema } from './dto/register.dto';
import { catchAsync } from '../../utils/catch-async';

export class AuthController {
  /**
   * POST /api/v1/auth/register
   * Registra un nuevo usuario. NO inicia sesión automáticamente.
   */
  static register = catchAsync(async (req: Request, res: Response): Promise<void> => {
    // Validar y tipar el body con Zod. Lanza ZodError si los datos son inválidos.
    const data = registerSchema.parse(req.body);

    const result = await AuthService.register(data);

    res.status(201).json({
      success: true,
      message: 'Usuario registrado con éxito. Ahora puedes iniciar sesión.',
      user: result.user,
    });
  });

  /**
   * POST /api/v1/auth/login
   * Inicia sesión verificando credenciales y devuelve un JWT.
   */
  static login = catchAsync(async (req: Request, res: Response): Promise<void> => {
    // Validar y tipar el body con Zod
    const data = loginSchema.parse(req.body);

    const result = await AuthService.login(data);

    res.status(200).json({
      success: true,
      message: 'Inicio de sesión exitoso',
      user: result.user,
      token: result.token,
    });
  });
}
