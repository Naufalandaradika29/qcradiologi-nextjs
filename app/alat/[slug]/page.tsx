"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import { QC_TOOL_DEFINITIONS, buildQcStatusSummary, saveQcRecord } from "@/services/qcService";
import { exportQcDailyExcel, exportQcMonthlyExcel } from "@/lib/exportExcel";
import { StatusBadge } from "@/components/report/ReportPage";
import type { QcAnswer, QcRecord, QcStatus } from "@/types/qc";
import { useParams } from "next/navigation";

export default function AlatDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { profile, loading: authLoading } = useAuth();
  const tool = QC_TOOL_DEFINITIONS.find((item) => item.slug === slug);

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [answers, setAnswers] = useState<Record<number, QcStatus>>({});
  const [catatan, setCatatan] = useState("");
  const [history, setHistory] = useState<Array<QcRecord & { id: string }>>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  useEffect(() => {
    async function loadHistory() {
      if (!slug) return;
      const snapshot = await getDocs(
        query(collection(db, "pemeriksaan_qc"), where("alatSlug", "==", slug), orderBy("tanggal", "desc")),
      );
      setHistory(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as QcRecord & { id: string })));
    }

    if (!authLoading && profile && slug) {
      void loadHistory();
    }
  }, [authLoading, profile, slug]);

  const checklist = tool?.checklist ?? [];
  const isMobileXray = tool?.slug === "mobile-xray";

  const historyForTool = useMemo(
    () => history.filter((row) => row.alatSlug === slug).sort((a, b) => String(b.tanggal).localeCompare(String(a.tanggal))),
    [history, slug],
  );

  if (!tool) {
    return (
      <AuthGuard>
        <AppLayout user={profile} title="Alat">
          <EmptyState title="Alat tidak ditemukan." description="Pilih alat yang tersedia pada menu Alat." />
        </AppLayout>
      </AuthGuard>
    );
  }

  const summary = buildQcStatusSummary(
    checklist
      .filter((item) => !isMobileXray || typeof answers[item.nomor] !== "undefined")
      .map((item) => ({ hasil: answers[item.nomor] ?? "baik" })),
  );

  const handleAnswer = (nomor: number, value: QcStatus) => {
    setAnswers((prev) => ({ ...prev, [nomor]: value }));
  };

  const handleSave = async () => {
    if (!profile?.uid) {
      setError("Sesi pengguna tidak valid.");
      return;
    }

    const answered = checklist.filter((item) => typeof answers[item.nomor] !== "undefined");
    if (answered.length !== checklist.length) {
      setError(isMobileXray ? "Terdapat item QC yang belum diperiksa." : "Semua item checklist harus diberikan status BAIK atau TIDAK BAIK.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        alatSlug: tool.slug,
        namaAlat: tool.namaAlat,
        tanggal: selectedDate,
        bulan: Number(selectedDate.slice(5, 7)),
        tahun: Number(selectedDate.slice(0, 4)),
        petugasUid: profile.uid,
        petugasNama: profile.nama,
        catatan: catatan.trim(),
        ...buildQcStatusSummary(
          checklist.map((item) => ({ hasil: answers[item.nomor] as QcStatus })),
        ),
        statusKeseluruhan: buildQcStatusSummary(
          checklist.map((item) => ({ hasil: answers[item.nomor] as QcStatus })),
        ).statusKeseluruhan,
        answers: checklist.map((item) => ({
          nomor: item.nomor,
          kategori: item.kategori,
          kegiatan: item.kegiatan,
          parameter: item.parameter,
          hasil: answers[item.nomor],
        })),
      };

      await saveQcRecord(payload as Parameters<typeof saveQcRecord>[0]);
      setMessage("Data QC berhasil disimpan ke Firestore.");
      setCatatan("");
      setAnswers({});
      const updated = await getDocs(
        query(collection(db, "pemeriksaan_qc"), where("alatSlug", "==", slug), orderBy("tanggal", "desc")),
      );
      setHistory(updated.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as QcRecord & { id: string })));
    } catch (saveError) {
      console.error("Save QC failed:", saveError);
      setError("Gagal menyimpan data QC. Silakan coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  const handleExportDaily = () => {
    const rows = checklist.map((item) => ({
      nomor: item.nomor,
      kegiatan: item.kegiatan,
      parameter: item.parameter,
      hasil: answers[item.nomor] ?? "",
    }));
    exportQcDailyExcel({ alatName: tool.namaAlat, tanggal: selectedDate, rows, ...(isMobileXray ? { catatan: catatan.trim(), petugas: profile?.nama } : {}) });
  };

  const handleExportMonthly = () => {
    const monthKey = selectedDate.slice(0, 7);
    const rowsByDate = Array.from({ length: 31 }, (_, idx) => idx + 1).map((day) => {
      const dateKey = `${monthKey}-${String(day).padStart(2, "0")}`;
      const record = historyForTool.find((row) => row.tanggal === dateKey);
      const hasil: Record<string, string> = {};
      if (record?.answers) {
          record.answers.forEach((answer: QcAnswer) => {
          hasil[String(answer.nomor)] = answer.hasil;
        });
      }
      return { day, record };
    });

    const exportRows = checklist.map((item) => ({
      nomor: item.nomor,
      kegiatan: item.kegiatan,
      parameter: item.parameter,
      hasil: Object.fromEntries(
        rowsByDate.map(({ day }) => {
          const record = historyForTool.find((row) => row.tanggal === `${monthKey}-${String(day).padStart(2, "0")}`);
          const answer = record?.answers?.find((entry: QcAnswer) => entry.nomor === item.nomor);
          return [String(day), answer?.hasil ?? ""];
        }),
      ),
    }));

    exportQcMonthlyExcel({ alatName: tool.namaAlat, bulan: monthKey, rows: exportRows, ...(isMobileXray ? { catatan: historyForTool.find((row) => row.catatan)?.catatan, petugas: historyForTool.find((row) => row.petugasNama)?.petugasNama } : {}) });
  };

  return (
    <AuthGuard>
      <AppLayout user={profile} title={tool.namaAlat}>
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{isMobileXray ? "PELAKSANAAN HARIAN QUALITY CONTROL" : tool.namaAlat}</h1>
                <p className="mt-1 text-sm text-slate-500">{isMobileXray ? "Bagian Radiologi RS PERMATA PAMULANG" : "Form QC alat berdasarkan checklist referensi Excel yang tersedia."}</p>
                {isMobileXray ? <p className="mt-1 text-sm font-semibold text-slate-700">Nama Alat: Mobile X-Ray</p> : null}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={handleExportDaily}>Export Harian</Button>
                <Button type="button" variant="secondary" onClick={handleExportMonthly}>Export Bulanan</Button>
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
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

              {tool.checklist.length === 0 ? (
                <EmptyState title={tool.emptyStateTitle ?? "Checklist belum tersedia."} description={tool.emptyStateDescription ?? "Checklist akan ditambahkan oleh administrator."} />
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-3 py-3 font-medium">No</th>
                        <th className="px-3 py-3 font-medium">Kegiatan</th>
                        <th className="px-3 py-3 font-medium">Parameter</th>
                        <th className="px-3 py-3 font-medium text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {checklist.map((item) => (
                        <tr key={`${tool.slug}-${item.nomor}`} className="border-t border-slate-100 align-top">
                          <td className="px-3 py-3 font-medium">{item.nomor}</td>
                          <td className="px-3 py-3">{item.kegiatan}</td>
                          <td className="px-3 py-3">{item.parameter}</td>
                          <td className="px-3 py-3">
                            <div className="flex flex-wrap justify-center gap-2">
                              <button
                                type="button"
                                aria-label={`Set item ${item.nomor} sebagai baik`}
                                onClick={() => handleAnswer(item.nomor, "baik")}
                                className={`flex h-12 w-12 items-center justify-center rounded-xl border text-xl font-bold transition ${answers[item.nomor] === "baik" ? "border-emerald-500 bg-emerald-600 text-white shadow-md" : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}`}
                              >
                                ✓
                              </button>
                              <button
                                type="button"
                                aria-label={`Set item ${item.nomor} sebagai tidak baik`}
                                onClick={() => handleAnswer(item.nomor, "tidak_baik")}
                                className={`flex h-12 w-12 items-center justify-center rounded-xl border text-xl font-bold transition ${answers[item.nomor] === "tidak_baik" ? "border-rose-500 bg-rose-600 text-white shadow-md" : "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"}`}
                              >
                                ✕
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Catatan</label>
                <textarea
                  rows={4}
                  value={catatan}
                  onChange={(event) => setCatatan(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  placeholder="Masukkan catatan pemeriksaan bila diperlukan"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button type="button" loading={saving} onClick={handleSave}>Simpan QC</Button>
                <div className="text-sm font-medium text-slate-600">
                  {summary.jumlahBaik} baik / {summary.jumlahTidakBaik} tidak baik
                </div>
              </div>

              {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div> : null}
              {message ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</div> : null}
            </div>

            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Ringkasan</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-emerald-50 p-3">
                  <div className="text-xs uppercase tracking-wide text-emerald-700">Baik</div>
                  <div className="mt-2 text-2xl font-bold text-emerald-700">{summary.jumlahBaik}</div>
                </div>
                <div className="rounded-xl bg-rose-50 p-3">
                  <div className="text-xs uppercase tracking-wide text-rose-700">Tidak Baik</div>
                  <div className="mt-2 text-2xl font-bold text-rose-700">{summary.jumlahTidakBaik}</div>
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-3">
                <div className="text-xs uppercase tracking-wide text-slate-500">Status keseluruhan</div>
                <div className="mt-2">
                  <StatusBadge status={summary.statusKeseluruhan} />
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-3">
                <div className="mb-2 text-sm font-semibold text-slate-700">Riwayat QC</div>
                {historyForTool.length === 0 ? (
                  <p className="text-sm text-slate-500">Belum ada riwayat QC untuk alat ini.</p>
                ) : (
                  <div className="space-y-2">
                    {historyForTool.slice(0, 6).map((row) => (
                      <div key={row.id} className="rounded-lg border border-slate-100 bg-slate-50 p-2 text-xs text-slate-600">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-slate-700">{row.tanggal}</span>
                          {isMobileXray ? (
                            <span className={row.statusKeseluruhan === "baik" ? "font-bold text-emerald-600" : "font-bold text-rose-600"}>
                              {row.statusKeseluruhan === "baik" ? "✓" : "✕"}
                            </span>
                          ) : <StatusBadge status={row.statusKeseluruhan ?? "baik"} />}
                        </div>
                        <div className="mt-1">Tanggal: {row.tanggal}</div>
                        <div>Petugas: {row.petugasNama || "-"}</div>
                        {isMobileXray ? <div>Catatan: {row.catatan || "-"}</div> : <div>Baik: {row.jumlahBaik ?? 0} | Tidak Baik: {row.jumlahTidakBaik ?? 0}</div>}
                        {isMobileXray ? (
                          <button
                            type="button"
                            className="mt-2 font-semibold text-sky-700 hover:text-sky-900"
                            onClick={() => setExpandedHistoryId((current) => current === row.id ? null : row.id)}
                          >
                            {expandedHistoryId === row.id ? "Tutup detail" : "Lihat detail"}
                          </button>
                        ) : null}
                        {isMobileXray && expandedHistoryId === row.id ? (
                          <div className="mt-2 space-y-1 border-t border-slate-200 pt-2">
                            {(row.answers ?? []).map((answer: QcAnswer) => (
                              <div key={answer.nomor} className="flex justify-between gap-3">
                                <span>{answer.nomor}. {answer.kegiatan}</span>
                                <span className={answer.hasil === "baik" ? "font-bold text-emerald-600" : "font-bold text-rose-600"}>{answer.hasil === "baik" ? "✓" : answer.hasil === "tidak_baik" ? "✕" : "-"}</span>
                              </div>
                            ))}
                          </div>
                        ) : null}
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
