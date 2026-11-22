<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Laporan Investigasi B-SAFE</title>
    <style>
        @page { margin: 18mm 15mm; }
        * { box-sizing: border-box; }
        body {
            color: #17231d;
            font-family: "DejaVu Sans", sans-serif;
            font-size: 10px;
            line-height: 1.5;
        }
        h1, h2, h3, p { margin: 0; }
        h1 { color: #0a7a4b; font-size: 20px; }
        h2 { font-size: 14px; margin-bottom: 8px; }
        h3 { font-size: 11px; margin-bottom: 4px; }
        .muted { color: #5c6b62; }
        .header { border-bottom: 2px solid #0a7a4b; margin-bottom: 16px; padding-bottom: 10px; }
        .section { margin-bottom: 16px; page-break-inside: avoid; }
        .grid { width: 100%; }
        .grid td { border: 1px solid #dce5df; padding: 7px; vertical-align: top; width: 50%; }
        .label { color: #5c6b62; font-size: 8px; }
        .value { font-weight: bold; overflow-wrap: anywhere; }
        table { border-collapse: collapse; table-layout: fixed; width: 100%; }
        th, td { border: 1px solid #dce5df; overflow-wrap: anywhere; padding: 6px; text-align: left; vertical-align: top; }
        th { background: #f1f6f3; color: #34443b; font-size: 8px; }
        td { font-size: 8px; }
        .state-mismatch { background: #fff0ef; color: #a82020; }
        .state-warning { background: #fff6df; color: #815000; }
        .state-match { background: #f4f8f5; color: #23513a; }
        .state-unavailable { background: #f5f6f5; color: #5c6b62; }
        .finding { border-left: 3px solid #d78a00; background: #fff6df; margin-top: 6px; padding: 8px; }
        .finding.mismatch { border-color: #bd2929; background: #fff0ef; }
        .recommendation { background: #fff6df; border: 1px solid #efd58f; padding: 9px; }
        .history-item { border-left: 2px solid #0a7a4b; margin: 8px 0; padding: 2px 0 2px 8px; }
        .footer { border-top: 1px solid #dce5df; color: #5c6b62; font-size: 8px; margin-top: 20px; padding-top: 8px; }
    </style>
</head>
<body>
    <header class="header">
        <h1>B-SAFE</h1>
        <p><strong>Laporan investigasi perusahaan</strong> · Bahan pemeriksaan internal</p>
        <p class="muted">Dibuat {{ $preparedAt }} oleh {{ $preparedBy }}. Ringkasan ini bukan penetapan pelanggaran.</p>
    </header>

    <section class="section">
        <h2>Profil perusahaan</h2>
        <table class="grid">
            <tr>
                <td><div class="label">Nama</div><div class="value">{{ $investigation['company']['name'] ?: 'Belum tersedia' }}</div></td>
                <td><div class="label">Pekerja terdaftar di BPJS</div><div class="value">{{ $investigation['company']['bpjsWorkerCount'] === null ? 'Belum tersedia' : number_format($investigation['company']['bpjsWorkerCount'], 0, ',', '.').' orang' }}</div></td>
            </tr>
            <tr>
                <td><div class="label">NIB (OSS)</div><div class="value">{{ $investigation['company']['nib'] ?: 'Belum tersedia' }}</div></td>
                <td><div class="label">NPWP (DJP)</div><div class="value">{{ $investigation['company']['npwp'] ?: 'Belum tersedia' }}</div></td>
            </tr>
            <tr>
                <td><div class="label">Wilayah</div><div class="value">{{ collect([$investigation['company']['city'], $investigation['company']['province']])->filter()->implode(', ') ?: 'Belum tersedia' }}</div></td>
                <td><div class="label">Kasus / periode</div><div class="value">{{ $investigation['case']['typeLabel'] }} · {{ $investigation['case']['period'] }}</div></td>
            </tr>
        </table>
    </section>

    <section class="section">
        <h2>Tingkat risiko</h2>
        <p><strong>{{ $investigation['riskScore']['levelLabel'] }}</strong>
            @if ($investigation['riskScore']['score'] !== null)
                · Skor {{ number_format($investigation['riskScore']['score'], 2, ',', '.') }}
            @endif
        </p>
        <p class="muted">Skor risiko adalah indikator pendukung, bukan kesimpulan pemeriksaan.</p>
        <table class="grid" style="margin-top: 6px">
            @foreach (array_chunk($investigation['riskIndicators'], 2) as $indicators)
                <tr>
                    @foreach ($indicators as $indicator)
                        <td><div class="label">{{ $indicator['label'] }}</div><div class="value">{{ $indicator['value'] }}</div></td>
                    @endforeach
                    @if (count($indicators) === 1)
                        <td></td>
                    @endif
                </tr>
            @endforeach
        </table>
    </section>

    <section class="section">
        <h2>Perbandingan data lintas lembaga</h2>
        <table>
            <thead>
                <tr>
                    <th style="width: 18%">Indikator</th>
                    <th style="width: 23%">Dilaporkan ke BPJS</th>
                    <th style="width: 31%">Sumber pembanding</th>
                    <th style="width: 28%">Hasil</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($investigation['comparisons'] as $comparison)
                    <tr class="state-{{ $comparison['state'] }}">
                        <td>{{ $comparison['label'] }}</td>
                        <td>{{ $comparison['bpjsValue'] ?? 'Belum tersedia' }}</td>
                        <td>
                            {{ $comparison['comparisonValue'] ?? $comparison['sourceName'] }}
                            @if ($comparison['sourceReference'])
                                <br><span class="muted">{{ $comparison['sourceReference'] }}</span>
                            @endif
                        </td>
                        <td>{{ $comparison['result'] }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </section>

    <section class="section">
        <h2>Temuan investigasi</h2>
        @forelse ($investigation['findings'] as $finding)
            <div class="finding {{ $finding['state'] === 'mismatch' ? 'mismatch' : '' }}">
                <strong>{{ $finding['title'] }}</strong><br>
                {{ $finding['description'] }}
            </div>
        @empty
            <p class="muted">Belum ada temuan tambahan dari perbandingan sumber yang tersedia.</p>
        @endforelse
    </section>

    <section class="section">
        <h2>Status & rekomendasi tindak lanjut</h2>
        <p>Status kasus: <strong>{{ $investigation['case']['statusLabel'] }}</strong></p>
        <p class="recommendation" style="margin-top: 6px"><strong>Rekomendasi sistem:</strong> {{ $investigation['recommendation'] }}</p>
    </section>

    <section class="section">
        <h2>Riwayat tindak lanjut ({{ number_format($investigation['historyCount'], 0, ',', '.') }} aktivitas)</h2>
        @if ($investigation['historyCount'] > count($investigation['history']))
            <p class="muted">Menampilkan {{ count($investigation['history']) }} aktivitas terbaru.</p>
        @endif
        @forelse ($investigation['history'] as $activity)
            <div class="history-item">
                <strong>{{ $activity['title'] }}</strong>
                @if ($activity['previousStatusLabel'] || $activity['statusLabel'])
                    <span class="muted"> · {{ $activity['previousStatusLabel'] ?? 'Status sebelumnya tidak tersedia' }} → {{ $activity['statusLabel'] ?? 'Status baru tidak tersedia' }}</span>
                @endif
                <br>{{ $activity['notes'] ?: 'Tidak ada catatan tambahan.' }}
                <br><span class="muted">{{ $activity['actor'] }} · {{ $activity['createdAt'] ?? 'Waktu tidak tersedia' }}</span>
            </div>
        @empty
            <p class="muted">Belum ada aktivitas tindak lanjut.</p>
        @endforelse
    </section>

    <footer class="footer">
        Dokumen internal untuk verifikasi. Nilai merupakan agregat dan tidak menampilkan identitas pekerja perorangan.
    </footer>
</body>
</html>
