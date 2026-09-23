import { PlatformService } from './platform.service';
import { PlatformPaginationQueryDto } from './dto/platform-pagination-query.dto';
import { PaginatedPlatformResult, PlatformOrganizationResponse, PlatformUserResponse, PlatformMetricsResponse } from './dto/platform-response.dto';
export declare class PlatformController {
    private readonly platformService;
    constructor(platformService: PlatformService);
    findOrganizations(query: PlatformPaginationQueryDto): Promise<PaginatedPlatformResult<PlatformOrganizationResponse>>;
    findOrganizationById(id: string): Promise<PlatformOrganizationResponse>;
    findUsers(query: PlatformPaginationQueryDto): Promise<PaginatedPlatformResult<PlatformUserResponse>>;
    getMetrics(): Promise<PlatformMetricsResponse>;
}
