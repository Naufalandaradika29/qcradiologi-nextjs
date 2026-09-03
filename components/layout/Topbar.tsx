"use client";

import { Bell } from "lucide-react";
import type { AppUser } from "@/types/user";

export function Topbar({ user, title }: { user: AppUser | null; title: string }) {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white/90 px-5 py-4 shadow-sm backdrop-blur-sm">
      <div className="text-xl font-semibold text-slate-800">{title}</div>
      <div className="flex items-center gap-3">
        <button type="button" className="rounded-full border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50">
          <Bell className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-600 text-sm font-semibold text-white">
            {user?.nama ? user.nama.charAt(0).toUpperCase() : "U"}
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-800">{user?.nama ?? "Memuat profil..."}</div>
            <div className="text-xs text-slate-500">{user?.role ? user.role.toUpperCase() : ""}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
