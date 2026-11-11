import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class BusinessTypesService {
  constructor(private readonly prisma: PrismaService) {}

  async seed() {
    const businessTypes = [
      {
        code: 'BODEGA',
        name: 'Bodega / Tienda de Conveniencia',
        description: 'Tienda de productos básicos y abarrotes',
        defaultModules: ['inventario', 'ventas', 'caja'],
        productSchema: {},
      },
      {
        code: 'FERRETERIA',
        name: 'Ferretería',
        description: 'Venta de herramientas, materiales y suministros',
        defaultModules: ['inventario', 'ventas', 'caja', 'fraccionamiento'],
        productSchema: {
          unidadFraccionable: { type: 'boolean' },
          equivalencia: { type: 'string' },
          material: { type: 'string' },
        },
      },
      {
        code: 'FARMACIA',
        name: 'Farmacia',
        description: 'Establecimiento de venta de medicamentos',
        defaultModules: ['inventario', 'ventas', 'caja', 'lotes'],
        productSchema: {
          requiereReceta: { type: 'boolean' },
          laboratorio: { type: 'string' },
          principioActivo: { type: 'string' },
        },
      },
    ];

    for (const bt of businessTypes) {
      await this.prisma.businessType.upsert({
        where: { code: bt.code },
        update: bt,
        create: bt,
      });
    }

    return businessTypes;
  }

  findAll() {
    return this.prisma.businessType.findMany({
      orderBy: { name: 'asc' },
    });
  }

  findOne(code: string) {
    return this.prisma.businessType.findUnique({
      where: { code },
    });
  }
}
