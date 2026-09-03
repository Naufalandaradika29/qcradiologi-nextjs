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
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { KegiatanQC } from "@/types/kegiatan";

const coll = collection(db, "kegiatan_qc");

export async function getKegiatanList(): Promise<KegiatanQC[]> {
  const q = query(coll, orderBy("namaKegiatan", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as KegiatanQC) }));
}

export async function getKegiatanById(id: string): Promise<KegiatanQC | null> {
  const ref = doc(db, "kegiatan_qc", id);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...(snapshot.data() as KegiatanQC) };
}

export async function createKegiatan(data: Omit<KegiatanQC, "id" | "createdAt" | "updatedAt">) {
  await addDoc(coll, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateKegiatan(id: string, data: Partial<KegiatanQC>) {
  const ref = doc(db, "kegiatan_qc", id);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteKegiatan(id: string) {
  await deleteDoc(doc(db, "kegiatan_qc", id));
}

export async function searchKegiatan(search: string, frekuensi?: string, status?: string) {
  let q = query(coll, orderBy("namaKegiatan", "asc"));
  if (frekuensi) {
    q = query(coll, where("frekuensi", "==", frekuensi), orderBy("namaKegiatan", "asc"));
  }
  if (status) {
    q = query(coll, where("status", "==", status), orderBy("namaKegiatan", "asc"));
  }
  const snapshot = await getDocs(q);
  const list = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as KegiatanQC) }));

  if (!search.trim()) return list;

  const term = search.toLowerCase();
  return list.filter((item) => {
    return [item.kodeKegiatan, item.namaKegiatan, item.kategori, item.standar].some((value) =>
      value?.toLowerCase().includes(term),
    );
  });
}
