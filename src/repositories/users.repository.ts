import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { hashPassword } from "../utils/password";
import {
  DeleteItemCommand,
  DynamoDBClient,
  ScanCommand,
  ScanCommandInput,
} from "@aws-sdk/client-dynamodb";

const USERS_TABLE = "users";
const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);

export interface User {
  email: string;
  password: string;
}

export interface UserResponse {
  ok: boolean;
  message: string;
  statusCode: number;
  user?: User;
  pagintation?: {
    lastKey: string;
  };
}

export const createUser = async (user: User): Promise<UserResponse> => {
  // Check if user already exists
  const existingUser = await getUserByEmail(user.email);
  if (existingUser.ok) {
    return {
      ok: false,
      message: "User already exists",
      statusCode: 409,
    };
  }

  const hashedPassword = await hashPassword(user.password);
  const newUser = { ...user, password: hashedPassword };

  await dynamo.send(
    new PutCommand({
      TableName: USERS_TABLE,
      Item: newUser,
    })
  );

  return {
    ok: true,
    message: "User created successfully",
    statusCode: 201,
    user: newUser,
  };
};

export async function getUsersPage(limit = 10, lastKey?: Record<string, any>) {
  const params: ScanCommandInput = {
    TableName: USERS_TABLE,
    Limit: limit,
    ExclusiveStartKey: lastKey,
  };

  const result = await client.send(new ScanCommand(params));

  return {
    ok: true,
    message: "Users retrieved successfully",
    statusCode: 200,
    users: result.Items,
    pagintation: {
      lastKey: result.LastEvaluatedKey ? result.LastEvaluatedKey : null,
    },
  };
}

export async function deleteUser(userId: string) {
  await client.send(
    new DeleteItemCommand({
      TableName: "Users",
      Key: {
        userId: { S: userId },
      },
    })
  );

  return {
    ok: true,
    message: "User deleted successfully",
    statusCode: 200,
  };
}
export async function getUserById(userId: string) {
  const result = await client.send(
    new ScanCommand({
      TableName: "Users",
      FilterExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": { S: userId },
      },
    })
  );

  if (!result.Items || result.Items.length === 0) {
    return {
      ok: false,
      message: "User not found",
      statusCode: 404,
    };
  }

  return {
    ok: true,
    message: "User found",
    statusCode: 200,
    user: result.Items[0],
  };
}
export async function getUserByEmail(email: string) {
  const result = await client.send(
    new ScanCommand({
      TableName: "Users",
      FilterExpression: "email = :email",
      ExpressionAttributeValues: {
        ":email": { S: email },
      },
    })
  );
  if (!result.Items || result.Items.length === 0) {
    return {
      ok: false,
      message: "User not found",
      statusCode: 404,
    };
  }

  return {
    ok: true,
    message: "User found",
    statusCode: 200,
    user: result.Items[0],
  };
}

export const updateUserByEmail = async (
  email: string,
  user: Partial<User>
): Promise<UserResponse> => {
  const existingUser = await getUserByEmail(email);
  if (!existingUser) {
    return {
      ok: false,
      message: "User not found",
      statusCode: 404,
    };
  }

  const updatedUser = { ...existingUser, ...user };

  await dynamo.send(
    new PutCommand({
      TableName: USERS_TABLE,
      Item: updatedUser,
    })
  );

  return {
    ok: true,
    message: "User updated successfully",
    statusCode: 200,
  };
};
