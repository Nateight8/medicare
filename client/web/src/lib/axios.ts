import axios, { AxiosError, AxiosResponse } from "axios";

// Create axios instance
const apiClient = axios.create({
  baseURL: "http://localhost:4000/api",
  timeout: 10000, // 10 seconds
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Include cookies in requests
});

// Request interceptor - add auth token, logging, etc.
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem("authToken"); // or get from your auth context
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log request in development
    if (process.env.NODE_ENV === "development") {
      console.log(
        `🚀 ${config.method?.toUpperCase()} ${config.url}`,
        config.data
      );
    }

    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor - handle common errors, transform responses
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log response in development
    if (process.env.NODE_ENV === "development") {
      console.log(
        `✅ ${response.status} ${response.config.url}`,
        response.data
      );
    }

    return response;
  },
  (error: AxiosError) => {
    // Handle common errors
    if (error.response) {
      if (error.response.status === 401) {
        // Unauthorized - redirect to login or refresh token
        localStorage.removeItem("authToken");
        window.location.href = "/login";
      }

      if (error.response.status >= 500) {
        // Server error - show generic error message
        console.error("Server error:", error.response.data);
      }
    }

    // Log error in development
    if (process.env.NODE_ENV === "development") {
      console.error(
        `❌ ${error.response?.status || "No status"} ${
          error.config?.url || "No URL"
        }`,
        error.response?.data || error.message
      );
    }

    return Promise.reject(error);
  }
);

export default apiClient;
