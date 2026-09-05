import * as XLSX from "xlsx";

function triggerDownload(workbook: XLSX.WorkBook, filename: string) {
  XLSX.writeFile(workbook, filename);
}

export function exportQcDailyExcel({ alatName, tanggal, rows }: { alatName: string; tanggal: string; rows: Array<{ nomor: number; kegiatan: string; parameter: string; hasil: string }> }) {
  const data = [
    ["PELAKSANAAN HARIAN QUALITY CONTROL"],
    ["Bagian Radiologi RS PERMATA PAMULANG"],
    ["Nama Alat", alatName],
    ["Tanggal", tanggal],
    [],
    ["No", "Kegiatan", "Parameter", "Status"],
    ...rows.map((row) => [row.nomor, row.kegiatan, row.parameter, row.hasil === "baik" ? "√" : "X"]),
  ];

  const sheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "QC Harian");
  triggerDownload(workbook, `qc-${alatName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${tanggal}.xlsx`);
}

export function exportQcMonthlyExcel({ alatName, bulan, rows }: { alatName: string; bulan: string; rows: Array<{ nomor: number; kegiatan: string; parameter: string; hasil: Record<string, string> }> }) {
  const headers = ["No", "Kegiatan", "Parameter", ...Array.from({ length: 31 }, (_, index) => String(index + 1))];
  const data = rows.map((row) => [
    row.nomor,
    row.kegiatan,
    row.parameter,
    ...Array.from({ length: 31 }, (_, index) => row.hasil[String(index + 1)] ?? ""),
  ]);

  const sheet = XLSX.utils.aoa_to_sheet([
    ["Pelaksanaan Harian Quality Control"],
    ["Bagian Radiologi RS PERMATA PAMULANG"],
    ["Nama Alat", alatName],
    ["Bulan", bulan],
    [],
    headers,
    ...data,
    [],
    ["Keterangan"],
  ]);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Data QC");
  triggerDownload(workbook, `qc-bulanan-${alatName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.xlsx`);
}

export function exportSuhuDailyExcel({ ruangan, tanggal, rows }: { ruangan: string; tanggal: string; rows: Array<{ shift: string; suhu: string; status: string; petugas: string; catatan: string }> }) {
  const sheet = XLSX.utils.aoa_to_sheet([
    ["PEMANTAUAN HARIAN SUHU RUANGAN"],
    ["Bagian Radiologi RS PERMATA PAMULANG"],
    ["Ruangan", ruangan],
    ["Tanggal", tanggal],
    ["Standar Suhu", "18°C - 25°C"],
    [],
    ["Shift", "Suhu", "Status", "Petugas", "Catatan"],
    ...rows.map((row) => [row.shift, row.suhu || "-", row.status, row.petugas, row.catatan || "-"]),
  ]);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Suhu Harian");
  triggerDownload(workbook, `suhu-${ruangan.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${tanggal}.xlsx`);
}

export function exportSuhuMonthlyExcel({ ruangan, bulan, data }: { ruangan: string; bulan: string; data: Array<{ tanggal: number; pagi: string; siang: string; malam: string }> }) {
  const header = ["Tanggal", "P", "S", "M"];
  const rows = data.map((row) => [row.tanggal, row.pagi || "", row.siang || "", row.malam || ""]);

  const dataSheet = XLSX.utils.aoa_to_sheet([
    ["PENGISIAN FORMULIR"],
    ["PEMANTAUAN HARIAN SUHU RUANGAN"],
    ["BULAN", bulan],
    ["RUANGAN", ruangan],
    ["STANDAR SUHU", "18-25°C"],
    [],
    ["Tanggal"],
    header,
    ...rows,
  ]);

  const chartData = [
    ["Tanggal", "Pagi", "Siang", "Malam", "Batas Bawah", "Batas Atas"],
    ...data.map((row) => [row.tanggal, row.pagi || "", row.siang || "", row.malam || "", 18, 25]),
  ];

  const chartSheet = XLSX.utils.aoa_to_sheet(chartData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, dataSheet, "Data Suhu");
  XLSX.utils.book_append_sheet(workbook, chartSheet, "Grafik Suhu");
  triggerDownload(workbook, `suhu-bulanan-${ruangan.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.xlsx`);
}
