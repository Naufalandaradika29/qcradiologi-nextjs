"use client";

import { useEffect, useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Activity, ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const router = useRouter();
  const { firebaseUser, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && firebaseUser) router.replace("/dashboard");
  }, [authLoading, firebaseUser, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setSubmitting(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace("/dashboard");
    } catch {
      setMessage("Email atau password belum sesuai. Silakan periksa kembali.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#eef5f4] text-slate-900 lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden min-h-screen overflow-hidden bg-[#123b3b] px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between xl:px-20">
        <div className="absolute -right-28 -top-28 h-96 w-96 rounded-full border-[38px] border-[#2c7470]/40" />
        <div className="absolute -bottom-40 -left-24 h-[30rem] w-[30rem] rounded-full border-[48px] border-[#d7a85d]/15" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#d7a85d] text-[#123b3b]">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-bold tracking-tight">QC Radiologi</p>
            <p className="text-xs uppercase tracking-[0.22em] text-[#b8d7d2]">Quality Control System</p>
          </div>
        </div>

        <div className="relative max-w-xl">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.24em] text-[#d7a85d]">Pusat kendali mutu</p>
          <h1 className="max-w-lg text-5xl font-bold leading-[1.08] tracking-tight xl:text-6xl">Pastikan setiap pemeriksaan tetap terpercaya.</h1>
          <p className="mt-7 max-w-md text-base leading-7 text-[#c5ddda]">Pantau performa alat, catat pemeriksaan, dan susun laporan QC radiologi dalam satu ruang kerja.</p>
          <div className="mt-10 flex items-center gap-3 text-sm text-[#c5ddda]"><ShieldCheck className="h-5 w-5 text-[#d7a85d]" /> Data kerja tersusun dan mudah ditelusuri</div>
        </div>

        <p className="relative text-xs text-[#8eb5b0]">Quality assurance untuk layanan radiologi yang lebih konsisten.</p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#123b3b] text-[#d7a85d]"><Activity className="h-6 w-6" /></div>
            <p className="text-xl font-bold text-[#123b3b]">QC Radiologi</p>
            <p className="mt-1 text-sm text-slate-500">Quality Control System</p>
          </div>

          <div className="mb-9">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#2c7470]">Selamat datang kembali</p>
            <h2 className="text-3xl font-bold tracking-tight text-[#123b3b]">Masuk ke ruang kerja Anda</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">Gunakan akun terdaftar untuk melanjutkan pengelolaan quality control.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Email</span>
              <span className="relative block">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input required type="email" placeholder="nama@rumahsakit.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#2c7470] focus:ring-4 focus:ring-[#2c7470]/10" />
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Password</span>
              <span className="relative block">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input required minLength={6} type={showPassword ? "text" : "password"} placeholder="Masukkan password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-12 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#2c7470] focus:ring-4 focus:ring-[#2c7470]/10" />
                <button type="button" aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"} onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
              </span>
            </label>

            {message ? <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{message}</p> : null}

            <button type="submit" disabled={submitting} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#123b3b] px-5 text-sm font-semibold text-white shadow-lg shadow-[#123b3b]/15 transition hover:bg-[#1b5150] disabled:cursor-not-allowed disabled:opacity-60">
              {submitting ? "Memeriksa akun..." : "Masuk ke dashboard"}
              {!submitting ? <ArrowRight className="h-4 w-4" /> : null}
            </button>
          </form>

          <p className="mt-10 text-center text-xs leading-5 text-slate-400">Akses sistem diperuntukkan bagi petugas yang terdaftar.</p>
        </div>
      </section>
    </main>
  );
}