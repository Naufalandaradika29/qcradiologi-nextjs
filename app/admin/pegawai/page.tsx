"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, doc, getDocs, orderBy, query, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useAuth } from "@/hooks/useAuth";
import type { AppUser } from "@/types/user";

export default function PegawaiPage() {
  const { profile, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!authLoading) {
      loadUsers();
    }
  }, [authLoading]);

  async function loadUsers() {
    try {
      setLoading(true);
      const snap = await getDocs(query(collection(db, "users"), orderBy("nama", "asc")));
      setUsers(snap.docs.map((docSnap) => ({ ...(docSnap.data() as AppUser), uid: docSnap.id })));
    } catch (err) {
      console.error("Load users failed:", err);
      setError("Gagal memuat data pegawai.");
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch = !search || [user.nama, user.email, user.nip, user.bagian].some((value) => value?.toLowerCase().includes(search.toLowerCase()));
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesStatus = statusFilter === "all" || user.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const updateStatus = async (uid: string, role: "admin" | "pegawai", status: "aktif" | "nonaktif") => {
    try {
      await updateDoc(doc(db, "users", uid), { role, status, updatedAt: new Date() });
      setSuccess("Perubahan profil pegawai berhasil disimpan.");
      await loadUsers();
    } catch (err) {
      console.error("Update user failed:", err);
      setError("Gagal memperbarui profil pengguna.");
    }
  };

  if (authLoading) {
    return <AuthGuard><div className="p-6 text-slate-500">Memuat...</div></AuthGuard>;
  }

  return (
    <AuthGuard>
      <AppLayout user={profile} title="Data Pegawai">
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900">Data Pegawai</h1>
            <p className="mt-1 text-sm text-slate-500">Kelola profil, role, dan status pengguna.</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Daftar Pengguna</h2>
              <div className="flex flex-col gap-2 md:flex-row">
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari pegawai" className="md:w-60" />
                <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="md:w-40">
                  <option value="all">Semua role</option>
                  <option value="admin">Admin</option>
                  <option value="pegawai">Pegawai</option>
                </Select>
                <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="md:w-40">
                  <option value="all">Semua status</option>
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Nonaktif</option>
                </Select>
              </div>
            </div>

            {error ? <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div> : null}
            {success ? <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</div> : null}

            {loading ? <div className="py-8 text-center text-sm text-slate-500">Memuat data...</div> : filtered.length === 0 ? <EmptyState title="Belum ada data pegawai." description="Profile user akan muncul setelah login berhasil." /> : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-3 py-3 font-medium">Nama</th>
                      <th className="px-3 py-3 font-medium">Email</th>
                      <th className="px-3 py-3 font-medium">NIP</th>
                      <th className="px-3 py-3 font-medium">Bagian</th>
                      <th className="px-3 py-3 font-medium">Role</th>
                      <th className="px-3 py-3 font-medium">Status</th>
                      <th className="px-3 py-3 font-medium">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((user) => (
                      <tr key={user.uid} className="border-t border-slate-100">
                        <td className="px-3 py-3">{user.nama}</td>
                        <td className="px-3 py-3">{user.email}</td>
                        <td className="px-3 py-3">{user.nip || "-"}</td>
                        <td className="px-3 py-3">{user.bagian || "-"}</td>
                        <td className="px-3 py-3">
                          <Select value={user.role} onChange={(e) => updateStatus(user.uid, e.target.value as "admin" | "pegawai", user.status)}>
                            <option value="admin">Admin</option>
                            <option value="pegawai">Pegawai</option>
                          </Select>
                        </td>
                        <td className="px-3 py-3">
                          <Select value={user.status} onChange={(e) => updateStatus(user.uid, user.role, e.target.value as "aktif" | "nonaktif")}>
                            <option value="aktif">Aktif</option>
                            <option value="nonaktif">Nonaktif</option>
                          </Select>
                        </td>
                        <td className="px-3 py-3">
                          <Button type="button" variant="secondary" size="sm" onClick={() => updateStatus(user.uid, user.role, user.status)}>Simpan</Button>
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
