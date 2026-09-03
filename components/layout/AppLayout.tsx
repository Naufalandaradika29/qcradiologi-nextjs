"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import type { AppUser } from "@/types/user";

export function AppLayout({ user, title, children }: { user: AppUser | null; title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <Sidebar user={user} />
        <div className="flex min-h-screen flex-1 flex-col">
          <Topbar user={user} title={title} />
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
