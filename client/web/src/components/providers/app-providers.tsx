"use client";
import { PropsWithChildren } from "react";
import { ApolloWrapper } from "./apollo-wrapper";
import { AuthProvider } from "./auth-provider";
import AuthGuard from "./auth-guard";

export default function AppProviders({ children }: PropsWithChildren) {
  return (
    <ApolloWrapper>
      <AuthProvider>
        {/* <AuthGuard> */}
        {children}
        {/* </AuthGuard> */}
      </AuthProvider>
    </ApolloWrapper>
  );
}
