export declare enum EntityType {
    PROVEEDOR = "PROVEEDOR",
    CLIENTE = "CLIENTE",
    AMBOS = "AMBOS"
}
export declare class CreateBusinessEntityDto {
    entityType: EntityType;
    name: string;
    taxId?: string;
    email?: string;
    phone?: string;
    mobile?: string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    notes?: string;
    attributes?: Record<string, any>;
    creditLimit?: number;
    currentBalance?: number;
}
export declare class UpdateBusinessEntityDto {
    entityType?: EntityType;
    name?: string;
    taxId?: string;
    email?: string;
    phone?: string;
    mobile?: string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    notes?: string;
    attributes?: Record<string, any>;
    creditLimit?: number;
    currentBalance?: number;
    isActive?: boolean;
}
