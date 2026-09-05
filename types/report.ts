export type ReportTab = "qc" | "suhu";
export type ReportPeriod = "harian" | "mingguan" | "bulanan" | "tahunan";

export interface ReportRow {
  label: string;
  value: string;
}
