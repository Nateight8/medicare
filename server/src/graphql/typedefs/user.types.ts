import { gql } from "graphql-tag";

export const userTypeDefs = gql`
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

  type AuthPayload {
    token: String!
    user: User!
  }

  input CreateUserInput {
    email: String!
    password: String!
    name: String!
    phone: String
    timeZone: String = "UTC"
  }
`;

export default userTypeDefs;
