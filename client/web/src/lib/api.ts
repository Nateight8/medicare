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
