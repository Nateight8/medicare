"use client";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function Page() {
  const searchParams = useSearchParams();
  const requestId = searchParams.get("requestId");
  const [qrCode, setQrCode] = useState<string | null>(null);

  useEffect(() => {
    if (!requestId) return;

    fetch(`http://localhost:4000/api/auth/qr?requestId=${requestId}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch QR code");
        }
        return res.blob();
      })
      .then((blob) => {
        const imageUrl = URL.createObjectURL(blob);
        setQrCode(imageUrl);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }, [requestId]);

  const handleContinue = async () => {
    if (!requestId) return;
    // setLoading(true);

    try {
      const res = await fetch("http://localhost:4000/api/auth/continue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
        credentials: "include", // important for cookies
      });

      if (!res.ok) throw new Error("Continue failed");

      // cookie now set → just redirect
      window.location.href = "/";
    } catch (err) {
      console.error(err);
    } finally {
      // setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            {qrCode ? (
              <img
                src={qrCode}
                alt="QR Code"
                className="h-48 w-48 object-contain"
              />
            ) : (
              <div className="flex h-48 w-48 items-center justify-center border-2 border-dashed border-gray-300">
                <span className="text-sm text-gray-500">
                  Loading QR code...
                </span>
              </div>
            )}
            <h1 className="text-xl font-bold">Login with QR Code</h1>
            <div className="text-center text-sm">
              Open the Medi Care mobile app and scan this QR code to sign in
              instantly.
            </div>
          </div>

          <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
            <span className="bg-background text-muted-foreground relative z-10 px-2">
              OR
            </span>
          </div>
          <div className="">
            <Button
              variant="outline"
              type="button"
              className="w-full "
              onClick={handleContinue}
            >
              Continue on this device
            </Button>
          </div>
        </div>
      </>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        having trouble scanning the QR code? <a href="#">sign in with otp</a>.
      </div>
    </div>
  );
}
