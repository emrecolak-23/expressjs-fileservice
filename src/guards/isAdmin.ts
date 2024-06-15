import { Request, Response, NextFunction } from "express";
import { UserType } from "../types/user-types";
import { NotAuthorizedError } from "../errors/not-authorized-error";

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {

    const userRole = req.currentUser?.role

    if (userRole === UserType.ROLE_ADMIN) {
        return next()
    }

    throw new NotAuthorizedError("user_not_authorized")

}