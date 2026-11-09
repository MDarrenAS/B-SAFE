-- =====================================================================
-- 01_schema.sql
-- Sistem Cerdas Deteksi Kepatuhan Perusahaan (Integrated Fraud Detection)
-- Target: PostgreSQL 15+ / Supabase
--
-- Sumber data (disimulasikan, semua DUMMY):
--   dukcapil_*  : identitas penduduk (Ditjen Dukcapil)
--   kemnaker_*  : WLKP, perjanjian kerja, UMK (Kemnaker)
--   djp_*       : WP badan, WP OP, bukti potong PPh 21, SPT Masa (DJP)
--   bpjs_*      : badan usaha, peserta PPU, mutasi, iuran (BPJS Kesehatan)
--   fraud_alert : hasil deteksi sistem
--   eval.gt_anomali_dummy : "kunci jawaban" skenario dummy (schema terpisah, hanya untuk uji)
--
-- Catatan desain: antar-lembaga TIDAK memakai FOREIGN KEY, karena di dunia
-- nyata tiap lembaga punya database sendiri. Tautan lintas lembaga dilakukan
-- lewat kunci bersama: NIK (orang), NPWP & NIB (perusahaan).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. DUKCAPIL
-- ---------------------------------------------------------------------
create table public.dukcapil_penduduk (
  nik                 char(16) primary key check (nik ~ '^[0-9]{16}$'),
  no_kk               char(16) not null check (no_kk ~ '^[0-9]{16}$'),
  nama_lengkap        varchar(150) not null,
  jenis_kelamin       varchar(10) not null check (jenis_kelamin in ('LAKI-LAKI','PEREMPUAN')),
  tempat_lahir        varchar(80) not null,
  tanggal_lahir       date not null,
  golongan_darah      varchar(2) not null default '-' check (golongan_darah in ('A','B','AB','O','-')),
  agama               varchar(20) not null check (agama in ('ISLAM','KRISTEN','KATOLIK','HINDU','BUDDHA','KONGHUCU')),
  status_perkawinan   varchar(20) not null check (status_perkawinan in ('BELUM KAWIN','KAWIN','CERAI HIDUP','CERAI MATI')),
  pekerjaan           varchar(80),
  kewarganegaraan     varchar(3) not null default 'WNI' check (kewarganegaraan in ('WNI','WNA')),
  nama_ibu_kandung    varchar(150),
  alamat              varchar(200),
  rt                  char(3),
  rw                  char(3),
  kelurahan           varchar(80),
  kecamatan           varchar(80),
  kab_kota            varchar(80),
  provinsi            varchar(80),
  kode_kecamatan      char(6),
  status_kependudukan varchar(10) not null default 'AKTIF' check (status_kependudukan in ('AKTIF','MENINGGAL','PINDAH')),
  tanggal_meninggal   date,
  tanggal_rekam_ektp  date,
  created_at          timestamptz not null default now(),
  constraint chk_dukcapil_meninggal check ((status_kependudukan = 'MENINGGAL') = (tanggal_meninggal is not null))
);
create index idx_dukcapil_kk on public.dukcapil_penduduk (no_kk);
create index idx_dukcapil_status on public.dukcapil_penduduk (status_kependudukan);

-- ---------------------------------------------------------------------
-- 2. KEMNAKER
-- ---------------------------------------------------------------------
create table public.kemnaker_umk (
  kode_kab_kota  char(4) not null,
  kab_kota       varchar(80) not null,
  provinsi       varchar(80) not null,
  tahun          smallint not null,
  nilai_umk      numeric(15,2) not null check (nilai_umk > 0),
  no_sk_gubernur varchar(60),
  primary key (kode_kab_kota, tahun)
);

create table public.kemnaker_perusahaan (
  nib             char(13) primary key check (nib ~ '^[0-9]{13}$'),
  npwp            char(16) not null unique check (npwp ~ '^[0-9]{16}$'),
  nama_perusahaan varchar(200) not null,
  bentuk_usaha    varchar(10) not null check (bentuk_usaha in ('PT','CV','UD','KOPERASI')),
  kbli            char(5) not null,
  bidang_usaha    varchar(150) not null,
  alamat          varchar(250),
  kecamatan       varchar(80),
  kode_kab_kota   char(4) not null,
  kab_kota        varchar(80) not null,
  provinsi        varchar(80) not null,
  nama_pimpinan   varchar(150),
  tanggal_berdiri date,
  status_aktif    varchar(10) not null default 'AKTIF' check (status_aktif in ('AKTIF','TUTUP'))
);

-- Wajib Lapor Ketenagakerjaan di Perusahaan (agregat jumlah tenaga kerja)
create table public.kemnaker_wlkp (
  id                  bigint generated always as identity primary key,
  nomor_wlkp          varchar(40) not null unique,
  nib                 char(13) not null references public.kemnaker_perusahaan(nib),
  tahun_lapor         smallint not null,
  per_tanggal         date not null,
  tanggal_lapor       date not null,
  jumlah_tk_laki      integer not null default 0 check (jumlah_tk_laki >= 0),
  jumlah_tk_perempuan integer not null default 0 check (jumlah_tk_perempuan >= 0),
  jumlah_tk_total     integer not null check (jumlah_tk_total >= 0),
  jumlah_pkwtt        integer not null default 0,
  jumlah_pkwt         integer not null default 0,
  jumlah_alih_daya    integer not null default 0,
  jumlah_lepas_mitra  integer not null default 0,
  jumlah_tka          integer not null default 0,
  status_wlkp         varchar(15) not null default 'SUDAH_LAPOR' check (status_wlkp in ('SUDAH_LAPOR','BELUM_LAPOR','PERBAIKAN')),
  unique (nib, tahun_lapor)
);

-- Data hubungan kerja per pekerja (perjanjian kerja yang dicatat Kemnaker)
create table public.kemnaker_tenaga_kerja (
  id                      bigint generated always as identity primary key,
  nib                     char(13) not null references public.kemnaker_perusahaan(nib),
  nik                     char(16) not null check (nik ~ '^[0-9]{16}$'),
  no_perjanjian_kerja     varchar(40) not null,
  jabatan                 varchar(100) not null,
  status_hubungan_kerja   varchar(15) not null check (status_hubungan_kerja in ('PKWTT','PKWT','ALIH_DAYA','HARIAN_LEPAS','KEMITRAAN','MAGANG')),
  tanggal_mulai_kerja     date not null,
  tanggal_akhir_kontrak   date,
  upah_pokok              numeric(15,2) not null check (upah_pokok >= 0),
  tunjangan_tetap         numeric(15,2) not null default 0,
  status_kerja            varchar(15) not null default 'AKTIF' check (status_kerja in ('AKTIF','RESIGN','PHK','HABIS_KONTRAK')),
  tanggal_berhenti        date,
  kode_kab_kota_kerja     char(4),
  unique (nib, nik, tanggal_mulai_kerja),
  constraint chk_kemnaker_berhenti check ((status_kerja = 'AKTIF') = (tanggal_berhenti is null))
);
create index idx_kemnaker_tk_nik on public.kemnaker_tenaga_kerja (nik);
create index idx_kemnaker_tk_nib on public.kemnaker_tenaga_kerja (nib);

-- ---------------------------------------------------------------------
-- 3. DJP
-- ---------------------------------------------------------------------
create table public.djp_wp_badan (
  npwp                     char(16) primary key check (npwp ~ '^[0-9]{16}$'),
  nama_wp                  varchar(200) not null,
  bentuk_badan             varchar(10) not null,
  nib                      char(13),
  kode_klu                 char(5) not null,
  alamat                   varchar(250),
  kecamatan                varchar(80),
  kab_kota                 varchar(80),
  provinsi                 varchar(80),
  kode_kpp                 char(3) not null,
  nama_kpp                 varchar(100) not null,
  status_pkp               boolean not null default true,
  tanggal_pengukuhan       date not null,
  status_wp                varchar(15) not null default 'AKTIF' check (status_wp in ('AKTIF','NON_EFEKTIF','DIHAPUS')),
  nik_penanggung_jawab     char(16),
  nama_penanggung_jawab    varchar(150)
);
create index idx_djp_wp_badan_nib on public.djp_wp_badan (nib);

-- Sejak integrasi NIK-NPWP, NPWP orang pribadi = NIK
create table public.djp_wp_orang_pribadi (
  npwp              char(16) primary key check (npwp ~ '^[0-9]{16}$'),
  nik               char(16) not null unique check (nik ~ '^[0-9]{16}$'),
  nama_wp           varchar(150) not null,
  status_ptkp       varchar(5) not null check (status_ptkp in ('TK/0','TK/1','TK/2','TK/3','K/0','K/1','K/2','K/3')),
  kode_kpp          char(3),
  tanggal_terdaftar date not null,
  status_wp         varchar(15) not null default 'AKTIF' check (status_wp in ('AKTIF','NON_EFEKTIF','DIHAPUS'))
);

create table public.djp_ref_objek_pajak_pph21 (
  kode_objek_pajak varchar(10) primary key,
  nama_objek_pajak varchar(120) not null,
  kategori         varchar(20) not null check (kategori in ('PEGAWAI_TETAP','PENSIUN','BUKAN_PEGAWAI'))
);

-- Bukti Potong PPh 21 (e-Bupot 21/26) : 1 baris = 1 penerima x 1 masa pajak
create table public.djp_bukti_potong_pph21 (
  no_bukti_potong    varchar(30) primary key,
  npwp_pemotong      char(16) not null references public.djp_wp_badan(npwp),
  nik_penerima       char(16) not null references public.djp_wp_orang_pribadi(nik),
  masa_pajak         smallint not null check (masa_pajak between 1 and 12),
  tahun_pajak        smallint not null,
  kode_objek_pajak   varchar(10) not null references public.djp_ref_objek_pajak_pph21(kode_objek_pajak),
  status_ptkp        varchar(5) not null,
  kategori_ter       char(1) check (kategori_ter in ('A','B','C')),
  penghasilan_bruto  numeric(15,2) not null check (penghasilan_bruto >= 0),
  tarif_efektif      numeric(5,2) not null default 0,
  pph21_dipotong     numeric(15,2) not null default 0,
  tanggal_pemotongan date not null,
  status_bukti       varchar(12) not null default 'NORMAL' check (status_bukti in ('NORMAL','PEMBETULAN','PEMBATALAN')),
  unique (npwp_pemotong, nik_penerima, masa_pajak, tahun_pajak, kode_objek_pajak)
);
create index idx_bupot_pemotong_masa on public.djp_bukti_potong_pph21 (npwp_pemotong, tahun_pajak, masa_pajak);
create index idx_bupot_nik on public.djp_bukti_potong_pph21 (nik_penerima);

-- SPT Masa PPh 21 (agregat per pemotong per masa)
create table public.djp_spt_masa_pph21 (
  id                    bigint generated always as identity primary key,
  npwp_pemotong         char(16) not null references public.djp_wp_badan(npwp),
  masa_pajak            smallint not null check (masa_pajak between 1 and 12),
  tahun_pajak           smallint not null,
  jumlah_bukti_potong   integer not null,
  jumlah_penerima       integer not null,
  total_bruto           numeric(17,2) not null,
  total_pph21           numeric(17,2) not null,
  tanggal_lapor         date not null,
  status_spt            varchar(12) not null default 'NORMAL' check (status_spt in ('NORMAL','PEMBETULAN')),
  unique (npwp_pemotong, masa_pajak, tahun_pajak)
);

-- ---------------------------------------------------------------------
-- 4. BPJS KESEHATAN
-- ---------------------------------------------------------------------
create table public.bpjs_kantor_cabang (
  kode_kantor_cabang char(4) primary key,
  nama_kantor        varchar(80) not null,
  kab_kota           varchar(80) not null
);

create table public.bpjs_badan_usaha (
  kode_badan_usaha   char(8) primary key,
  nama_badan_usaha   varchar(200) not null,
  npwp               char(16) not null unique check (npwp ~ '^[0-9]{16}$'),
  nib                char(13),
  alamat             varchar(250),
  kab_kota           varchar(80),
  kode_kantor_cabang char(4) not null references public.bpjs_kantor_cabang(kode_kantor_cabang),
  tanggal_terdaftar  date not null,
  status_badan_usaha varchar(10) not null default 'AKTIF' check (status_badan_usaha in ('AKTIF','NONAKTIF')),
  nama_pic           varchar(150),
  nik_pic            char(16),
  no_telp            varchar(20),
  email              varchar(120)
);

-- Peserta JKN segmen Pekerja Penerima Upah (PPU) yang didaftarkan perusahaan
create table public.bpjs_peserta (
  no_kartu                  char(13) primary key check (no_kartu ~ '^[0-9]{13}$'),
  nik                       char(16) not null check (nik ~ '^[0-9]{16}$'),
  nama_peserta              varchar(150) not null,
  kode_badan_usaha          char(8) not null references public.bpjs_badan_usaha(kode_badan_usaha),
  jenis_peserta             varchar(20) not null default 'PPU_SWASTA',
  status_hubungan_kerja_dilaporkan varchar(20) not null check (status_hubungan_kerja_dilaporkan in ('PEKERJA_TETAP','PEKERJA_KONTRAK','PEKERJA_LEPAS')),
  upah_dilaporkan           numeric(15,2) not null check (upah_dilaporkan >= 0),
  jumlah_anggota_keluarga   smallint not null default 0 check (jumlah_anggota_keluarga between 0 and 4),
  faskes_tingkat1           varchar(100),
  tanggal_efektif           date not null,
  status_peserta            varchar(10) not null default 'AKTIF' check (status_peserta in ('AKTIF','NONAKTIF')),
  tanggal_nonaktif          date,
  alasan_nonaktif           varchar(20) check (alasan_nonaktif in ('RESIGN','PHK','HABIS_KONTRAK','MENINGGAL','PINDAH_BU')),
  unique (nik, kode_badan_usaha),
  constraint chk_bpjs_nonaktif check ((status_peserta = 'NONAKTIF') = (tanggal_nonaktif is not null and alasan_nonaktif is not null))
);
create index idx_bpjs_peserta_nik on public.bpjs_peserta (nik);
create index idx_bpjs_peserta_bu on public.bpjs_peserta (kode_badan_usaha);

create table public.bpjs_mutasi_peserta (
  id               bigint generated always as identity primary key,
  no_kartu         char(13) not null references public.bpjs_peserta(no_kartu),
  nik              char(16) not null,
  kode_badan_usaha char(8) not null references public.bpjs_badan_usaha(kode_badan_usaha),
  jenis_mutasi     varchar(25) not null check (jenis_mutasi in ('PENDAFTARAN','NONAKTIF_RESIGN','NONAKTIF_PHK','NONAKTIF_HABIS_KONTRAK','PERUBAHAN_UPAH')),
  tanggal_mutasi   date not null,
  tanggal_lapor    date not null,
  keterangan       varchar(200)
);
create index idx_bpjs_mutasi_nik on public.bpjs_mutasi_peserta (nik);

-- Tagihan iuran per badan usaha per bulan (1 Virtual Account)
create table public.bpjs_iuran_badan_usaha (
  id                    bigint generated always as identity primary key,
  kode_badan_usaha      char(8) not null references public.bpjs_badan_usaha(kode_badan_usaha),
  masa                  smallint not null check (masa between 1 and 12),
  tahun                 smallint not null,
  no_va                 varchar(16) not null,
  jumlah_peserta        integer not null,
  total_upah_dilaporkan numeric(17,2) not null,
  total_iuran           numeric(17,2) not null,
  tanggal_jatuh_tempo   date not null,
  tanggal_bayar         date,
  status_bayar          varchar(15) not null check (status_bayar in ('LUNAS','BELUM_BAYAR','TUNGGAKAN')),
  unique (kode_badan_usaha, masa, tahun)
);

-- Rincian iuran per peserta: 5% dari upah (4% pemberi kerja + 1% pekerja), batas upah Rp12.000.000
create table public.bpjs_iuran_peserta (
  id                    bigint generated always as identity primary key,
  no_kartu              char(13) not null references public.bpjs_peserta(no_kartu),
  kode_badan_usaha      char(8) not null references public.bpjs_badan_usaha(kode_badan_usaha),
  masa                  smallint not null check (masa between 1 and 12),
  tahun                 smallint not null,
  upah_dilaporkan       numeric(15,2) not null,
  upah_dasar_iuran      numeric(15,2) not null,
  iuran_pemberi_kerja   numeric(15,2) not null,
  iuran_pekerja         numeric(15,2) not null,
  total_iuran           numeric(15,2) not null,
  unique (no_kartu, masa, tahun)
);
create index idx_bpjs_iuran_bu_masa on public.bpjs_iuran_peserta (kode_badan_usaha, tahun, masa);

-- ---------------------------------------------------------------------
-- 5. HASIL DETEKSI & KUNCI JAWABAN DUMMY
-- ---------------------------------------------------------------------
create table public.fraud_alert (
  id                bigint generated always as identity primary key,
  npwp              char(16) not null,
  kode_badan_usaha  char(8),
  nik               char(16),
  jenis_anomali     varchar(40) not null check (jenis_anomali in
                      ('PDUK','UNDER_REPORTING_UPAH','MISKLASIFIKASI_HUBUNGAN_KERJA','MANIPULASI_MUTASI','IDENTITAS_TIDAK_VALID')),
  masa_pajak        smallint,
  tahun_pajak       smallint,
  nilai_bpjs        numeric(17,2),
  nilai_pembanding  numeric(17,2),
  selisih           numeric(17,2),
  tingkat_risiko    varchar(10) not null check (tingkat_risiko in ('RENDAH','SEDANG','TINGGI')),
  status_tindak_lanjut varchar(15) not null default 'BARU' check (status_tindak_lanjut in ('BARU','DALAM_REVIEW','TERBUKTI','FALSE_POSITIVE')),
  keterangan        text,
  created_at        timestamptz not null default now()
);

-- Kunci jawaban HANYA untuk menguji akurasi deteksi. Sengaja dipisah ke schema "eval"
-- (tidak terekspos via API Supabase, tidak dipakai oleh view/fungsi deteksi). Boleh di-drop.
create schema if not exists eval;
create table eval.gt_anomali_dummy (
  id             bigint generated always as identity primary key,
  npwp_pemotong  char(16) not null,
  nik            char(16),
  jenis_anomali  varchar(40) not null,
  keterangan     varchar(250)
);
alter table eval.gt_anomali_dummy enable row level security;

-- ---------------------------------------------------------------------
-- 6. KEAMANAN SUPABASE: aktifkan RLS di semua tabel (data berisi NIK).
--    Tanpa policy, akses via anon/authenticated key ditolak; service_role
--    (backend) tetap bisa. Tambahkan policy sesuai kebutuhan aplikasi.
-- ---------------------------------------------------------------------
do $$
declare t record;
begin
  for t in
    select tablename from pg_tables
    where schemaname = 'public'
      and (tablename like 'dukcapil\_%' or tablename like 'kemnaker\_%' or tablename like 'djp\_%'
           or tablename like 'bpjs\_%' or tablename in ('fraud_alert'))
  loop
    execute format('alter table public.%I enable row level security', t.tablename);
  end loop;
end $$;
