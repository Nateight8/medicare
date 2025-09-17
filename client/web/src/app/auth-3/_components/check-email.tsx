import { Mail } from "lucide-react";

export default function CheckEmail() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="flex flex-col items-center space-y-6 animate-in fade-in duration-500">
        {/* Success Icon */}
        <div className="relative">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-primary" />
          </div>
        </div>

        {/* Content */}
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-xl font-semibold text-foreground">
            Check your email
          </h1>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              We&apos;ve sent a magic link to your email address.
            </p>
            <p className="text-sm text-muted-foreground">
              Click the link in the email to sign in to your account.
            </p>
          </div>
        </div>

        {/* Additional Help */}
        <div className="text-center space-y-3 pt-4">
          <p className="text-xs text-muted-foreground">
            Didn&apos;t receive the email? Check your spam folder.
          </p>
          <button className="text-xs text-primary hover:text-primary/80 transition-colors underline underline-offset-4">
            Resend magic link
          </button>
        </div>
      </div>
    </div>
  );
}
