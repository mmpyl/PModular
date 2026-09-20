import { UnitsOfMeasureService } from './units-of-measure.service';
export interface CreateUnitOfMeasureDto {
    name: string;
    symbol?: string;
    isFractionable?: boolean;
}
export declare class UnitsOfMeasureController {
    private readonly unitsOfMeasureService;
    constructor(unitsOfMeasureService: UnitsOfMeasureService);
    create(createUnitDto: CreateUnitOfMeasureDto, organizationId: string): Promise<{
        symbol: string | null;
        name: string;
        id: string;
        organizationId: string;
        isFractionable: boolean;
    }>;
    findAll(organizationId: string): import(".prisma/client").Prisma.PrismaPromise<{
        symbol: string | null;
        name: string;
        id: string;
        organizationId: string;
        isFractionable: boolean;
    }[]>;
    findOne(id: string, organizationId: string): import(".prisma/client").Prisma.Prisma__UnitOfMeasureClient<{
        symbol: string | null;
        name: string;
        id: string;
        organizationId: string;
        isFractionable: boolean;
    } | null, null, import("@prisma/client/runtime/library").DefaultArgs>;
    update(id: string, updateUnitDto: Partial<CreateUnitOfMeasureDto>, organizationId: string): Promise<{
        symbol: string | null;
        name: string;
        id: string;
        organizationId: string;
        isFractionable: boolean;
    }>;
    remove(id: string, organizationId: string): Promise<{
        symbol: string | null;
        name: string;
        id: string;
        organizationId: string;
        isFractionable: boolean;
    }>;
}
