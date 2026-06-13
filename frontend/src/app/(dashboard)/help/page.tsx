"use client";

import { useState } from "react";
import {
  AlertOctagon,
  ArrowDownCircle,
  BarChart3,
  BookOpen,
  ClipboardCheck,
  Clock,
  HelpCircle,
  Mail,
  MessageSquare,
  PackageCheck,
  Phone,
  Rocket,
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils";

// ─── Article data ──────────────────────────────────────────────────────────────

interface ArticleStep {
  step: number;
  title: string;
  desc: string;
}

interface HelpArticle {
  id: string;
  title: string;
  icon: React.ElementType;
  category: string;
  content: ArticleStep[];
}

const HELP_ARTICLES: HelpArticle[] = [
  {
    id: "mulai-cepat",
    title: "Panduan Memulai",
    icon: Rocket,
    category: "Panduan Pengguna",
    content: [
      {
        step: 1,
        title: "Login ke Sistem",
        desc: "Masukkan email dan password yang diberikan admin. Pilih akun demo untuk mencoba fitur tanpa risiko.",
      },
      {
        step: 2,
        title: "Kenali Dashboard",
        desc: "Dashboard menampilkan KPI utama: stok kritis, ED mendekat, dan task yang perlu ditindaklanjuti segera.",
      },
      {
        step: 3,
        title: "Mulai Kelola Stok",
        desc: "Akses menu Stok Masuk untuk menginput obat baru, atau Stok Keluar untuk mencatat pemakaian.",
      },
    ],
  },
  {
    id: "stok-masuk",
    title: "Cara Input Stok Masuk",
    icon: ArrowDownCircle,
    category: "Panduan Pengguna",
    content: [
      {
        step: 1,
        title: "Akses Menu Stok Masuk",
        desc: "Buka menu Stok Masuk di sidebar kiri. Klik tombol \"+ Tambah Stok Masuk\" di pojok kanan atas.",
      },
      {
        step: 2,
        title: "Isi Formulir Penerimaan",
        desc: "Pilih obat, supplier, dan batch number. Masukkan tanggal kadaluarsa, jumlah, dan harga satuan sesuai faktur.",
      },
      {
        step: 3,
        title: "Konfirmasi dan Simpan",
        desc: "Periksa kembali seluruh data, lalu klik Simpan. Stok akan otomatis bertambah dan tercatat di audit log.",
      },
    ],
  },
  {
    id: "fefo",
    title: "Memahami FEFO",
    icon: Clock,
    category: "Panduan Pengguna",
    content: [
      {
        step: 1,
        title: "Apa itu FEFO?",
        desc: "First Expired First Out — obat dengan tanggal kadaluarsa paling dekat harus dikeluarkan terlebih dahulu untuk meminimalkan kedaluwarsa.",
      },
      {
        step: 2,
        title: "Otomasi Sistem",
        desc: "Saat mencatat Stok Keluar, sistem secara otomatis memilih batch yang paling mendekati tanggal kadaluarsa. Anda tidak perlu memilih secara manual.",
      },
      {
        step: 3,
        title: "Pantau Tanggal Kadaluarsa",
        desc: "Gunakan halaman Batch & Expired untuk melihat seluruh batch aktif. Notifikasi otomatis dikirim 30, 14, dan 7 hari sebelum ED.",
      },
    ],
  },
  {
    id: "good-receipt",
    title: "Alur Good Receipt",
    icon: PackageCheck,
    category: "Panduan Pengguna",
    content: [
      {
        step: 1,
        title: "Terima Pemberitahuan GR",
        desc: "Apoteker mendapat notifikasi ketika barang dari PO sudah tiba. Buka halaman Good Receipt untuk melihat daftar.",
      },
      {
        step: 2,
        title: "Verifikasi Barang Fisik",
        desc: "Input jumlah fisik yang diterima, tandai kondisi barang yang rusak, upload foto bukti, dan tambahkan catatan jika ada selisih.",
      },
      {
        step: 3,
        title: "Submit untuk Approval",
        desc: "Klik Kirim untuk Review. Admin akan memeriksa dan memutuskan: menyetujui (stok masuk), atau meminta revisi dengan catatan.",
      },
    ],
  },
  {
    id: "defekta",
    title: "Cara Lapor Defekta",
    icon: AlertOctagon,
    category: "Panduan Pengguna",
    content: [
      {
        step: 1,
        title: "Temukan Obat Bermasalah",
        desc: "Identifikasi obat yang rusak, kemasan bocor, atau tidak memenuhi standar kualitas. Pisahkan dari stok aktif.",
      },
      {
        step: 2,
        title: "Isi Formulir Defekta",
        desc: "Buka menu Defekta, pilih item dan batch, masukkan jumlah dan alasan defekta, upload foto bukti kondisi obat.",
      },
      {
        step: 3,
        title: "Tunggu Keputusan Admin",
        desc: "Admin akan me-review laporan Anda. Jika disetujui, stok dikurangi dan dicatat. Jika ditolak, Anda mendapat notifikasi beserta alasan.",
      },
    ],
  },
  {
    id: "opname",
    title: "Panduan Stock Opname",
    icon: ClipboardCheck,
    category: "Panduan Pengguna",
    content: [
      {
        step: 1,
        title: "Mulai Sesi Opname",
        desc: "Admin memulai sesi opname dari halaman Validasi Opname. Selama opname berlangsung, transaksi stok keluar akan dikunci sementara.",
      },
      {
        step: 2,
        title: "Hitung Fisik dan Input",
        desc: "Apoteker menghitung stok fisik di gudang, lalu menginput jumlah aktual di halaman Stok Opname. Sistem menampilkan selisih secara real-time.",
      },
      {
        step: 3,
        title: "Submit untuk Validasi Admin",
        desc: "Setelah semua item terhitung, klik Kirim ke Admin. Admin memverifikasi dan menyetujui atau mengembalikan untuk koreksi.",
      },
    ],
  },
  {
    id: "pareto",
    title: "Analisis Pareto & ABC",
    icon: BarChart3,
    category: "Panduan Pengguna",
    content: [
      {
        step: 1,
        title: "Buka Menu Analitik",
        desc: "Akses menu Analitik > Analisis Pareto di sidebar kiri. Pilih periode waktu dan klik Tampilkan Analisis.",
      },
      {
        step: 2,
        title: "Pahami Klasifikasi ABC",
        desc: "Kelas A (top 20% item, 80% nilai) butuh perhatian ketat. Kelas B (sedang), Kelas C (sisa) dapat dikelola lebih longgar.",
      },
      {
        step: 3,
        title: "Gunakan untuk Keputusan Restock",
        desc: "Prioritaskan restock dan safety stock untuk item kelas A. Gunakan grafik Pareto untuk presentasi ke manajemen klinik.",
      },
    ],
  },
];

// ─── FAQ data ──────────────────────────────────────────────────────────────────

const FAQ = [
  {
    q: "Apa itu FEFO dan bagaimana cara kerjanya?",
    a: "FEFO (First Expired First Out) adalah metode pengeluaran stok di mana obat dengan tanggal kadaluarsa paling dekat dikeluarkan terlebih dahulu. Sistem secara otomatis memilih batch yang tepat saat Anda mencatat stok keluar.",
  },
  {
    q: "Mengapa transaksi stok keluar saya dikunci?",
    a: "Transaksi stok keluar dikunci sementara selama proses Stock Opname berlangsung. Ini mencegah perbedaan data selama penghitungan fisik. Setelah opname disetujui Admin, transaksi kembali normal.",
  },
  {
    q: "Bagaimana cara Good Receipt jika barang dari supplier tidak sesuai PO?",
    a: "Input jumlah fisik yang sebenarnya diterima, tandai kondisi barang yang rusak, upload foto bukti, dan tambahkan catatan. Admin akan me-review dan memutuskan: menyetujui (stok masuk), atau meminta revisi.",
  },
  {
    q: "Apakah data audit log bisa diubah atau dihapus?",
    a: "Tidak. Audit log bersifat immutable (tidak dapat diubah atau dihapus) untuk menjaga integritas data. Ini penting untuk compliance dan akuntabilitas sistem inventaris farmasi.",
  },
  {
    q: "Bagaimana cara export laporan ke PDF atau Excel?",
    a: "Buka menu Laporan, atur filter periode dan jenis transaksi, klik \"Tampilkan Laporan\", lalu gunakan tombol \"Export PDF\" atau \"Export Excel\" yang muncul di bagian atas halaman.",
  },
];

// ─── Nav config ────────────────────────────────────────────────────────────────

type NavKey = "panduan" | "faq" | "kontak";

const NAV_ITEMS: { value: NavKey; label: string; icon: React.ElementType }[] = [
  { value: "panduan", label: "Panduan Pengguna", icon: BookOpen },
  { value: "faq", label: "FAQ", icon: HelpCircle },
  { value: "kontak", label: "Kontak Support", icon: Phone },
];

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function HelpPage() {
  const [activeArticle, setActiveArticle] = useState(HELP_ARTICLES[0].id);
  const [activeNav, setActiveNav] = useState<NavKey>("panduan");

  const currentArticle = HELP_ARTICLES.find((a) => a.id === activeArticle);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Bantuan & Dukungan"
        description="Panduan penggunaan dan informasi kontak"
      />

      <div className="flex gap-6">
        {/* ── SIDEBAR KIRI ────────────────────────────────── */}
        <aside className="w-[220px] flex-shrink-0">
          <div className="bg-card border rounded-xl p-4 sticky top-6 space-y-5">

            {/* Top nav */}
            <nav className="space-y-0.5">
              {NAV_ITEMS.map((item) => {
                const ItemIcon = item.icon;
                return (
                  <button
                    key={item.value}
                    onClick={() => setActiveNav(item.value)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                      activeNav === item.value
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <ItemIcon className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Article list — only when on Panduan */}
            {activeNav === "panduan" && (
              <>
                <Separator />
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Artikel
                  </p>
                  <nav className="space-y-0.5">
                    {HELP_ARTICLES.map((article) => {
                      const ArticleIcon = article.icon;
                      return (
                        <button
                          key={article.id}
                          onClick={() => setActiveArticle(article.id)}
                          className={cn(
                            "w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors",
                            activeArticle === article.id
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          <ArticleIcon className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="line-clamp-1">{article.title}</span>
                        </button>
                      );
                    })}
                  </nav>
                </div>
              </>
            )}
          </div>
        </aside>

        {/* ── KONTEN KANAN ────────────────────────────────── */}
        <main className="flex-1 min-w-0">

          {/* Panduan */}
          {activeNav === "panduan" && currentArticle && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <currentArticle.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>{currentArticle.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {currentArticle.category}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {currentArticle.content.map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <div className="flex-shrink-0 w-7 h-7 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-bold">
                      {item.step}
                    </div>
                    <div className="pt-0.5">
                      <p className="font-medium text-sm">{item.title}</p>
                      <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* FAQ */}
          {activeNav === "faq" && (
            <Card>
              <CardHeader>
                <CardTitle>Pertanyaan Umum</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Jawaban atas pertanyaan yang sering diajukan pengguna sistem.
                </p>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="space-y-2">
                  {FAQ.map((item, idx) => (
                    <AccordionItem
                      key={idx}
                      value={`faq-${idx}`}
                      className="border rounded-lg px-4"
                    >
                      <AccordionTrigger className="text-sm font-medium hover:no-underline py-4 text-left">
                        {item.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground pb-4 leading-relaxed">
                        {item.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          )}

          {/* Kontak */}
          {activeNav === "kontak" && (
            <Card>
              <CardHeader>
                <CardTitle>Kontak Support</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Tim kami siap membantu Anda pada jam kerja.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    {
                      icon: Mail,
                      label: "Email Support",
                      value: "support@smartclinic.id",
                    },
                    {
                      icon: Phone,
                      label: "WhatsApp",
                      value: "+62 811-2345-6789",
                    },
                    {
                      icon: Clock,
                      label: "Jam Layanan",
                      value: "Senin–Jumat, 08.00–17.00",
                    },
                    {
                      icon: MessageSquare,
                      label: "Waktu Respons",
                      value: "< 24 jam kerja",
                    },
                  ].map((item) => {
                    const ItemIcon = item.icon;
                    return (
                      <div
                        key={item.label}
                        className="flex items-start gap-3 p-4 bg-muted/50 rounded-xl"
                      >
                        <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <ItemIcon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            {item.label}
                          </p>
                          <p className="text-sm font-medium mt-0.5">
                            {item.value}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Separator />

                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-sm font-medium mb-1">
                    Laporkan Bug atau Masalah Teknis
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Untuk bug atau masalah teknis yang mendesak, sertakan
                    screenshot, langkah reproduksi, dan nama akun Anda agar tim
                    dapat menangani lebih cepat.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
