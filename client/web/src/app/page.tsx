"use client";

import EditProfileDialog from "./profile/_components/edit-dialotg";
import { useAuth } from "../components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  const { user, logout } = useAuth();

  console.log(user);

  const channel = new BroadcastChannel("auth");

  console.log("CHANNEL:", channel);

  channel.postMessage("login");

  channel.onmessage = (e) => {
    console.log(e);
  };

  console.log("CHANNEL MSG:");

  return (
    <div className="h-screen flex-col gap-4 w-full flex items-center justify-center">
      {/* <QrWrapper /> */}
      <Button onClick={() => logout()}>Logout</Button>
      <EditProfileDialog />

      <ThemeToggle />
      <Button effect="gooeyLeft" variant="default">
        Gooey Left
      </Button>
      <div className="animate-gradient-flow bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
        Flowing gradient
      </div>
    </div>
  );
}
