"use client";

import { useEffect, useMemo, useState } from "react";
import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useAuth } from "@/hooks/useAuth";
import type { KegiatanQC } from "@/types/kegiatan";

const initialForm: {
  kodeKegiatan: string;
  namaKegiatan: string;
  kategori: string;
  frekuensi: "harian" | "mingguan" | "bulanan" | "tahunan";
  standar: string;
  satuan: string;
  batasMinimum: string;
  batasMaksimum: string;
  keterangan: string;
  status: "aktif" | "nonaktif";
} = {
  kodeKegiatan: "",
  namaKegiatan: "",
  kategori: "",
  frekuensi: "harian" as const,
  standar: "",
  satuan: "",
  batasMinimum: "",
  batasMaksimum: "",
  keterangan: "",
  status: "aktif" as const,
};

export default function KegiatanPage() {
  const { profile, loading: authLoading } = useAuth();
  const [items, setItems] = useState<KegiatanQC[]>([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [frekuensiFilter, setFrekuensiFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  }, [authLoading]);

  async function loadData() {
    try {
      setLoading(true);
      const snap = await getDocs(query(collection(db, "kegiatan_qc"), orderBy("namaKegiatan", "asc")));
      setItems(snap.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as KegiatanQC) })));
    } catch (err) {
      console.error("Load kegiatan failed:", err);
      setError("Gagal memuat kegiatan QC.");
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = !search || [item.kodeKegiatan, item.namaKegiatan, item.kategori, item.standar].some((value) => value?.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const matchesFrekuensi = frekuensiFilter === "all" || item.frekuensi === frekuensiFilter;
      return matchesSearch && matchesStatus && matchesFrekuensi;
    });
  }, [items, search, statusFilter, frekuensiFilter]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleChange = (field: keyof typeof initialForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.kodeKegiatan.trim() || !form.namaKegiatan.trim() || !form.kategori.trim() || !form.standar.trim()) {
      setError("Kode kegiatan, nama kegiatan, kategori, dan standar wajib diisi.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        kodeKegiatan: form.kodeKegiatan.trim(),
        namaKegiatan: form.namaKegiatan.trim(),
        kategori: form.kategori.trim(),
        standar: form.standar.trim(),
        satuan: form.satuan.trim(),
        keterangan: form.keterangan.trim(),
        batasMinimum: form.batasMinimum === "" ? null : Number(form.batasMinimum),
        batasMaksimum: form.batasMaksimum === "" ? null : Number(form.batasMaksimum),
        status: form.status,
        frekuensi: form.frekuensi,
      };

      if (editingId) {
        await updateDoc(doc(db, "kegiatan_qc", editingId), { ...payload, updatedAt: serverTimestamp() });
        setSuccess("Kegiatan QC berhasil diperbarui.");
      } else {
        await addDoc(collection(db, "kegiatan_qc"), { ...payload, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        setSuccess("Kegiatan QC berhasil ditambahkan.");
      }

      resetForm();
      await loadData();
    } catch (err) {
      console.error("Save kegiatan failed:", err);
      setError("Gagal menyimpan kegiatan QC.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: KegiatanQC) => {
    setEditingId(item.id ?? null);
    setForm({
      kodeKegiatan: item.kodeKegiatan,
      namaKegiatan: item.namaKegiatan,
      kategori: item.kategori,
      frekuensi: item.frekuensi,
      standar: item.standar,
      satuan: item.satuan,
      batasMinimum: item.batasMinimum === null ? "" : String(item.batasMinimum),
      batasMaksimum: item.batasMaksimum === null ? "" : String(item.batasMaksimum),
      keterangan: item.keterangan,
      status: item.status,
    });
  };

  const handleDelete = async (id?: string) => {
    if (!id || !window.confirm("Hapus kegiatan ini?")) return;
    try {
      await deleteDoc(doc(db, "kegiatan_qc", id));
      setSuccess("Kegiatan berhasil dihapus.");
      await loadData();
    } catch (err) {
      console.error("Delete kegiatan failed:", err);
      setError("Gagal menghapus kegiatan.");
    }
  };

  if (authLoading) {
    return <AuthGuard><div className="p-6 text-slate-500">Memuat...</div></AuthGuard>;
  }

  return (
    <AuthGuard>
      <AppLayout user={profile} title="Kegiatan QC">
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900">Kegiatan QC</h1>
            <p className="mt-1 text-sm text-slate-500">Kelola jenis kegiatan dan standar QC.</p>
          </div>

          <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Field label="Kode Kegiatan"><Input value={form.kodeKegiatan} onChange={(e) => handleChange("kodeKegiatan", e.target.value)} /></Field>
              <Field label="Nama Kegiatan"><Input value={form.namaKegiatan} onChange={(e) => handleChange("namaKegiatan", e.target.value)} /></Field>
              <Field label="Kategori"><Input value={form.kategori} onChange={(e) => handleChange("kategori", e.target.value)} /></Field>
              <Field label="Frekuensi">
                <Select value={form.frekuensi} onChange={(e) => handleChange("frekuensi", e.target.value)}>
                  <option value="harian">Harian</option>
                  <option value="mingguan">Mingguan</option>
                  <option value="bulanan">Bulanan</option>
                  <option value="tahunan">Tahunan</option>
                </Select>
              </Field>
              <Field label="Standar"><Input value={form.standar} onChange={(e) => handleChange("standar", e.target.value)} /></Field>
              <Field label="Satuan"><Input value={form.satuan} onChange={(e) => handleChange("satuan", e.target.value)} /></Field>
              <Field label="Batas Minimum"><Input type="number" value={form.batasMinimum} onChange={(e) => handleChange("batasMinimum", e.target.value)} /></Field>
              <Field label="Batas Maksimum"><Input type="number" value={form.batasMaksimum} onChange={(e) => handleChange("batasMaksimum", e.target.value)} /></Field>
              <Field label="Status">
                <Select value={form.status} onChange={(e) => handleChange("status", e.target.value)}>
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Nonaktif</option>
                </Select>
              </Field>
            </div>

            <div className="mt-4">
              <Field label="Keterangan">
                <textarea value={form.keterangan} onChange={(e) => handleChange("keterangan", e.target.value)} rows={3} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
              </Field>
            </div>

            {error ? <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div> : null}
            {success ? <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</div> : null}

            <div className="mt-5 flex gap-3">
              <Button type="submit" loading={saving}>{editingId ? "Simpan Perubahan" : "Tambah Kegiatan"}</Button>
              {editingId ? <Button type="button" variant="secondary" onClick={resetForm}>Batal</Button> : null}
            </div>
          </form>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Daftar Kegiatan</h2>
              <div className="flex flex-col gap-2 md:flex-row">
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari kegiatan" className="md:w-60" />
                <Select value={frekuensiFilter} onChange={(e) => setFrekuensiFilter(e.target.value)} className="md:w-40">
                  <option value="all">Semua frekuensi</option>
                  <option value="harian">Harian</option>
                  <option value="mingguan">Mingguan</option>
                  <option value="bulanan">Bulanan</option>
                  <option value="tahunan">Tahunan</option>
                </Select>
                <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="md:w-40">
                  <option value="all">Semua status</option>
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Nonaktif</option>
                </Select>
              </div>
            </div>

            {loading ? <div className="py-8 text-center text-sm text-slate-500">Memuat data...</div> : filtered.length === 0 ? <EmptyState title="Belum ada data kegiatan QC." description="Kegiatan QC akan muncul setelah ditambahkan." /> : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-3 py-3 font-medium">Kode</th>
                      <th className="px-3 py-3 font-medium">Nama</th>
                      <th className="px-3 py-3 font-medium">Frekuensi</th>
                      <th className="px-3 py-3 font-medium">Standar</th>
                      <th className="px-3 py-3 font-medium">Status</th>
                      <th className="px-3 py-3 font-medium">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((item) => (
                      <tr key={item.id} className="border-t border-slate-100">
                        <td className="px-3 py-3">{item.kodeKegiatan}</td>
                        <td className="px-3 py-3">{item.namaKegiatan}</td>
                        <td className="px-3 py-3">{item.frekuensi}</td>
                        <td className="px-3 py-3">{item.standar}</td>
                        <td className="px-3 py-3"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${item.status === "aktif" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{item.status}</span></td>
                        <td className="px-3 py-3">
                          <div className="flex gap-2">
                            <Button type="button" variant="secondary" size="sm" onClick={() => handleEdit(item)}>Edit</Button>
                            <Button type="button" variant="danger" size="sm" onClick={() => handleDelete(item.id)}>Hapus</Button>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="text-sm text-slate-700">
      <span className="mb-2 block font-medium">{label}</span>
      {children}
    </label>
  );
}
