import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Poblando la base de datos con usuarios de prueba...');

  const hashedPassword = await bcrypt.hash('Password123!', 10);

  // 1. Administrador
  const admin = await (prisma as any).user.upsert({
    where: { email: 'admin@aurion.com' },
    update: {},
    create: {
      name: 'Administrador Aurion',
      email: 'admin@aurion.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  // 2. Usuario Común
  const user = await (prisma as any).user.upsert({
    where: { email: 'user@aurion.com' },
    update: {},
    create: {
      name: 'Usuario Estándar',
      email: 'user@aurion.com',
      password: hashedPassword,
      role: 'USER',
    },
  });

  console.log('Usuarios creados exitosamente:');
  console.log({ admin, user });
}

main()
  .catch((e) => {
    console.error('Error al poblar la base de datos:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });