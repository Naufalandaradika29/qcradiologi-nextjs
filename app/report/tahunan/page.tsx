"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ReportPage, StatusBadge } from "@/components/report/ReportPage";
import { useAuth } from "@/hooks/useAuth";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";

export default function ReportTahunanPage() {
  const { profile, loading: authLoading } = useAuth();
  const [qcRecords, setQcRecords] = useState<any[]>([]);
  const [suhuRecords, setSuhuRecords] = useState<any[]>([]);
  const [year, setYear] = useState(new Date().getFullYear().toString());

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

  return (
    <ReportPage user={profile} title="Report Tahunan" initialTab="qc">
      {(currentTab) => {
        if (currentTab === "qc") {
          if (qcRecords.length === 0) {
            return <EmptyState title="Belum ada data tahunan QC." description="Data akan muncul setelah pemeriksaan dilakukan." />;
          }

          return (
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <label className="mb-2 block text-sm font-medium text-slate-700">Tahun</label>
                <Input type="number" value={year} onChange={(e) => setYear(e.target.value)} />
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-3 py-3 font-medium">Tanggal</th>
                      <th className="px-3 py-3 font-medium">Alat</th>
                      <th className="px-3 py-3 font-medium">Baik</th>
                      <th className="px-3 py-3 font-medium">Tidak Baik</th>
                      <th className="px-3 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {qcRecords.slice(0, 12).map((row) => (
                      <tr key={row.id} className="border-t border-slate-100">
                        <td className="px-3 py-3">{String(row.tanggal)}</td>
                        <td className="px-3 py-3">{row.namaAlat || row.alatNama}</td>
                        <td className="px-3 py-3">{row.jumlahBaik ?? 0}</td>
                        <td className="px-3 py-3">{row.jumlahTidakBaik ?? 0}</td>
                        <td className="px-3 py-3"><StatusBadge status={row.statusKeseluruhan || "baik"} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        }

        if (suhuRecords.length === 0) {
          return <EmptyState title="Belum ada data tahunan suhu." description="Data suhu akan muncul setelah pengukuran dilakukan." />;
        }

        return (
          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <label className="mb-2 block text-sm font-medium text-slate-700">Tahun</label>
              <Input type="number" value={year} onChange={(e) => setYear(e.target.value)} />
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-3 py-3 font-medium">Tanggal</th>
                    <th className="px-3 py-3 font-medium">Ruangan</th>
                    <th className="px-3 py-3 font-medium">Shift</th>
                    <th className="px-3 py-3 font-medium">Suhu</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {suhuRecords.slice(0, 12).map((row) => (
                    <tr key={row.id} className="border-t border-slate-100">
                      <td className="px-3 py-3">{String(row.tanggal)}</td>
                      <td className="px-3 py-3">{row.namaRuangan || row.ruanganSlug}</td>
                      <td className="px-3 py-3">{row.shift}</td>
                      <td className="px-3 py-3">{row.suhu}°C</td>
                      <td className="px-3 py-3"><StatusBadge status={row.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      }}
    </ReportPage>
  );
}
