"use client";

import { useQuery } from "@apollo/client";
import { meOperation } from "@/graphql/operations/me";
import EditProfileDialog from "./profile/_components/edit-dialotg";

export default function Home() {
  const { data, loading, error } = useQuery(meOperation.Queries.me);

  return (
    <div className="h-screen w-full flex items-center justify-center">
      {/* <QrWrapper /> */}
      <EditProfileDialog />
    </div>
  );
}
