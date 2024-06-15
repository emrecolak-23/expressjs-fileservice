import { Subjects } from "../subjects";

export interface NewCompanyRegisteredEvent {
  messageId: string;
  type: Subjects.NEW_COMPANY_REGISTERED;
  body: {
    companyId: number;
    companyName: string;
    companyInfoStatus: string;
    authorizedPersonName: string;
    authorizedPersonSurname: string;
    authorizedPersonEmail: string;
  };
}

export const newCompanyRegisteredValidationSchema = {
  type: "object",
  properties: {
    companyId: { type: "number" },
    companyName: { type: "string" },
    authorizedPersonName: { type: "string" },
    authorizedPersonSurname: { type: "string" },
    authorizedPersonEmail: { type: "string" },
  },
  required: [
    "companyId",
    "companyName",
    "authorizedPersonName",
    "authorizedPersonSurname",
    "authorizedPersonEmail",
  ],
  additionalProperties: false,
};
