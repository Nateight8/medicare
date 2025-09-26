"use client";

import { Button } from "@/components/ui/button";
import { AsclepiusIcon } from "@phosphor-icons/react";

export default function DeleteAccountPage() {
  return (
    <div className="min-h-screen flex items-center justify-center ">
      <div className="flex items-center justify-center flex-col">
        <div className=" text-secondary rounded-xl flex items-center justify-center">
          <AsclepiusIcon size={48} />
        </div>
        <div className="flex-1 max-w-md flex items-center justify-center p-8">
          <div className="w-full">
            <div className="md:p-6">
              <div className="text-center mb-4">
                <h1 className="text-2xl font-semibold tracking-tight">
                  Action is irrivasable
                </h1>
                <p className="text-sm text-muted-foreground mt-2">
                  Being here proves u own the email
                </p>
                <div className="mt-6 space-y-4">
                  <Button
                    variant="destructive"
                    effect="ringHover"
                    className="w-full"
                  >
                    Delete my account
                  </Button>
                  <Button variant="ghost" effect="ringHover" className="w-full">
                    Cancel delete
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
