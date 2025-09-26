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

  extend type Query {
    """
    Get all active sessions for the currently authenticated user
    """
    getUserSessions: [Session!]!
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

export type { SessionType };
