import { Subjects } from "../subjects";

export interface RemoveIsteyimUserEvent {
    messageId: string,
    type: Subjects.REMOVE_ISTEYIM_USER,
    body: {
        userId: number,
    }
}

export const removeIsteyimUserValidationSchema = {
    type: "object",
    properties: {
      userId: { type: "number" },
    },
    required: ["userId"],
    additionalProperties: false,
}