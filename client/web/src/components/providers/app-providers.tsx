"use client";
import { PropsWithChildren } from "react";
import { ApolloWrapper } from "./apollo-wrapper";

export default function AppProviders({ children }: PropsWithChildren) {
  return <ApolloWrapper>{children}</ApolloWrapper>;
}
