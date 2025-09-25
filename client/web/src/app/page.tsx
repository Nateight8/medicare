"use client";

import { useAuth } from "../components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import UserSessions from "@/components/user-session";

export default function Home() {
  const { user, login, logout } = useAuth();

  console.log(user);

  const channel = new BroadcastChannel("auth");

  console.log("CHANNEL:", channel);

  channel.postMessage("login");

  channel.onmessage = (e) => {
    console.log(e);
  };

  console.log("CHANNEL MSG:");

  return (
    <>
      <div className="h-screen w-full">
        <UserSessions />
      </div>
    </>
  );
}
