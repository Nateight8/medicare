"use client";

import { Button } from "@/components/ui/button";
import { formatTime } from "@/lib/utils";
import { RefreshCwIcon } from "lucide-react";

interface SubmittedProps {
  email: string;
  timeLeft: number;
  handleResend: () => void;
  resendCooldown: number;
  handleUseDifferentEmail: () => void;
  expiresIn?: string;
}

export default function Check({
  email,
  timeLeft,
  resendCooldown,
  handleUseDifferentEmail,
}: SubmittedProps) {
  return (
    <div className="flex-1 max-w-md flex items-center justify-center p-8">
      <div className="w-full">
        <div className="md:p-6">
          <div className="text-center mb-4">
            <h1 className="text-2xl font-semibold tracking-tight">
              Magic Link Sent
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Waiting for you to click the link sent to your email. Link expires
              in {formatTime(timeLeft)} minutes.
            </p>
          </div>
          <Button
            variant="outline"
            size="lg"
            effect="ringHover"
            className="w-full mb-2"
            disabled={resendCooldown > 0}
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
          <p className="text-muted-foreground text-left text-xs">
            signing you in as{" "}
            <span
              className="font-semibold truncate max-w-[15ch] inline-block align-bottom"
              title="mbaochajonathan@yahoo.com"
            >
              {email}
            </span>
            <button
              onClick={handleUseDifferentEmail}
              className="underline hover:no-underline cursor-pointer font-semibold text-secondary"
            >
              not you?
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
