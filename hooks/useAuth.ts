"use client";

import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import type { AppUser } from "@/types/user";

const ADMIN_EMAIL = "admin@qcradiologi.com";

export function useAuth() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setFirebaseUser(null);
        setProfile(null);
        setProfileError(null);
        setLoading(false);
        return;
      }

      setFirebaseUser(user);
      setProfile(null);
      setProfileError(null);
      setLoading(true);

      try {
        const currentUid = auth.currentUser?.uid ?? user.uid;
        const userRef = doc(db, "users", currentUid);
        const snapshot = await getDoc(userRef);

        if (!snapshot.exists()) {
          if (user.email?.toLowerCase() === ADMIN_EMAIL) {
            const adminProfile: AppUser = {
              uid: currentUid,
              nama: "Administrator",
              email: user.email,
              role: "admin",
              nip: "",
              bagian: "Administrator",
              status: "aktif",
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            };

            await setDoc(userRef, adminProfile, { merge: true });
            setProfile(adminProfile);
          } else {
            setProfileError("Profil pengguna tidak ditemukan. Hubungi administrator untuk mengaktifkan akun.");
          }
        } else {
          const data = snapshot.data() as Partial<AppUser>;
          if (!data.nama || !data.email || !data.role || !data.status) {
            setProfileError("Profil pengguna belum lengkap. Hubungi administrator.");
          } else if (data.status !== "aktif") {
            setProfileError("Akun pengguna sedang tidak aktif.");
          } else {
            setProfile({ ...data, uid: currentUid } as AppUser);
          }
        }
      } catch (error) {
        console.error("Auth profile sync failed:", error);
        setProfileError("Profil pengguna gagal dibaca dari Firestore.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return {
    firebaseUser,
    profile,
    loading,
    profileError,
    role: profile?.role ?? null,
    isAdmin: profile?.role === "admin",
  };
}
