export type PemeriksaanHasil = "lulus" | "tidak_lulus";

export interface PemeriksaanQC {
  id?: string;
  tanggal: unknown;
  alatId: string;
  alatKode: string;
  alatNama: string;
  kegiatanId: string;
  kegiatanNama: string;
  petugasUid: string;
  petugasNama: string;
  nilai: number | string;
  satuan: string;
  standar: string;
  batasMinimum: number | null;
  batasMaksimum: number | null;
  hasil: PemeriksaanHasil;
  catatan: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}
