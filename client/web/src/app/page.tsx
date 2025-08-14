"use client";

import { useQuery } from "@apollo/client";
import { meOperation } from "@/graphql/operations/me";

export default function Home() {
  const { data, loading, error } = useQuery(meOperation.Queries.me);

  return (
    <div className="h-screen w-full flex items-center justify-center">
      {/* <QrWrapper /> */}
      <div className="w-full max-w-sm"></div>
    </div>
  );
}
