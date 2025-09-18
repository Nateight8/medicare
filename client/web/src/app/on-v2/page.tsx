"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Page() {
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
          <form className="space-y-4">
            <div className="space-y-2">
              <Input type="email" placeholder="Enter your email" />
            </div>

            <Button
              type="submit"
              size="lg"
              effect="ringHover"
              className="w-full"
            >
              cont
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">OR</span>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
