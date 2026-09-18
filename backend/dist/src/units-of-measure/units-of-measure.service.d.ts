import { PrismaService } from '../prisma.service';
export interface CreateUnitOfMeasureDto {
    name: string;
    symbol?: string;
    isFractionable?: boolean;
}
export declare class UnitsOfMeasureService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(organizationId: string, data: CreateUnitOfMeasureDto): Promise<any>;
    findAll(organizationId: string): any;
    findOne(organizationId: string, id: string): any;
    update(organizationId: string, id: string, data: Partial<CreateUnitOfMeasureDto>): Promise<any>;
    remove(organizationId: string, id: string): Promise<any>;
}
