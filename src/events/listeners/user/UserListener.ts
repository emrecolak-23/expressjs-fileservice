import amqp, { ConsumeMessage } from "amqplib";
import { User } from "../../../models/users";
import { Company } from "../../../models/companies";
import { Backoffice } from "../../../models/backoffice-user";
import { UserEvent } from "./types/user-event";
import {
  UserCreatedEvent,
  userCreatedValidationSchema,
} from "./types/user-created-event";
import {
  BackofficeUserCreatedEvent,
  backofficeUserCreatedValidationSchema,
} from "./types/backoffice-user-created-event";
import {
  NewCompanyRegisteredEvent,
  newCompanyRegisteredValidationSchema,
} from "./types/company-created-event";
import {
  RemoveIsteyimUserEvent,
  removeIsteyimUserValidationSchema,
} from "./types/user-removed-event";
import {
  CompanyInfoChangedEvent,
  companyInfoChangedValidationSchema,
} from "./types/company-info-changed-event";
import {
  UserInformationStatusChangedEvent,
  userInformationStatusChangedValidationSchema,
} from "./types/user-info-status-changed-event";
import {
  ResumeStatusChangedEvent,
  resumeStatusChangedValidationSchema,
} from "./types/resume-status-changed-event";
import {
  CompanyInfoStatusChangedEvent,
  companyInfoStatusChangedValidationSchema,
} from "./types/company-info-status-changed-event";
import {
  CompanyInfoCompletedEvent,
  companyInfoCompletedValidationSchema,
} from "./types/company-info-completed-event";
import { CompanyInfoReviewCompletedEvent } from "./types/company-info-review-completed-event";
import { Subjects } from "./subjects";
import { Listener } from "../BaseListener";

export class UserListener extends Listener {
  queueName = "file-control-service";

  onMessage(data: UserEvent["body"], type: string, msg: amqp.ConsumeMessage) {
    (async () => {
      switch (type) {
        case Subjects.NEW_USER_REGISTERED:
          if (!this.isValidEventData(data, userCreatedValidationSchema, msg)) {
            this.channel.nack(msg, false, false);
            return;
          }
          await this.handleUserCreatedEvent(
            data as UserCreatedEvent["body"],
            type,
            msg
          );
          break;
        case Subjects.USER_INFORMATION_STATUS_CHANGED:
          if (
            !this.isValidEventData(
              data,
              userInformationStatusChangedValidationSchema,
              msg
            )
          ) {
            this.channel.nack(msg, false, false);
            return;
          }
          await this.handleUserInformationStatusChanged(
            data as UserInformationStatusChangedEvent["body"],
            type,
            msg
          );
          break;
        case Subjects.NEW_COMPANY_REGISTERED:
          if (
            !this.isValidEventData(
              data,
              newCompanyRegisteredValidationSchema,
              msg
            )
          ) {
            this.channel.nack(msg, false, false);
            return;
          }
          await this.handleNewCompanyRegisterEvent(
            data as NewCompanyRegisteredEvent["body"],
            type,
            msg
          );
          break;
        case Subjects.REMOVE_ISTEYIM_USER:
          if (
            !this.isValidEventData(data, removeIsteyimUserValidationSchema, msg)
          ) {
            this.channel.nack(msg, false, false);
            return;
          }
          await this.handleRemoveIsteyimUser(
            data as RemoveIsteyimUserEvent["body"],
            type,
            msg
          );
          break;
        case Subjects.RESUME_STATUS_CHANGED:
          if (
            !this.isValidEventData(
              data,
              resumeStatusChangedValidationSchema,
              msg
            )
          ) {
            this.channel.nack(msg, false, false);
            return;
          }
          await this.handleResumeStatusChanged(
            data as ResumeStatusChangedEvent["body"],
            type,
            msg
          );
          break;
        case Subjects.COMPANY_INFO_UPDATED:
          if (
            !this.isValidEventData(
              data,
              companyInfoStatusChangedValidationSchema,
              msg
            )
          ) {
            this.channel.nack(msg, false, false);
            return;
          }
          await this.handleCompanyInfoStatusChanged(
            data as CompanyInfoStatusChangedEvent["body"],
            type,
            msg
          );
          break;
        case Subjects.COMPANY_INFO_COMPLETED:
          await this.handleCompanyInfoCompleted(
            data as CompanyInfoCompletedEvent["body"],
            type,
            msg
          );
          break;
        case Subjects.COMPANY_INFO_REVIEW_COMPLETED:
          if (
            !this.isValidEventData(
              data,
              companyInfoCompletedValidationSchema,
              msg
            )
          ) {
            this.channel.nack(msg, false, false);
            return;
          }
          await this.handleCompanyInfoReviewCompleted(
            data as CompanyInfoReviewCompletedEvent["body"],
            type,
            msg
          );
          break;
        case Subjects.BACKOFFICE_USER_CREATED:
          if (
            !this.isValidEventData(
              data,
              backofficeUserCreatedValidationSchema,
              msg
            )
          ) {
            this.channel.nack(msg, false, false);
            return;
          }
          await this.handleBackofficeUserCreated(
            data as BackofficeUserCreatedEvent["body"],
            type,
            msg
          );
          break;
        default:
          console.error(`Unsupported event type: ${type}`);
          break;
      }

      this.channel.ack(msg);
    })();
  }

  async handleNewCompanyRegisterEvent(
    data: NewCompanyRegisteredEvent["body"],
    type: string,
    msg: ConsumeMessage
  ) {
    try {
      const existingCompany = await Company.findOne({
        companyId: data.companyId,
      });
      console.log(existingCompany, "existingCompany");
      console.log(data, "data");
      if (existingCompany) {
        return;
      }
      const newCompany = Company.build({
        companyId: data.companyId,
        companyName: data.companyName,
        authorizedPersonName: data.authorizedPersonName,
        authorizedPersonSurname: data.authorizedPersonSurname || "",
        authorizedPersonEmail: data.authorizedPersonEmail,
      });

      await newCompany.save();
    } catch (error: any) {
      this.handleErrors(type, msg, error);
    }
  }

  async handleUserCreatedEvent(
    data: UserCreatedEvent["body"],
    type: string,
    msg: ConsumeMessage
  ) {
    try {
      const existingUser = await User.findOne({ userId: data.userId });
      if (existingUser) {
        return;
      }

      const newUser = User.build({
        userId: data.userId,
        name: data.name,
        surname: data.surname || "",
        personalInfoStatus: data.personalInfoStatus || "",
        resumeStatus: data.resumeStatus || "",
      });

      await newUser.save();
    } catch (error: any) {
      this.handleErrors(type, msg, error);
    }
  }

  async handleRemoveIsteyimUser(
    data: RemoveIsteyimUserEvent["body"],
    type: string,
    msg: ConsumeMessage
  ) {
    try {
      await User.deleteOne({ userId: data.userId });
    } catch (error: any) {
      this.handleErrors(type, msg, error);
    }
  }

  async handleBackofficeUserCreated(
    data: BackofficeUserCreatedEvent["body"],
    type: string,
    msg: ConsumeMessage
  ) {
    try {
      const newBackofficeUser = Backoffice.build({
        userId: data.userId,
        userType: data.userType,
        role: data.role,
        email: data.email,
      });

      await newBackofficeUser.save();
    } catch (error: any) {
      this.handleErrors(type, msg, error);
    }
  }

  async handleUserInformationStatusChanged(
    data: UserInformationStatusChangedEvent["body"],
    type: string,
    msg: ConsumeMessage
  ) {
    try {
      await User.updateOne(
        { userId: data.userId },
        { $set: { personalInfoStatus: data.personalInfoStatus } }
      );
    } catch (error: any) {
      this.handleErrors(type, msg, error);
    }
  }

  async handleResumeStatusChanged(
    data: ResumeStatusChangedEvent["body"],
    type: string,
    msg: ConsumeMessage
  ) {
    try {
      await User.updateOne(
        { userId: data.userId },
        { $set: { resumeStatus: data.resultStatus } }
      );
    } catch (error: any) {
      this.handleErrors(type, msg, error);
    }
  }

  async handleCompanyInfoStatusChanged(
    data: CompanyInfoStatusChangedEvent["body"],
    type: string,
    msg: ConsumeMessage
  ) {
    try {
      await Company.updateOne(
        { companyId: data.id },
        { $set: { companyName: data.name, customerInfoStatus: "ACCEPTED" } }
      );
    } catch (error: any) {
      this.handleErrors(type, msg, error);
    }
  }

  async handleCompanyInfoCompleted(
    data: CompanyInfoCompletedEvent["body"],
    type: string,
    msg: ConsumeMessage
  ) {
    try {
      await Company.updateOne(
        { companyId: data.companyId },
        { $set: { companyInfoStatus: data.companyInfoStatus } }
      );
    } catch (error: any) {
      this.handleErrors(type, msg, error);
    }
  }

  async handleCompanyInfoReviewCompleted(
    data: CompanyInfoReviewCompletedEvent["body"],
    type: string,
    msg: ConsumeMessage
  ) {
    try {
      await Company.updateOne(
        { companyId: data.companyId },
        { $set: { companyInfoStatus: data.status } }
      );
    } catch (error: any) {
      this.handleErrors(type, msg, error);
    }
  }
}
