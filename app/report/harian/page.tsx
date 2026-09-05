"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ReportPage, StatusBadge } from "@/components/report/ReportPage";
import { useAuth } from "@/hooks/useAuth";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { exportSuhuDailyExcel, exportQcDailyExcel } from "@/lib/exportExcel";

export default function ReportHarianPage() {
  const { profile, loading: authLoading } = useAuth();
  const [qcRecords, setQcRecords] = useState<any[]>([]);
  const [suhuRecords, setSuhuRecords] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedAlat, setSelectedAlat] = useState("all");
  const [selectedRuangan, setSelectedRuangan] = useState("all");
  const [tab, setTab] = useState<"qc" | "suhu">("qc");

  useEffect(() => {
    async function loadData() {
      const [qcSnap, suhuSnap] = await Promise.all([
        getDocs(query(collection(db, "pemeriksaan_qc"), orderBy("tanggal", "desc"))),
        getDocs(query(collection(db, "suhu_ruangan"), orderBy("tanggal", "desc"))),
      ]);
      setQcRecords(qcSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setSuhuRecords(suhuSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    }

    if (!authLoading && profile) {
      void loadData();
    }
  }, [authLoading, profile]);

  const alatOptions = useMemo(() => [...new Set(qcRecords.map((row) => row.namaAlat || row.alatNama))], [qcRecords]);
  const ruanganOptions = useMemo(() => [...new Set(suhuRecords.map((row) => row.namaRuangan || row.ruanganSlug))], [suhuRecords]);

  const filteredQc = useMemo(
    () => qcRecords.filter((row) => (!selectedDate || String(row.tanggal) === selectedDate) && (selectedAlat === "all" || (row.namaAlat || row.alatNama) === selectedAlat)),
    [qcRecords, selectedDate, selectedAlat],
  );

  const filteredSuhu = useMemo(
    () => suhuRecords.filter((row) => (!selectedDate || String(row.tanggal) === selectedDate) && (selectedRuangan === "all" || (row.namaRuangan || row.ruanganSlug) === selectedRuangan)),
    [suhuRecords, selectedDate, selectedRuangan],
  );

  const handleDownloadQc = () => {
    if (!filteredQc[0]) return;
    const first = filteredQc[0];
    const rows = (first.answers ?? []).map((answer: any) => ({
      nomor: answer.nomor,
      kegiatan: answer.kegiatan,
      parameter: answer.parameter,
      hasil: answer.hasil,
    }));
    exportQcDailyExcel({ alatName: first.namaAlat || first.alatNama, tanggal: first.tanggal, rows });
  };

  const handleDownloadSuhu = () => {
    if (!filteredSuhu.length) return;
    const rows = [
      { shift: "Pagi", suhu: filteredSuhu.find((row) => row.shift === "pagi")?.suhu ?? "", status: filteredSuhu.find((row) => row.shift === "pagi")?.status ?? "", petugas: filteredSuhu.find((row) => row.shift === "pagi")?.petugasNama ?? "", catatan: filteredSuhu.find((row) => row.shift === "pagi")?.catatan ?? "" },
      { shift: "Siang", suhu: filteredSuhu.find((row) => row.shift === "siang")?.suhu ?? "", status: filteredSuhu.find((row) => row.shift === "siang")?.status ?? "", petugas: filteredSuhu.find((row) => row.shift === "siang")?.petugasNama ?? "", catatan: filteredSuhu.find((row) => row.shift === "siang")?.catatan ?? "" },
      { shift: "Malam", suhu: filteredSuhu.find((row) => row.shift === "malam")?.suhu ?? "", status: filteredSuhu.find((row) => row.shift === "malam")?.status ?? "", petugas: filteredSuhu.find((row) => row.shift === "malam")?.petugasNama ?? "", catatan: filteredSuhu.find((row) => row.shift === "malam")?.catatan ?? "" },
    ];
    exportSuhuDailyExcel({ ruangan: filteredSuhu[0].namaRuangan || filteredSuhu[0].ruanganSlug, tanggal: selectedDate, rows });
  };

  return (
    <ReportPage user={profile} title="Report Harian" initialTab="qc" onDownload={tab === "qc" ? handleDownloadQc : handleDownloadSuhu}>
      {(currentTab) => (
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Tanggal</label>
                <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
              </div>
              {currentTab === "qc" ? (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Alat</label>
                  <Select value={selectedAlat} onChange={(e) => setSelectedAlat(e.target.value)}>
                    <option value="all">Semua alat</option>
                    {alatOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                  </Select>
                </div>
              ) : (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Ruangan</label>
                  <Select value={selectedRuangan} onChange={(e) => setSelectedRuangan(e.target.value)}>
                    <option value="all">Semua ruangan</option>
                    {ruanganOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                  </Select>
                </div>
              )}
              <div className="flex items-end">
                <Button type="button" variant="secondary" onClick={() => { setSelectedDate(new Date().toISOString().slice(0,10)); setSelectedAlat("all"); setSelectedRuangan("all"); }}>Reset</Button>
              </div>
            </div>
          </div>

          {currentTab === "qc" ? (
            filteredQc.length === 0 ? <EmptyState title="Belum ada data QC alat." description="Tidak ada pemeriksaan pada tanggal yang dipilih." /> : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-3 py-3 font-medium">Nama Alat</th>
                      <th className="px-3 py-3 font-medium">Tanggal</th>
                      <th className="px-3 py-3 font-medium">Petugas</th>
                      <th className="px-3 py-3 font-medium">Baik</th>
                      <th className="px-3 py-3 font-medium">Tidak Baik</th>
                      <th className="px-3 py-3 font-medium">Status</th>
                      <th className="px-3 py-3 font-medium">Catatan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredQc.map((row) => (
                      <tr key={row.id} className="border-t border-slate-100">
                        <td className="px-3 py-3">{row.namaAlat || row.alatNama}</td>
                        <td className="px-3 py-3">{String(row.tanggal)}</td>
                        <td className="px-3 py-3">{row.petugasNama}</td>
                        <td className="px-3 py-3">{row.jumlahBaik ?? 0}</td>
                        <td className="px-3 py-3">{row.jumlahTidakBaik ?? 0}</td>
                        <td className="px-3 py-3"><StatusBadge status={row.statusKeseluruhan === "baik" ? "baik" : "tidak_baik"} /></td>
                        <td className="px-3 py-3">{row.catatan || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            filteredSuhu.length === 0 ? <EmptyState title="Belum ada data suhu ruangan." description="Tidak ada pengukuran pada tanggal yang dipilih." /> : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-3 py-3 font-medium">Ruangan</th>
                      <th className="px-3 py-3 font-medium">Pagi</th>
                      <th className="px-3 py-3 font-medium">Siang</th>
                      <th className="px-3 py-3 font-medium">Malam</th>
                      <th className="px-3 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...new Set(filteredSuhu.map((row) => row.namaRuangan || row.ruanganSlug))].map((ruangan) => {
                      const roomRows = filteredSuhu.filter((row) => (row.namaRuangan || row.ruanganSlug) === ruangan);
                      const pagi = roomRows.find((row) => row.shift === "pagi")?.suhu ?? "-";
                      const siang = roomRows.find((row) => row.shift === "siang")?.suhu ?? "-";
                      const malam = roomRows.find((row) => row.shift === "malam")?.suhu ?? "-";
                      return (
                        <tr key={ruangan} className="border-t border-slate-100">
                          <td className="px-3 py-3">{ruangan}</td>
                          <td className="px-3 py-3">{pagi}</td>
                          <td className="px-3 py-3">{siang}</td>
                          <td className="px-3 py-3">{malam}</td>
                          <td className="px-3 py-3"><StatusBadge status={roomRows.some((row) => row.status === "normal") ? "normal" : "di_bawah_standar"} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      )}
    </ReportPage>
  );
}
