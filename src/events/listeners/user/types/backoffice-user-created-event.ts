import { Subjects } from "../subjects";

export interface BackofficeUserCreatedEvent {
    messageId: string,
    type: Subjects.BACKOFFICE_USER_CREATED,
    body: {
        userId: number,
        userType: string
        role: string
        email: string
    }
}

export const backofficeUserCreatedValidationSchema = {
    type: "object",
    properties: {
      userId: { type: "number" },
      userType: { type: "string" },
      role: { type: "string" },
      email: { type: "string" },
    },
    required: ["userId", "userType", "role", "email"],
    additionalProperties: false,
}