"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Sembrando datos iniciales...');
    const bodega = await prisma.businessType.upsert({
        where: { code: 'BODEGA' },
        update: {},
        create: {
            code: 'BODEGA',
            name: 'Bodega / Tienda de Barrio',
            description: 'Tienda de productos básicos y abarrotes',
            defaultModules: ['inventario', 'ventas', 'caja'],
            productSchema: {
                requiereReceta: { type: 'boolean', default: false },
                numeroLote: { type: 'string', default: null },
                fechaVencimiento: { type: 'date', default: null },
                esFraccionable: { type: 'boolean', default: false },
            },
        },
    });
    const ferreteria = await prisma.businessType.upsert({
        where: { code: 'FERRETERIA' },
        update: {},
        create: {
            code: 'FERRETERIA',
            name: 'Ferretería',
            description: 'Venta de herramientas, materiales y suministros',
            defaultModules: ['inventario', 'ventas', 'compras'],
            productSchema: {
                esFraccionable: { type: 'boolean', default: true },
                equivalencia: { type: 'string', default: null },
                material: { type: 'string', default: null },
                requiereMedidaEspecial: { type: 'boolean', default: false },
            },
        },
    });
    const farmacia = await prisma.businessType.upsert({
        where: { code: 'FARMACIA' },
        update: {},
        create: {
            code: 'FARMACIA',
            name: 'Farmacia',
            description: 'Venta de medicamentos y productos de salud',
            defaultModules: ['inventario', 'ventas', 'lotes', 'recetas'],
            productSchema: {
                requiereReceta: { type: 'boolean', default: false },
                numeroLote: { type: 'string', default: null },
                fechaVencimiento: { type: 'date', default: null },
                laboratorio: { type: 'string', default: null },
                principioActivo: { type: 'string', default: null },
                concentracion: { type: 'string', default: null },
            },
        },
    });
    console.log('✅ Tipos de negocio creados:', { bodega: bodega.id, ferreteria: ferreteria.id, farmacia: farmacia.id });
    const orgBodega = await prisma.organization.create({
        data: {
            name: 'Mi Bodega Express',
            businessTypeId: bodega.id,
            enabledModules: ['inventario', 'ventas', 'caja'],
            settings: { moneda: 'USD', zonaHoraria: 'America/Guatemala', impuestoDefault: 0.12 },
        },
    });
    const orgFerreteria = await prisma.organization.create({
        data: {
            name: 'Ferretería El Constructor',
            businessTypeId: ferreteria.id,
            enabledModules: ['inventario', 'ventas', 'compras'],
            settings: { moneda: 'USD', zonaHoraria: 'America/Guatemala', impuestoDefault: 0.12 },
        },
    });
    const orgFarmacia = await prisma.organization.create({
        data: {
            name: 'Farmacia Salud Total',
            businessTypeId: farmacia.id,
            enabledModules: ['inventario', 'ventas', 'lotes', 'recetas'],
            settings: { moneda: 'USD', zonaHoraria: 'America/Guatemala', impuestoDefault: 0.12 },
        },
    });
    console.log('✅ Organizaciones creadas:', { orgBodega: orgBodega.id, orgFerreteria: orgFerreteria.id, orgFarmacia: orgFarmacia.id });
    const categoriasBodega = [
        { name: 'Abarrotes', parentId: null },
        { name: 'Bebidas', parentId: null },
        { name: 'Lácteos', parentId: null },
        { name: 'Snacks', parentId: null },
    ];
    for (const cat of categoriasBodega) {
        await prisma.category.create({
            data: { ...cat, organizationId: orgBodega.id },
        });
    }
    const categoriasFerreteria = [
        { name: 'Tornillería', parentId: null },
        { name: 'Herramientas', parentId: null },
        { name: 'Pintura', parentId: null },
        { name: 'Electricidad', parentId: null },
        { name: 'Plomería', parentId: null },
    ];
    for (const cat of categoriasFerreteria) {
        await prisma.category.create({
            data: { ...cat, organizationId: orgFerreteria.id },
        });
    }
    const categoriasFarmacia = [
        { name: 'Analgésicos', parentId: null },
        { name: 'Antibióticos', parentId: null },
        { name: 'Vitaminas', parentId: null },
        { name: 'Cuidado Personal', parentId: null },
    ];
    for (const cat of categoriasFarmacia) {
        await prisma.category.create({
            data: { ...cat, organizationId: orgFarmacia.id },
        });
    }
    console.log('✅ Categorías precargadas completadas');
    const unidadesBodega = [
        { name: 'Unidad', symbol: 'u', isFractionable: false },
        { name: 'Kilogramo', symbol: 'kg', isFractionable: true },
        { name: 'Litro', symbol: 'L', isFractionable: true },
        { name: 'Caja', symbol: 'caja', isFractionable: false },
    ];
    for (const unit of unidadesBodega) {
        await prisma.unitOfMeasure.create({
            data: { ...unit, organizationId: orgBodega.id },
        });
    }
    const unidadesFerreteria = [
        { name: 'Unidad', symbol: 'u', isFractionable: false },
        { name: 'Metro', symbol: 'm', isFractionable: true },
        { name: 'Kilogramo', symbol: 'kg', isFractionable: true },
        { name: 'Litro', symbol: 'L', isFractionable: true },
        { name: 'Caja', symbol: 'caja', isFractionable: false },
    ];
    for (const unit of unidadesFerreteria) {
        await prisma.unitOfMeasure.create({
            data: { ...unit, organizationId: orgFerreteria.id },
        });
    }
    const unidadesFarmacia = [
        { name: 'Unidad', symbol: 'u', isFractionable: false },
        { name: 'Caja', symbol: 'caja', isFractionable: false },
        { name: 'Blister', symbol: 'blister', isFractionable: false },
        { name: 'Mililitro', symbol: 'mL', isFractionable: true },
    ];
    for (const unit of unidadesFarmacia) {
        await prisma.unitOfMeasure.create({
            data: { ...unit, organizationId: orgFarmacia.id },
        });
    }
    console.log('✅ Unidades de medida precargadas completadas');
    const catAbarrotes = await prisma.category.findUnique({
        where: { organizationId_name: { organizationId: orgBodega.id, name: 'Abarrotes' } },
    });
    const unitUnidadBodega = await prisma.unitOfMeasure.findUnique({
        where: { organizationId_name: { organizationId: orgBodega.id, name: 'Unidad' } },
    });
    const productoBodega = await prisma.product.create({
        data: {
            organizationId: orgBodega.id,
            name: 'Arroz Extra Premium',
            sku: 'ARR-001',
            price: 1.50,
            cost: 1.00,
            attributes: { esFraccionable: false },
            categoryId: catAbarrotes?.id,
            unitId: unitUnidadBodega?.id,
        },
    });
    const catTornilleria = await prisma.category.findUnique({
        where: { organizationId_name: { organizationId: orgFerreteria.id, name: 'Tornillería' } },
    });
    const unitUnidadFerreteria = await prisma.unitOfMeasure.findUnique({
        where: { organizationId_name: { organizationId: orgFerreteria.id, name: 'Unidad' } },
    });
    const productoFerreteria = await prisma.product.create({
        data: {
            organizationId: orgFerreteria.id,
            name: 'Tornillo 3/4 Pulgada',
            sku: 'TOR-001',
            price: 0.25,
            cost: 0.15,
            attributes: { esFraccionable: true, material: 'Acero' },
            categoryId: catTornilleria?.id,
            unitId: unitUnidadFerreteria?.id,
        },
    });
    const catAnalgésicos = await prisma.category.findUnique({
        where: { organizationId_name: { organizationId: orgFarmacia.id, name: 'Analgésicos' } },
    });
    const unitCajaFarmacia = await prisma.unitOfMeasure.findUnique({
        where: { organizationId_name: { organizationId: orgFarmacia.id, name: 'Caja' } },
    });
    const productoFarmacia = await prisma.product.create({
        data: {
            organizationId: orgFarmacia.id,
            name: 'Paracetamol 500mg',
            sku: 'PAR-001',
            price: 0.50,
            cost: 0.25,
            attributes: { requiereReceta: false, laboratorio: 'Genérico', principioActivo: 'Paracetamol', concentracion: '500mg' },
            categoryId: catAnalgésicos?.id,
            unitId: unitCajaFarmacia?.id,
        },
    });
    console.log('✅ Productos de ejemplo creados:', { productoBodega: productoBodega.id, productoFerreteria: productoFerreteria.id, productoFarmacia: productoFarmacia.id });
    console.log('\n🎉 ¡Seed completado exitosamente!');
}
main()
    .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map