# CreatorChat

Jejaring sosial dan ruang obrolan realtime untuk kreator. Berbagi karya di
feed, membuka diskusi privat, mengelola galeri, menyimpan artikel, dan
mempromosikan karyamu dalam satu antarmuka gelap yang tenang.

Dibangun dengan **Next.js 15 App Router**, **TypeScript**, **Tailwind CSS**,
**Supabase** (Auth, Postgres, Storage, Realtime), dan **headless WordPress**
untuk halaman serta artikel publik.

---

## Fitur

- **Autentikasi** — OTP email / magic link, pemulihan kata sandi, callback
  Supabase, dan proteksi rute melalui middleware.
- **Feed kreator** — teks (hingga 5.000 karakter), tautan dengan pratinjau OG,
  gambar, lampiran dokumen, suka, komentar, dan simpan ke pustaka artikel.
- **Galeri pribadi** — unggah, unduh, bagikan, jadikan ulang sebagai postingan,
  dan hapus foto.
- **Pustaka artikel** — simpan postingan/tautan sebagai bacaan pribadi yang
  tetap ada meskipun sumbernya dihapus.
- **Diskusi realtime** — ruang privat dengan undangan `@username`, persetujuan
  pemilik, pesan realtime, dan indikator kehadiran.
- **Promo** — satu penawaran utama per pengguna dengan kanal kontak dan tautan
  sosial.
- **Pengaturan** — profil, avatar, bio, situs web, telepon, email, dan kata
  sandi.
- **Halaman publik WordPress** — `/p/[slug]` dan `/blog` + `/blog/[slug]`
  dirender dengan HTML tersanitasi, metadata dinamis, JSON-LD, sitemap, dan
  robots.
- **PWA** — manifest, ikon, service worker, dan halaman offline.
- **Keamanan** — RLS ketat, sanitasi XSS, validasi unggahan, rate limit,
  perlindungan SSRF pada pratinjau tautan, dan security headers.

---

## Stack

| Lapisan    | Teknologi                                              |
| ---------- | ------------------------------------------------------ |
| Framework  | Next.js 15.5 (App Router, Server Components)           |
| Bahasa     | TypeScript 5.9                                         |
| UI         | Tailwind CSS 3.4, Lucide Icons                         |
| Auth & DB  | Supabase (`@supabase/ssr`, Postgres, Storage, Realtime) |
| CMS        | WordPress REST API (`/wp-json/wp/v2`)                  |
| Sanitasi   | `isomorphic-dompurify` + utilitas khusus               |
| Deployment | Vercel                                                 |

---

## Struktur proyek

```
src/
├─ app/
│  ├─ (app)/                 # Area privat: feed, diskusi, galeri, artikel, promo, pengaturan
│  ├─ (auth)/                # Login, register, reset kata sandi
│  ├─ (public)/              # Halaman WordPress & blog publik
│  ├─ api/link-preview/      # Pratinjau tautan dengan proteksi SSRF
│  ├─ auth/callback/         # Callback OTP / magic link Supabase
│  ├─ manifest.ts            # PWA manifest
│  ├─ robots.ts / sitemap.ts # SEO
│  └─ offline/               # Shell offline PWA
├─ components/ui/            # Primitif UI (button, modal, toast, avatar, ...)
├─ lib/
│  ├─ security/              # Sanitasi, validasi upload, rate limit, validasi URL
│  ├─ supabase/              # Klien browser/server/middleware
│  ├─ wordpress/             # Klien REST, tipe, metadata SEO
│  └─ types.ts, utils.ts     # Tipe domain & helper
├─ modules/                  # Fitur modular (auth, feed, gallery, articles, promo,
│                            # discussions, settings, layout, wordpress)
└─ middleware.ts             # Refresh sesi + proteksi rute
supabase/schema.sql          # Skema, RLS, trigger, realtime, storage policy
public/                      # Ikon PWA & service worker
```

---

## Menjalankan secara lokal

Prasyarat: **Node.js 20+** dan npm.

```bash
npm install
cp .env.example .env.local
# isi kredensial Supabase & WordPress
npm run dev
```

> Windows PowerShell memblokir `npm.ps1` pada beberapa mesin. Gunakan
> `npm.cmd run dev` atau jalankan melalui `cmd`.

Perintah lain:

```bash
npm run typecheck   # TypeScript tanpa emit
npm run lint        # ESLint Next.js
npm run build       # Build produksi
npm run start       # Jalankan hasil build
```

---

## Variabel lingkungan

Salin `.env.example` menjadi `.env.local` (lokal) atau isi di dashboard Vercel.

| Variabel                          | Wajib | Keterangan                                                     |
| --------------------------------- | :---: | -------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`        |  Ya   | URL proyek Supabase, mis. `https://xxxx.supabase.co`.          |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`   |  Ya   | Anon/public key Supabase.                                       |
| `SUPABASE_SERVICE_ROLE_KEY`       |  -    | Hanya untuk job server tepercaya. Jangan pernah ke browser.    |
| `WORDPRESS_API_URL`               |  -    | Default: `https://creatordock.online/wp-json/wp/v2`.           |
| `NEXT_PUBLIC_WORDPRESS_SITE_URL`  |  -    | Default: `https://creatordock.online`.                         |
| `WORDPRESS_API_TOKEN`             |  -    | Hanya jika REST API WordPress dilindungi.                       |
| `NEXT_PUBLIC_SITE_URL`            |  Ya   | URL publik aplikasi, dipakai untuk canonical, sitemap, OG.     |
| `NEXT_PUBLIC_APP_NAME`            |  -    | Nama tampilan aplikasi.                                         |

Tanpa kredensial Supabase, aplikasi tetap bisa melakukan build dan menampilkan
halaman publik WordPress. Rute privat akan mengarahkan ke `/login`.

---

## Penyiapan Supabase

1. Buat proyek baru di [supabase.com](https://supabase.com).
2. Buka **SQL Editor**, tempel isi `supabase/schema.sql`, lalu jalankan. Skrip
   ini membuat:
   - tabel `profiles`, `posts`, `post_likes`, `post_comments`,
     `saved_articles`, `gallery_items`, `promos`, `discussions`,
     `discussion_members`, dan `discussion_messages`;
   - trigger profil otomatis, `updated_at`, hitung like/komentar, dan
     `touch_last_seen`;
   - kebijakan RLS ketat untuk setiap tabel;
   - bucket `avatars`, `feed-media`, dan `promo-media` beserta policy-nya;
   - publikasi realtime untuk tabel feed dan diskusi.
3. Di **Authentication → URL Configuration**, atur:
   - **Site URL**: `https://creatordock.online`
   - **Redirect URLs**: `https://creatordock.online/auth/callback`,
     `http://localhost:3000/auth/callback`
4. Aktifkan penyedia **Email**. Untuk pengalaman OTP, sunting template email
   agar menampilkan `{{ .Token }}` (lihat contoh di bawah).
5. Salin **Project URL** dan **anon key** ke variabel lingkungan.

### Contoh template email OTP

```html
<h2>Kode masuk CreatorChat</h2>
<p>Gunakan kode berikut untuk masuk atau memverifikasi akunmu:</p>
<p style="font-size: 28px; letter-spacing: 6px; font-weight: 700">
  {{ .Token }}
</p>
<p>Kode berlaku selama 10 menit. Abaikan email ini jika kamu tidak meminta
kode.</p>
```

> Pemulihan kata sandi menggunakan tautan `{{ .ConfirmationURL }}` yang
> diarahkan ke `/auth/callback?next=/reset-password/update`.

---

## Penyiapan WordPress

- REST API harus dapat diakses publik:
  `https://creatordock.online/wp-json/wp/v2/pages` dan `/posts`.
- Halaman yang dipublikasikan otomatis muncul di sidebar kiri (desktop) dan
  drawer (mobile) melalui `getWordPressPageLinks()`.
- Halaman mandiri tersedia di `/p/[slug]`; artikel di `/blog` dan
  `/blog/[slug]`.
- Jika API tidak dapat dijangkau, empat halaman fallback lokal
  (`tentang-kami`, `panduan`, `kebijakan-privasi`, `syarat-ketentuan`) tetap
  tampil agar navigasi dan SEO tidak rusak.
- Konten HTML WordPress disanitasi dengan `sanitizeRichHtml()` sebelum
  dirender. Script, iframe, form, event handler, dan inline style dibuang.
- Konten di-cache dengan ISR selama 5 menit (`revalidate = 300`).
- Jika REST API dilindungi, buat Application Password dan isi
  `WORDPRESS_API_TOKEN` (dikirim sebagai `Authorization: Bearer`).

---

## Deployment ke Vercel

1. Hubungkan repositori ke Vercel.
2. Tambahkan semua variabel lingkungan produksi. Pastikan
   `NEXT_PUBLIC_SITE_URL=https://creatordock.online`.
3. Deploy. Vercel mendeteksi Next.js secara otomatis; tidak perlu
   `vercel.json`.
4. Arahkan domain `creatordock.online` ke proyek Vercel dan aktifkan HTTPS.
5. Setelah deploy, verifikasi:
   - `https://creatordock.online/robots.txt`
   - `https://creatordock.online/sitemap.xml`
   - `https://creatordock.online/blog`
   - `https://creatordock.online/p/tentang-kami`
   - header keamanan melalui `curl -I`.

Security headers, CSP, dan cache service worker diatur di `next.config.mjs`.
Middleware tidak memproteksi `/p`, `/blog`, `/offline`, `robots.txt`, dan
`sitemap.xml` agar tetap dapat diakses publik.

---

## Keamanan

- **RLS**: seluruh tabel memakai Row Level Security. Galeri, pustaka artikel,
  dan diskusi hanya dapat diakses pemilik/anggota yang disetujui.
- **Sanitasi**: input teks dibersihkan dari HTML/tag kontrol; HTML CMS
  disanitasi dengan allowlist tag/atribut.
- **Unggahan**: gambar JPG/PNG/WEBP maks. 2 MB; dokumen PDF/DOC/DOCX/ZIP maks.
  5 MB; nama file dinormalisasi; tipe MIME dan ekstensi diperiksa.
- **Tautan**: hanya `http`/`https`, kredensial URL dibuang, dan pratinjau
  tautan memakai proteksi SSRF (host privat/localhost ditolak, redirect
  dimanualkan, ukuran HTML dibatasi).
- **Rate limit**: login/register dan endpoint pratinjau tautan dibatasi.
- **Headers**: CSP, HSTS, `X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy`, dan `Cross-Origin-Opener-Policy`.
- **Rahasia**: `SUPABASE_SERVICE_ROLE_KEY` hanya untuk server. Jangan pernah
  memberi prefix `NEXT_PUBLIC_`.

---

## Catatan pengembangan

- Rute privat berada di grup `(app)` dan memaksa sesi aktif; halaman publik
  berada di grup `(public)`.
- `useSearchParams` pada halaman login dibungkus `Suspense` sesuai kebutuhan
  Next.js 15.
- Parameter rute dinamis (`params`) adalah `Promise` dan harus di-`await`.
- Gambar dari WordPress dirender sebagai `<img>` agar tidak bergantung pada
  allowlist `next/image`; host tetap dibatasi melalui CSP.
- Service worker hanya didaftarkan pada produksi dan tidak pernah menyimpan
  respons API terautentikasi.

---

## Lisensi

Proyek privat CreatorChat. Seluruh hak cipta dilindungi.
