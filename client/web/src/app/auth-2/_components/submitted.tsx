"use client";
import { Button } from "@/components/ui/button";
import { MailboxIcon, ClockIcon } from "@phosphor-icons/react";
import { RefreshCwIcon } from "lucide-react";

interface SubmittedProps {
  email: string;
  timeLeft: number;
  handleResend: () => void;
  canResend: boolean;
  resendCooldown: number;
  handleUseDifferentEmail: () => void;
  expiresIn?: string;
}

export default function Submitted({
  email,
  timeLeft,
  handleResend,
  canResend,
  resendCooldown,
  handleUseDifferentEmail,
}: SubmittedProps) {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const channel = new BroadcastChannel("auth");

  console.log("CHANNEL:", channel);

  // channel.onmessage = (e) => {
  //   if (e.data === "done") {
  //     window.location.href = "/"; // or window.close();
  //   }
  // };

  return (
    <div className="flex-1 max-w-md flex items-center justify-center p-8">
      <div className="w-full">
        <div className="p-6">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <MailboxIcon className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Check your email!
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              We sent a magic link to <strong>{email}</strong>
            </p>
          </div>
          <div className="space-y-4">
            <div className="text-center">
              <div className="flex flex-col items-center gap-1 text-sm text-muted-foreground mb-2">
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-4 h-4 flex-shrink-0" />
                  <span>Expires in {formatTime(timeLeft)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleResend}
                disabled={!canResend}
                variant="outline"
                className="w-full bg-transparent"
                size="lg"
              >
                {resendCooldown > 0 ? (
                  <>
                    <RefreshCwIcon className="w-4 h-4 mr-2" />
                    Resend in {resendCooldown}s
                  </>
                ) : (
                  <>
                    <RefreshCwIcon className="w-4 h-4 mr-2" />
                    Didn&apos;t receive it? Resend
                  </>
                )}
              </Button>

              <Button
                size="lg"
                onClick={handleUseDifferentEmail}
                className="w-full"
              >
                Use different email
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
