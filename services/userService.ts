import { doc, getDoc, updateDoc } from "firebase/firestore";
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

export async function updateUserProfile(uid: string, data: Partial<AppUser>) {
  const ref = doc(db, "users", uid);
  await updateDoc(ref, {
    ...data,
    updatedAt: new Date(),
  });
}
