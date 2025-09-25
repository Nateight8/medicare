import { gql } from "graphql-tag";

export const userTypeDefs = gql`
  scalar Date
  """
  User type
  """
  type User {
    id: ID!
    email: String!
    phone: String
    name: String
    timeZone: String
    prescriptions: [Prescription!]!
    doseEvents: [DoseEvent!]!
    createdAt: String!
    updatedAt: String!
  }

  """
  Input for updating user profile
  """
  input UpdateProfileInput {
    displayName: String
    dateOfBirth: Date
    image: String
    phone: String
    timeZone: String
  }

  """
  Response after updating a profile
  """
  type MutationResponse {
    success: Boolean!
  }

  extend type Query {
    """
    Get the currently authenticated user's profile
    """
    me: User!
  }

  extend type Mutation {
    """
    Update the authenticated user's profile
    """
    updateProfile(input: UpdateProfileInput!): MutationResponse!

    """
    Delete the authenticated user's profile
    """
    deleteAccount: MutationResponse!

    """
    Logout the current user and invalidate the session
    """
    logout: LogoutResponse!
  }

  """
  Response for logout operation
  """
  type LogoutResponse {
    success: Boolean!
  }
`;

interface UpdateProfileInput {
  name?: string;
  phone?: string;
  timeZone?: string;
  dateOfBirth?: string;
  displayName?: string;
  image?: string;
}

export type { UpdateProfileInput };
