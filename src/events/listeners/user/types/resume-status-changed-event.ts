import { Subjects } from "../subjects";

export interface ResumeStatusChangedEvent {
  messageId: string;
  type: Subjects.RESUME_STATUS_CHANGED;
  body: {
    userId: number;
    resultStatus?: string;
  };
}

export const resumeStatusChangedValidationSchema = {
  type: "object",
  properties: {
    userId: { type: "number" },
    resultStatus: { type: "string" },
  },
  required: ["userId", "resultStatus"],
  additionalProperties: false,
};
