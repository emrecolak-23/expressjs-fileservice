import { Subjects } from "../subjects";

export interface CompanyInfoCompletedEvent {
    messageId: string,
    type: Subjects.COMPANY_INFO_COMPLETED,
    body: {
        companyId: number,
        companyName: string
        companyInfoStatus: string
    }
}

export const companyInfoCompletedValidationSchema = {
    type: "object",
    properties: {
      companyId: { type: "number" },
      status: { type: "string" },
    },
    required: ["companyId", "status"],
    additionalProperties: false,
}