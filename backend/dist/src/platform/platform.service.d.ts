import { PrismaService } from '../prisma.service';
import { PlatformPaginationQueryDto } from './dto/platform-pagination-query.dto';
import { PaginatedPlatformResult, PlatformOrganizationResponse, PlatformUserResponse } from './dto/platform-response.dto';
export declare class PlatformService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findOrganizations(query: PlatformPaginationQueryDto): Promise<PaginatedPlatformResult<PlatformOrganizationResponse>>;
    findOrganizationById(id: string): Promise<PlatformOrganizationResponse>;
    findUsers(query: PlatformPaginationQueryDto): Promise<PaginatedPlatformResult<PlatformUserResponse>>;
}
