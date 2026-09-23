import { OrganizationsService, BusinessSettingsDto } from './organizations.service';
export interface CreateOrganizationDto {
    name: string;
    businessTypeId: string;
    enabledModules?: string[];
    settings?: Record<string, any>;
}
export declare class OrganizationsController {
    private readonly organizationsService;
    constructor(organizationsService: OrganizationsService);
    create(createOrgDto: CreateOrganizationDto, user: {
        sub: string;
    }): Promise<any>;
    findAll(organizationId: string): any;
    findOne(id: string, organizationId: string): any;
    getBusinessSettings(id: string, organizationId: string): Promise<BusinessSettingsDto>;
    update(id: string, updateOrgDto: Partial<CreateOrganizationDto>, organizationId: string): Promise<any>;
    remove(id: string, organizationId: string): Promise<any>;
}
export declare class PlatformOrganizationsController {
    private readonly organizationsService;
    constructor(organizationsService: OrganizationsService);
    suspend(id: string): Promise<any>;
    reactivate(id: string): Promise<any>;
}
