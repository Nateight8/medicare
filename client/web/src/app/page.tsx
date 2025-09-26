"use client";

import { useAuth } from "../components/providers/auth-provider";
import UserSessions from "@/components/user-session";

export default function Home() {
  const { user } = useAuth();

  return (
    <>
      <div className="h-screen w-full">
        <UserSessions />
      </div>
    </>
  );
}
