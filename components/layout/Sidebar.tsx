"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, LayoutDashboard, ClipboardCheck, BarChart3, Wrench, ClipboardList, Users, Activity, FolderKanban } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import type { AppUser } from "@/types/user";

const sidebarMenu = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Pemeriksaan QC", href: "/qc", icon: ClipboardCheck },
  { label: "Rekap Harian", href: "/rekap/harian", icon: BarChart3 },
  { label: "Rekap Mingguan", href: "/rekap/mingguan", icon: BarChart3 },
  { label: "Rekap Bulanan", href: "/rekap/bulanan", icon: BarChart3 },
  { label: "Rekap Tahunan", href: "/rekap/tahunan", icon: BarChart3 },
  { label: "Data Alat", href: "/admin/alat", icon: Wrench },
  { label: "Kegiatan QC", href: "/admin/kegiatan", icon: ClipboardList },
  { label: "Data Pegawai", href: "/admin/pegawai", icon: Users },
];

export function Sidebar({ user }: { user: AppUser | null }) {
  const pathname = usePathname();
  const isAdmin = user?.role === "admin";

  const showItem = (href: string) => {
    if (href.startsWith("/admin") && !isAdmin) return false;
    if (href.startsWith("/rekap") && !user) return false;
    return true;
  };

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
            <NavLink href="/dashboard" label="Dashboard" icon={LayoutDashboard} active={pathname === "/dashboard"} />
          </div>
        </div>

        <div>
          <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Quality Control</p>
          <div className="space-y-1">
            <NavLink href="/qc" label="Pemeriksaan QC" icon={ClipboardCheck} active={pathname === "/qc"} />
          </div>
        </div>

        <div>
          <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Rekapitulasi</p>
          <div className="space-y-1">
            {[
              ["/rekap/harian", "Rekap Harian"],
              ["/rekap/mingguan", "Rekap Mingguan"],
              ["/rekap/bulanan", "Rekap Bulanan"],
              ["/rekap/tahunan", "Rekap Tahunan"],
            ].map(([href, label]) => (
              <NavLink key={href} href={href} label={label} icon={BarChart3} active={pathname === href} />
            ))}
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

function NavLink({ href, label, icon: Icon, active }: { href: string; label: string; icon: typeof LayoutDashboard; active: boolean }) {
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
