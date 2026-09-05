import { PrismaClient, OrgRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const email = 'owner@pmodular.local';
const name = 'owner';
const organizationName = 'admin_owner';
const password = process.env.TEST_USER_PASSWORD || 'PmodularTest2026!';

async function main() {
  const businessType = await prisma.businessType.findFirst({
    orderBy: { code: 'asc' },
  });

  if (!businessType) {
    throw new Error('No hay tipos de negocio. Ejecuta primero el seed de Prisma.');
  }

  const organization = await prisma.organization.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: { name: organizationName },
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: organizationName,
      businessTypeId: businessType.id,
      enabledModules: [],
      settings: {},
    },
  });

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      password: await bcrypt.hash(password, 12),
    },
    create: {
      email,
      name,
      password: await bcrypt.hash(password, 12),
    },
  });

  await prisma.membership.upsert({
    where: {
      userId_organizationId: {
        userId: user.id,
        organizationId: organization.id,
      },
    },
    update: { role: OrgRole.OWNER },
    create: {
      userId: user.id,
      organizationId: organization.id,
      role: OrgRole.OWNER,
    },
  });

  console.log(`Usuario de prueba listo: ${email}`);
  console.log(`Organizacion: ${organization.name} (${organization.id})`);
  console.log(`Password: ${password}`);
}

main()
  .catch((error) => {
    console.error('No se pudo crear el usuario de prueba:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });