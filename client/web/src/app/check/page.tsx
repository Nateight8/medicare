import { Loader2 } from "lucide-react";

export default function Check() {
  return (
    <div>
      <h1>Check Your Email</h1>
      <p>we sent a magic link</p>
      <div className="">
        <p>logging you in as mbaochajonathan@yahoo.com</p>{" "}
        <button>not you?</button>
      </div>
      <div className="flex items-center gap-2">
        <Loader2 className="animate-spin" /> waiting for you to click the link
        in your email
      </div>
      <div className="text-xs text-muted-foreground">
        Didn&apos;t receive the email? Check your spam folder.
      </div>
      <button>Resend magic link</button>
    </div>
  );
}
