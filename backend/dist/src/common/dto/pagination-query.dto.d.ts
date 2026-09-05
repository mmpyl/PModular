export declare class PaginationQueryDto {
    page: number;
    pageSize: number;
    get skip(): number;
    get take(): number;
}
export type PaginatedResult<T> = {
    data: T[];
    meta: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
};
