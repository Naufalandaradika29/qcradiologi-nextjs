import { readFile } from "node:fs/promises";
import process from "node:process";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const requestedPath = process.argv.slice(2).find((argument) => !argument.startsWith("--"));
const sqlPath = requestedPath ?? "migration/qcradiologi.sql";
const dryRun = process.argv.includes("--dry-run");
const projectId = process.env.FIREBASE_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!dryRun && (!projectId || !clientEmail || !privateKey)) {
  throw new Error("Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY before running the migration.");
}

const db = dryRun
  ? null
  : getFirestore(getApps()[0] ?? initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    }));
const sql = await readFile(sqlPath, "utf8");

const tables = {
  alat: parseInsert(sql, "alat"),
  qc_kegiatan: parseInsert(sql, "qc_kegiatan"),
  qc_pemeriksaan: parseInsert(sql, "qc_pemeriksaan"),
  qc_detail: parseInsert(sql, "qc_detail"),
  suhu_ruangan: parseInsert(sql, "suhu_ruangan"),
  users: parseInsert(sql, "users"),
};

const alatById = new Map(tables.alat.map((row) => [String(row.id), row]));
const usersById = new Map(tables.users.map((row) => [String(row.id), row]));
const kegiatanById = new Map(tables.qc_kegiatan.map((row) => [String(row.id), row]));
const pemeriksaanById = new Map(tables.qc_pemeriksaan.map((row) => [String(row.id), row]));

await writeCollection("alat", tables.alat.map((row) => ({
  id: `legacy-${row.id}`,
  data: {
    legacyId: Number(row.id),
    kodeAlat: `ALT-${String(row.id).padStart(3, "0")}`,
    namaAlat: row.nama_alat,
    merk: row.jenis ?? "",
    tipe: row.jenis ?? "",
    nomorSeri: "",
    ruangan: row.lokasi ?? "",
    instalasi: row.lokasi ?? "",
    tanggalPengadaan: "",
    status: row.status === "nonaktif" ? "nonaktif" : "aktif",
    createdAt: toTimestamp(row.created_at),
    migratedFrom: "mysql:alat",
  },
})));

await writeCollection("kegiatan_qc", tables.qc_kegiatan.map((row) => ({
  id: `legacy-${row.id}`,
  data: {
    legacyId: Number(row.id),
    alatLegacyId: Number(row.alat_id),
    kodeKegiatan: `KGT-${String(row.id).padStart(3, "0")}`,
    namaKegiatan: row.kegiatan,
    kategori: row.kategori ?? "",
    frekuensi: inferFrequency(row.parameter, row.kategori),
    standar: row.parameter ?? "",
    satuan: "",
    batasMinimum: null,
    batasMaksimum: null,
    keterangan: `Urutan ${row.no_urut}`,
    status: Number(row.status_aktif) === 1 ? "aktif" : "nonaktif",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    migratedFrom: "mysql:qc_kegiatan",
  },
})));

await writeCollection("users_legacy", tables.users.map((row) => ({
  id: `legacy-${row.id}`,
  data: {
    legacyId: Number(row.id),
    nama: row.nama,
    username: row.username,
    role: row.role,
    status: row.status,
    passwordHash: row.password,
    createdAt: toTimestamp(row.created_at),
    migratedFrom: "mysql:users",
    authMigrationRequired: true,
  },
})));

await writeCollection("qc_detail_legacy", tables.qc_detail.map((row) => ({
  id: `legacy-${row.id}`,
  data: {
    legacyId: Number(row.id),
    pemeriksaanLegacyId: Number(row.pemeriksaan_id),
    kegiatanLegacyId: Number(row.kegiatan_id),
    hasilLegacy: row.hasil,
    hasil: row.hasil === "OK" ? "lulus" : "tidak_lulus",
    keterangan: row.keterangan ?? "",
    migratedFrom: "mysql:qc_detail",
  },
})));

await writeCollection("suhu_ruangan", tables.suhu_ruangan.map((row) => ({
  id: `legacy-${row.id}`,
  data: {
    legacyId: Number(row.id),
    tanggal: row.tanggal,
    shift: row.shift,
    ruangan: row.ruangan,
    alatLegacyId: row.alat_id === null ? null : Number(row.alat_id),
    suhu: Number(row.suhu),
    kondisi: row.kondisi,
    keterangan: row.keterangan ?? "",
    pegawaiLegacyId: row.pegawai_id === null ? null : Number(row.pegawai_id),
    createdAt: toTimestamp(row.created_at),
    migratedFrom: "mysql:suhu_ruangan",
  },
})));

await writeCollection("pemeriksaan_qc", tables.qc_pemeriksaan.flatMap((row) => {
  const alat = alatById.get(String(row.alat_id));
  const user = usersById.get(String(row.pegawai_id));
  const details = tables.qc_detail.filter((detail) => String(detail.pemeriksaan_id) === String(row.id));
  return details.map((detail) => {
    const kegiatan = kegiatanById.get(String(detail.kegiatan_id));
    return {
      id: `legacy-${row.id}-detail-${detail.id}`,
      data: {
        legacyId: Number(row.id),
        legacyDetailId: Number(detail.id),
        tanggal: row.tanggal,
        alatId: `legacy-${row.alat_id}`,
        alatKode: `ALT-${String(row.alat_id).padStart(3, "0")}`,
        alatNama: alat?.nama_alat ?? "Alat lama",
        kegiatanId: `legacy-${detail.kegiatan_id}`,
        kegiatanNama: kegiatan?.kegiatan ?? "Kegiatan lama",
        petugasUid: `legacy-${row.pegawai_id}`,
        petugasNama: user?.nama ?? "Petugas lama",
        nilai: detail.hasil,
        satuan: "",
        standar: kegiatan?.parameter ?? "",
        batasMinimum: null,
        batasMaksimum: null,
        hasil: detail.hasil === "OK" ? "lulus" : "tidak_lulus",
        catatan: detail.keterangan || row.catatan || "",
        createdAt: toTimestamp(row.created_at),
        updatedAt: toTimestamp(row.created_at),
        migratedFrom: "mysql:qc_pemeriksaan+qc_detail",
      },
    };
  });
}));

console.log(JSON.stringify({ source: sqlPath, ...Object.fromEntries(Object.entries(tables).map(([name, rows]) => [name, rows.length])) }, null, 2));
if (dryRun) {
  console.log("Dry run completed. No Firestore data was written.");
} else {
  console.log("Migration completed. Legacy password hashes were stored separately; Firebase Auth users were not created by this script.");
}

async function writeCollection(collectionName, documents) {
  if (!db) return;
  for (let index = 0; index < documents.length; index += 400) {
    const batch = db.batch();
    for (const document of documents.slice(index, index + 400)) {
      batch.set(db.collection(collectionName).doc(document.id), cleanData(document.data), { merge: true });
    }
    if (documents.length > 0) await batch.commit();
  }
}

function cleanData(data) {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
}

function toTimestamp(value) {
  if (!value) return FieldValue.serverTimestamp();
  const date = new Date(String(value).replace(" ", "T") + "Z");
  return Number.isNaN(date.valueOf()) ? FieldValue.serverTimestamp() : date;
}

function inferFrequency(parameter, category) {
  const text = `${parameter ?? ""} ${category ?? ""}`.toLowerCase();
  if (text.includes("minggu")) return "mingguan";
  if (text.includes("bulan")) return "bulanan";
  if (text.includes("tahun")) return "tahunan";
  return "harian";
}

function parseInsert(source, tableName) {
  const expression = new RegExp("INSERT INTO\\s+[`]?" + tableName + "[`]?\\s+\\(([^)]+)\\)\\s+VALUES\\s*([\\s\\S]*?);", "i");
  const match = source.match(expression);
  if (!match) return [];
  const columns = match[1].split(",").map((column) => column.trim().replaceAll("`", ""));
  const rows = splitRows(match[2]);
  return rows.map((row) => {
    const values = splitValues(row);
    return Object.fromEntries(columns.map((column, index) => [column, parseValue(values[index])]));
  });
}

function splitRows(value) {
  const rows = [];
  let quote = false;
  let depth = 0;
  let start = -1;
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (character === "'" && value[index - 1] !== "\\") quote = !quote;
    if (quote) continue;
    if (character === "(") {
      if (depth === 0) start = index + 1;
      depth += 1;
    } else if (character === ")") {
      depth -= 1;
      if (depth === 0) rows.push(value.slice(start, index));
    }
  }
  return rows;
}

function splitValues(row) {
  const values = [];
  let quote = false;
  let start = 0;
  for (let index = 0; index < row.length; index += 1) {
    const character = row[index];
    if (character === "'" && row[index - 1] !== "\\") quote = !quote;
    if (character === "," && !quote) {
      values.push(row.slice(start, index).trim());
      start = index + 1;
    }
  }
  values.push(row.slice(start).trim());
  return values;
}

function parseValue(value) {
  if (value === undefined || value.toUpperCase() === "NULL") return null;
  if (value.startsWith("'") && value.endsWith("'")) return value.slice(1, -1).replaceAll("\\'", "'").replaceAll("\\\\", "\\");
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  return value;
}
