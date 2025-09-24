import { gql } from "graphql-tag";

export const authTypeDefs = gql`
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
    updateProfile(input: UpdateProfileInput!): UpdateProfileResponse!

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

  """
  Input for updating user profile
  """
  input UpdateProfileInput {
    name: String
    displayName: String
    age: Int
    image: String
    phone: String
    timeZone: String
  }

  """
  Response after updating a profile
  """
  type UpdateProfileResponse {
    success: Boolean!
  }
`;

interface UpdateProfileInput {
  name?: string;
  phone?: string;
  timeZone?: string;
  age?: number;
  displayName?: string;
  image?: string;
}

export type { UpdateProfileInput };
