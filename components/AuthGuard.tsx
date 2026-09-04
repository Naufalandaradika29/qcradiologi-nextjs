"use client";

import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { useEffect } from "react";
import { Loading } from "@/components/ui/Loading";
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/lib/firebase";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { firebaseUser, profile, profileError, loading } = useAuth();

  useEffect(() => {
    if (!loading && !firebaseUser) {
      router.replace("/");
    } else if (!loading && profile?.status === "nonaktif") {
      void signOut(auth).finally(() => router.replace("/"));
    } else if (!loading && profile?.role !== "admin" && pathname.startsWith("/admin")) {
      router.replace("/dashboard");
    }
  }, [loading, firebaseUser, pathname, profile, router]);

  if (loading) {
    return <Loading label="Memeriksa sesi login..." />;
  }

  if (!firebaseUser) {
    return null;
  }

  if (profileError || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-5">
        <div className="max-w-md rounded-2xl border border-rose-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-slate-900">Profil tidak dapat digunakan</h1>
          <p className="mt-2 text-sm text-rose-700">{profileError ?? "Profil pengguna masih belum tersedia."}</p>
        </div>
      </div>
    );
  }

  if (profile.status !== "aktif" || (pathname.startsWith("/admin") && profile.role !== "admin")) {
    return <Loading label="Memeriksa akses..." />;
  }

  return <>{children}</>;
}
