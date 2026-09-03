"use client";

import { useEffect, useMemo, useState } from "react";
import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, Timestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useAuth } from "@/hooks/useAuth";
import type { Alat } from "@/types/alat";

const initialForm: {
  kodeAlat: string;
  namaAlat: string;
  merk: string;
  tipe: string;
  nomorSeri: string;
  ruangan: string;
  instalasi: string;
  tanggalPengadaan: string;
  status: "aktif" | "nonaktif";
} = {
  kodeAlat: "",
  namaAlat: "",
  merk: "",
  tipe: "",
  nomorSeri: "",
  ruangan: "",
  instalasi: "",
  tanggalPengadaan: "",
  status: "aktif" as const,
};

export default function AlatPage() {
  const { profile, loading: authLoading } = useAuth();
  const [items, setItems] = useState<Alat[]>([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
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
      const snap = await getDocs(query(collection(db, "alat"), orderBy("namaAlat", "asc")));
      setItems(snap.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Alat) })));
    } catch (err) {
      console.error("Load alat failed:", err);
      setError("Gagal memuat data alat.");
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        !search ||
        [item.kodeAlat, item.namaAlat, item.merk, item.tipe, item.ruangan, item.instalasi].some((value) =>
          value?.toLowerCase().includes(search.toLowerCase()),
        );
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [items, search, statusFilter]);

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

    if (!form.kodeAlat.trim() || !form.namaAlat.trim() || !form.merk.trim() || !form.tipe.trim() || !form.ruangan.trim()) {
      setError("Semua field utama wajib diisi.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        kodeAlat: form.kodeAlat.trim(),
        namaAlat: form.namaAlat.trim(),
        merk: form.merk.trim(),
        tipe: form.tipe.trim(),
        nomorSeri: form.nomorSeri.trim(),
        ruangan: form.ruangan.trim(),
        instalasi: form.instalasi.trim(),
        tanggalPengadaan: form.tanggalPengadaan,
        status: form.status,
      };

      if (editingId) {
        await updateDoc(doc(db, "alat", editingId), { ...payload, updatedAt: serverTimestamp() });
        setSuccess("Data alat berhasil diperbarui.");
      } else {
        await addDoc(collection(db, "alat"), { ...payload, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        setSuccess("Data alat berhasil ditambahkan.");
      }

      resetForm();
      await loadData();
    } catch (err) {
      console.error("Save alat failed:", err);
      setError("Gagal menyimpan data alat.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: Alat) => {
    setEditingId(item.id ?? null);
    setForm({
      kodeAlat: item.kodeAlat,
      namaAlat: item.namaAlat,
      merk: item.merk,
      tipe: item.tipe,
      nomorSeri: item.nomorSeri,
      ruangan: item.ruangan,
      instalasi: item.instalasi,
      tanggalPengadaan: item.tanggalPengadaan,
      status: item.status,
    });
  };

  const handleDelete = async (id?: string) => {
    if (!id || !window.confirm("Hapus data alat ini?")) return;
    try {
      await deleteDoc(doc(db, "alat", id));
      setSuccess("Data alat berhasil dihapus.");
      await loadData();
    } catch (err) {
      console.error("Delete alat failed:", err);
      setError("Gagal menghapus data alat.");
    }
  };

  if (authLoading) {
    return <AuthGuard><div className="p-6 text-slate-500">Memuat...</div></AuthGuard>;
  }

  return (
    <AuthGuard>
      <AppLayout user={profile} title="Data Alat">
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900">Data Alat</h1>
            <p className="mt-1 text-sm text-slate-500">Kelola daftar alat radiologi.</p>
          </div>

          <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Field label="Kode Alat"><Input value={form.kodeAlat} onChange={(e) => handleChange("kodeAlat", e.target.value)} /></Field>
              <Field label="Nama Alat"><Input value={form.namaAlat} onChange={(e) => handleChange("namaAlat", e.target.value)} /></Field>
              <Field label="Merk"><Input value={form.merk} onChange={(e) => handleChange("merk", e.target.value)} /></Field>
              <Field label="Tipe"><Input value={form.tipe} onChange={(e) => handleChange("tipe", e.target.value)} /></Field>
              <Field label="Nomor Seri"><Input value={form.nomorSeri} onChange={(e) => handleChange("nomorSeri", e.target.value)} /></Field>
              <Field label="Ruangan"><Input value={form.ruangan} onChange={(e) => handleChange("ruangan", e.target.value)} /></Field>
              <Field label="Instalasi"><Input value={form.instalasi} onChange={(e) => handleChange("instalasi", e.target.value)} /></Field>
              <Field label="Tanggal Pengadaan"><Input type="date" value={form.tanggalPengadaan} onChange={(e) => handleChange("tanggalPengadaan", e.target.value)} /></Field>
              <Field label="Status">
                <Select value={form.status} onChange={(e) => handleChange("status", e.target.value)}>
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Nonaktif</option>
                </Select>
              </Field>
            </div>

            {error ? <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div> : null}
            {success ? <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</div> : null}

            <div className="mt-5 flex gap-3">
              <Button type="submit" loading={saving}>{editingId ? "Simpan Perubahan" : "Tambah Alat"}</Button>
              {editingId ? <Button type="button" variant="secondary" onClick={resetForm}>Batal</Button> : null}
            </div>
          </form>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Daftar Alat</h2>
              <div className="flex flex-col gap-2 md:flex-row">
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari alat" className="md:w-60" />
                <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="md:w-40">
                  <option value="all">Semua status</option>
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Nonaktif</option>
                </Select>
              </div>
            </div>

            {loading ? <div className="py-8 text-center text-sm text-slate-500">Memuat data...</div> : filtered.length === 0 ? <EmptyState title="Belum ada data alat." description="Data alat akan muncul setelah ditambahkan." /> : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-3 py-3 font-medium">Kode</th>
                      <th className="px-3 py-3 font-medium">Nama</th>
                      <th className="px-3 py-3 font-medium">Merk</th>
                      <th className="px-3 py-3 font-medium">Ruangan</th>
                      <th className="px-3 py-3 font-medium">Status</th>
                      <th className="px-3 py-3 font-medium">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((item) => (
                      <tr key={item.id} className="border-t border-slate-100">
                        <td className="px-3 py-3">{item.kodeAlat}</td>
                        <td className="px-3 py-3">{item.namaAlat}</td>
                        <td className="px-3 py-3">{item.merk}</td>
                        <td className="px-3 py-3">{item.ruangan}</td>
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
