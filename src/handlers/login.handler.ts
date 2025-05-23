import * as jwt from "jsonwebtoken";
import { verifyPassword } from "../utils/password";
import { JWT_SECRET, JWT_EXPIRY } from "../config/env";
import { getUserByEmail } from "../repositories/users.repository";

type LoginEvent = {
  email: string;
  password: string;
};

export const handler = async (event: LoginEvent) => {
  const { email, password } = event;
  if (!email || !password) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Username and password are required" }),
    };
  }

  const user = await getUserByEmail(email);
  if (!user) {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: "User not found" }),
    };
  }

  const stored = user.password;

  if (!stored || !(await verifyPassword(password, stored))) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Invalid credentials" }),
    };
  }

  const token = jwt.sign({ email }, JWT_SECRET, {
    expiresIn: JWT_EXPIRY,
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ token }),
  };
};
