import { gql } from "graphql-tag";

export const authTypeDefs = gql`
  extend type Mutation {
    """
    Request a magic link to be sent to the user's email
    """
    requestMagicLink(email: String!): Boolean!

    """
    Verify a magic link token
    """
    verifyMagicLink(token: String!, email: String!): AuthPayload!

    """
    Verify an OTP code
    """
    verifyOtp(email: String!, otp: String!): AuthPayload!
  }

  extend type Query {
    me: User!
  }

  """
  Payload returned after successful authentication
  """
  type AuthPayload {
    token: String!
    user: User!
  }

  """
  Input for login with email and password
  """
  input LoginInput {
    email: String!
    password: String!
  }

  """
  Input for creating a new user
  """
  input CreateUserInput {
    email: String!
    password: String!
    name: String!
    phone: String
    timeZone: String = "UTC"
  }
`;
