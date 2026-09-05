import { OrganizationsService } from './organizations.service';
export interface CreateOrganizationDto {
    name: string;
    businessTypeId: string;
    enabledModules?: string[];
    settings?: Record<string, any>;
}
export declare class OrganizationsController {
    private readonly organizationsService;
    constructor(organizationsService: OrganizationsService);
    create(createOrgDto: CreateOrganizationDto): Promise<any>;
    findAll(): any;
    findOne(id: string): any;
    remove(id: string): Promise<any>;
}
