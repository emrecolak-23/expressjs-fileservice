import { Subjects } from "../subjects";

export interface CompanyInfoStatusChangedEvent {
  messageId: string;
  type: Subjects.COMPANY_INFO_STATUS_CHANGED;
  body: {
    id: number;
    name: string;
  };
}

export const companyInfoStatusChangedValidationSchema = {
  type: "object",
  properties: {
    id: { type: "number" },
    name: { type: "string" },
  },
  required: ["id", "name"],
  additionalProperties: false,
};
