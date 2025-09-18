'use client';

import { useSearchParams } from 'next/navigation';

const errorMessages: Record<string, string> = {
  invalid_token: "This login link is invalid. Please request a new one.",
  expired_token: "This login link has expired. Please request a new one.",
  used_token: "This login link has already been used. Please request a new one.",
  session_not_found: "We couldn't find your login session. Please try again.",
  unknown_error: "Something went wrong. Please try again.",
};

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const errorReason = searchParams.get('reason');
  const message = errorReason ? (errorMessages[errorReason] || errorMessages.unknown_error) : errorMessages.unknown_error;

  return (
    <div className="flex-1 max-w-md flex items-center justify-center p-8">
      <div className="w-full">
        <div className="md:p-6">
          <div className="text-center mb-4">
            <h1 className="text-2xl font-semibold tracking-tight">
              {errorReason === 'expired_token' ? 'Link Expired' : 'Link Error'}
            </h1>
            <p className="text-sm text-muted-foreground mt-2">{message}</p>
            <div className="mt-6">
              <a 
                href="/auth" 
                className="text-sm font-medium text-primary underline underline-offset-4 hover:text-primary/80"
              >
                Back to Sign In
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
