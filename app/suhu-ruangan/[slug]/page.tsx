"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ReferenceLine } from "recharts";
import { db } from "@/lib/firebase";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import { exportSuhuDailyExcel, exportSuhuMonthlyExcel } from "@/lib/exportExcel";
import { SHIFT_OPTIONS, SUHU_RUANGAN_DEFINITIONS, calculateSuhuStatus, saveSuhuRecord } from "@/services/suhuService";
import { StatusBadge } from "@/components/report/ReportPage";
import { useParams } from "next/navigation";

export default function SuhuRuanganDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { profile, loading: authLoading } = useAuth();
  const room = SUHU_RUANGAN_DEFINITIONS.find((item) => item.slug === slug);

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [values, setValues] = useState<Record<string, string>>({ pagi: "", siang: "", malam: "" });
  const [catatan, setCatatan] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadHistory() {
      if (!slug) return;
      const snapshot = await getDocs(
        query(collection(db, "suhu_ruangan"), where("ruanganSlug", "==", slug), orderBy("tanggal", "desc")),
      );
      setHistory(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));
    }

    if (!authLoading && profile && slug) {
      void loadHistory();
    }
  }, [authLoading, profile, slug]);

  if (!room) {
    return (
      <AuthGuard>
        <AppLayout user={profile} title="Suhu Ruangan">
          <EmptyState title="Ruangan tidak ditemukan." description="Pilih ruangan yang tersedia pada menu Suhu Ruangan." />
        </AppLayout>
      </AuthGuard>
    );
  }

  const roomHistory = useMemo(
    () => history.filter((row) => row.ruanganSlug === slug).sort((a, b) => String(b.tanggal).localeCompare(String(a.tanggal))),
    [history, slug],
  );

  const chartData = SHIFT_OPTIONS.map((shift) => ({
    name: shift.label,
    value: Number(values[shift.value] || 0),
    min: 18,
    max: 25,
  }));

  const handleValueChange = (shift: string, value: string) => {
    setValues((prev) => ({ ...prev, [shift]: value }));
  };

  const handleSave = async () => {
    if (!profile?.uid) {
      setError("Sesi pengguna tidak valid.");
      return;
    }

    const entries = SHIFT_OPTIONS.map((shiftOption) => {
      const rawValue = values[shiftOption.value];
      const suhu = Number(rawValue);
      return { ...shiftOption, suhu, status: calculateSuhuStatus(suhu), rawValue };
    });

    if (entries.some((entry) => entry.rawValue === "" || Number.isNaN(entry.suhu))) {
      setError("Semua shift Pagi, Siang, dan Malam wajib diisi dengan nilai suhu.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const createdRows: any[] = [];
      for (const entry of entries) {
        const row = {
          ruanganSlug: room.slug,
          namaRuangan: room.namaRuangan,
          tanggal: selectedDate,
          bulan: Number(selectedDate.slice(5, 7)),
          tahun: Number(selectedDate.slice(0, 4)),
          shift: entry.value,
          suhu: entry.suhu,
          status: entry.status,
          catatan: catatan.trim(),
          petugasUid: profile.uid,
          petugasNama: profile.nama,
        };
        const savedId = await saveSuhuRecord(row as any);
        createdRows.push({ id: savedId, ...row });
      }

      setHistory((prev) => [...createdRows, ...prev]);
      setMessage("Data suhu ruangan berhasil disimpan ke Firestore.");
      setCatatan("");
      setValues({ pagi: "", siang: "", malam: "" });
    } catch (saveError: any) {
      console.error("Save suhu failed:", saveError);
      setError(saveError?.message ?? "Gagal menyimpan data suhu.");
    } finally {
      setSaving(false);
    }
  };

  const handleExportDaily = () => {
    const rows = SHIFT_OPTIONS.map((shiftOption) => {
      const entry = roomHistory.find((row) => row.shift === shiftOption.value && row.tanggal === selectedDate);
      return {
        shift: shiftOption.label,
        suhu: String(entry?.suhu ?? values[shiftOption.value] ?? "-"),
        status: entry?.status ?? calculateSuhuStatus(Number(values[shiftOption.value] || 0)),
        petugas: entry?.petugasNama ?? profile?.nama ?? "-",
        catatan: entry?.catatan ?? catatan ?? "-",
      };
    });

    exportSuhuDailyExcel({ ruangan: room.namaRuangan, tanggal: selectedDate, rows });
  };

  const handleExportMonthly = () => {
    const monthDays = Array.from({ length: 31 }, (_, index) => index + 1);
    const monthData = monthDays.map((day) => {
      const dateKey = `${selectedMonth}-${String(day).padStart(2, "0")}`;
      const byDay = roomHistory.filter((row) => row.tanggal === dateKey);
      const entryPagi = byDay.find((row) => row.shift === "pagi");
      const entrySiang = byDay.find((row) => row.shift === "siang");
      const entryMalam = byDay.find((row) => row.shift === "malam");
      return {
        tanggal: day,
        pagi: entryPagi?.suhu != null ? String(entryPagi.suhu) : "",
        siang: entrySiang?.suhu != null ? String(entrySiang.suhu) : "",
        malam: entryMalam?.suhu != null ? String(entryMalam.suhu) : "",
      };
    });

    exportSuhuMonthlyExcel({ ruangan: room.namaRuangan, bulan: selectedMonth, data: monthData });
  };

  return (
    <AuthGuard>
      <AppLayout user={profile} title={room.namaRuangan}>
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{room.namaRuangan}</h1>
                <p className="mt-1 text-sm text-slate-500">Pantau suhu ruangan sesuai standar 18–25°C untuk shift Pagi, Siang, dan Malam.</p>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={handleExportDaily}>Export Harian</Button>
                <Button type="button" variant="secondary" onClick={handleExportMonthly}>Export Bulanan</Button>
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Tanggal</label>
                  <Input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Petugas</label>
                  <Input value={profile?.nama ?? "-"} readOnly />
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                {SHIFT_OPTIONS.map((option) => (
                  <div key={option.value} className="grid gap-3 md:grid-cols-[140px_1fr_120px] md:items-center">
                    <div className="font-medium text-slate-700">Shift {option.label}</div>
                    <Input
                      type="number"
                      step="0.1"
                      value={values[option.value]}
                      onChange={(event) => handleValueChange(option.value, event.target.value)}
                      placeholder="Suhu °C"
                    />
                    <div className="text-right text-sm text-slate-600">
                      {values[option.value] ? <StatusBadge status={calculateSuhuStatus(Number(values[option.value]))} /> : "-"}
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Catatan</label>
                <textarea
                  rows={4}
                  value={catatan}
                  onChange={(event) => setCatatan(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  placeholder="Catatan kondisi ruangan"
                />
              </div>

              <div className="flex items-center gap-3">
                <Button type="button" loading={saving} onClick={handleSave}>Simpan Suhu</Button>
              </div>

              {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div> : null}
              {message ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</div> : null}
            </div>

            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Bulan</label>
                <Input type="month" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} />
              </div>

              <div className="h-64 w-full rounded-xl border border-slate-200 p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[10, 35]} />
                    <Tooltip />
                    <ReferenceLine y={18} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: "18°C", position: "insideTopLeft" }} />
                    <ReferenceLine y={25} stroke="#ef4444" strokeDasharray="5 5" label={{ value: "25°C", position: "insideBottomRight" }} />
                    <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-xl border border-slate-200 p-3">
                <div className="mb-2 text-sm font-semibold text-slate-700">Riwayat suhu</div>
                {roomHistory.length === 0 ? (
                  <p className="text-sm text-slate-500">Belum ada riwayat suhu untuk ruangan ini.</p>
                ) : (
                  <div className="space-y-2">
                    {roomHistory.slice(0, 6).map((row) => (
                      <div key={row.id} className="rounded-lg border border-slate-100 bg-slate-50 p-2 text-xs text-slate-600">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-slate-700">{row.tanggal}</span>
                          <span className="font-medium text-slate-600">{row.shift}</span>
                        </div>
                        <div className="mt-1">Suhu: {row.suhu}°C</div>
                        <div className="mt-1"><StatusBadge status={row.status} /></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
