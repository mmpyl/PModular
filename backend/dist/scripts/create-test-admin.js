"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new client_1.PrismaClient();
const email = 'admin@pmodular.local';
const name = 'Administrador de prueba';
const organizationId = '00000000-0000-0000-0000-000000000001';
const password = process.env.TEST_ADMIN_PASSWORD || 'PmodularAdmin2026!';
async function main() {
    const organization = await prisma.organization.findUnique({ where: { id: organizationId } });
    if (!organization)
        throw new Error('No existe admin_owner. Ejecuta primero npm run test:user -w backend.');
    const user = await prisma.user.upsert({
        where: { email },
        update: { name, password: await bcrypt.hash(password, 12) },
        create: { email, name, password: await bcrypt.hash(password, 12) },
    });
    await prisma.membership.upsert({
        where: { userId_organizationId: { userId: user.id, organizationId } },
        update: { role: client_1.OrgRole.ADMIN },
        create: { userId: user.id, organizationId, role: client_1.OrgRole.ADMIN },
    });
    console.log(`Usuario ADMIN listo: ${email}`);
    console.log(`Organizacion: ${organization.name} (${organization.id})`);
    console.log(`Password: ${password}`);
}
main()
    .catch((error) => {
    console.error('No se pudo crear el usuario ADMIN:', error);
    process.exitCode = 1;
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=create-test-admin.js.map