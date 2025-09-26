import { gql } from "graphql-tag";

export const sessionTypeDefs = gql`
  scalar Date
  """
  Session type
  """
  type Session {
    id: ID!
    ip: String
    deviceType: String!
    deviceName: String! # e.g. iPhone, Windows, MacBook
    browser: String! # e.g. Chrome, Safari
    browserVersion: String
    os: String! # e.g. iOS, Windows
    osVersion: String
    city: String
    region: String
    country: String
    createdAt: String!
    lastActive: String!
    isCurrentDevice: Boolean!
  }

  type RevokeSessionsResponse {
    success: Boolean!
  }

  extend type Query {
    """
    Get all active sessions for the currently authenticated user
    """
    getUserSessions: [Session!]!
  }

  extend type Mutation {
    """
    Revoke single or multiple sessions
    """
    revokeSessions(sessionIds: [ID!]!): RevokeSessionsResponse!
  }
`;

interface SessionType {
  id: string;
  userAgent?: string;
  ip: string;
  city?: string;
  region?: string;
  country?: string;
  isActive: boolean;
}

interface RevokeSessionsArgs {
  sessionIds: string[]; // required, client sends the sessions to revoke
}

export type { SessionType, RevokeSessionsArgs };
