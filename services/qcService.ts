import { addDoc, collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { QcChecklistDefinition, QcRecord, QcStatus } from "@/types/qc";

export const QC_TOOL_DEFINITIONS: QcChecklistDefinition[] = [
  {
    slug: "usg",
    namaAlat: "USG",
    checklist: [
      { nomor: 1, kategori: "Cek Pesawat dan Ruangan", kegiatan: "Panel ON", parameter: "Posisi ON" },
      { nomor: 2, kategori: "Cek Pesawat dan Ruangan", kegiatan: "Pesawat ON", parameter: "Lampu Indikator Nyala" },
      { nomor: 3, kategori: "Cek Pesawat dan Ruangan", kegiatan: "Cek Monitor", parameter: "ON" },
      { nomor: 4, kategori: "Cek Pesawat dan Ruangan", kegiatan: "Cek UPS", parameter: "ON" },
      { nomor: 5, kategori: "Cek Pesawat dan Ruangan", kegiatan: "AC", parameter: "ON" },
      { nomor: 6, kategori: "Cek Pesawat dan Ruangan", kegiatan: "Tempat tidur pasien", parameter: "Kebersihan" },
      { nomor: 7, kategori: "Warming Up Pesawat", kegiatan: "Lakukan Pemanasan", parameter: "Merubah parameter" },
      { nomor: 8, kategori: "Warming Up Pesawat", kegiatan: "Cek probe USG", parameter: "kegunaan" },
      { nomor: 9, kategori: "Ruangan", kegiatan: "Kebersihan Ruangan", parameter: "Tidak terlihat sampah" },
      { nomor: 10, kategori: "Ruangan", kegiatan: "Tempat sampah", parameter: "Kosong" },
    ],
  },
  {
    slug: "ct-scan",
    namaAlat: "CT Scan",
    checklist: [
      { nomor: 1, kategori: "Cek Pesawat", kegiatan: "Panel ON", parameter: "Posisi ON" },
      { nomor: 2, kategori: "Cek Pesawat", kegiatan: "Pesawat dan gantry ON", parameter: "Lampu Indikator Nyala" },
      { nomor: 3, kategori: "Cek Pesawat", kegiatan: "Workstation ON", parameter: "Display standby" },
      { nomor: 4, kategori: "Cek Pesawat", kegiatan: "Injektor ON", parameter: "Display standby" },
      { nomor: 5, kategori: "Cek Pesawat", kegiatan: "Tes Sistem Injektor", parameter: "Dapat mengisi dan membuang" },
      { nomor: 6, kategori: "Warming Up Pesawat", kegiatan: "Tube Warm Up", parameter: "Setiap pagi" },
      { nomor: 7, kategori: "Warming Up Pesawat", kegiatan: "Air calibration", parameter: "1 minggu 1 X" },
      { nomor: 8, kategori: "Warming Up Pesawat", kegiatan: "Cek kualitas gambar", parameter: "pengamatan gambar" },
      { nomor: 10, kategori: "Ruangan", kegiatan: "Kebersihan Ruangan", parameter: "Tidak terlihat sampah" },
      { nomor: 11, kategori: "Ruangan", kegiatan: "Baju Pasien rapih", parameter: "Tidak di taruh di luar" },
      { nomor: 12, kategori: "Ruangan", kegiatan: "Kebersihan meja/asesoris", parameter: "kondisi bersih" },
    ],
  },
  {
    slug: "panoramic",
    namaAlat: "Panoramic",
    checklist: [
      { nomor: 1, kategori: "Cek Pesawat", kegiatan: "Panel ON", parameter: "Posisi ON" },
      { nomor: 2, kategori: "Cek Pesawat", kegiatan: "Pesawat ON", parameter: "Lampu Indikator Nyala" },
      { nomor: 3, kategori: "Cek Pesawat", kegiatan: "PC", parameter: "Display akan tampil angka" },
      { nomor: 4, kategori: "Cek Pesawat", kegiatan: "Aplikasi", parameter: "Display akan tampil angka" },
      { nomor: 5, kategori: "Cek Pesawat", kegiatan: "Rotasi Tube", parameter: "Dapat bergerak" },
      { nomor: 6, kategori: "Warming Up Pesawat", kegiatan: "Lakukan Pemanasan tube", parameter: "Lakukan tes tube tekan tombol expos sebanyak 3 x" },
      { nomor: 7, kategori: "Warming Up Pesawat", kegiatan: "Lakukan dengan kondisi berbeda", parameter: "-" },
      { nomor: 8, kategori: "Ruangan", kegiatan: "Kebersihan Ruangan", parameter: "Tidak terlihat sampah" },
      { nomor: 9, kategori: "Ruangan", kegiatan: "Baju Pasien rapih", parameter: "Tidak di taruh di luar" },
    ],
  },
  {
    slug: "general-xray-dental",
    namaAlat: "General X-Ray & Dental",
    checklist: [
      { nomor: 1, kategori: "Cek Pesawat", kegiatan: "Panel ON", parameter: "Posisi ON" },
      { nomor: 2, kategori: "Cek Pesawat", kegiatan: "Pesawat ON", parameter: "Lampu Indikator Nyala" },
      { nomor: 3, kategori: "Cek Pesawat", kegiatan: "Cek Parameter KV", parameter: "Display akan tampil angka" },
      { nomor: 4, kategori: "Cek Pesawat", kegiatan: "Cek Parameter mAs", parameter: "Display akan tampil angka" },
      { nomor: 5, kategori: "Cek Pesawat", kegiatan: "Cek Kolimasi/diagframa", parameter: "Dapat di buka tutup" },
      { nomor: 6, kategori: "Cek Pesawat", kegiatan: "Rotasi Tube", parameter: "Dapat di gerakan" },
      { nomor: 7, kategori: "Cek Pesawat", kegiatan: "Buky Stan", parameter: "Dapat di gerakan" },
      { nomor: 8, kategori: "Cek Pesawat", kegiatan: "Pergerakan Meja", parameter: "Dapat di gerakan" },
      { nomor: 9, kategori: "Warming Up Pesawat", kegiatan: "Lakukan Pemanasan tube", parameter: "Lakukan tes tube tekan tombol expos sebanyak 3 x" },
      { nomor: 10, kategori: "Warming Up Pesawat", kegiatan: "Lakukan dengan kondisi berbeda", parameter: "-" },
      { nomor: 11, kategori: "Ruangan", kegiatan: "Kebersihan Ruangan", parameter: "Tidak terlihat sampah" },
      { nomor: 12, kategori: "Ruangan", kegiatan: "Baju Pasien rapih", parameter: "Tidak di taruh di luar" },
      { nomor: 13, kategori: "Ruangan", kegiatan: "Komputer DR", parameter: "Dalam kondisi baik" },
    ],
  },
  {
    slug: "mobile-xray",
    namaAlat: "Mobile X-Ray",
    checklist: [
      { nomor: 1, kategori: "Cek Pesawat", kegiatan: "Pesawat ON", parameter: "Lampu Indikator Nyala" },
      { nomor: 2, kategori: "Cek Pesawat", kegiatan: "Cek Parameter KV", parameter: "Display akan tampil angka" },
      { nomor: 3, kategori: "Cek Pesawat", kegiatan: "Cek Parameter mAs", parameter: "Display akan tampil angka" },
      { nomor: 4, kategori: "Cek Pesawat", kegiatan: "Cek Kolimasi/diagframa", parameter: "Dapat di buka tutup" },
      { nomor: 5, kategori: "Cek Pesawat", kegiatan: "Rotasi Tube", parameter: "Dapat di gerakan" },
      { nomor: 6, kategori: "Warming Up Pesawat", kegiatan: "Lakukan Pemanasan tube", parameter: "Lakukan tes tube tekan tombol expos sebanyak 3 x" },
      { nomor: 7, kategori: "Warming Up Pesawat", kegiatan: "Lakukan dengan kondisi berbeda", parameter: "-" },
    ],
  },
];

export function getToolChecklistBySlug(slug: string): QcChecklistDefinition | undefined {
  return QC_TOOL_DEFINITIONS.find((item) => item.slug === slug);
}

export function buildQcStatusSummary(answers: { hasil: QcStatus }[]) {
  const jumlahBaik = answers.filter((item) => item.hasil === "baik").length;
  const jumlahTidakBaik = answers.filter((item) => item.hasil === "tidak_baik").length;
  const statusKeseluruhan = jumlahTidakBaik === 0 ? "baik" : "tidak_baik";
  return { jumlahBaik, jumlahTidakBaik, statusKeseluruhan };
}

export function normalizeQcRecord(record: Record<string, any>): QcRecord {
  const answers = Array.isArray(record.answers) ? record.answers : [];
  const statusKeseluruhan = record.statusKeseluruhan ?? (record.hasil === "tidak_lulus" ? "tidak_baik" : "baik");
  return {
    id: record.id,
    alatSlug: record.alatSlug ?? record.alatId ?? "",
    namaAlat: record.namaAlat ?? record.alatNama ?? "",
    tanggal: record.tanggal ?? "",
    bulan: Number(record.bulan ?? 0),
    tahun: Number(record.tahun ?? 0),
    petugasUid: record.petugasUid ?? "",
    petugasNama: record.petugasNama ?? "",
    catatan: record.catatan ?? "",
    jumlahBaik: Number(record.jumlahBaik ?? 0),
    jumlahTidakBaik: Number(record.jumlahTidakBaik ?? 0),
    statusKeseluruhan,
    answers,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export async function fetchQcRecords(filters?: { alatSlug?: string; tanggal?: string; bulan?: number; year?: number }) {
  const q = query(collection(db, "pemeriksaan_qc"), orderBy("tanggal", "desc"));
  const snapshot = await getDocs(q);
  const records = snapshot.docs
    .map((docSnap) => normalizeQcRecord({ id: docSnap.id, ...docSnap.data() }))
    .filter((record) => {
      const matchesAlat = !filters?.alatSlug || record.alatSlug === filters.alatSlug;
      const matchesTanggal = !filters?.tanggal || record.tanggal === filters.tanggal;
      const matchesMonth = !filters?.bulan || Number(record.bulan) === Number(filters.bulan);
      const matchesYear = !filters?.year || Number(record.tahun) === Number(filters.year);
      return matchesAlat && matchesTanggal && matchesMonth && matchesYear;
    });

  return records;
}

export async function saveQcRecord(payload: Omit<QcRecord, "id" | "createdAt" | "updatedAt">) {
  const docRef = await addDoc(collection(db, "pemeriksaan_qc"), {
    ...payload,
    tanggal: payload.tanggal,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return docRef.id;
}

export async function getQcRecordsByDateRange(start: string, end: string) {
  const q = query(collection(db, "pemeriksaan_qc"), where("tanggal", ">=", start), where("tanggal", "<=", end));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => normalizeQcRecord({ id: docSnap.id, ...docSnap.data() }));
}
