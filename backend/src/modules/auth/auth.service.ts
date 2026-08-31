import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppError } from '../../middleware/error.middleware';
import type { LoginDTO } from './dto/login.dto';
import type { RegisterDTO } from './dto/register.dto';

export class AuthService {
  /**
   * Registrar un nuevo usuario en la base de datos.
   * NOTA: Este método NO inicia sesión automáticamente.
   * Solo crea el usuario y devuelve confirmación.
   */
  static async register(data: RegisterDTO) {
    // 1. Verificar si el usuario ya existe por su correo
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError('El correo electrónico ya está registrado.', 409);
    }

    // 2. Encriptar la contraseña (hash con salt rounds 12 para mayor seguridad)
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // 3. Crear el usuario en PostgreSQL
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
      },
    });

    // 4. Retornar el usuario (sin la contraseña) SIN token
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  /**
   * Iniciar sesión verificando credenciales.
   * Este método SÍ genera un token JWT válido.
   */
  static async login(data: LoginDTO) {
    // 1. Buscar al usuario por correo
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new AppError('Credenciales incorrectas.', 401);
    }

    // 2. Comparar la contraseña ingresada con la encriptada
    const isMatch = await bcrypt.compare(data.password, user.password);

    if (!isMatch) {
      throw new AppError('Credenciales incorrectas.', 401);
    }

    // 3. Generar el token JWT
    const token = this.generateToken(user.id, user.email, user.role);

    // 4. Retornar la información básica del usuario y el token
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    };
  }

  /**
   * Método auxiliar para firmar tokens JWT.
   * Usa JWT_SECRET y JWT_EXPIRES_IN desde las variables de entorno validadas.
   */
  private static generateToken(userId: string, email: string, role: string): string {
    return jwt.sign(
      { sub: userId, email, role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
    );
  }
}
