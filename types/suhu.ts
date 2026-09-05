export type ShiftName = "pagi" | "siang" | "malam";
export type SuhuStatus = "normal" | "di_bawah_standar" | "di_atas_standar";

export interface RuanganDefinition {
  slug: string;
  namaRuangan: string;
  kategori?: string;
}

export interface SuhuRecord {
  id?: string;
  ruanganId?: string;
  ruanganSlug: string;
  namaRuangan: string;
  tanggal: string;
  tanggalKey?: string;
  bulan: number;
  tahun: number;
  shift: ShiftName;
  suhu: number;
  status: SuhuStatus;
  catatan: string;
  petugasUid: string;
  petugasNama: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}
