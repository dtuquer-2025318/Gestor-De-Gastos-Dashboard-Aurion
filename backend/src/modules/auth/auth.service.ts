import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppError } from '../../middleware/error.middleware';
import type { LoginDTO } from './dto/login.dto';
import type { RegisterDTO } from './dto/register.dto';

export class AuthService {
  /**
   * Registrar un nuevo usuario con perfil extendido.
   * Valida unicidad de email y username antes de la creación.
   */
  static async register(data: RegisterDTO) {
    // 1. Verificar si el correo electrónico ya existe
    const existingEmail = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingEmail) {
      throw new AppError('El correo electrónico ya está registrado.', 409);
    }

    // 2. Verificar si el nombre de usuario ya existe
    const existingUsername = await prisma.user.findUnique({
      where: { username: data.username },
    });

    if (existingUsername) {
      throw new AppError('El nombre de usuario ya está en uso.', 409);
    }

    // 3. Encriptar la contraseña (hash con 12 rondas de salt)
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // 4. Crear el usuario en PostgreSQL
    const user = await prisma.user.create({
      data: {
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: hashedPassword,
        gender: data.gender,
        birthDate: new Date(data.birthDate),
        phone: data.phone,
      },
    });

    // 5. Retornar los datos del usuario (excluyendo la contraseña)
    return {
      user: {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    };
  }

  /**
   * Iniciar sesión verificando credenciales y registrando auditoría de acceso.
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

    // 3. Actualizar la marca de tiempo del último login y reiniciar contadores de bloqueo
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        failedAttempts: 0,
        lockedUntil: null,
      },
    });

    // 4. Generar el token JWT
    const token = this.generateToken(updatedUser.id, updatedUser.email, updatedUser.role);

    // 5. Retornar la información del usuario y el token de sesión
    return {
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        role: updatedUser.role,
        lastLoginAt: updatedUser.lastLoginAt,
      },
      token,
    };
  }

  /**
   * Método auxiliar para firmar tokens JWT de forma segura.
   */
  private static generateToken(userId: string, email: string, role: string): string {
    return jwt.sign(
      { sub: userId, email, role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
    );
  }
}