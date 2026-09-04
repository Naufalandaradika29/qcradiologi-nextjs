import { collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { AppUser } from "@/types/user";

export async function getUserProfile(uid: string): Promise<AppUser | null> {
  const ref = doc(db, "users", uid);
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data() as AppUser;
  return { ...data, uid };
}

export async function createUserProfile(uid: string, data: Pick<AppUser, "nama" | "email">) {
  await setDoc(doc(db, "users", uid), {
    uid,
    ...data,
    role: "pegawai",
    status: "aktif",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function getUsers(): Promise<AppUser[]> {
  const snapshot = await getDocs(query(collection(db, "users"), orderBy("nama", "asc")));
  return snapshot.docs.map((item) => ({ ...(item.data() as AppUser), uid: item.id }));
}

export async function disableUser(uid: string) {
  await updateDoc(doc(db, "users", uid), { status: "nonaktif", updatedAt: serverTimestamp() });
}

export async function enableUser(uid: string) {
  await updateDoc(doc(db, "users", uid), { status: "aktif", updatedAt: serverTimestamp() });
}

export async function updateUserProfile(uid: string, data: Pick<AppUser, "nama">) {
  const ref = doc(db, "users", uid);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}
