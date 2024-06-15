import { Request, Response, NextFunction } from "express";
import { UserRole } from "../types/user-role";
import { NotAuthorizedError } from "../errors/not-authorized-error";
import { UserType } from "../types/user-types";

export const isValidUser = (req: Request, res: Response, next: NextFunction) => {

    const userRole = req.currentUser?.role
    const userType = req.currentUser?.user_type

    if(userType === UserType.INMIDI || userType === UserType.INMIDI_BACKOFFICE) {
        return next()
    }

    if (userRole === UserRole.ROLE_ADMIN || userRole === UserRole.ROLE_BACKOFFICE) {
        return next()
    }

    if (userRole === UserRole.ROLE_ISTEYIM_LEVEL_1) {
        throw new NotAuthorizedError("user_not_authorized")
    }


    next()
}

