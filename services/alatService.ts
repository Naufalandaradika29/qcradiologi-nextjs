import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Alat } from "@/types/alat";

const coll = collection(db, "alat");

export async function getAlatList(): Promise<Alat[]> {
  const q = query(coll, orderBy("namaAlat", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Alat) }));
}

export async function getAlatById(id: string): Promise<Alat | null> {
  const ref = doc(db, "alat", id);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...(snapshot.data() as Alat) };
}

export async function createAlat(data: Omit<Alat, "id" | "createdAt" | "updatedAt">) {
  await addDoc(coll, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateAlat(id: string, data: Partial<Alat>) {
  const ref = doc(db, "alat", id);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteAlat(id: string) {
  await deleteDoc(doc(db, "alat", id));
}

export async function searchAlat(search: string, status?: string) {
  let q = query(coll, orderBy("namaAlat", "asc"));
  if (status) {
    q = query(coll, where("status", "==", status), orderBy("namaAlat", "asc"));
  }
  const snapshot = await getDocs(q);
  const list = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Alat) }));

  if (!search.trim()) return list;

  const term = search.toLowerCase();
  return list.filter((item) => {
    return [
      item.kodeAlat,
      item.namaAlat,
      item.merk,
      item.tipe,
      item.nomorSeri,
      item.ruangan,
      item.instalasi,
    ].some((value) => value?.toLowerCase().includes(term));
  });
}
