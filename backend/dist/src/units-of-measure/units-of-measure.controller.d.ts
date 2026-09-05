import { UnitsOfMeasureService } from './units-of-measure.service';
export interface CreateUnitOfMeasureDto {
    name: string;
    symbol?: string;
    isFractionable?: boolean;
}
export declare class UnitsOfMeasureController {
    private readonly unitsOfMeasureService;
    constructor(unitsOfMeasureService: UnitsOfMeasureService);
    create(createUnitDto: CreateUnitOfMeasureDto, organizationId: string): Promise<any>;
    findAll(organizationId: string): any;
    findOne(id: string, organizationId: string): any;
    remove(id: string, organizationId: string): Promise<any>;
}
