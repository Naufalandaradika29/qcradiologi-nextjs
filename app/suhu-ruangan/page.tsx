"use client";

import Link from "next/link";
import { Activity, Building2, ClipboardCheck, House, MonitorCog, Stethoscope } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/hooks/useAuth";

const ruanganList = [
  { slug: "usg", title: "USG", icon: MonitorCog },
  { slug: "ct-scan", title: "CT Scan", icon: Activity },
  { slug: "panoramic", title: "Panoramic", icon: Stethoscope },
  { slug: "general-xray-dental", title: "General X-Ray & Dental", icon: Building2 },
  { slug: "dokter-administrasi", title: "Dokter & Administrasi", icon: House },
];

export default function SuhuRuanganPage() {
  const { profile, loading } = useAuth();

  if (loading || !profile) {
    return <AuthGuard><div className="p-6 text-slate-500">Memuat ruangan...</div></AuthGuard>;
  }

  return (
    <AuthGuard>
      <AppLayout user={profile} title="Suhu Ruangan">
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900">Suhu Ruangan</h1>
            <p className="mt-1 text-sm text-slate-500">Pantau suhu tiap ruangan sesuai shift pagi, siang, malam.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {ruanganList.map(({ slug, title, icon: Icon }) => (
              <Link key={slug} href={`/suhu-ruangan/${slug}`} className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="text-lg font-semibold text-slate-900">{title}</div>
                <div className="mt-3 text-sm text-slate-500">Input suhu</div>
                <div className="mt-4 inline-flex rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white group-hover:bg-emerald-700">
                  Lihat Ruangan
                </div>
              </Link>
            ))}
          </div>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
