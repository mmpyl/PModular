import { BusinessTypesService } from './business-types.service';
export declare class BusinessTypesController {
    private readonly businessTypesService;
    constructor(businessTypesService: BusinessTypesService);
    seed(): Promise<({
        code: string;
        name: string;
        description: string;
        defaultModules: string[];
        productSchema: {
            unidadFraccionable?: undefined;
            equivalencia?: undefined;
            material?: undefined;
            requiereReceta?: undefined;
            laboratorio?: undefined;
            principioActivo?: undefined;
        };
    } | {
        code: string;
        name: string;
        description: string;
        defaultModules: string[];
        productSchema: {
            unidadFraccionable: {
                type: string;
            };
            equivalencia: {
                type: string;
            };
            material: {
                type: string;
            };
            requiereReceta?: undefined;
            laboratorio?: undefined;
            principioActivo?: undefined;
        };
    } | {
        code: string;
        name: string;
        description: string;
        defaultModules: string[];
        productSchema: {
            requiereReceta: {
                type: string;
            };
            laboratorio: {
                type: string;
            };
            principioActivo: {
                type: string;
            };
            unidadFraccionable?: undefined;
            equivalencia?: undefined;
            material?: undefined;
        };
    })[]>;
    findAll(): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        description: string | null;
        defaultModules: import("@prisma/client/runtime/library").JsonValue;
        productSchema: import("@prisma/client/runtime/library").JsonValue;
    }[]>;
    findOne(code: string): import(".prisma/client").Prisma.Prisma__BusinessTypeClient<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        description: string | null;
        defaultModules: import("@prisma/client/runtime/library").JsonValue;
        productSchema: import("@prisma/client/runtime/library").JsonValue;
    } | null, null, import("@prisma/client/runtime/library").DefaultArgs>;
}
