"use client";

import { useEffect, useMemo, useState } from "react";
import { Edit3 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { useAuth } from "@/hooks/useAuth";
import { approveUser, disableUser, getUsers, updateUserProfile } from "@/services/userService";
import type { AppUser, UserStatus } from "@/types/user";

const statusLabels: Record<UserStatus, string> = { pending: "PENDING", aktif: "AKTIF", nonaktif: "NONAKTIF" };

export default function PegawaiPage() {
  const { profile, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editing, setEditing] = useState<AppUser | null>(null);
  const [confirming, setConfirming] = useState<AppUser | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && profile?.role === "admin") void loadUsers();
  }, [authLoading, profile]);

  async function loadUsers() {
    try {
      setLoading(true);
      setError("");
      setUsers(await getUsers());
    } catch (loadError) {
      console.error("Load users failed:", loadError);
      setError("Gagal memuat data pegawai.");
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => users.filter((user) => {
    const term = search.toLowerCase();
    return (!term || [user.nama, user.email, user.nip, user.bagian].some((value) => value?.toLowerCase().includes(term))) &&
      (roleFilter === "all" || user.role === roleFilter) && (statusFilter === "all" || user.status === statusFilter);
  }), [users, search, roleFilter, statusFilter]);

  async function changeStatus() {
    if (!confirming) return;
    try {
      setSaving(true);
      if (confirming.status === "pending" || confirming.status === "nonaktif") await approveUser(confirming.uid);
      else await disableUser(confirming.uid);
      setConfirming(null);
      setSuccess(confirming.status === "aktif" ? "Akun pegawai berhasil dinonaktifkan." : "Akun pegawai berhasil diaktifkan.");
      await loadUsers();
    } catch (statusError) {
      console.error("Update user status failed:", statusError);
      setError("Gagal memperbarui status pengguna.");
    } finally {
      setSaving(false);
    }
  }

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const form = new FormData(event.currentTarget);
    try {
      setSaving(true);
      await updateUserProfile(editing.uid, { nama: String(form.get("nama") ?? "").trim(), nip: String(form.get("nip") ?? "").trim(), bagian: String(form.get("bagian") ?? "").trim() });
      setEditing(null);
      setSuccess("Profil pegawai berhasil diperbarui.");
      await loadUsers();
    } catch (saveError) {
      console.error("Update user profile failed:", saveError);
      setError("Gagal memperbarui profil pegawai.");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading) return <AuthGuard><div className="p-6 text-slate-500">Memuat...</div></AuthGuard>;

  return <AuthGuard>
    <AppLayout user={profile} title="Data Pegawai">
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h1 className="text-2xl font-bold text-slate-900">Data Pegawai</h1><p className="mt-1 text-sm text-slate-500">Kelola profil dan persetujuan pengguna.</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><h2 className="text-lg font-semibold text-slate-900">Daftar Pengguna</h2><div className="flex flex-col gap-2 md:flex-row"><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari pegawai" className="md:w-60" /><Select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="md:w-40"><option value="all">Semua role</option><option value="admin">Admin</option><option value="pegawai">Pegawai</option></Select><Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="md:w-40"><option value="all">Semua status</option><option value="pending">Pending</option><option value="aktif">Aktif</option><option value="nonaktif">Nonaktif</option></Select></div></div>
          {error ? <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div> : null}
          {success ? <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</div> : null}
          {loading ? <div className="py-8 text-center text-sm text-slate-500">Memuat data...</div> : filtered.length === 0 ? <EmptyState title={users.length === 0 ? "Belum ada data pegawai." : "Tidak ada akun yang menunggu persetujuan."} description="Profile user akan muncul setelah registrasi berhasil." /> : <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-slate-600"><tr>{["Nama", "NIP", "Bagian", "Email", "Role", "Status", "Tanggal Daftar", "Aksi"].map((heading) => <th key={heading} className="px-3 py-3 font-medium">{heading}</th>)}</tr></thead><tbody>{filtered.map((user) => <tr key={user.uid} className="border-t border-slate-100"><td className="px-3 py-3 font-medium">{user.nama}</td><td className="px-3 py-3">{user.nip || "-"}</td><td className="px-3 py-3">{user.bagian || "-"}</td><td className="px-3 py-3">{user.email}</td><td className="px-3 py-3"><Badge tone={user.role === "admin" ? "info" : "neutral"}>{user.role.toUpperCase()}</Badge></td><td className="px-3 py-3"><Badge tone={user.status === "aktif" ? "success" : user.status === "pending" ? "warning" : "danger"}>{statusLabels[user.status]}</Badge></td><td className="whitespace-nowrap px-3 py-3 text-slate-500">{formatDate(user.createdAt)}</td><td className="px-3 py-3"><div className="flex flex-wrap gap-2"><Button type="button" variant="secondary" size="sm" onClick={() => setEditing(user)}><Edit3 className="mr-1 h-3.5 w-3.5" />Edit</Button>{user.role !== "admin" && <Button type="button" variant={user.status === "aktif" ? "danger" : "primary"} size="sm" onClick={() => setConfirming(user)}>{user.status === "aktif" ? "Nonaktifkan" : "Aktifkan"}</Button>}</div></td></tr>)}</tbody></table></div>}
        </div>
      </div>
      <Modal open={Boolean(editing)} title="Edit profil pegawai" onClose={() => setEditing(null)}><form onSubmit={saveProfile} className="space-y-4"><EditField name="nama" label="Nama Lengkap" defaultValue={editing?.nama} /><EditField name="nip" label="NIP / ID Pegawai" defaultValue={editing?.nip} /><EditField name="bagian" label="Bagian / Unit" defaultValue={editing?.bagian} /><div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setEditing(null)}>Batal</Button><Button type="submit" loading={saving}>Simpan</Button></div></form></Modal>
      <ConfirmDialog open={Boolean(confirming)} title={confirming?.status === "aktif" ? "Nonaktifkan akun?" : "Aktifkan akun pegawai ini?"} message={confirming?.status === "aktif" ? "Pegawai ini tidak dapat masuk aplikasi sampai diaktifkan kembali." : "Akun pegawai ini akan dapat masuk setelah diaktifkan."} onCancel={() => setConfirming(null)} onConfirm={() => void changeStatus()} />
    </AppLayout>
  </AuthGuard>;
}

function formatDate(value: unknown) {
  if (!value) return "-";
  if (typeof value === "object" && value !== null && "toDate" in value && typeof value.toDate === "function") return value.toDate().toLocaleDateString("id-ID");
  if (value instanceof Date) return value.toLocaleDateString("id-ID");
  return "-";
}

function EditField({ name, label, defaultValue }: { name: string; label: string; defaultValue?: string }) {
  return <label className="block"><span className="mb-1 block text-sm font-medium text-slate-700">{label}</span><Input name={name} defaultValue={defaultValue} required /></label>;
}
