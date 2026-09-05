"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, ClipboardCheck, BarChart3, Wrench, Users, FolderKanban, Thermometer, MonitorCheck, FileText } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import type { AppUser } from "@/types/user";

export function Sidebar({ user }: { user: AppUser | null }) {
  const pathname = usePathname();
  const isAdmin = user?.role === "admin";

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <aside className="flex w-full max-w-[280px] flex-col border-r border-slate-200 bg-white/95 backdrop-blur-sm lg:min-h-screen">
      <div className="border-b border-slate-200 px-6 py-6">
        <div className="text-xl font-bold text-slate-900">QC Radiologi</div>
        <div className="mt-1 text-sm text-slate-500">Quality Control System</div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
        <div>
          <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Menu Utama</p>
          <div className="space-y-1">
            <NavLink href="/alat" label="Alat" icon={MonitorCheck} active={pathname.startsWith("/alat")} />
          </div>
        </div>

        <div>
          <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Quality Control</p>
          <div className="space-y-1">
            <NavLink href="/qc" label="Pemeriksaan QC" icon={ClipboardCheck} active={pathname === "/qc"} />
            <NavLink href="/suhu-ruangan" label="Suhu Ruangan" icon={Thermometer} active={pathname.startsWith("/suhu-ruangan")} />
          </div>
        </div>

        <div>
          <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Report</p>
          <div className="space-y-1">
            <NavLink href="/report/harian" label="Harian" icon={BarChart3} active={pathname === "/report/harian"} />
            <NavLink href="/report/mingguan" label="Mingguan" icon={BarChart3} active={pathname === "/report/mingguan"} />
            <NavLink href="/report/bulanan" label="Bulanan" icon={BarChart3} active={pathname === "/report/bulanan"} />
            <NavLink href="/report/tahunan" label="Tahunan" icon={BarChart3} active={pathname === "/report/tahunan"} />
            <NavLink href="/report/ringkasan" label="Ringkasan Quality Control" icon={FileText} active={pathname === "/report/ringkasan"} />
          </div>
        </div>

        {isAdmin ? (
          <div>
            <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Data Master</p>
            <div className="space-y-1">
              <NavLink href="/admin/alat" label="Data Alat" icon={Wrench} active={pathname === "/admin/alat"} />
              <NavLink href="/admin/kegiatan" label="Kegiatan QC" icon={FolderKanban} active={pathname === "/admin/kegiatan"} />
              <NavLink href="/admin/pegawai" label="Data Pegawai" icon={Users} active={pathname === "/admin/pegawai"} />
            </div>
          </div>
        ) : null}

        <div>
          <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Sistem</p>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </nav>
    </aside>
  );
}

function NavLink({ href, label, icon: Icon, active }: { href: string; label: string; icon: React.ComponentType<{ className?: string }>; active: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
        active ? "bg-sky-50 text-sky-700 ring-1 ring-sky-200" : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}
