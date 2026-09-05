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
exports.UnitsOfMeasureService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let UnitsOfMeasureService = class UnitsOfMeasureService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(organizationId, data) {
        return this.prisma.unitOfMeasure.create({
            data: {
                organizationId,
                name: data.name,
                symbol: data.symbol,
                isFractionable: data.isFractionable ?? false,
            },
        });
    }
    findAll(organizationId) {
        return this.prisma.unitOfMeasure.findMany({
            where: { organizationId },
            orderBy: { name: 'asc' },
        });
    }
    findOne(organizationId, id) {
        return this.prisma.unitOfMeasure.findUnique({
            where: { id, organizationId },
        });
    }
    async update(organizationId, id, data) {
        const existing = await this.prisma.unitOfMeasure.findUnique({
            where: { id, organizationId },
        });
        if (!existing) {
            throw new common_1.NotFoundException(`Unidad de medida con ID ${id} no encontrada en esta organización`);
        }
        return this.prisma.unitOfMeasure.update({
            where: { id, organizationId },
            data,
        });
    }
    async remove(organizationId, id) {
        const existing = await this.prisma.unitOfMeasure.findUnique({
            where: { id, organizationId },
        });
        if (!existing) {
            throw new common_1.NotFoundException(`Unidad de medida con ID ${id} no encontrada en esta organización`);
        }
        return this.prisma.unitOfMeasure.delete({
            where: { id, organizationId },
        });
    }
};
exports.UnitsOfMeasureService = UnitsOfMeasureService;
exports.UnitsOfMeasureService = UnitsOfMeasureService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UnitsOfMeasureService);
//# sourceMappingURL=units-of-measure.service.js.map