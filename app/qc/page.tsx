"use client";

import { useEffect, useMemo, useState } from "react";
import { Timestamp, collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AuthGuard } from "@/components/AuthGuard";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useAuth } from "@/hooks/useAuth";
import { computeHasil, createPemeriksaan, deletePemeriksaan, updatePemeriksaan } from "@/services/pemeriksaanService";
import type { Alat } from "@/types/alat";
import type { KegiatanQC } from "@/types/kegiatan";
import type { PemeriksaanQC } from "@/types/pemeriksaan";

export default function QcPage() {
  const { profile, loading: authLoading } = useAuth();
  const [alatList, setAlatList] = useState<Alat[]>([]);
  const [kegiatanList, setKegiatanList] = useState<KegiatanQC[]>([]);
  const [pemeriksaanList, setPemeriksaanList] = useState<PemeriksaanQC[]>([]);
  const [selectedAlatId, setSelectedAlatId] = useState("");
  const [selectedKegiatanId, setSelectedKegiatanId] = useState("");
  const [selectedAlat, setSelectedAlat] = useState<Alat | null>(null);
  const [selectedKegiatan, setSelectedKegiatan] = useState<KegiatanQC | null>(null);
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [nilai, setNilai] = useState("");
  const [catatan, setCatatan] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [alatSnap, kegiatanSnap, pemeriksaanSnap] = await Promise.all([
          getDocs(query(collection(db, "alat"), orderBy("namaAlat", "asc"))),
          getDocs(query(collection(db, "kegiatan_qc"), orderBy("namaKegiatan", "asc"))),
          getDocs(query(collection(db, "pemeriksaan_qc"), orderBy("tanggal", "desc"))),
        ]);

        setAlatList(alatSnap.docs.map((item) => ({ id: item.id, ...(item.data() as Alat) })));
        setKegiatanList(kegiatanSnap.docs.map((item) => ({ id: item.id, ...(item.data() as KegiatanQC) })));
        setPemeriksaanList(pemeriksaanSnap.docs.map((item) => ({ id: item.id, ...(item.data() as PemeriksaanQC) })));
      } catch (err) {
        console.error("QC page load failed:", err);
        setError("Gagal memuat data pemeriksaan.");
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      loadData();
    }
  }, [authLoading]);

  useEffect(() => {
    setSelectedAlat(alatList.find((item) => item.id === selectedAlatId) ?? null);
  }, [selectedAlatId, alatList]);

  useEffect(() => {
    setSelectedKegiatan(kegiatanList.find((item) => item.id === selectedKegiatanId) ?? null);
  }, [selectedKegiatanId, kegiatanList]);

  const filteredPemeriksaan = useMemo(() => {
    return pemeriksaanList.filter((row) => {
      const matchesSearch =
        !search ||
        [row.alatNama, row.kegiatanNama, row.petugasNama, row.catatan].some((value) =>
          value?.toLowerCase().includes(search.toLowerCase()),
        );
      const matchesStatus = statusFilter === "all" || normalizeHasil(row.hasil) === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [pemeriksaanList, search, statusFilter]);

  const resetForm = () => {
    setSelectedAlatId("");
    setSelectedKegiatanId("");
    setSelectedAlat(null);
    setSelectedKegiatan(null);
    setTanggal(new Date().toISOString().slice(0, 10));
    setNilai("");
    setCatatan("");
    setEditingId(null);
  };

  const handleEdit = (item: PemeriksaanQC) => {
    setEditingId(item.id ?? null);
    setSelectedAlatId(item.alatId);
    setSelectedKegiatanId(item.kegiatanId);
    setTanggal(item.tanggal ? new Date(String(item.tanggal)).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
    setNilai(String(item.nilai));
    setCatatan(item.catatan ?? "");
  };

  const handleDelete = async (id?: string) => {
    if (!id || !window.confirm("Hapus pemeriksaan ini?")) return;
    try {
      await deletePemeriksaan(id);
      setPemeriksaanList((prev) => prev.filter((item) => item.id !== id));
      setSuccess("Pemeriksaan berhasil dihapus.");
    } catch (err) {
      console.error("Delete inspection failed:", err);
      setError("Gagal menghapus pemeriksaan.");
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedAlat || !selectedKegiatan || !tanggal || !nilai) {
      setError("Tanggal, alat, kegiatan, dan nilai wajib diisi.");
      return;
    }

    if (!profile?.uid) {
      setError("Sesi user tidak valid.");
      return;
    }

    setSaving(true);

    try {
      const trimmedNilai = String(nilai).trim();
      const parsedNilai = Number(trimmedNilai);
      const computedHasil = computeHasil(
        selectedKegiatan.batasMinimum === null && selectedKegiatan.batasMaksimum === null ? trimmedNilai : parsedNilai,
        selectedKegiatan.batasMinimum,
        selectedKegiatan.batasMaksimum,
      );

      const payload = {
        tanggal: new Date(`${tanggal}T00:00:00`),
        alatId: selectedAlat.id ?? "",
        alatKode: selectedAlat.kodeAlat,
        alatNama: selectedAlat.namaAlat,
        kegiatanId: selectedKegiatan.id ?? "",
        kegiatanNama: selectedKegiatan.namaKegiatan,
        petugasUid: profile.uid,
        petugasNama: profile.nama,
        nilai: Number.isNaN(parsedNilai) ? trimmedNilai : parsedNilai,
        satuan: selectedKegiatan.satuan,
        standar: selectedKegiatan.standar,
        batasMinimum: selectedKegiatan.batasMinimum,
        batasMaksimum: selectedKegiatan.batasMaksimum,
        hasil: computedHasil,
        catatan: catatan.trim(),
      };

      if (editingId) {
        await updatePemeriksaan(editingId, payload);
        setSuccess("Pemeriksaan berhasil diperbarui.");
      } else {
        await createPemeriksaan(payload);
        setSuccess("Pemeriksaan berhasil disimpan.");
      }

      resetForm();
      const updatedSnap = await getDocs(query(collection(db, "pemeriksaan_qc"), orderBy("tanggal", "desc")));
      setPemeriksaanList(updatedSnap.docs.map((item) => ({ id: item.id, ...(item.data() as PemeriksaanQC) })));
    } catch (err) {
      console.error("Save inspection failed:", err);
      setError("Gagal menyimpan pemeriksaan QC.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthGuard>
      <AppLayout user={profile} title="Pemeriksaan QC">
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900">Pemeriksaan QC</h1>
            <p className="mt-1 text-sm text-slate-500">Catat hasil pemeriksaan alat dan kegiatan QC.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm text-slate-700">
                <span className="mb-2 block font-medium">Tanggal</span>
                <Input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
              </label>
              <label className="text-sm text-slate-700">
                <span className="mb-2 block font-medium">Pilih Alat</span>
                <Select value={selectedAlatId} onChange={(e) => setSelectedAlatId(e.target.value)}>
                  <option value="">Pilih alat</option>
                  {alatList.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.namaAlat} - {item.kodeAlat}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="text-sm text-slate-700 md:col-span-2">
                <span className="mb-2 block font-medium">Pilih Kegiatan QC</span>
                <Select value={selectedKegiatanId} onChange={(e) => setSelectedKegiatanId(e.target.value)}>
                  <option value="">Pilih kegiatan</option>
                  {kegiatanList.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.namaKegiatan} ({item.frekuensi})
                    </option>
                  ))}
                </Select>
              </label>
            </div>

            {selectedKegiatan ? (
              <div className="rounded-xl border border-sky-100 bg-sky-50 p-4 text-sm text-slate-700">
                <div className="grid gap-3 md:grid-cols-3">
                  <div>
                    <span className="block font-medium text-slate-600">Standar</span>
                    {selectedKegiatan.standar}
                  </div>
                  <div>
                    <span className="block font-medium text-slate-600">Satuan</span>
                    {selectedKegiatan.satuan}
                  </div>
                  <div>
                    <span className="block font-medium text-slate-600">Batas</span>
                    {selectedKegiatan.batasMinimum ?? "-"} - {selectedKegiatan.batasMaksimum ?? "-"}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm text-slate-700">
                <span className="mb-2 block font-medium">Nilai Hasil Pemeriksaan</span>
                <Input value={nilai} onChange={(e) => setNilai(e.target.value)} placeholder="Masukkan nilai" />
              </label>
              <label className="text-sm text-slate-700">
                <span className="mb-2 block font-medium">Satuan</span>
                <Input value={selectedKegiatan?.satuan ?? ""} readOnly />
              </label>
            </div>

            <label className="text-sm text-slate-700">
              <span className="mb-2 block font-medium">Catatan</span>
              <textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                placeholder="Catatan pemeriksaan"
              />
            </label>

            {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div> : null}
            {success ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</div> : null}

            <div className="flex gap-3">
              <Button type="submit" loading={saving}>{editingId ? "Simpan Perubahan" : "Simpan Pemeriksaan"}</Button>
              {editingId ? (
                <Button type="button" variant="secondary" onClick={resetForm}>
                  Batal
                </Button>
              ) : null}
            </div>
          </form>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Riwayat Pemeriksaan</h2>
              <div className="flex flex-col gap-2 md:flex-row">
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari alat, kegiatan, petugas" className="md:w-60" />
                <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="md:w-40">
                  <option value="all">Semua Hasil</option>
                  <option value="baik">✓</option>
                  <option value="tidak_baik">✕</option>
                </Select>
              </div>
            </div>

            {loading ? (
              <div className="py-8 text-center text-sm text-slate-500">Memuat riwayat...</div>
            ) : filteredPemeriksaan.length === 0 ? (
              <EmptyState title="Belum ada data pemeriksaan QC." description="Data riwayat akan muncul setelah pemeriksaan pertama disimpan." />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-3 py-3 font-medium">Tanggal</th>
                      <th className="px-3 py-3 font-medium">Alat</th>
                      <th className="px-3 py-3 font-medium">Kegiatan</th>
                      <th className="px-3 py-3 font-medium">Nilai</th>
                      <th className="px-3 py-3 font-medium">Hasil</th>
                      <th className="px-3 py-3 font-medium">Catatan</th>
                      <th className="px-3 py-3 font-medium">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPemeriksaan.map((item) => (
                      <tr key={item.id} className="border-t border-slate-100">
                        <td className="px-3 py-3">{formatDate(item.tanggal)}</td>
                        <td className="px-3 py-3">{item.alatNama}</td>
                        <td className="px-3 py-3">{item.kegiatanNama}</td>
                        <td className="px-3 py-3">
                          {displayValue(item.nilai)} {displayValue(item.satuan)}
                        </td>
                        <td className="px-3 py-3">
                          <HasilIcon hasil={normalizeHasil(item.hasil)} />
                        </td>
                        <td className="px-3 py-3">{item.catatan || "-"}</td>
                        <td className="px-3 py-3">
                          <div className="flex gap-2">
                            <Button type="button" variant="secondary" size="sm" onClick={() => handleEdit(item)}>
                              Edit
                            </Button>
                            <Button type="button" variant="danger" size="sm" onClick={() => handleDelete(item.id)}>
                              Hapus
                            </Button>
                          </div>
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

function formatDate(value: unknown) {
  if (!value) return "-";
  if (value instanceof Timestamp) return value.toDate().toLocaleDateString("id-ID");
  if (typeof value === "string") return new Date(value).toLocaleDateString("id-ID");
  return new Date(String(value)).toLocaleDateString("id-ID");
}

type NormalizedHasil = "baik" | "tidak_baik" | "tidak_diketahui";

function normalizeHasil(value: unknown): NormalizedHasil {
  if (typeof value === "boolean") return value ? "baik" : "tidak_baik";
  if (typeof value !== "string") return "tidak_diketahui";

  const normalized = value.trim().toLowerCase();
  if (["lulus", "ok", "baik", "true", "✓"].includes(normalized)) return "baik";
  if (["tidak lulus", "tidak_lulus", "tidak baik", "tidak_baik", "false", "✕"].includes(normalized)) return "tidak_baik";
  return "tidak_diketahui";
}

function displayValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "number" && Number.isNaN(value)) return "-";
  return String(value);
}

function HasilIcon({ hasil }: { hasil: NormalizedHasil }) {
  if (hasil === "baik") {
    return (
      <span aria-label="Hasil baik" title="Hasil baik" className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-base font-bold text-emerald-700">
        ✓
      </span>
    );
  }

  if (hasil === "tidak_baik") {
    return (
      <span aria-label="Hasil tidak baik" title="Hasil tidak baik" className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-rose-100 text-base font-bold text-rose-700">
        ✕
      </span>
    );
  }

  return <span aria-label="Hasil tidak tersedia" title="Hasil tidak tersedia">-</span>;
}
