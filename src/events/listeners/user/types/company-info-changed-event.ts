import { Subjects } from "../subjects";

export interface CompanyInfoChangedEvent {
  messageId: string;
  type: Subjects.COMPANY_INFO_UPDATED;
  body: {
    companyId: number;
    companyName: string;
  };
}

export const companyInfoChangedValidationSchema = {
  type: "object",
  properties: {
    companyId: { type: "number" },
    companyName: { type: "string" },
  },
  required: ["companyId", "companyName"],
  additionalProperties: false,
};
