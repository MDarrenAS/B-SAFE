-- =====================================================================
-- 07_views_deteksi.sql
-- Aturan deteksi anomali (rule-based) lintas BPJS - DJP - Kemnaker - Dukcapil.
-- Seluruh ambang batas & bobot ada di tabel public.fraud_rule_config (bisa diubah
-- tanpa menyentuh SQL view). Tingkat risiko TIDAK disimpan di data; ia dihitung
-- saat query dari aturan tersebut. View memakai security_invoker agar RLS tetap berlaku.
-- =====================================================================

create table if not exists public.fraud_rule_config (
  kode        varchar(40) primary key,
  nilai       numeric not null,
  keterangan  varchar(200) not null
);
alter table public.fraud_rule_config enable row level security;

insert into public.fraud_rule_config (kode, nilai, keterangan) values
 ('pduk_min_selisih_pekerja', 3,    'PDUK: minimal selisih jumlah pekerja DJP vs BPJS agar ditandai'),
 ('pduk_min_persen',          15,   'PDUK: minimal persentase pekerja tidak terdaftar'),
 ('upah_rasio_maks',          0.80, 'Under-reporting: rata-rata upah BPJS / bruto DJP di bawah nilai ini = anomali'),
 ('tarif_iuran_total',        0.05, 'Total iuran JKN PPU (4% pemberi kerja + 1% pekerja), untuk estimasi iuran hilang'),
 ('klasifikasi_min_bulan',    2,    'Misklasifikasi: minimal bulan dipotong sbg Pegawai Tetap tanpa terdaftar BPJS'),
 ('identitas_pembagi',        3,    'Jumlah peserta bermasalah identitas yang dianggap risiko penuh (skala 0-1)'),
 ('bobot_pduk',               0.35, 'Bobot skor: PDUK'),
 ('bobot_upah',               0.25, 'Bobot skor: under-reporting upah'),
 ('bobot_klasifikasi',        0.20, 'Bobot skor: misklasifikasi hubungan kerja'),
 ('bobot_mutasi',             0.15, 'Bobot skor: manipulasi mutasi'),
 ('bobot_identitas',          0.05, 'Bobot skor: identitas tidak valid'),
 ('faktor_skala_skor',        1.6,  'Pengali skor mentah agar sebaran skor 0-100 lebih terbaca'),
 ('ambang_tinggi',            35,   'Skor >= nilai ini = tingkat risiko TINGGI'),
 ('ambang_sedang',            12,   'Skor >= nilai ini = tingkat risiko SEDANG')
on conflict (kode) do nothing;

create or replace function public.fn_cfg(p_kode text) returns numeric
language sql stable as $$ select nilai from public.fraud_rule_config where kode = p_kode $$;

create or replace view public.v_periode_terakhir with (security_invoker = true) as
select tahun_pajak, masa_pajak
from public.djp_bukti_potong_pph21
order by tahun_pajak desc, masa_pajak desc
limit 1;

-- Peta perusahaan lintas lembaga (kunci: NPWP, NIB)
create or replace view public.v_perusahaan_lintas_lembaga with (security_invoker = true) as
select d.npwp, d.nama_wp as nama_perusahaan, d.nib, b.kode_badan_usaha, k.nib as nib_kemnaker
from public.djp_wp_badan d
left join public.bpjs_badan_usaha b on b.npwp = d.npwp
left join public.kemnaker_perusahaan k on k.npwp = d.npwp;

-- ---------------------------------------------------------------------
-- 1. PDUK : jumlah NIK aktif di DJP & WLKP vs peserta terdaftar di BPJS
-- ---------------------------------------------------------------------
create or replace view public.v_flag_pduk with (security_invoker = true) as
with p as (select * from public.v_periode_terakhir),
per_nik as (   -- setiap NIK yang dipotong PPh21 pada periode terakhir
  select b.npwp_pemotong as npwp, b.nik_penerima as nik,
         exists (select 1 from public.bpjs_peserta ps
                 join public.bpjs_badan_usaha bu on bu.kode_badan_usaha = ps.kode_badan_usaha
                 where bu.npwp = b.npwp_pemotong and ps.nik = b.nik_penerima) as terdaftar_bpjs,
         exists (select 1 from public.kemnaker_tenaga_kerja k
                 join public.kemnaker_perusahaan kp on kp.nib = k.nib
                 where kp.npwp = b.npwp_pemotong and k.nik = b.nik_penerima
                   and k.status_hubungan_kerja in ('HARIAN_LEPAS', 'KEMITRAAN')) as lepas_di_kemnaker
  from public.djp_bukti_potong_pph21 b
  join p on p.tahun_pajak = b.tahun_pajak and p.masa_pajak = b.masa_pajak),
agg as (
  -- pekerja "lepas/mitra" yang tidak terdaftar ditangani view misklasifikasi, bukan PDUK
  select npwp, count(*) filter (where terdaftar_bpjs or not lepas_di_kemnaker) as jml_nik_djp,
         count(*) filter (where terdaftar_bpjs) as jml_peserta_bpjs
  from per_nik group by npwp),
wl as (
  select kp.npwp, w.jumlah_tk_total as jml_wlkp
  from public.kemnaker_wlkp w join public.kemnaker_perusahaan kp on kp.nib = w.nib
  where w.tahun_lapor = (select max(tahun_lapor) from public.kemnaker_wlkp))
select a.npwp, wb.nama_wp as nama_perusahaan, a.jml_nik_djp, coalesce(w.jml_wlkp, 0) as jml_wlkp,
       a.jml_peserta_bpjs, a.jml_nik_djp - a.jml_peserta_bpjs as selisih_pekerja,
       round(100.0 * (a.jml_nik_djp - a.jml_peserta_bpjs) / a.jml_nik_djp, 1) as persen_tidak_terdaftar
from agg a
join public.djp_wp_badan wb on wb.npwp = a.npwp
left join wl w on w.npwp = a.npwp
where a.jml_nik_djp > 0
  and a.jml_nik_djp - a.jml_peserta_bpjs >= public.fn_cfg('pduk_min_selisih_pekerja')
  and 100.0 * (a.jml_nik_djp - a.jml_peserta_bpjs) / a.jml_nik_djp >= public.fn_cfg('pduk_min_persen');

-- ---------------------------------------------------------------------
-- 2. UNDER-REPORTING UPAH : upah BPJS vs penghasilan bruto DJP (per NIK)
--    Ambang rasio diambil dari fraud_rule_config ('upah_rasio_maks')
-- ---------------------------------------------------------------------
create or replace view public.v_flag_underreport_upah with (security_invoker = true) as
select bu.npwp, bu.nama_badan_usaha, ps.nik, ps.nama_peserta, count(*) as jml_bulan_dibandingkan,
       round(avg(i.upah_dilaporkan)) as rata_upah_bpjs, round(avg(b.penghasilan_bruto)) as rata_bruto_djp,
       round(avg(b.penghasilan_bruto) - avg(i.upah_dilaporkan)) as selisih_upah,
       round(avg(i.upah_dilaporkan / nullif(b.penghasilan_bruto, 0)), 2) as rasio_bpjs_vs_djp,
       round(sum(b.penghasilan_bruto - i.upah_dilaporkan) * public.fn_cfg('tarif_iuran_total')) as potensi_iuran_hilang_estimasi
from public.bpjs_iuran_peserta i
join public.bpjs_peserta ps on ps.no_kartu = i.no_kartu
join public.bpjs_badan_usaha bu on bu.kode_badan_usaha = i.kode_badan_usaha
join public.djp_bukti_potong_pph21 b on b.npwp_pemotong = bu.npwp and b.nik_penerima = ps.nik
                                     and b.masa_pajak = i.masa and b.tahun_pajak = i.tahun
group by bu.npwp, bu.nama_badan_usaha, ps.nik, ps.nama_peserta
having avg(i.upah_dilaporkan / nullif(b.penghasilan_bruto, 0)) < public.fn_cfg('upah_rasio_maks');

-- ---------------------------------------------------------------------
-- 3. MISKLASIFIKASI : dipotong PPh21 sbg Pegawai Tetap (21-100-01) berulang,
--    tidak terdaftar BPJS, dan di Kemnaker tercatat lepas/kemitraan
-- ---------------------------------------------------------------------
create or replace view public.v_flag_misklasifikasi with (security_invoker = true) as
select b.npwp_pemotong as npwp, wb.nama_wp as nama_perusahaan, b.nik_penerima as nik, dk.nama_lengkap,
       count(*) as jml_bulan_dipotong_pegawai_tetap, round(avg(b.penghasilan_bruto)) as rata_bruto,
       k.status_hubungan_kerja as status_di_kemnaker, k.no_perjanjian_kerja
from public.djp_bukti_potong_pph21 b
join public.djp_wp_badan wb on wb.npwp = b.npwp_pemotong
left join public.bpjs_badan_usaha bu on bu.npwp = b.npwp_pemotong
join public.kemnaker_perusahaan kp on kp.npwp = b.npwp_pemotong
join public.kemnaker_tenaga_kerja k on k.nib = kp.nib and k.nik = b.nik_penerima
left join public.dukcapil_penduduk dk on dk.nik = b.nik_penerima
where b.kode_objek_pajak = '21-100-01'
  and k.status_hubungan_kerja in ('HARIAN_LEPAS', 'KEMITRAAN')
  and not exists (select 1 from public.bpjs_peserta p
                  where p.nik = b.nik_penerima and p.kode_badan_usaha = bu.kode_badan_usaha)
group by b.npwp_pemotong, wb.nama_wp, b.nik_penerima, dk.nama_lengkap, k.status_hubungan_kerja, k.no_perjanjian_kerja
having count(*) >= public.fn_cfg('klasifikasi_min_bulan');

-- ---------------------------------------------------------------------
-- 4. MANIPULASI MUTASI : NONAKTIF di BPJS, tetapi PPh21 masih dipotong
--    setelah tanggal nonaktif (dan/atau Kemnaker masih AKTIF)
-- ---------------------------------------------------------------------
create or replace view public.v_flag_mutasi_fiktif with (security_invoker = true) as
select bu.npwp, bu.nama_badan_usaha, ps.nik, ps.nama_peserta, ps.tanggal_nonaktif as tgl_nonaktif_bpjs, ps.alasan_nonaktif,
       count(*) as jml_bulan_masih_dipotong_pph21, min(b.masa_pajak) as masa_pertama_setelah_nonaktif,
       max(b.masa_pajak) as masa_terakhir, round(sum(b.penghasilan_bruto)) as total_bruto_setelah_nonaktif,
       k.status_kerja as status_di_kemnaker
from public.bpjs_peserta ps
join public.bpjs_badan_usaha bu on bu.kode_badan_usaha = ps.kode_badan_usaha
join public.djp_bukti_potong_pph21 b on b.npwp_pemotong = bu.npwp and b.nik_penerima = ps.nik
     and make_date(b.tahun_pajak, b.masa_pajak, 1) > ps.tanggal_nonaktif
left join public.kemnaker_perusahaan kp on kp.npwp = bu.npwp
left join public.kemnaker_tenaga_kerja k on k.nib = kp.nib and k.nik = ps.nik
where ps.status_peserta = 'NONAKTIF'
group by bu.npwp, bu.nama_badan_usaha, ps.nik, ps.nama_peserta, ps.tanggal_nonaktif, ps.alasan_nonaktif, k.status_kerja;

-- ---------------------------------------------------------------------
-- 5. IDENTITAS : peserta BPJS aktif yang NIK-nya tidak ada / meninggal di Dukcapil
-- ---------------------------------------------------------------------
create or replace view public.v_flag_identitas with (security_invoker = true) as
select bu.npwp, bu.nama_badan_usaha, ps.no_kartu, ps.nik, ps.nama_peserta,
       case when d.nik is null then 'NIK_TIDAK_DITEMUKAN' else 'PESERTA_MENINGGAL' end as jenis_masalah,
       d.tanggal_meninggal
from public.bpjs_peserta ps
join public.bpjs_badan_usaha bu on bu.kode_badan_usaha = ps.kode_badan_usaha
left join public.dukcapil_penduduk d on d.nik = ps.nik
where ps.status_peserta = 'AKTIF' and (d.nik is null or d.status_kependudukan = 'MENINGGAL');

-- ---------------------------------------------------------------------
-- 6. SKOR RISIKO & PRIORITAS AUDIT PER PERUSAHAAN (bobot & ambang dari fraud_rule_config)
-- ---------------------------------------------------------------------
create or replace view public.v_skor_risiko_perusahaan with (security_invoker = true) as
with tot as (
  select b.npwp_pemotong as npwp, count(distinct b.nik_penerima) as jml_pekerja_djp
  from public.djp_bukti_potong_pph21 b
  join public.v_periode_terakhir p on p.tahun_pajak = b.tahun_pajak and p.masa_pajak = b.masa_pajak
  group by b.npwp_pemotong),
a as (select npwp, persen_tidak_terdaftar / 100.0 as r from public.v_flag_pduk),
u as (select npwp, count(*) as n from public.v_flag_underreport_upah group by npwp),
k as (select npwp, count(*) as n from public.v_flag_misklasifikasi group by npwp),
m as (select npwp, count(*) as n from public.v_flag_mutasi_fiktif group by npwp),
i as (select npwp, count(*) as n from public.v_flag_identitas group by npwp),
s as (
  select t.npwp, t.jml_pekerja_djp,
         coalesce(a.r, 0) as r_pduk,
         least(1.0, coalesce(u.n, 0)::numeric / t.jml_pekerja_djp) as r_upah,
         least(1.0, coalesce(k.n, 0)::numeric / t.jml_pekerja_djp) as r_klasifikasi,
         least(1.0, coalesce(m.n, 0)::numeric / t.jml_pekerja_djp) as r_mutasi,
         least(1.0, coalesce(i.n, 0)::numeric / public.fn_cfg('identitas_pembagi')) as r_identitas,
         coalesce(u.n, 0) as n_upah, coalesce(k.n, 0) as n_klasifikasi, coalesce(m.n, 0) as n_mutasi, coalesce(i.n, 0) as n_identitas
  from tot t left join a using (npwp) left join u using (npwp) left join k using (npwp) left join m using (npwp) left join i using (npwp)),
w as (
  select s.*,
         public.fn_cfg('bobot_pduk') * r_pduk + public.fn_cfg('bobot_upah') * r_upah + public.fn_cfg('bobot_klasifikasi') * r_klasifikasi
         + public.fn_cfg('bobot_mutasi') * r_mutasi + public.fn_cfg('bobot_identitas') * r_identitas as skor_mentah
  from s),
sk as (select w.*, least(100, 100 * skor_mentah * public.fn_cfg('faktor_skala_skor')) as skor from w)
select sk.npwp, wb.nama_wp as nama_perusahaan, sk.jml_pekerja_djp,
       round(100 * sk.r_pduk, 1) as persen_pduk, sk.n_upah as pekerja_upah_rendah, sk.n_klasifikasi as pekerja_misklasifikasi,
       sk.n_mutasi as pekerja_mutasi_fiktif, sk.n_identitas as peserta_identitas_bermasalah,
       round(sk.skor::numeric, 1) as skor_risiko,
       case when sk.skor >= public.fn_cfg('ambang_tinggi') then 'TINGGI'
            when sk.skor >= public.fn_cfg('ambang_sedang') then 'SEDANG'
            else 'RENDAH' end as tingkat_risiko,
       rank() over (order by sk.skor_mentah desc) as prioritas_audit
from sk join public.djp_wp_badan wb on wb.npwp = sk.npwp;
