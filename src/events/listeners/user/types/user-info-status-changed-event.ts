import { Subjects } from "../subjects";

export interface UserInformationStatusChangedEvent {
    messageId: string,
    type: Subjects.USER_INFORMATION_STATUS_CHANGED,
    body: {
        userId: number,
        personalInfoStatus: string,
    }
}

export const userInformationStatusChangedValidationSchema = {
    type: "object",
    properties: {
      userId: { type: "number" },
      personalInfoStatus: { type: "string" },
    },
    required: ["userId", "personalInfoStatus"],
    additionalProperties: false,
}