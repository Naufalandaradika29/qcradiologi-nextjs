export type QcStatus = "baik" | "tidak_baik";
export type QcOverallStatus = "baik" | "tidak_baik";

export interface QcChecklistItem {
  nomor: number;
  kategori: string;
  kegiatan: string;
  parameter: string;
}

export interface QcChecklistDefinition {
  slug: string;
  namaAlat: string;
  checklist: QcChecklistItem[];
  emptyStateTitle?: string;
  emptyStateDescription?: string;
}

export interface QcAnswer {
  kegiatanId: string;
  nomor: number;
  kategori: string;
  kegiatan: string;
  parameter: string;
  hasil: QcStatus;
}

export interface QcRecord {
  id?: string;
  alatId?: string;
  alatSlug: string;
  namaAlat: string;
  tanggal: string;
  bulan: number;
  tahun: number;
  petugasUid: string;
  petugasNama: string;
  catatan: string;
  jumlahBaik: number;
  jumlahTidakBaik: number;
  statusKeseluruhan: QcOverallStatus;
  answers: QcAnswer[];
  createdAt?: unknown;
  updatedAt?: unknown;
}
