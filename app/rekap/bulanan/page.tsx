"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, orderBy, query, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useAuth } from "@/hooks/useAuth";
import type { PemeriksaanQC } from "@/types/pemeriksaan";

export default function RekapBulananPage() {
  const { profile, loading: authLoading } = useAuth();
  const [items, setItems] = useState<PemeriksaanQC[]>([]);
  const [month, setMonth] = useState(String(new Date().getMonth() + 1).padStart(2, "0"));
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  }, [authLoading]);

  async function loadData() {
    try {
      setLoading(true);
      const snap = await getDocs(query(collection(db, "pemeriksaan_qc"), orderBy("tanggal", "desc")));
      setItems(snap.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as PemeriksaanQC) })));
    } catch (err) {
      console.error("Load monthly recap failed:", err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const value = parseDate(item.tanggal);
      return value.getMonth() + 1 === Number(month) && value.getFullYear() === Number(year);
    });
  }, [items, month, year]);

  const total = filtered.length;
  const lulus = filtered.filter((item) => item.hasil === "lulus").length;
  const tidak = filtered.filter((item) => item.hasil === "tidak_lulus").length;
  const persentase = total ? Math.round((lulus / total) * 100) : 0;

  if (authLoading) {
    return <AuthGuard><div className="p-6 text-slate-500">Memuat...</div></AuthGuard>;
  }

  return (
    <AuthGuard>
      <AppLayout user={profile} title="Rekap Bulanan">
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900">Rekap Bulanan</h1>
            <p className="mt-1 text-sm text-slate-500">Ringkasan bulanan pemeriksaan QC.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-5">
            <SummaryCard label="Total Pemeriksaan" value={String(total)} />
            <SummaryCard label="Lulus" value={String(lulus)} tone="success" />
            <SummaryCard label="Tidak Lulus" value={String(tidak)} tone="danger" />
            <SummaryCard label="Persentase" value={`${persentase}%`} tone="info" />
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-medium text-slate-600">Periode</div>
              <div className="mt-3 flex gap-2">
                <Select value={month} onChange={(e) => setMonth(e.target.value)}>
                  {Array.from({ length: 12 }, (_, index) => (
                    <option key={index + 1} value={String(index + 1).padStart(2, "0")}>{String(index + 1).padStart(2, "0")}</option>
                  ))}
                </Select>
                <Input value={year} onChange={(e) => setYear(e.target.value)} className="w-24" />
              </div>
            </div>
          </div>

          {loading ? <div className="py-8 text-center text-sm text-slate-500">Memuat data...</div> : filtered.length === 0 ? <EmptyState title="Belum ada data pemeriksaan bulan ini." description="Tidak ada hasil QC pada bulan yang dipilih." /> : (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-3 py-3 font-medium">Tanggal</th>
                      <th className="px-3 py-3 font-medium">Alat</th>
                      <th className="px-3 py-3 font-medium">Kegiatan</th>
                      <th className="px-3 py-3 font-medium">Petugas</th>
                      <th className="px-3 py-3 font-medium">Hasil</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((item) => (
                      <tr key={item.id} className="border-t border-slate-100">
                        <td className="px-3 py-3">{formatDate(item.tanggal)}</td>
                        <td className="px-3 py-3">{item.alatNama}</td>
                        <td className="px-3 py-3">{item.kegiatanNama}</td>
                        <td className="px-3 py-3">{item.petugasNama}</td>
                        <td className="px-3 py-3"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${item.hasil === "lulus" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{item.hasil === "lulus" ? "Lulus" : "Tidak Lulus"}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </AppLayout>
    </AuthGuard>
  );
}

function SummaryCard({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "success" | "danger" | "info" }) {
  const classes = {
    neutral: "bg-slate-50 text-slate-700 border-slate-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-100",
    danger: "bg-rose-50 text-rose-700 border-rose-100",
    info: "bg-sky-50 text-sky-700 border-sky-100",
  };

  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${classes[tone]}`}>
      <div className="text-sm font-medium">{label}</div>
      <div className="mt-2 text-3xl font-bold">{value}</div>
    </div>
  );
}

function formatDate(value: unknown) {
  if (!value) return "-";
  if (value instanceof Timestamp) return value.toDate().toLocaleDateString("id-ID");
  return new Date(String(value)).toLocaleDateString("id-ID");
}

function parseDate(value: unknown) {
  if (!value) return new Date(0);
  if (value instanceof Timestamp) return value.toDate();
  return new Date(String(value));
}
