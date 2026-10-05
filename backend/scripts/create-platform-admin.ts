import { PlatformRole, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const [email, ...nameParts] = process.argv.slice(2);
  const name = nameParts.join(' ').trim();

  if (!email || !name) {
    throw new Error('Usage: npm run create:platform-admin -w backend -- <email> <name>');
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error(`Ya existe una cuenta con el correo ${email}. No se realizaron cambios.`);
  }

  const password = randomBytes(24).toString('base64url');
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: passwordHash,
      platformRole: PlatformRole.PLATFORM_ADMIN,
    },
  });

  console.log(`Cuenta global creada: ${user.email}`);
  console.log(`Acceso: http://localhost:3000/platform/login`);
  console.log(`Contraseña temporal (guárdala ahora): ${password}`);
}

main()
  .catch((error) => {
    console.error('No se pudo crear la cuenta global:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });