"use client";

import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { AppUser } from "@/types/user";

export type ReportPageProps = {
  user: AppUser | null;
  title: string;
  initialTab?: "qc" | "suhu";
  onDownload?: () => void;
  children: React.ReactNode | ((tab: "qc" | "suhu") => React.ReactNode);
};

export function ReportPage({ user, title, initialTab = "qc", onDownload, children }: ReportPageProps) {
  const [tab, setTab] = useState<"qc" | "suhu">(initialTab);
  const resolvedChildren = typeof children === "function" ? children(tab) : children;

  return (
    <AuthGuard>
      <AppLayout user={user} title={title}>
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
                <p className="mt-1 text-sm text-slate-500">Ringkasan hasil QC alat dan suhu ruangan.</p>
              </div>
              {onDownload ? (
                <Button type="button" variant="secondary" onClick={onDownload}>
                  Download Excel
                </Button>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
            <div className="flex flex-wrap gap-2">
              <TabButton active={tab === "qc"} onClick={() => setTab("qc")}>QC ALAT</TabButton>
              <TabButton active={tab === "suhu"} onClick={() => setTab("suhu")}>SUHU RUANGAN</TabButton>
            </div>
          </div>

          {resolvedChildren}
        </div>
      </AppLayout>
    </AuthGuard>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${active ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
    >
      {children}
    </button>
  );
}

export function ReportFilterBar({
  dateValue,
  onDateChange,
  selectValue,
  onSelectChange,
  selectOptions,
  onReset,
}: {
  dateValue?: string;
  onDateChange?: (value: string) => void;
  selectValue?: string;
  onSelectChange?: (value: string) => void;
  selectOptions?: Array<{ value: string; label: string }>;
  onReset?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        {onDateChange ? (
          <div className="w-full md:max-w-xs">
            <label className="mb-2 block text-sm font-medium text-slate-700">Tanggal</label>
            <Input type="date" value={dateValue ?? ""} onChange={(event) => onDateChange(event.target.value)} />
          </div>
        ) : null}

        {selectOptions && onSelectChange ? (
          <div className="w-full md:max-w-xs">
            <label className="mb-2 block text-sm font-medium text-slate-700">Filter</label>
            <Select value={selectValue ?? "all"} onChange={(event) => onSelectChange(event.target.value)}>
              <option value="all">Semua</option>
              {selectOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </Select>
          </div>
        ) : null}

        {onReset ? (
          <div className="md:ml-auto">
            <Button type="button" variant="secondary" onClick={onReset}>Reset</Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
    baik: "success",
    tidak_baik: "danger",
    NORMAL: "success",
    "DI BAWAH STANDAR": "warning",
    "DI ATAS STANDAR": "danger",
    normal: "success",
    di_bawah_standar: "warning",
    di_atas_standar: "danger",
  };

  return <Badge tone={map[status] ?? "neutral"}>{status}</Badge>;
}
