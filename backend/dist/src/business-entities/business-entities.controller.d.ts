import { BusinessEntitiesService } from './business-entities.service';
import { CreateBusinessEntityDto, UpdateBusinessEntityDto, EntityType } from './dto/create-business-entity.dto';
export declare class BusinessEntitiesController {
    private readonly businessEntitiesService;
    constructor(businessEntitiesService: BusinessEntitiesService);
    create(dto: CreateBusinessEntityDto, orgId: string): Promise<any>;
    findAll(orgId: string, entityType?: EntityType, search?: string): Promise<any>;
    findOne(id: string, orgId: string): Promise<any>;
    findOneWithHistory(id: string, orgId: string): Promise<any>;
    recalculateBalance(id: string, orgId: string): Promise<any>;
    checkCreditLimit(id: string, orgId: string): Promise<{
        withinLimit: boolean;
        currentBalance: number;
        creditLimit: number | null;
    }>;
    update(id: string, dto: UpdateBusinessEntityDto, orgId: string): Promise<any>;
    remove(id: string, orgId: string): Promise<any>;
}
