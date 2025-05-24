import { createUser, getUserByEmail } from "../repositories/users.repository";
import { APIGatewayEvent } from "../utils/general.vlt";

type SignupEvent = APIGatewayEvent<{
  email: string;
  password: string;
}>;

export const handler = async (event: SignupEvent) => {
  const { email, password } = event.body;

  if (!email || !password) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Username and password are required" }),
    };
  }

  try {
    const userExists = await getUserByEmail(email);
    if (userExists) {
      return {
        statusCode: 409,
        body: JSON.stringify({ error: "User already exists" }),
      };
    }
    await createUser({ email, password });

    return {
      statusCode: 201,
      body: JSON.stringify({ message: "User created successfully" }),
    };
  } catch (err) {
    console.error("Error creating user:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error creating user" }),
    };
  }
};
