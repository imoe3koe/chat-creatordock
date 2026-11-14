# Panduan Git Push CreatorChat ke GitHub (VS Code di Windows)

Target repo: <https://github.com/imoe3koe/chat-creatordock>

Repo tersebut saat ini **kosong** (belum punya commit), jadi alur di bawah ini
adalah push pertama dari folder `C:\Creatorchat`.

> Jangan pernah meng-commit `.env.local`. File itu berisi kredensial Supabase
> dan sudah masuk `.gitignore`. Yang boleh ikut hanya `.env.example`.

---

## 1. Persiapan

1. Buka **VS Code**.
2. Pilih **File → Open Folder…** lalu buka `C:\Creatorchat`.
3. Buka terminal terintegrasi: **Ctrl + `** (backtick).
4. Di kanan atas terminal, pilih **PowerShell** (bukan Command Prompt, agar
   perintah di panduan ini berjalan apa adanya).
5. Pastikan Git dikenali:

   ```powershell
   git --version
   ```

   Jika muncul error, install Git for Windows dari
   <https://git-scm.com/download/win>, lalu restart VS Code.

6. Pastikan identitas commit sudah diisi. Jika belum:

   ```powershell
   git config --global user.name "Nama Kamu"
   git config --global user.email "email@kamu.com"
   ```

   Gunakan email yang sama dengan akun GitHub agar kontribusi terbaca.

---

## 2. Pastikan file rahasia tidak ikut ter-commit

Jalankan dari folder proyek:

```powershell
Get-ChildItem -Force .env*
```

Yang muncul seharusnya `.env.example` dan `.env.local`. File `.env.local`
**tidak boleh** di-commit. Setelah repo diinisialisasi, cek dengan:

```powershell
git check-ignore -v .env.local
```

Jika perintah itu **tidak** mengeluarkan apa pun, hentikan proses dan tambahkan
`.env*.local` ke `.gitignore` terlebih dahulu.

---

## 3. Inisialisasi repo dan commit pertama

Jalankan berurutan:

```powershell
git init
git branch -M main
git add .
git status
```

Periksa daftar `Changes to be committed`:

- `node_modules/`, `.next/`, `*.log`, `.env.local`, dan `*.tsbuildinfo`
  **tidak boleh** muncul.
- File penting seperti `src/`, `supabase/schema.sql`, `package.json`,
  `package-lock.json`, `README.md`, `.env.example` harus muncul.

Jika sudah benar:

```powershell
git commit -m "feat: initial CreatorChat release"
```

---

## 4. Hubungkan ke repo GitHub

```powershell
git remote add origin https://github.com/imoe3koe/chat-creatordock.git
git remote -v
```

Output yang benar:

```text
origin  https://github.com/imoe3koe/chat-creatordock.git (fetch)
origin  https://github.com/imoe3koe/chat-creatordock.git (push)
```

Jika muncul `remote origin already exists`, ganti dengan:

```powershell
git remote set-url origin https://github.com/imoe3koe/chat-creatordock.git
```

---

## 5. Push ke GitHub

```powershell
git push -u origin main
```

Saat pertama kali, akan muncul jendela login GitHub:

1. Pilih **Sign in with your browser**.
2. Login ke akun yang punya akses ke `imoe3koe/chat-creatordock`.
3. Kembali ke VS Code dan tunggu proses push selesai.

Alternatif jika browser tidak terbuka atau diminta password:

- Buat **Personal Access Token (classic)** di
  <https://github.com/settings/tokens> dengan scope `repo`.
- Saat terminal meminta password, tempel token tersebut (bukan password akun).

Atau gunakan GitHub CLI jika terpasang:

```powershell
gh auth login
```

---

## 6. Verifikasi

1. Buka <https://github.com/imoe3koe/chat-creatordock>.
2. Pastikan branch `main` berisi file proyek.
3. Cek bahwa `.env.local` **tidak ada** di repo.
4. Di VS Code, buka **Source Control** (Ctrl + Shift + G). Statusnya harus
   bersih dan tombol **Sync Changes** tersedia.

---

## 7. Alternatif lewat UI VS Code (tanpa terminal)

Jika lebih nyaman memakai klik:

1. Klik ikon **Source Control** di sidebar (Ctrl + Shift + G).
2. Klik **Initialize Repository**.
3. Klik `+` di samping **Changes** untuk stage semua file.
4. Tulis pesan commit, lalu klik **Commit** (centang/ikon ✓).
5. Klik **Publish Branch**.
6. Pilih **existing repository** → masukkan URL
   `https://github.com/imoe3koe/chat-creatordock.git`.

Catatan: jangan memilih **Publish to GitHub private/public repository** karena
opsi itu membuat repo **baru**, bukan mengirim ke repo yang sudah ada.

---

## 8. Troubleshooting umum

| Masalah | Penyebab | Solusi |
| --- | --- | --- |
| `src refspec main does not match any` | Belum ada commit atau branch masih `master` | Jalankan `git add .`, `git commit`, lalu `git branch -M main` |
| `remote origin already exists` | Remote sudah pernah ditambahkan | `git remote set-url origin https://github.com/imoe3koe/chat-creatordock.git` |
| `failed to push some refs` / `non-fast-forward` | Repo GitHub sudah punya commit lain | `git pull origin main --allow-unrelated-histories`, selesaikan konflik, lalu push |
| `Authentication failed` | Password biasa tidak dipakai lagi | Login browser atau gunakan Personal Access Token |
| `LF will be replaced by CRLF` | Perbedaan line ending Windows/Linux | Peringatan saja, aman. Bisa diabaikan |
| File `.env.local` terlanjur ter-commit | `.gitignore` belum aktif saat commit | `git rm --cached .env.local`, commit ulang, lalu **rotate semua key Supabase** |
| Push lambat / file besar | Folder build ikut ter-stage | `git rm -r --cached .next node_modules`, lalu commit |

---

## 9. Setelah push berhasil (opsional, untuk Vercel)

1. Buka <https://vercel.com/new> dan import repo
   `imoe3koe/chat-creatordock`.
2. Tambahkan environment variables dari `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (hanya jika dipakai di server)
   - `NEXT_PUBLIC_SITE_URL`
   - `WORDPRESS_API_URL`
3. Deploy.
4. Setelah domain aktif, perbarui **Site URL** dan **Redirect URLs** di
   Supabase → Authentication → URL Configuration:
   - `https://domain-kamu.com/auth/callback`
   - `https://domain-kamu.vercel.app/auth/callback`

---

## 10. Perintah ringkas (copy-paste)

Jika semua pengecekan di atas sudah lolos:

```powershell
git init
git branch -M main
git add .
git commit -m "feat: initial CreatorChat release"
git remote add origin https://github.com/imoe3koe/chat-creatordock.git
git push -u origin main
```
