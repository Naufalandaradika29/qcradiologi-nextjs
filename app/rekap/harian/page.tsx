"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, orderBy, query, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useAuth } from "@/hooks/useAuth";
import type { PemeriksaanQC } from "@/types/pemeriksaan";

export default function RekapHarianPage() {
  const { profile, loading: authLoading } = useAuth();
  const [items, setItems] = useState<PemeriksaanQC[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [filterAlat, setFilterAlat] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
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
      console.error("Load recap failed:", err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const dateMatch = !selectedDate || formatDateOnly(item.tanggal) === selectedDate;
      const alatMatch = filterAlat === "all" || item.alatNama === filterAlat;
      const statusMatch = filterStatus === "all" || item.hasil === filterStatus;
      return dateMatch && alatMatch && statusMatch;
    });
  }, [items, selectedDate, filterAlat, filterStatus]);

  const total = filtered.length;
  const lulus = filtered.filter((item) => item.hasil === "lulus").length;
  const tidak = filtered.filter((item) => item.hasil === "tidak_lulus").length;
  const persentase = total ? Math.round((lulus / total) * 100) : 0;

  const handleExport = () => {
    const header = ["Tanggal", "Alat", "Kegiatan QC", "Petugas", "Nilai", "Standar", "Hasil", "Catatan"];
    const rows = filtered.map((item) => [formatDate(item.tanggal), item.alatNama, item.kegiatanNama, item.petugasNama, String(item.nilai), item.standar, item.hasil, item.catatan || ""]);
    const csvContent = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rekap-qc-harian-${selectedDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (authLoading) {
    return <AuthGuard><div className="p-6 text-slate-500">Memuat...</div></AuthGuard>;
  }

  return (
    <AuthGuard>
      <AppLayout user={profile} title="Rekap Harian">
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900">Rekap Harian</h1>
            <p className="mt-1 text-sm text-slate-500">Ringkasan pemeriksaan berdasarkan tanggal.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <SummaryCard label="Jumlah Pemeriksaan" value={String(total)} />
            <SummaryCard label="Lulus" value={String(lulus)} tone="success" />
            <SummaryCard label="Tidak Lulus" value={String(tidak)} tone="danger" />
            <SummaryCard label="Persentase" value={`${persentase}%`} tone="info" />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Filter</h2>
              <Button type="button" onClick={handleExport}>Export CSV</Button>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
              <Select value={filterAlat} onChange={(e) => setFilterAlat(e.target.value)}>
                <option value="all">Semua alat</option>
                {[...new Set(items.map((item) => item.alatNama))].map((alat) => <option key={alat} value={alat}>{alat}</option>)}
              </Select>
              <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="all">Semua status</option>
                <option value="lulus">Lulus</option>
                <option value="tidak_lulus">Tidak Lulus</option>
              </Select>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            {loading ? <div className="py-8 text-center text-sm text-slate-500">Memuat rekap...</div> : filtered.length === 0 ? <EmptyState title="Belum ada data pemeriksaan." description="Tidak ada item pada rentang filter yang dipilih." /> : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-3 py-3 font-medium">Tanggal</th>
                      <th className="px-3 py-3 font-medium">Alat</th>
                      <th className="px-3 py-3 font-medium">Kegiatan</th>
                      <th className="px-3 py-3 font-medium">Petugas</th>
                      <th className="px-3 py-3 font-medium">Nilai</th>
                      <th className="px-3 py-3 font-medium">Standar</th>
                      <th className="px-3 py-3 font-medium">Hasil</th>
                      <th className="px-3 py-3 font-medium">Catatan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((item) => (
                      <tr key={item.id} className="border-t border-slate-100">
                        <td className="px-3 py-3">{formatDate(item.tanggal)}</td>
                        <td className="px-3 py-3">{item.alatNama}</td>
                        <td className="px-3 py-3">{item.kegiatanNama}</td>
                        <td className="px-3 py-3">{item.petugasNama}</td>
                        <td className="px-3 py-3">{String(item.nilai)} {item.satuan}</td>
                        <td className="px-3 py-3">{item.standar}</td>
                        <td className="px-3 py-3"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${item.hasil === "lulus" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{item.hasil === "lulus" ? "Lulus" : "Tidak Lulus"}</span></td>
                        <td className="px-3 py-3">{item.catatan || "-"}</td>
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
  if (value instanceof Timestamp) return value.toDate().toLocaleString("id-ID");
  return new Date(String(value)).toLocaleString("id-ID");
}

function formatDateOnly(value: unknown) {
  if (!value) return "";
  if (value instanceof Timestamp) return value.toDate().toISOString().slice(0, 10);
  return new Date(String(value)).toISOString().slice(0, 10);
}
