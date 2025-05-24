import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { generateUniqueId, hashPassword } from "../utils/main";
import {
  DeleteItemCommand,
  DynamoDBClient,
  ScanCommand,
  ScanCommandInput,
} from "@aws-sdk/client-dynamodb";

const USERS_TABLE = "Users";
const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);

type User = {
  email: string;
  password: string;
};
type UserOutput = User & {
  createdAt: string;
  updatedAt: string;
};

export const createUser = async (user: User) => {
  const hashedPassword = await hashPassword(user.password);
  const newUser = {
    ...user,
    password: hashedPassword,
    userId: generateUniqueId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await dynamo.send(
    new PutCommand({
      TableName: USERS_TABLE,
      Item: newUser,
    })
  );

  return;
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

export async function deleteUser(email: string) {
  await client.send(
    new DeleteItemCommand({
      TableName: USERS_TABLE,
      Key: {
        userId: { S: email },
      },
    })
  );

  return {
    ok: true,
    message: "User deleted successfully",
    statusCode: 200,
  };
}

export async function getUserByEmail(email: string) {
  const result = await client.send(
    new ScanCommand({
      TableName: USERS_TABLE,
      FilterExpression: "email = :email",
      ExpressionAttributeValues: {
        ":email": { S: email },
      },
    })
  );
  if (!result.Items || result.Items.length === 0) {
    return;
  }
  const user: UserOutput = {
    email: result.Items[0].email.S as string,
    password: result.Items[0].password.S as string,
    createdAt: result.Items[0].createdAt.S as string,
    updatedAt: result.Items[0].updatedAt.S as string,
  };
  return user;
}
