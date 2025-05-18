import { APIGatewayProxyEvent } from "aws-lambda";
import * as AWS from "aws-sdk";
import { hashPassword } from "../utils/password";
import { USERS_TABLE } from "../config/env";
import dynamo from "../utils/fake.db";

type SignupEvent = {
  username: string;
  password: string;
};

export const handler = async (event: SignupEvent) => {
  const { username, password } = event;

  if (!username || !password) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Username and password are required" }),
    };
  }

  const hashed = await hashPassword(password);

  const params = {
    TableName: USERS_TABLE,
    Item: {
      username,
      password: hashed,
    },
  };

  try {
    await dynamo.put(params);
    return {
      statusCode: 201,
      body: JSON.stringify({ message: "User created", data: params.Item }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error creating user" }),
    };
  }
};
