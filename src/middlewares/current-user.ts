import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserPayload } from "../types/user-payload";
import { consulInstance } from "..";
import { NotAuthorizedError } from "../errors/not-authorized-error";
import { i18n } from "./translations";
import { UsersService } from "../services/users";
import { UserRole } from "../types/user-role";
import { UserType } from "../types/user-types";

export const currentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const consulClient = consulInstance.getConsulClient();
  const kvConfig = process.env.KV_PATH;
  const jwtKey = await consulClient.kv.get(kvConfig);

  const authHeader: any = req.headers["authorization"];
  if (!authHeader) {
    return next();
  }
  const [bearer, token] = authHeader.split(" ");

  if (bearer !== "Bearer" || !token) {
    return res.status(401).json({ error: "Invalid Bearer token format" });
  }

  try {
    // const decodedKey = Buffer.from(jwtKey.Value, 'base64');
    const payload = jwt.decode(token) as any;
    if (
      payload.user_type === UserType.INMIDI ||
      payload.user_type === UserType.INMIDI_BACKOFFICE ||
      payload?.auth === UserType.ROLE_ADMIN
    ) {
      req.currentUser = {
        id: payload.id,
        role: payload.auth,
        user_type: payload.user_type,
        sub: payload.sub,
      };
      req.token = token;

      return next();
    }

    const usersService = new UsersService();
    const existingUser = usersService.getUserById(payload.id);

    if (!existingUser) {
      throw new NotAuthorizedError(i18n.__("user_not_found"));
    }

    req.token = token;
    req.currentUser = {
      id: payload.id,
      role: payload.auth,
      user_type: payload.user_type,
      sub: payload.sub,
    };

    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      throw new NotAuthorizedError(i18n.__("token_expired"));
    } else {
      console.log(error);
      throw new NotAuthorizedError(error.message);
    }
  }
};
