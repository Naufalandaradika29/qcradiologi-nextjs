export type UserRole = "admin" | "pegawai";
export type UserStatus = "aktif" | "nonaktif";

export interface AppUser {
  uid: string;
  nama: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
}
