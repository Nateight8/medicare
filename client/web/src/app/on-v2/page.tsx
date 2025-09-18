"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeftIcon } from "lucide-react";
import { Label } from "@/components/ui/label";

export default function Page() {
  return (
    <form className="space-y-4">
      <div className="space-y-2">
        <Label>Email</Label>
        <Input className="h-11" type="email" placeholder="Enter your email" />
      </div>

      <div className="flex gap-4">
        <Button
          variant="outline"
          type="submit"
          size="icon"
          effect="gooeyLeft"
          className="size-11"
        >
          <ChevronLeftIcon />
        </Button>
        <Button
          type="submit"
          size="lg"
          effect="gooeyRight"
          className="w-full flex-1 tracking-wider"
        >
          CONTINUE
        </Button>
      </div>
    </form>
  );
}
