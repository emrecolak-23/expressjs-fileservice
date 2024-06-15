import { Subjects } from "../subjects";
type DataObject = {
    [key: string]: number | string;
};


export interface UserEvent {
    messageId: string,
    type: Subjects.NEW_USER_REGISTERED | Subjects.NEW_COMPANY_REGISTERED | Subjects.REMOVE_ISTEYIM_USER | Subjects.BACKOFFICE_USER_CREATED,
    body: DataObject
}