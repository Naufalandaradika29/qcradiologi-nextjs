"use client";

import Link from "next/link";
import { Activity, ClipboardCheck, Monitor, Radio, Stethoscope, Zap, ShieldPlus } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/hooks/useAuth";

const alatList = [
  { slug: "usg", title: "USG", icon: Monitor },
  { slug: "ct-scan", title: "CT Scan", icon: Activity },
  { slug: "panoramic", title: "Panoramic", icon: Stethoscope },
  { slug: "general-xray-dental", title: "General X-Ray & Dental", icon: ShieldPlus },
  { slug: "mobile-xray", title: "Mobile X-Ray", icon: Radio },
];

export default function AlatPage() {
  const { profile, loading } = useAuth();

  if (loading || !profile) {
    return <AuthGuard><div className="p-6 text-slate-500">Memuat alat...</div></AuthGuard>;
  }

  return (
    <AuthGuard>
      <AppLayout user={profile} title="Alat">
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900">Alat</h1>
            <p className="mt-1 text-sm text-slate-500">Pilih alat untuk memulai pemeriksaan QC harian.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {alatList.map(({ slug, title, icon: Icon }) => (
              <Link key={slug} href={`/alat/${slug}`} className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="text-lg font-semibold text-slate-900">{title}</div>
                <div className="mt-3 text-sm text-slate-500">{slug === "mobile-xray" ? "Detail alat" : "Mulai QC"}</div>
                <div className="mt-4 inline-flex rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white group-hover:bg-sky-700">
                  {slug === "mobile-xray" ? "Lihat QC" : "Mulai QC"}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
