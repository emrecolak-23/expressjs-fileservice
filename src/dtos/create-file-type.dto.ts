export interface CreateFileTypeDto {
    name: string,
    isMultiple: boolean,
    extension: string[],
    mime: string[],
    isBrifcase: boolean,
    requiredPersonalInfoStatus: boolean,
    requiredResumeStatus: boolean,
    userType: string
}