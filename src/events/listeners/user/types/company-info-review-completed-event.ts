import { Subjects } from "../subjects";

export interface CompanyInfoReviewCompletedEvent {
    messageId: string,
    type: Subjects.COMPANY_INFO_REVIEW_COMPLETED,
    body: {
        companyId: number,
        status: string
    }
}

export const companyInfoReviewCompletedValidationSchema = {
    type: "object",
    properties: {
      companyId: { type: "number" },
      status: { type: "string"},
    },
    required: ["companyId", "status"],
    additionalProperties: false,
}