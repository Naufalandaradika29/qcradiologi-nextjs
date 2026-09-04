export type UserRole = "admin" | "pegawai";
export type UserStatus = "pending" | "aktif" | "nonaktif";

export interface AppUser {
  uid: string;
  nama: string;
  email: string;
  role: UserRole;
  nip?: string;
  bagian?: string;
  status: UserStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
}
