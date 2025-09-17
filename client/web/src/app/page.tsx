"use client";

import EditProfileDialog from "./profile/_components/edit-dialotg";
import { useAuth } from "../components/providers/auth-provider";
import { Button } from "react-aria-components";
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
    <div className="h-screen w-full flex items-center justify-center">
      {/* <QrWrapper /> */}
      <Button onClick={() => logout()}>Logout</Button>
      <EditProfileDialog />

      <ThemeToggle />
    </div>
  );
}
