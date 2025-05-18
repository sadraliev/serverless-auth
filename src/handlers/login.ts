import { APIGatewayProxyEvent } from "aws-lambda";
import * as AWS from "aws-sdk";
import * as jwt from "jsonwebtoken";
import { verifyPassword } from "../utils/password";
import { USERS_TABLE, JWT_SECRET, JWT_EXPIRY } from "../config/env";
import dynamo from "../utils/fake.db";

type LoginEvent = {
  username: string;
  password: string;
};

export const handler = async (event: LoginEvent) => {
  const { username, password } = event;
  if (!username || !password) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Username and password are required" }),
    };
  }

  const user = await dynamo.get({
    TableName: USERS_TABLE,
    Key: { username },
  });

  const stored = user.Item?.password;

  if (!stored || !(await verifyPassword(password, stored))) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Invalid credentials" }),
    };
  }

  const token = jwt.sign({ username }, JWT_SECRET, {
    expiresIn: JWT_EXPIRY,
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ token }),
  };
};
