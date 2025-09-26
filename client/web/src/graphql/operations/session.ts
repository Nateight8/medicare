import { gql } from "@apollo/client";

export const sessionOperation = {
  Queries: {
    getUserSessions: gql`
      query GetUserSessions {
        getUserSessions {
          id
          ip
          deviceType
          deviceName
          browser
          browserVersion
          os
          osVersion
          city
          region
          country
          createdAt
          lastActive
          isCurrentDevice
        }
      }
    `,
  },
  Mutations: {
    revokeSessions: gql`
      mutation RevokeSessions($sessionIds: [ID!]!) {
        revokeSessions(sessionIds: $sessionIds) {
          success
        }
      }
    `,
  },
};

interface getUserSessionsResponse {
  getUserSessions: userSession[];
}

interface userSession {
  id: string;
  ip: string;
  deviceType: "DESKTOP" | "MOBILE" | "TABLET";
  deviceName: string;
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  city: string;
  region: string;
  country: string;
  createdAt: string;
  lastActive: string;
  isCurrentDevice: boolean;
}

export type { userSession, getUserSessionsResponse };
