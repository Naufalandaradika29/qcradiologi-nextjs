"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loading } from "@/components/ui/Loading";
import { useAuth } from "@/hooks/useAuth";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { firebaseUser, profile, profileError, loading } = useAuth();

  useEffect(() => {
    if (!loading && !firebaseUser) {
      router.replace("/");
    }
  }, [loading, firebaseUser, router]);

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

  return <>{children}</>;
}
