import { PrismaService } from '../prisma.service';
import { PlatformPaginationQueryDto } from './dto/platform-pagination-query.dto';
import { PaginatedPlatformResult, PlatformOrganizationResponse, PlatformUserResponse, PlatformMetricsResponse } from './dto/platform-response.dto';
import { PlatformRole } from '@prisma/client';
export declare class PlatformService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findOrganizations(query: PlatformPaginationQueryDto): Promise<PaginatedPlatformResult<PlatformOrganizationResponse>>;
    findOrganizationById(id: string): Promise<PlatformOrganizationResponse>;
    findUsers(query: PlatformPaginationQueryDto): Promise<PaginatedPlatformResult<PlatformUserResponse>>;
    getMetrics(): Promise<PlatformMetricsResponse>;
    updatePlatformRole(targetUserId: string, requestingUserId: string, newRole: PlatformRole | null): Promise<{
        id: string;
        email: string;
        platformRole: PlatformRole | null;
    }>;
}
