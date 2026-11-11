import { PrismaClient, PlatformRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error('Usage: npm run grant:platform-admin -- <email>');
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.error(`User with email "${email}" not found.`);
    process.exit(1);
  }

  if (user.platformRole === PlatformRole.PLATFORM_ADMIN) {
    console.log(`User "${email}" is already a Platform Admin.`);
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { platformRole: PlatformRole.PLATFORM_ADMIN },
  });

  console.log(`Successfully granted PLATFORM_ADMIN role to user "${email}".`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
