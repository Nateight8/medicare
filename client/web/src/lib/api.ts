import apiClient from "./axios";

interface PollAuthParams {
  email: string;
}

interface SendMagicLinkParams {
  email: string;
}

export const pollAuth = async ({ email }: PollAuthParams) => {
  const response = await apiClient.post("/auth/poll", { email });
  return response.data;
};

export const sendMagicLink = async ({ email }: SendMagicLinkParams) => {
  const response = await apiClient.post("/auth/magiclink", { email });
  return response.data;
};

export interface ContinueAuthResponse {
  success: boolean;
  user: {
    id: string;
    email: string;
    phone: string;
    name: string;
    timeZone: string;
    createdAt: string;
    updatedAt: string;
    onboarded: boolean;
  };
}

export const continueAuth = async (requestId: string): Promise<ContinueAuthResponse> => {
  const response = await apiClient.post("/auth/continue", { requestId });
  return response.data;
};
