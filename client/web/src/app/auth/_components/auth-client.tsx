"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw } from "lucide-react";
import { useMagicLinkAuth } from "@/hooks/use-magiclink-auth";
import Check from "./check";

export default function AuthClient() {
  const {
    email,
    success,
    emailError,
    isLoading,
    timeLeft,
    resendCooldown,
    expiresIn,
    setEmail,
    sendMagicLink,
    handleResend,
    handleUseDifferentEmail,
  } = useMagicLinkAuth("http://localhost:4000/api/auth/magiclink");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await sendMagicLink(email);
  };

  if (success) {
    return (
      <Check
        email={email}
        timeLeft={timeLeft}
        handleResend={handleResend}
        resendCooldown={resendCooldown}
        handleUseDifferentEmail={handleUseDifferentEmail}
        expiresIn={expiresIn}
      />
    );
  }

  return (
    <div className="flex-1 max-w-md flex items-center justify-center p-8">
      <div className="w-full">
        <div className="md:p-6">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome back
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Let&apos;s get you signed in securely
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`h-11 ${emailError ? "border-destructive" : ""}`}
              />
              {emailError && (
                <p className="text-xs text-destructive">{emailError}</p>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              effect="ringHover"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Sending magic link...
                </>
              ) : (
                "Sign in with Email"
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">OR</span>
              </div>
            </div>

            <Button
              size="lg"
              effect="ringHover"
              type="button"
              variant="outline"
              className="w-full "
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              By signing in, you agree to our{" "}
              <a href="/terms" className="underline hover:text-foreground">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy" className="underline hover:text-foreground">
                Privacy Policy
              </a>
              .
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
