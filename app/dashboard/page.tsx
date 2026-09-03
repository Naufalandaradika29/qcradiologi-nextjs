"use client";

import { useEffect, useMemo, useState } from "react";
import { Timestamp, collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Loading } from "@/components/ui/Loading";
import { useAuth } from "@/hooks/useAuth";
import type { PemeriksaanQC } from "@/types/pemeriksaan";

export default function DashboardPage() {
  const { profile, loading: authLoading, profileError } = useAuth();
  const [loading, setLoading] = useState(true);
  const [pemeriksaan, setPemeriksaan] = useState<PemeriksaanQC[]>([]);
  const [alatCount, setAlatCount] = useState(0);
  const [kegiatanCount, setKegiatanCount] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [alatSnap, kegiatanSnap, pemeriksaanSnap] = await Promise.all([
          getDocs(collection(db, "alat")),
          getDocs(collection(db, "kegiatan_qc")),
          getDocs(query(collection(db, "pemeriksaan_qc"), orderBy("tanggal", "desc"))),
        ]);

        setAlatCount(alatSnap.size);
        setKegiatanCount(kegiatanSnap.size);
        setPemeriksaan(pemeriksaanSnap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as PemeriksaanQC) })));
      } catch (error) {
        console.error("Dashboard load failed:", error);
        setError(error instanceof Error ? error.message : "Data dashboard gagal dibaca dari Firestore.");
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading && profile) {
      loadData();
    }
  }, [authLoading, profile]);

  const stats = useMemo(() => {
    const total = pemeriksaan.length;
    const lulus = pemeriksaan.filter((item) => item.hasil === "lulus").length;
    const tidakLulus = pemeriksaan.filter((item) => item.hasil === "tidak_lulus").length;

    return {
      total,
      lulus,
      tidakLulus,
    };
  }, [pemeriksaan]);

  if (authLoading || loading || !profile) {
    return (
      <AuthGuard>
        <Loading label="Memuat dashboard..." />
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <AppLayout user={profile} title="Dashboard">
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <p className="mt-1 text-sm text-slate-500">Ringkasan quality control radiologi.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <StatCard label="Total Alat" value={String(alatCount)} tone="info" />
            <StatCard label="Total Kegiatan QC" value={String(kegiatanCount)} tone="success" />
            <StatCard label="Total Pemeriksaan" value={String(pemeriksaan.length)} tone="neutral" />
            <StatCard label="QC Lulus" value={String(stats.lulus)} tone="success" />
            <StatCard label="QC Tidak Lulus / Perlu Tindakan" value={String(stats.tidakLulus)} tone="danger" />
          </div>

          {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">Firestore: {error}</div> : null}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Aktivitas QC Terbaru</h2>
            </div>

            {pemeriksaan.length === 0 ? (
              <EmptyState title="Belum ada data pemeriksaan QC." description="Data akan muncul setelah petugas memasukkan pemeriksaan QC pertama." />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-3 py-3 font-medium">Tanggal</th>
                      <th className="px-3 py-3 font-medium">Alat</th>
                      <th className="px-3 py-3 font-medium">Kegiatan</th>
                      <th className="px-3 py-3 font-medium">Petugas</th>
                      <th className="px-3 py-3 font-medium">Hasil</th>
                      <th className="px-3 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pemeriksaan.slice(0, 8).map((item) => (
                      <tr key={item.id} className="border-t border-slate-100">
                        <td className="px-3 py-3">{formatDate(item.tanggal)}</td>
                        <td className="px-3 py-3">{item.alatNama}</td>
                        <td className="px-3 py-3">{item.kegiatanNama}</td>
                        <td className="px-3 py-3">{item.petugasNama}</td>
                        <td className="px-3 py-3">{String(item.nilai)}</td>
                        <td className="px-3 py-3">
                          <span className={`rounded-full px-2 py-1 text-xs font-semibold ${item.hasil === "lulus" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                            {item.hasil === "lulus" ? "Lulus" : "Tidak Lulus"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone: "info" | "success" | "danger" | "neutral" }) {
  const tones = {
    info: "bg-sky-50 text-sky-700 border-sky-100",
    success: "bg-emerald-50 text-emerald-700 border-emerald-100",
    danger: "bg-rose-50 text-rose-700 border-rose-100",
    neutral: "bg-slate-50 text-slate-700 border-slate-200",
  };

  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${tones[tone]}`}>
      <div className="text-sm font-medium text-slate-600">{label}</div>
      <div className="mt-3 text-3xl font-bold">{value}</div>
    </div>
  );
}

function formatDate(value: unknown) {
  if (!value) return "-";
  if (value instanceof Timestamp) return value.toDate().toLocaleDateString("id-ID");
  if (typeof value === "string") return new Date(value).toLocaleDateString("id-ID");
  return new Date(String(value)).toLocaleDateString("id-ID");
}
