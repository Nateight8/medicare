"use client";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "./auth-provider";

const publicRoutes = ["/auth", "/auth/qr", "/auth/qr/scan"];
const onboardRoute = "/onboard";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const needsOnboarding = isAuthenticated && user?.onboarded === false;

  useEffect(() => {
    if (loading) return;

    if (!isPublicRoute && !isAuthenticated) {
      router.replace("/auth");
      return;
    }

    if (isAuthenticated && needsOnboarding && pathname !== onboardRoute) {
      router.replace(onboardRoute);
      return;
    }

    if (isAuthenticated && !needsOnboarding && pathname === onboardRoute) {
      router.replace("/");
    }
  }, [
    loading,
    isAuthenticated,
    needsOnboarding,
    pathname,
    router,
    isPublicRoute,
  ]);

  if (loading || (!isPublicRoute && !isAuthenticated)) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
}
