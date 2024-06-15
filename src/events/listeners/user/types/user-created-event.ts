import { Subjects } from "../subjects";

export interface UserCreatedEvent {
  messageId: string;
  type: Subjects.NEW_USER_REGISTERED;
  body: {
    userId: number;
    name: string;
    surname: string;
    personalInfoStatus: string;
    resumeStatus: string;
  };
}

export const userCreatedValidationSchema = {
  type: "object",
  properties: {
    userId: { type: "number" },
    name: { type: "string" },
    surname: { type: "string" },
    email: { type: "string" },
    personalInfoStatus: { type: "string" },
    resumeStatus: { type: "string" },
  },
  required: ["userId", "name", "surname", "personalInfoStatus", "resumeStatus"],
  additionalProperties: true,
};
