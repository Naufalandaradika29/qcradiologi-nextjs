"use client";

import { FormEvent, useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { Activity, ArrowRight, LockKeyhole, Mail, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { createUserProfile } from "@/services/userService";

function getRegisterError(error: unknown) {
  if (error instanceof Error && "code" in error) {
    const code = (error as { code?: string }).code;
    if (code === "auth/email-already-in-use") return "Email sudah terdaftar.";
    if (code === "auth/invalid-email") return "Format email tidak valid.";
    if (code === "auth/weak-password") return "Password minimal 6 karakter.";
  }
  return "Terjadi kesalahan saat membuat akun.";
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ nama: "", email: "", password: "", konfirmasiPassword: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const update = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!form.nama.trim()) return setError("Nama lengkap wajib diisi.");
    if (!form.email.trim()) return setError("Email wajib diisi.");
    if (form.password.length < 6) return setError("Password minimal 6 karakter.");
    if (form.password !== form.konfirmasiPassword) return setError("Konfirmasi password tidak sama.");

    setSubmitting(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, form.email.trim().toLowerCase(), form.password);
      await createUserProfile(credential.user.uid, { nama: form.nama.trim(), email: form.email.trim().toLowerCase() });
      router.replace("/alat");
    } catch (registrationError) {
      setError(getRegisterError(registrationError));
    } finally {
      setSubmitting(false);
    }
  }

  return <main className="min-h-screen bg-[#eef5f4] px-5 py-10 text-slate-900 sm:px-10"><div className="mx-auto w-full max-w-xl"><div className="mb-8 flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#123b3b] text-[#d7a85d]"><Activity className="h-6 w-6" /></div><div><p className="text-xl font-bold text-[#123b3b]">QC Radiologi</p><p className="text-sm text-slate-500">Registrasi pegawai baru</p></div></div><div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#2c7470]">Akun pegawai</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-[#123b3b]">Buat akun Anda</h1><p className="mt-3 text-sm leading-6 text-slate-500">Setelah mendaftar, Anda dapat langsung masuk ke dashboard.</p><form onSubmit={handleSubmit} className="mt-7 space-y-4"><Field label="Nama Lengkap" value={form.nama} onChange={(value) => update("nama", value)} placeholder="Nama lengkap" /><Field label="Email" type="email" value={form.email} onChange={(value) => update("email", value)} placeholder="nama@rumahsakit.com" /><Field label="Password" type="password" value={form.password} onChange={(value) => update("password", value)} placeholder="Minimal 6 karakter" /><Field label="Konfirmasi Password" type="password" value={form.konfirmasiPassword} onChange={(value) => update("konfirmasiPassword", value)} placeholder="Ulangi password" />{error ? <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}<button type="submit" disabled={submitting} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#123b3b] px-5 text-sm font-semibold text-white transition hover:bg-[#1b5150] disabled:cursor-not-allowed disabled:opacity-60">{submitting ? "Membuat akun..." : "Daftar"}{!submitting ? <ArrowRight className="h-4 w-4" /> : null}</button></form><p className="mt-6 text-center text-sm text-slate-500">Sudah punya akun? <Link href="/" className="font-semibold text-[#2c7470] hover:underline">Login</Link></p></div></div></main>;
}

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string }) {
  const Icon = type === "email" ? Mail : type === "password" ? LockKeyhole : UserRound;
  return <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span><span className="relative block"><Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input required type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 pl-11 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#2c7470] focus:ring-4 focus:ring-[#2c7470]/10" /></span></label>;
}
