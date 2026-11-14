import { WORDPRESS_FALLBACK_LINKS } from "@/lib/constants";

/**
 * Local, editorially written pages used when the headless WordPress REST API
 * is unreachable or has not published a page with a fallback slug yet. They
 * keep public navigation (and SEO) useful instead of showing a dead link.
 */
export type FallbackPage = {
  slug: string;
  title: string;
  description: string;
  content: string;
  updatedAt: string;
};

const CONTACT_EMAIL = "halo@creatordock.online";
const LAST_UPDATED = "2026-01-01";

const FALLBACK_PAGES: Record<string, Omit<FallbackPage, "slug">> = {
  "tentang-kami": {
    title: "Tentang CreatorChat",
    description:
      "CreatorChat adalah ruang sosial dan obrolan realtime untuk kreator Indonesia: berbagi karya, berdiskusi, menyimpan bacaan, dan mempromosikan karyamu.",
    updatedAt: LAST_UPDATED,
    content: `
      <h2>Ruang tenang untuk kreator</h2>
      <p>CreatorChat adalah jejaring sosial dan ruang obrolan realtime yang dirancang untuk kreator. Kami percaya bahwa karya terbaik tumbuh di lingkungan yang tenang, aman, dan saling mendukung — bukan di tengah kebisingan linimasa yang tak berujung.</p>
      <p>Di sini kamu bisa berbagi karya, membuka ruang diskusi privat, menyimpan bacaan, dan memperkenalkan produk atau jasamu dalam satu tempat yang rapi.</p>

      <h2>Apa yang bisa kamu lakukan</h2>
      <ul>
        <li><strong>Feed kreator</strong> — bagikan teks, tautan, gambar, dan lampiran dokumen dalam satu postingan.</li>
        <li><strong>Galeri pribadi</strong> — unggah dan kelola foto karyamu dengan kontrol penuh.</li>
        <li><strong>Diskusi realtime</strong> — buat ruang privat, undang anggota dengan <em>@username</em>, dan setujui permintaan bergabung.</li>
        <li><strong>Pustaka artikel</strong> — simpan postingan dan tautan penting agar mudah dibaca kembali.</li>
        <li><strong>Promo</strong> — tampilkan satu penawaran utama beserta kanal kontak dan tautan sosialmu.</li>
      </ul>

      <h2>Dirancang untuk privasi</h2>
      <p>Galeri, pustaka artikel, dan diskusi bersifat privat. Setiap tabel dilindungi Row Level Security sehingga hanya kamu dan anggota yang disetujui yang dapat mengakses datanya. Konten publik seperti halaman ini dipisahkan dari data akun.</p>

      <h2>Terhubung dengan Creatordock</h2>
      <p>CreatorChat terhubung dengan Creatordock sebagai sumber halaman dan artikel. Halaman mandiri dirender ulang secara berkala, sehingga pembaruan dari tim editorial tetap tampil cepat dan aman.</p>
      <p>Punya pertanyaan, ide kolaborasi, atau ingin melaporkan masalah? Hubungi kami di <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.</p>
    `.trim(),
  },

  panduan: {
    title: "Panduan CreatorChat",
    description:
      "Panduan singkat menggunakan CreatorChat: membuat akun, berbagi postingan, mengelola galeri, membuat diskusi privat, dan menyimpan artikel.",
    updatedAt: LAST_UPDATED,
    content: `
      <h2>1. Membuat akun</h2>
      <p>Buka halaman <strong>Gabung</strong>, isi nama, username, dan email, lalu masukkan kode OTP yang dikirim ke emailmu. Username hanya boleh berisi huruf, angka, dan garis bawah, serta tidak dapat diubah menjadi milik orang lain.</p>

      <h2>2. Berbagi di feed</h2>
      <p>Tulis teks hingga 5.000 karakter, tambahkan tautan, gambar, atau lampiran dokumen. Ketentuan unggahan:</p>
      <ul>
        <li>Gambar: JPG, PNG, atau WEBP, maksimal 2 MB.</li>
        <li>Dokumen: PDF, DOC, DOCX, atau ZIP, maksimal 5 MB.</li>
      </ul>
      <p>Setiap unggahan divalidasi berdasarkan tipe dan ukuran file sebelum disimpan ke penyimpanan aman.</p>

      <h2>3. Mengelola galeri</h2>
      <p>Halaman <strong>Galeri</strong> menyimpan foto karyamu secara privat. Kamu bisa mengunduh, membagikan tautan, menjadikannya ulang sebagai postingan, atau menghapusnya kapan saja.</p>

      <h2>4. Membuat diskusi privat</h2>
      <ol>
        <li>Buka <strong>Diskusi</strong> lalu buat ruang baru.</li>
        <li>Undang anggota dengan menuliskan <em>@username</em>.</li>
        <li>Anggota menerima status <em>menunggu</em> hingga kamu menyetujuinya.</li>
        <li>Setelah disetujui, anggota dapat membaca dan mengirim pesan realtime.</li>
      </ol>

      <h2>5. Menyimpan artikel</h2>
      <p>Gunakan tombol simpan pada postingan atau tautan untuk memasukkannya ke <strong>Pustaka Artikel</strong>. Simpanan bersifat pribadi dan tetap dapat dibaca meskipun postingan aslinya dihapus.</p>

      <h2>6. Mengatur profil</h2>
      <p>Di halaman <strong>Pengaturan</strong> kamu dapat memperbarui nama, bio, situs web, nomor telepon, foto profil, serta email dan kata sandi.</p>

      <h2>Butuh bantuan?</h2>
      <p>Kirim pesan ke <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a> dengan menyertakan username dan deskripsi kendala.</p>
    `.trim(),
  },

  "kebijakan-privasi": {
    title: "Kebijakan Privasi",
    description:
      "Kebijakan privasi CreatorChat: data yang dikumpulkan, cara penyimpanan, penggunaan cookie, hak pengguna, dan kontak permintaan data.",
    updatedAt: LAST_UPDATED,
    content: `
      <p>Kebijakan ini menjelaskan bagaimana CreatorChat mengumpulkan, menggunakan, dan melindungi data pengguna. Dengan menggunakan layanan, kamu menyetujui praktik yang dijelaskan di bawah ini.</p>

      <h2>Data yang kami kumpulkan</h2>
      <ul>
        <li><strong>Data akun</strong> — email, username, nama tampilan, dan kata sandi yang dikelola melalui Supabase Auth.</li>
        <li><strong>Konten</strong> — postingan, komentar, pesan diskusi, foto galeri, promosi, dan artikel yang kamu simpan.</li>
        <li><strong>Data teknis</strong> — informasi perangkat dan log keamanan yang diperlukan untuk menjaga layanan tetap berjalan.</li>
      </ul>

      <h2>Cara kami menggunakan data</h2>
      <p>Data digunakan untuk menyediakan fitur aplikasi, menampilkan konten kepada audiens yang tepat, mengirim kode verifikasi dan pemulihan akun, serta mencegah penyalahgunaan dan aktivitas mencurigakan.</p>

      <h2>Penyimpanan dan keamanan</h2>
      <p>Data disimpan di infrastruktur Supabase dengan kontrol akses berbasis baris (Row Level Security). Unggahan disimpan pada bucket penyimpanan dengan kebijakan akses ketat. Kami tidak menjual data pribadi kepada pihak ketiga.</p>

      <h2>Cookie dan sesi</h2>
      <p>Kami menggunakan cookie yang diperlukan untuk menjaga sesi login dan preferensi keamanan. Cookie ini tidak digunakan untuk periklanan lintas situs.</p>

      <h2>Layanan pihak ketiga</h2>
      <p>Autentikasi dan basis data ditangani oleh Supabase. Konten editorial dapat berasal dari WordPress Creatordock. Masing-masing penyedia memiliki kebijakan privasi tersendiri.</p>

      <h2>Hak kamu</h2>
      <p>Kamu dapat memperbarui data profil, menghapus konten, atau meminta penghapusan akun. Permintaan dapat dikirim ke <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a> dan akan ditindaklanjuti dalam waktu yang wajar.</p>

      <h2>Perubahan kebijakan</h2>
      <p>Kebijakan ini dapat diperbarui sewaktu-waktu. Versi terbaru selalu tersedia di halaman ini beserta tanggal pembaruan.</p>
    `.trim(),
  },

  "syarat-ketentuan": {
    title: "Syarat & Ketentuan",
    description:
      "Syarat dan ketentuan penggunaan CreatorChat: aturan komunitas, kepemilikan konten, batasan tanggung jawab, dan penghentian akun.",
    updatedAt: LAST_UPDATED,
    content: `
      <p>Dengan membuat akun dan menggunakan CreatorChat, kamu menyetujui syarat dan ketentuan berikut. Jika tidak setuju, mohon berhenti menggunakan layanan.</p>

      <h2>Penggunaan layanan</h2>
      <ul>
        <li>Kamu wajib memberikan informasi akun yang akurat dan menjaga kerahasiaan akses masuk.</li>
        <li>Layanan hanya boleh digunakan untuk tujuan yang sah dan sesuai hukum yang berlaku.</li>
        <li>Kamu bertanggung jawab atas seluruh aktivitas yang terjadi melalui akunmu.</li>
      </ul>

      <h2>Aturan komunitas</h2>
      <p>Dilarang mengunggah konten yang menyesatkan, melecehkan, mengancam, mengandung kebencian, melanggar hak cipta, atau menyebarkan malware. Kami dapat menghapus konten dan membatasi akun yang melanggar aturan ini.</p>

      <h2>Kepemilikan konten</h2>
      <p>Kamu tetap memiliki hak atas konten yang kamu unggah. Dengan mengunggah konten, kamu memberikan CreatorChat lisensi terbatas untuk menyimpan, menampilkan, dan memproses konten tersebut semata-mata untuk menjalankan layanan.</p>

      <h2>Konten pihak ketiga</h2>
      <p>Halaman dan artikel dari WordPress Creatordock dapat memuat tautan ke situs lain. Kami tidak bertanggung jawab atas isi atau kebijakan situs pihak ketiga tersebut.</p>

      <h2>Batasan tanggung jawab</h2>
      <p>Layanan disediakan apa adanya. Sejauh diizinkan hukum, CreatorChat tidak bertanggung jawab atas kerugian tidak langsung yang timbul dari penggunaan layanan, termasuk kehilangan data yang disebabkan oleh faktor di luar kendali kami.</p>

      <h2>Penghentian akun</h2>
      <p>Kami dapat menangguhkan atau menghentikan akun yang melanggar ketentuan. Kamu dapat berhenti menggunakan layanan kapan saja dan meminta penghapusan akun melalui <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.</p>

      <h2>Perubahan ketentuan</h2>
      <p>Ketentuan ini dapat diperbarui dari waktu ke waktu. Penggunaan layanan setelah pembaruan berarti kamu menyetujui versi terbaru.</p>
    `.trim(),
  },
};

export function getFallbackPage(slug: string): FallbackPage | null {
  const page = FALLBACK_PAGES[slug];
  return page ? { slug, ...page } : null;
}

export function getFallbackPageSlugs(): string[] {
  return WORDPRESS_FALLBACK_LINKS.map((page) => page.slug);
}
