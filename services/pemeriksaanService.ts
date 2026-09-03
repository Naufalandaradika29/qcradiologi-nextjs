import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { PemeriksaanQC } from "@/types/pemeriksaan";

const coll = collection(db, "pemeriksaan_qc");

export async function getPemeriksaanList() {
  const q = query(coll, orderBy("tanggal", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as PemeriksaanQC) }));
}

export async function createPemeriksaan(data: Omit<PemeriksaanQC, "id" | "createdAt" | "updatedAt">) {
  await addDoc(coll, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updatePemeriksaan(id: string, data: Partial<PemeriksaanQC>) {
  const ref = doc(db, "pemeriksaan_qc", id);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deletePemeriksaan(id: string) {
  await deleteDoc(doc(db, "pemeriksaan_qc", id));
}

export async function getPemeriksaanById(id: string): Promise<PemeriksaanQC | null> {
  const ref = doc(db, "pemeriksaan_qc", id);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...(snapshot.data() as PemeriksaanQC) };
}

export function computeHasil(nilai: number | string, minimum: number | null, maximum: number | null): "lulus" | "tidak_lulus" {
  if (typeof nilai === "string") {
    return nilai.trim() ? "lulus" : "tidak_lulus";
  }

  if (minimum === null && maximum === null) return "lulus";
  if (minimum !== null && maximum !== null) return nilai >= minimum && nilai <= maximum ? "lulus" : "tidak_lulus";
  if (minimum !== null) return nilai >= minimum ? "lulus" : "tidak_lulus";
  if (maximum !== null) return nilai <= maximum ? "lulus" : "tidak_lulus";
  return "lulus";
}

export function formatFirestoreDate(value: unknown): string {
  if (!value) return "-";
  if (typeof value === "string") return value;
  if (value instanceof Timestamp) return value.toDate().toLocaleString("id-ID");
  return new Date(String(value)).toLocaleString("id-ID");
}
