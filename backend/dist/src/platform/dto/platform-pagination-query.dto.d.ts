export declare class PlatformPaginationQueryDto {
    page: number;
    pageSize: number;
    search?: string;
    get skip(): number;
    get take(): number;
}
