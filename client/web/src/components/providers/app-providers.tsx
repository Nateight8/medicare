"use client";
import { PropsWithChildren } from "react";
import { ApolloWrapper } from "./apollo-wrapper";
import { AuthProvider } from "./auth-provider";

import QueryClientProviderWrapper from "./tanstack-query-client";

export default function AppProviders({ children }: PropsWithChildren) {
  return (
    <ApolloWrapper>
      <AuthProvider>
        {/* <AuthGuard> */}
        <QueryClientProviderWrapper>{children}</QueryClientProviderWrapper>
        {/* </AuthGuard> */}
      </AuthProvider>
    </ApolloWrapper>
  );
}
