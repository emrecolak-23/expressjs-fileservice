import { Publisher, Event } from "../base-publisher";

export class CompanyLogoPublisher extends Publisher<Event> {
  constructor(channel: any) {
    super(channel, [
      "user-management-service",
      "interview-message-service",
      "company-info-management-service",
      "inmidi-review-service",
    ]);
  }
}
