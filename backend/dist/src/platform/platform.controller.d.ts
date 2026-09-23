import { PlatformService } from './platform.service';
import { PlatformPaginationQueryDto } from './dto/platform-pagination-query.dto';
import { PaginatedPlatformResult, PlatformOrganizationResponse, PlatformUserResponse, PlatformMetricsResponse } from './dto/platform-response.dto';
import { UpdatePlatformRoleDto } from './dto/update-platform-role.dto';
import { PlatformRole } from '@prisma/client';
export declare class PlatformController {
    private readonly platformService;
    constructor(platformService: PlatformService);
    findOrganizations(query: PlatformPaginationQueryDto): Promise<PaginatedPlatformResult<PlatformOrganizationResponse>>;
    findOrganizationById(id: string): Promise<PlatformOrganizationResponse>;
    findUsers(query: PlatformPaginationQueryDto): Promise<PaginatedPlatformResult<PlatformUserResponse>>;
    getMetrics(): Promise<PlatformMetricsResponse>;
    updatePlatformRole(userId: string, updateRoleDto: UpdatePlatformRoleDto, currentUser: {
        sub: string;
    }): Promise<{
        id: string;
        email: string;
        platformRole: PlatformRole | null;
    }>;
}
