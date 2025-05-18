import { SignOptions, Secret } from "jsonwebtoken";

export const NODE_ENV = process.env.NODE_ENV ?? "development";
export const USERS_TABLE = process.env.USERS_TABLE ?? "UsersTable";
export const JWT_SECRET = (process.env.JWT_SECRET ??
  "default_secret") as Secret;
export const JWT_EXPIRY = (process.env.JWT_EXPIRY ??
  "1h") as SignOptions["expiresIn"];
