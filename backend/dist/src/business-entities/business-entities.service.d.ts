import { PrismaService } from '../prisma.service';
import { CreateBusinessEntityDto, UpdateBusinessEntityDto, EntityType } from './dto/create-business-entity.dto';
export declare class BusinessEntitiesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(organizationId: string, dto: CreateBusinessEntityDto): Promise<any>;
    findAll(organizationId: string, entityType?: EntityType, search?: string): Promise<any>;
    findOne(organizationId: string, id: string): Promise<any>;
    update(organizationId: string, id: string, dto: UpdateBusinessEntityDto): Promise<any>;
    remove(organizationId: string, id: string): Promise<any>;
    hardDelete(organizationId: string, id: string): Promise<any>;
}
