import { addDoc, collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { RuanganDefinition, ShiftName, SuhuRecord, SuhuStatus } from "@/types/suhu";

export const SUHU_RUANGAN_DEFINITIONS: RuanganDefinition[] = [
  { slug: "usg", namaRuangan: "USG" },
  { slug: "ct-scan", namaRuangan: "CT Scan" },
  { slug: "panoramic", namaRuangan: "Panoramic" },
  { slug: "general-xray-dental", namaRuangan: "General X-Ray & Dental" },
  { slug: "dokter-administrasi", namaRuangan: "Dokter & Administrasi" },
];

export const SHIFT_OPTIONS: Array<{ value: ShiftName; label: string }> = [
  { value: "pagi", label: "Pagi" },
  { value: "siang", label: "Siang" },
  { value: "malam", label: "Malam" },
];

export function getRuanganBySlug(slug: string) {
  return SUHU_RUANGAN_DEFINITIONS.find((item) => item.slug === slug);
}

export function calculateSuhuStatus(suhu: number): SuhuStatus {
  if (suhu < 18) return "di_bawah_standar";
  if (suhu > 25) return "di_atas_standar";
  return "normal";
}

export function normalizeSuhuRecord(record: Record<string, any>): SuhuRecord {
  return {
    id: record.id,
    ruanganSlug: record.ruanganSlug ?? record.ruanganId ?? "",
    namaRuangan: record.namaRuangan ?? "",
    tanggal: record.tanggal ?? "",
    tanggalKey: record.tanggalKey ?? record.tanggal,
    bulan: Number(record.bulan ?? 0),
    tahun: Number(record.tahun ?? 0),
    shift: record.shift ?? "pagi",
    suhu: Number(record.suhu ?? 0),
    status: record.status ?? calculateSuhuStatus(Number(record.suhu ?? 0)),
    catatan: record.catatan ?? "",
    petugasUid: record.petugasUid ?? "",
    petugasNama: record.petugasNama ?? "",
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export async function fetchSuhuRecords(filters?: { ruanganSlug?: string; tanggal?: string; bulan?: number; year?: number }) {
  const q = query(collection(db, "suhu_ruangan"), orderBy("tanggal", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((docSnap) => normalizeSuhuRecord({ id: docSnap.id, ...docSnap.data() }))
    .filter((record) => {
      const matchesRuangan = !filters?.ruanganSlug || record.ruanganSlug === filters.ruanganSlug;
      const matchesTanggal = !filters?.tanggal || record.tanggal === filters.tanggal;
      const matchesMonth = !filters?.bulan || Number(record.bulan) === Number(filters.bulan);
      const matchesYear = !filters?.year || Number(record.tahun) === Number(filters.year);
      return matchesRuangan && matchesTanggal && matchesMonth && matchesYear;
    });
}

export async function saveSuhuRecord(payload: Omit<SuhuRecord, "id" | "createdAt" | "updatedAt">) {
  const existing = await fetchSuhuRecords({ ruanganSlug: payload.ruanganSlug, tanggal: payload.tanggal });
  const duplicate = existing.find((record) => record.shift === payload.shift && record.ruanganSlug === payload.ruanganSlug);
  if (duplicate) {
    throw new Error("Data shift pada tanggal tersebut sudah diisi.");
  }

  const docRef = await addDoc(collection(db, "suhu_ruangan"), {
    ...payload,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return docRef.id;
}

export function formatShiftLabel(shift: ShiftName) {
  const map: Record<ShiftName, string> = { pagi: "Pagi", siang: "Siang", malam: "Malam" };
  return map[shift] ?? shift;
}

export function getStatusBadgeTone(status: SuhuStatus) {
  if (status === "normal") return "success";
  if (status === "di_bawah_standar") return "warning";
  return "danger";
}
