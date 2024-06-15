export interface ListBriefcaseDto {
    page: number,
    pageSize: number,
    search: string,
    skip: number,
    status?: string,
    userId: number,
    sort: any

}