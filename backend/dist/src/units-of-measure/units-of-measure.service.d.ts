import { PrismaService } from '../prisma.service';
export interface CreateUnitOfMeasureDto {
    name: string;
    symbol?: string;
    isFractionable?: boolean;
}
export declare class UnitsOfMeasureService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(organizationId: string, data: CreateUnitOfMeasureDto): Promise<{
        symbol: string | null;
        id: string;
        name: string;
        organizationId: string;
        isFractionable: boolean;
    }>;
    findAll(organizationId: string): import(".prisma/client").Prisma.PrismaPromise<{
        symbol: string | null;
        id: string;
        name: string;
        organizationId: string;
        isFractionable: boolean;
    }[]>;
    findOne(organizationId: string, id: string): import(".prisma/client").Prisma.Prisma__UnitOfMeasureClient<{
        symbol: string | null;
        id: string;
        name: string;
        organizationId: string;
        isFractionable: boolean;
    } | null, null, import("@prisma/client/runtime/library").DefaultArgs>;
    update(organizationId: string, id: string, data: Partial<CreateUnitOfMeasureDto>): Promise<{
        symbol: string | null;
        id: string;
        name: string;
        organizationId: string;
        isFractionable: boolean;
    }>;
    remove(organizationId: string, id: string): Promise<{
        symbol: string | null;
        id: string;
        name: string;
        organizationId: string;
        isFractionable: boolean;
    }>;
}
