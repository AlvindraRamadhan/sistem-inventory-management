import type { Kategori, Satuan, LokasiGudang } from "@/types/inventory";

// ─── Kategori Obat ────────────────────────────────────────────────────────────

export const KATEGORI_OBAT: Kategori[] = [
  { id: "KAT-001", kode: "ANT", nama: "Antibiotik",         deskripsi: "Obat untuk mengatasi infeksi bakteri" },
  { id: "KAT-002", kode: "ANL", nama: "Analgesik",          deskripsi: "Obat pereda nyeri dan demam" },
  { id: "KAT-003", kode: "AHT", nama: "Antihipertensi",     deskripsi: "Obat untuk menurunkan tekanan darah" },
  { id: "KAT-004", kode: "VIT", nama: "Vitamin & Suplemen", deskripsi: "Vitamin dan suplemen kesehatan" },
  { id: "KAT-005", kode: "ADB", nama: "Antidiabetes",       deskripsi: "Obat untuk mengendalikan gula darah" },
  { id: "KAT-006", kode: "AHS", nama: "Antihistamin",       deskripsi: "Obat untuk mengatasi alergi" },
  { id: "KAT-007", kode: "ASP", nama: "Antiseptik",         deskripsi: "Obat untuk mencegah infeksi pada luka" },
  { id: "KAT-008", kode: "OJT", nama: "Obat Jantung",       deskripsi: "Obat untuk penyakit kardiovaskular" },
  { id: "KAT-009", kode: "OLM", nama: "Obat Lambung",       deskripsi: "Obat untuk gangguan saluran pencernaan" },
  { id: "KAT-010", kode: "LNL", nama: "Lain-lain",          deskripsi: "Kategori obat lainnya" },
];

// ─── Satuan Obat ──────────────────────────────────────────────────────────────

export const SATUAN_OBAT: Satuan[] = [
  { id: "SAT-001", nama: "Tablet",  singkatan: "Tab"  },
  { id: "SAT-002", nama: "Kapsul",  singkatan: "Kap"  },
  { id: "SAT-003", nama: "Botol",   singkatan: "Bot"  },
  { id: "SAT-004", nama: "Ampul",   singkatan: "Amp"  },
  { id: "SAT-005", nama: "Tube",    singkatan: "Tub"  },
  { id: "SAT-006", nama: "Sachet",  singkatan: "Sch"  },
  { id: "SAT-007", nama: "Vial",    singkatan: "Vial" },
  { id: "SAT-008", nama: "Strip",   singkatan: "Str"  },
];

// ─── Lokasi Gudang (hierarkis) ────────────────────────────────────────────────

export const LOKASI_GUDANG: LokasiGudang[] = [
  {
    id: "LOK-G1", kode: "GU", nama: "Gudang Utama", tipe: "GUDANG", path: "Gudang Utama",
    kapasitas: 2000, terpakai: 1180, kondisi: "SUHU_RUANG",
    keterangan: "Gudang penyimpanan obat oral dan injeksi suhu ruang",
    children: [
      {
        id: "LOK-R1", kode: "RA", nama: "Ruang A (Obat Oral)", tipe: "RUANG", parentId: "LOK-G1",
        path: "Gudang Utama / Ruang A",
        kapasitas: 800, terpakai: 320, kondisi: "SUHU_RUANG",
        children: [
          {
            id: "LOK-A1", kode: "RA1", nama: "Rak A1", tipe: "RAK", parentId: "LOK-R1",
            path: "Gudang Utama / Ruang A / Rak A1",
            kapasitas: 300, terpakai: 180, kondisi: "SUHU_RUANG",
            keterangan: "Antibiotik dan antidiabetes",
            children: [
              { id: "LOK-A1L1", kode: "RA1L1", nama: "Laci 1", tipe: "LACI", parentId: "LOK-A1", path: "Gudang Utama / Ruang A / Rak A1 / Laci 1", kapasitas: 100, terpakai: 60,  kondisi: "SUHU_RUANG" },
              { id: "LOK-A1L2", kode: "RA1L2", nama: "Laci 2", tipe: "LACI", parentId: "LOK-A1", path: "Gudang Utama / Ruang A / Rak A1 / Laci 2", kapasitas: 100, terpakai: 72,  kondisi: "SUHU_RUANG" },
              { id: "LOK-A1L3", kode: "RA1L3", nama: "Laci 3", tipe: "LACI", parentId: "LOK-A1", path: "Gudang Utama / Ruang A / Rak A1 / Laci 3", kapasitas: 100, terpakai: 48,  kondisi: "SUHU_RUANG" },
            ],
          },
          {
            id: "LOK-A2", kode: "RA2", nama: "Rak A2", tipe: "RAK", parentId: "LOK-R1",
            path: "Gudang Utama / Ruang A / Rak A2",
            kapasitas: 300, terpakai: 120, kondisi: "SUHU_RUANG",
            keterangan: "Analgesik, antihistamin, vitamin",
            children: [
              { id: "LOK-A2L1", kode: "RA2L1", nama: "Laci 1", tipe: "LACI", parentId: "LOK-A2", path: "Gudang Utama / Ruang A / Rak A2 / Laci 1", kapasitas: 150, terpakai: 80, kondisi: "SUHU_RUANG" },
              { id: "LOK-A2L2", kode: "RA2L2", nama: "Laci 2", tipe: "LACI", parentId: "LOK-A2", path: "Gudang Utama / Ruang A / Rak A2 / Laci 2", kapasitas: 150, terpakai: 40, kondisi: "SUHU_RUANG" },
            ],
          },
        ],
      },
      {
        id: "LOK-R2", kode: "RB", nama: "Ruang B (Obat Injeksi)", tipe: "RUANG", parentId: "LOK-G1",
        path: "Gudang Utama / Ruang B",
        kapasitas: 800, terpakai: 600, kondisi: "SUHU_RUANG",
        keterangan: "Khusus sediaan injeksi dan infus",
        children: [
          {
            id: "LOK-B1", kode: "RB1", nama: "Rak B1", tipe: "RAK", parentId: "LOK-R2",
            path: "Gudang Utama / Ruang B / Rak B1",
            kapasitas: 400, terpakai: 380, kondisi: "SUHU_RUANG",
            keterangan: "Antibiotik injeksi – segera lakukan order ulang",
          },
          {
            id: "LOK-B2", kode: "RB2", nama: "Rak B2", tipe: "RAK", parentId: "LOK-R2",
            path: "Gudang Utama / Ruang B / Rak B2",
            kapasitas: 400, terpakai: 180, kondisi: "SUHU_RUANG",
          },
        ],
      },
    ],
  },
  {
    id: "LOK-G2", kode: "GD", nama: "Gudang Dingin (2–8°C)", tipe: "GUDANG", path: "Gudang Dingin",
    kapasitas: 500, terpakai: 250, kondisi: "DINGIN",
    keterangan: "Lemari pendingin — suhu dijaga 2–8°C untuk vaksin dan produk biologis",
    children: [
      {
        id: "LOK-R3", kode: "RC", nama: "Ruang C", tipe: "RUANG", parentId: "LOK-G2",
        path: "Gudang Dingin / Ruang C",
        kapasitas: 500, terpakai: 250, kondisi: "DINGIN",
        children: [
          {
            id: "LOK-C1", kode: "RC1", nama: "Rak C1", tipe: "RAK", parentId: "LOK-R3",
            path: "Gudang Dingin / Ruang C / Rak C1",
            kapasitas: 250, terpakai: 225, kondisi: "DINGIN",
            keterangan: "Vaksin dan produk biologis bersuhu rendah",
          },
          {
            id: "LOK-C2", kode: "RC2", nama: "Rak C2", tipe: "RAK", parentId: "LOK-R3",
            path: "Gudang Dingin / Ruang C / Rak C2",
            kapasitas: 250, terpakai: 25,  kondisi: "DINGIN",
          },
        ],
      },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getLokasiFlatList(nodes: LokasiGudang[] = LOKASI_GUDANG): LokasiGudang[] {
  return nodes.flatMap((node) => [
    node,
    ...(node.children ? getLokasiFlatList(node.children) : []),
  ]);
}

export function generateObatKode(existing: { kode: string }[]): string {
  const nums = existing
    .map((o) => o.kode)
    .filter((k) => /^OBT-\d{3}$/.test(k))
    .map((k) => parseInt(k.slice(4)))
    .filter((n) => !isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `OBT-${String(next).padStart(3, "0")}`;
}
