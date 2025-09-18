import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { sendMagicLink, pollAuth, revokeAuth } from "@/lib/api";

const STORAGE_KEY = "magicLinkState";
const RESEND_COOLDOWN = 60; // 60 seconds

interface MagicLinkState {
  email: string;
  expiresAt: number;
  expiresIn: string;
}

interface AuthStatusResponse {
  status: "pending" | "validated" | "not_started";
}

interface UseMagicLinkAuthReturn {
  // State
  email: string;
  initAuth: boolean;
  emailError: string;
  isLoading: boolean;
  timeLeft: number;
  resendCooldown: number;
  expiresIn: string;
  isAuthenticated: boolean;

  // Actions
  setEmail: (email: string) => void;
  sendMagicLink: (email: string) => Promise<void>;
  handleResend: () => Promise<void>;
  handleUseDifferentEmail: () => void;
  clearError: () => void;
}

export function useMagicLinkAuth(): UseMagicLinkAuthReturn {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  // Parse duration string (e.g., '1h', '30m', '60s') to milliseconds
  const parseDuration = (duration: string): number => {
    const match = duration.match(/^(\d+)([smh])$/);
    if (!match) return 15 * 60 * 1000; // Default to 15 minutes if format is invalid

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case "s":
        return value * 1000;
      case "m":
        return value * 60 * 1000;
      case "h":
        return value * 60 * 60 * 1000;
      default:
        return 15 * 60 * 1000; // Default to 15 minutes
    }
  };

  // Load saved state on mount
  const [savedState, setSavedState] = useState<MagicLinkState | null>(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const state = JSON.parse(saved);
        if (Date.now() < state.expiresAt) {
          setEmail(state.email);
          return state;
        }
        sessionStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        console.error("Error loading magic link state:", error);
        sessionStorage.removeItem(STORAGE_KEY);
      }
    }
    return null;
  });

  // Send magic link mutation
  const sendMagicLinkMutation = useMutation({
    mutationFn: async (emailToSend: string) => {
      setEmailError("");
      const response = await sendMagicLink({ email: emailToSend });

      // Save state to session storage
      const expiresInMs = parseDuration(response.expiresIn || "15m");
      const expiresAt = Date.now() + expiresInMs;
      const state = {
        email: emailToSend,
        expiresAt,
        expiresIn: response.expiresIn || "15m",
      };

      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setSavedState(state);

      return state;
    },
    onError: (error: Error) => {
      setEmailError(error.message || "Failed to send magic link");
    },
  });

  // Poll auth status
  const { data: authStatus } = useQuery<AuthStatusResponse>({
    queryKey: ["auth-status", savedState?.email],
    queryFn: () =>
      pollAuth({
        email: savedState?.email || "",
      }) as Promise<AuthStatusResponse>,
    enabled: !!savedState?.email,
    refetchInterval: (query) => {
      // Stop polling if the status is validated
      return query.state.data?.status === "validated" ? false : 2000;
    },
  });

  // Revoke auth mutation
  const revokeAuthMutation = useMutation({
    mutationFn: async (email: string) => {
      await revokeAuth({ email });
    },
  });

  const initAuth = authStatus?.status === "pending";
  const isAuthenticated = authStatus?.status === "validated";

  // Handle resend
  const handleResend = async () => {
    if (!savedState?.email || sendMagicLinkMutation.isPending) return;

    // Set cooldown
    sessionStorage.setItem(
      `${STORAGE_KEY}:cooldown`,
      (Date.now() + RESEND_COOLDOWN * 1000).toString()
    );

    await sendMagicLinkMutation.mutateAsync(savedState.email);
  };

  // Handle use different email
  const handleUseDifferentEmail = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setSavedState(null);
    setEmail("");
    setEmailError("");
    if (savedState?.email) {
      revokeAuthMutation.mutate(savedState.email);
    }
  };

  // Clear error
  const clearError = () => {
    setEmailError("");
  };

  // Time left state
  const [timeLeft, setTimeLeft] = useState<number>(() => 
    savedState ? Math.max(0, Math.floor((savedState.expiresAt - Date.now()) / 1000)) : 0
  );

  // Update time left every second
  useEffect(() => {
    if (!savedState) {
      setTimeLeft(0);
      return;
    }

    const updateTimeLeft = () => {
      const newTimeLeft = Math.max(0, Math.floor((savedState.expiresAt - Date.now()) / 1000));
      setTimeLeft(newTimeLeft);
    };

    // Update immediately
    updateTimeLeft();

    // Then update every second
    const interval = setInterval(updateTimeLeft, 1000);
    
    // Clear interval on cleanup
    return () => clearInterval(interval);
  }, [savedState]);

  // Get resend cooldown
  const [resendCooldown, setResendCooldown] = useState(0);

  // Update resend cooldown
  useEffect(() => {
    const updateCooldown = () => {
      const cooldown = sessionStorage.getItem(`${STORAGE_KEY}:cooldown`);
      if (cooldown) {
        const remaining = Math.ceil(
          (parseInt(cooldown, 10) - Date.now()) / 1000
        );
        setResendCooldown(Math.max(0, remaining));
      } else {
        setResendCooldown(0);
      }
    };

    updateCooldown();
    const interval = setInterval(updateCooldown, 1000);
    return () => clearInterval(interval);
  }, []);

  return {
    email,
    initAuth,
    emailError,
    isLoading: sendMagicLinkMutation.status === "pending",
    timeLeft,
    resendCooldown,
    expiresIn: savedState?.expiresIn || "15m",
    isAuthenticated,
    setEmail,
    sendMagicLink: async (emailToSend: string) => {
      await sendMagicLinkMutation.mutateAsync(emailToSend);
    },
    handleResend,
    handleUseDifferentEmail,
    clearError,
  };
}
