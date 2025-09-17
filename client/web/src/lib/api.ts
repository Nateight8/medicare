import apiClient from "./axios";

interface PollAuthParams {
  email: string;
}

export const pollAuth = async ({ email }: PollAuthParams) => {
  const response = await apiClient.post("/auth/poll", { email });
  return response.data;
};
