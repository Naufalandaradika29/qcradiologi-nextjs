export type KegiatanFrekuensi = "harian" | "mingguan" | "bulanan" | "tahunan";
export type KegiatanStatus = "aktif" | "nonaktif";

export interface KegiatanQC {
  id?: string;
  kodeKegiatan: string;
  namaKegiatan: string;
  kategori: string;
  frekuensi: KegiatanFrekuensi;
  standar: string;
  satuan: string;
  batasMinimum: number | null;
  batasMaksimum: number | null;
  keterangan: string;
  status: KegiatanStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
}
