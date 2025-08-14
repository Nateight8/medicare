// import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";
// import { AuthenticationError, UserInputError } from 'apollo-server-express';

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export const authResolvers = {
  Query: {
    me: async (_: any, __: any, context: any) => {
      // console.log("Context:");

      // Return a mock user object
      return {
        id: "1",
        email: "test@example.com",
        name: "Test User",
        phone: "+1234567890",
        timeZone: "UTC",
        prescriptions: [],
        doseEvents: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    },
  },
  Mutation: {
    /**
     * Create a new user account
     * @returns Authentication payload with token and user
     */
    signup: async (
      _: any,
      {
        input,
      }: {
        input: {
          email: string;
          password: string;
          name: string;
          phone?: string;
          timeZone?: string;
        };
      },
      context: any
    ) => {
      const { email, password, name, phone, timeZone = "UTC" } = input;

      // Check if user already exists
      const existingUser = await context.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        // throw new UserInputError('Email already in use');
      }

      // Hash password
      // const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      // const user = await context.prisma.user.create({
      //   data: {
      //     email,
      //     name,
      //     phone,
      //     timeZone,
      //     passwordHash,
      //   },
      // });

      // Generate JWT token
      // const token = jwt.sign({ userId: user.id }, JWT_SECRET);

      return {
        // token,
        // user,
      };
    },

    /**
     * Authenticate a user and return a JWT token
     * @returns Authentication payload with token and user
     */
    login: async (
      _: any,
      { input }: { input: { email: string; password: string } },
      context: any
    ) => {
      const { email, password } = input;

      // Find user by email
      const user = await context.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        // throw new AuthenticationError('Invalid email or password');
      }

      // Verify password
      // const valid = await bcrypt.compare(password, user.passwordHash);
      // if (!valid) {
      //   throw new AuthenticationError('Invalid email or password');
      // }

      // Generate JWT token
      // const token = jwt.sign({ userId: user.id }, JWT_SECRET);

      return {
        token: "",
        user,
      };
    },
  },
};
