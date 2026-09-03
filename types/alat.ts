export type AlatStatus = "aktif" | "nonaktif";

export interface Alat {
  id?: string;
  kodeAlat: string;
  namaAlat: string;
  merk: string;
  tipe: string;
  nomorSeri: string;
  ruangan: string;
  instalasi: string;
  tanggalPengadaan: string;
  status: AlatStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
}
