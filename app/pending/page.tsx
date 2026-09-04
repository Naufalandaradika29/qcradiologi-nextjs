"use client";

import { useEffect } from "react";
import { signOut } from "firebase/auth";
import { Clock3, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { Loading } from "@/components/ui/Loading";

export default function PendingPage() {
  const router = useRouter();
  const { firebaseUser, profile, loading, profileError } = useAuth();

  useEffect(() => {
    if (!loading && !firebaseUser) router.replace("/");
    if (!loading && profile?.status === "aktif") router.replace("/dashboard");
    if (!loading && profile?.status === "nonaktif") void signOut(auth).finally(() => router.replace("/"));
  }, [firebaseUser, loading, profile, router]);

  if (loading || !firebaseUser) return <Loading label="Memuat status akun..." />;
  if (profileError) return <main className="flex min-h-screen items-center justify-center bg-[#eef5f4] p-5"><div className="max-w-md rounded-2xl border border-rose-200 bg-white p-7 text-center shadow-sm"><h1 className="text-xl font-bold text-slate-900">Profil belum tersedia</h1><p className="mt-3 text-sm text-rose-700">{profileError}</p><Link href="/" className="mt-6 inline-block font-semibold text-[#2c7470]">Kembali ke login</Link></div></main>;

  return <main className="flex min-h-screen items-center justify-center bg-[#eef5f4] p-5"><div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600"><Clock3 className="h-7 w-7" /></div><p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-[#2c7470]">Registrasi berhasil</p><h1 className="mt-2 text-2xl font-bold text-[#123b3b]">Menunggu persetujuan admin</h1><p className="mt-3 text-sm leading-6 text-slate-500">Akun Anda sedang menunggu persetujuan administrator. Anda dapat masuk setelah akun diaktifkan.</p><p className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">{profile?.email ?? firebaseUser.email}</p><button type="button" onClick={() => void signOut(auth)} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"><LogOut className="h-4 w-4" /> Logout</button></div></main>;
}
