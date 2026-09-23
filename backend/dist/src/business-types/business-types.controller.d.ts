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
    findAll(): any;
    findOne(code: string): any;
}
