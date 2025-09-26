import {
  getUserSessionsResponse,
  sessionOperation,
} from "@/graphql/operations/session";
import { useQuery } from "@apollo/client";

export const useSessions = () => {
  const { data, loading } = useQuery<getUserSessionsResponse>(
    sessionOperation.Queries.getUserSessions
  );

  const currentDevice = data?.getUserSessions.find(
    (session) => session.isCurrentDevice
  );

  const otherDevices = data?.getUserSessions.filter(
    (session) => !session.isCurrentDevice
  );

  return {
    currentDevice,
    otherDevices,
    loading,
  };
};
