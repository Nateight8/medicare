import { useState, useEffect, useCallback } from "react";

interface MagicLinkState {
  email: string;
  timestamp: number;
  expiresAt: number;
  expiresIn?: string;
}

interface UseMagicLinkAuthReturn {
  // State
  email: string;
  success: boolean;
  emailError: string;
  isLoading: boolean;
  timeLeft: number;
  canResend: boolean;
  resendCooldown: number;
  expiresIn: string;

  // Actions
  setEmail: (email: string) => void;
  sendMagicLink: (email: string) => Promise<void>;
  handleResend: () => Promise<void>;
  handleUseDifferentEmail: () => void;
  clearError: () => void;
}

const STORAGE_KEY = "magicLinkState";
const RESEND_COOLDOWN = 60; // 60 seconds

export function useMagicLinkAuth(apiEndpoint: string): UseMagicLinkAuthReturn {
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [expiresIn, setExpiresIn] = useState<string>('15m'); // Default to 15 minutes

  // Parse duration string (e.g., '1h', '30m', '60s') to milliseconds
  const parseDuration = (duration: string): number => {
    const match = duration.match(/^(\d+)([smh])$/);
    if (!match) return 15 * 60 * 1000; // Default to 15 minutes if format is invalid
    
    const value = parseInt(match[1], 10);
    const unit = match[2];
    
    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      default: return 15 * 60 * 1000; // Default to 15 minutes
    }
  };

  // Load saved state on mount
  useEffect(() => {
    const savedState = sessionStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const {
          email: savedEmail,
          timestamp,
          expiresAt,
          expiresIn: savedExpiresIn,
        }: MagicLinkState = JSON.parse(savedState);

        if (Date.now() < expiresAt) {
          setEmail(savedEmail);
          setSuccess(true);
          setTimeLeft(Math.floor((expiresAt - Date.now()) / 1000));
          setExpiresIn(savedExpiresIn || '15m'); // Set expiresIn from saved state if available
        } else {
          // Expired, clean up
          sessionStorage.removeItem(STORAGE_KEY);
        }
      } catch (error) {
        console.error("Error loading magic link state:", error);
        sessionStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Countdown timer
  useEffect(() => {
    if (success && timeLeft > 0) {
      const timer = setInterval(() => {
        const savedState = sessionStorage.getItem(STORAGE_KEY);
        if (savedState) {
          try {
            const { expiresAt } = JSON.parse(savedState) as MagicLinkState;
            const now = Date.now();
            const secondsLeft = Math.max(0, Math.floor((expiresAt - now) / 1000));
            
            if (secondsLeft <= 0) {
              // Expired
              sessionStorage.removeItem(STORAGE_KEY);
              setSuccess(false);
              setTimeLeft(0);
            } else {
              setTimeLeft(secondsLeft);
            }
          } catch (error) {
            console.error("Error parsing saved state:", error);
            sessionStorage.removeItem(STORAGE_KEY);
            setSuccess(false);
            setTimeLeft(0);
          }
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [success, timeLeft]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [resendCooldown]);

  // Send magic link
  const sendMagicLink = useCallback(
    async (emailToSend: string) => {
      setIsLoading(true);
      setEmailError("");

      try {
        const response = await fetch(apiEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: emailToSend }),
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || "Failed to send magic link");
        }

        // Update expiresIn from response if available
        const responseExpiresIn = data.expiresIn || '15m';
        setExpiresIn(responseExpiresIn);

        // Calculate expiration time using the response value
        const durationMs = parseDuration(responseExpiresIn);
        const now = Date.now();
        const expiresAt = now + durationMs;
        
        // Set the initial time left based on the actual expiration (convert to seconds)
        const initialTimeLeft = Math.floor((expiresAt - now) / 1000);
        setTimeLeft(initialTimeLeft);
        
        const state: MagicLinkState = {
          email: emailToSend,
          timestamp: now,
          expiresAt,
          expiresIn: responseExpiresIn
        };

        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));

        setEmail(emailToSend);
        setSuccess(true);
        setCanResend(false);
        setResendCooldown(RESEND_COOLDOWN);
      } catch (error) {
        console.error("Error requesting magic link:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to send magic link. Please try again.";
        setEmailError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [apiEndpoint]
  );

  // Resend magic link
  const handleResend = useCallback(async () => {
    if (email && canResend) {
      await sendMagicLink(email);
    }
  }, [email, canResend, sendMagicLink]);

  // Use different email
  const handleUseDifferentEmail = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setSuccess(false);
    setEmail("");
    setTimeLeft(0);
    setCanResend(false);
    setResendCooldown(0);
    setEmailError("");
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setEmailError("");
  }, []);

  return {
    // State
    email,
    success,
    emailError,
    isLoading,
    timeLeft,
    canResend,
    resendCooldown,
    expiresIn,

    // Actions
    setEmail,
    sendMagicLink,
    handleResend,
    handleUseDifferentEmail,
    clearError,
  };
}
