"use client";

import EditProfileDialog from "./profile/_components/edit-dialotg";
import { useAuth } from "../components/providers/auth-provider";
import { Button } from "react-aria-components";

export default function Home() {
  const { user, logout } = useAuth();

  console.log(user);

  return (
    <div className="h-screen w-full flex items-center justify-center">
      {/* <QrWrapper /> */}
      <Button onClick={() => logout()}>Logout</Button>
      <EditProfileDialog />
    </div>
  );
}
