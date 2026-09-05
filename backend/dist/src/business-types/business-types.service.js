"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessTypesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let BusinessTypesService = class BusinessTypesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
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
    findOne(code) {
        return this.prisma.businessType.findUnique({
            where: { code },
        });
    }
};
exports.BusinessTypesService = BusinessTypesService;
exports.BusinessTypesService = BusinessTypesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BusinessTypesService);
//# sourceMappingURL=business-types.service.js.map