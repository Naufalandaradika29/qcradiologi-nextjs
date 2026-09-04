"use client";

import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import type { AppUser } from "@/types/user";

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
          setProfileError("Profil pengguna tidak ditemukan.");
        } else {
          const data = snapshot.data() as Partial<AppUser>;
          if (!data.nama || !data.email || !data.role || !data.status) {
            setProfileError("Profil pengguna belum lengkap. Hubungi administrator.");
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
