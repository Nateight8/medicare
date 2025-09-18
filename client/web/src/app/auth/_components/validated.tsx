"use client";

import { useEffect } from "react";

export default function Validated() {
  const channel = new BroadcastChannel("auth");

  useEffect(() => {
    channel.onmessage = (event) => {
      if (event.data === "onboarded") {
        window.location.href = "/";
      } else if (event.data === "onboard") {
        window.location.href = "/onboard";
      }
    };
  }, []);

  return (
    <div className="flex-1 max-w-md flex items-center justify-center p-8">
      <div className="w-full">
        <div className="md:p-6">
          <div className="text-center mb-4">
            <h1 className="text-2xl font-semibold tracking-tight">
              Link Clicked!
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Complete authentication on your device
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
